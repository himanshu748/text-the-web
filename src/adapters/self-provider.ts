import { definePlatform, stream } from '@spectrum-ts/core';
import type { ProviderMessageRecord } from '@spectrum-ts/core/authoring';
import { ChatId, IMessageSDK, type Message as NativeMessage, type DispatchEvents, type SendRequest, type MessageQuery } from '@photon-ai/imessage-kit';
import { z } from 'zod';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const SELF_REPLY_PREFIX = 'Text the Web · reply\n';
export type SelfConfig = { address: string; chatId: string };
export type Row = Pick<NativeMessage,'id'|'chatId'|'chatKind'|'service'|'text'|'kind'|'isFromMe'|'createdAt'|'retractedAt'|'reaction'|'isSystem'|'isAutoReply'|'hasError'|'isDowngraded'|'isSent'>;
export function isSelfRow(row: Row, address: string, exactChat?: string, allowAutoReply=false): boolean {
  if(!row.isFromMe || row.service!=='iMessage' || row.chatKind!=='dm' || row.kind!=='text' || !row.chatId || row.retractedAt || row.reaction || row.isSystem || (!allowAutoReply&&row.isAutoReply) || row.hasError || row.isDowngraded) return false;
  try {
    const chat=ChatId.fromUserInput(row.chatId);
    return !chat.isGroup && chat.extractRecipient()?.toLowerCase()===address.toLowerCase() && (!exactChat || row.chatId===exactChat);
  } catch {return false;}
}
export function selfCommand(row:Row, config:SelfConfig, startedAt:number): ProviderMessageRecord|undefined {
  if(!isSelfRow(row,config.address,config.chatId) || row.createdAt.getTime()<startedAt || !row.text?.startsWith('/web '))return;
  const text=row.text.slice(5).trim();if(!text || text.length>2000)return;
  // Only an explicitly addressed human /web command enters Spectrum. Native
  // from-me rows are NOT generally reclassified; all generated replies retain
  // a fixed prefix, so even a model output beginning with /web cannot loop.
  return {id:row.id,content:{type:'text',text},sender:{id:'self'},space:{id:row.chatId!},timestamp:row.createdAt,direction:'inbound'};
}
export interface NativePort {startWatching(events?:DispatchEvents):Promise<void>;stopWatching():Promise<void>;close():Promise<void>;send(request:SendRequest):Promise<void>;getMessages(query?:MessageQuery):Promise<readonly Row[]>}
export function sendFailureCode(error:unknown):string{
  let text='',cause=error;
  for(let depth=0;depth<5 && cause instanceof Error;depth++){text+=' '+cause.message;cause=cause.cause;}
  if(/-1743|not authorized to send apple events|not permitted|authorization/i.test(text))return 'messages_automation_denied';
  if(/-1728|can't get|cannot get|recipient|buddy.*not found/i.test(text))return 'messages_target_unavailable';
  if(/timeout|timed out|uncertain/i.test(text))return 'messages_send_timeout';
  return 'messages_dispatch_failed';
}
type SendDiagnostic={code:string;dispatchAccepted:boolean;queriedRows?:number;exactBodyRows?:number;eligibleCreatedRows?:number;nativeMarkedSent?:boolean;nativeRowIdHash?:string};
export class SelfClient {
  private pending?: {text:string;since:number;resolve:(row:Row)=>void};
  constructor(public sdk:NativePort,public config:SelfConfig,private ackMs=15000,private diagnostic:(result:SendDiagnostic)=>void=()=>{}){}
  messages(){
    return stream<ProviderMessageRecord>((emit,end)=>{
      const startedAt=Date.now();let queued=0,closed=false;let deliveries=Promise.resolve();
      const ready=this.sdk.startWatching({onFromMeMessage:row=>{
        if(this.pending && isSelfRow(row,this.config.address,this.config.chatId,true) && row.text===this.pending.text && row.createdAt.getTime()>=this.pending.since){this.pending.resolve(row);return;}
        if(!isSelfRow(row,this.config.address,this.config.chatId))return;
        const command=selfCommand(row,this.config,startedAt);
        if(command && !closed && queued<4){
          queued++;
          // Never hold the native watcher behind Spectrum backpressure: it
          // must remain free to observe our reply's chat.db acknowledgment.
          deliveries=deliveries.then(()=>emit(command)).catch(()=>{if(!closed)end(new Error('self_stream_unavailable'));}).finally(()=>{queued--;});
        }
      },onError:()=>end(new Error('self_watcher_unavailable'))});
      ready.catch(()=>end(new Error('self_watcher_unavailable')));
      return async()=>{closed=true;await ready.catch(()=>{});await this.sdk.stopWatching();await deliveries.catch(()=>{});};
    });
  }
  async send(text:string):Promise<ProviderMessageRecord>{
    if(this.pending)throw new Error('self_send_busy');
    const body=SELF_REPLY_PREFIX+text;
    let timer:ReturnType<typeof setTimeout>;
    let observed=false;
    const ack=new Promise<Row>((resolve,reject)=>{
      this.pending={text:body,since:Date.now(),resolve:row=>{observed=true;resolve(row);}};
      timer=setTimeout(()=>reject(new Error('self_send_uncertain')),this.ackMs);
    });
    // Attach an error handler before dispatch; an early ack timeout must not
    // become an unhandled rejection while AppleScript is still in progress.
    void ack.catch(()=>{});
    let dispatchAccepted=false;
    let queriedRows=0,exactBodyRows=0,eligibleCreatedRows=0;
    try {
      await this.sdk.send({to:this.config.chatId,text:body});
      dispatchAccepted=true;
      // SDK 3.0.0's watcher advances a ROWID cursor: it does not re-emit an
      // existing row when isSent changes. Re-read only this chat's fresh rows
      // through the public SDK query API; this never dispatches another send.
      const pending=this.pending!;
      void (async()=>{
        for(let attempt=0;attempt<15 && !observed && this.pending===pending;attempt++){
          const rows=await this.sdk.getMessages({chatId:this.config.chatId,service:'iMessage',isFromMe:true,since:new Date(pending.since),limit:5,excludeReactions:true});
          queriedRows=rows.length;exactBodyRows=rows.filter(row=>row.text===body).length;
          const matches=rows.filter(row=>isSelfRow(row,this.config.address,this.config.chatId,true)&&row.text===body&&row.createdAt.getTime()>=pending.since);
          eligibleCreatedRows=matches.length;
          if(matches.length===1){pending.resolve(matches[0]);return;}
          if(attempt<14 && !observed && this.pending===pending)await new Promise(resolve=>setTimeout(resolve,Math.min(1000,Math.max(1,Math.floor(this.ackMs/15)))));
        }
      })().catch(()=>{});
      const row=await ack;
      // Confirmation means accepted dispatch plus a new outgoing native row.
      // macOS sent/delivery flags are reported separately, never assumed.
      this.diagnostic({code:'native_outgoing_row_observed',dispatchAccepted,queriedRows,exactBodyRows,eligibleCreatedRows,nativeMarkedSent:row.isSent,nativeRowIdHash:createHash('sha256').update(row.id).digest('hex')});
      return {id:row.id,content:{type:'text',text:body},direction:'outbound',space:{id:this.config.chatId},timestamp:row.createdAt};
    }catch(error){
      this.diagnostic({code:sendFailureCode(error),dispatchAccepted,queriedRows,exactBodyRows,eligibleCreatedRows});
      throw error;
    }finally{clearTimeout(timer!);this.pending=undefined;}
  }
}
export function createSelfProvider(factory:(config:SelfConfig)=>SelfClient = config=>new SelfClient(new IMessageSDK({debug:false,maxConcurrentSends:1,sendTimeout:15000}),config,15000,result=>{
  // Fixed codes only. Native error messages can contain a private recipient or
  // AppleScript body and are never written to logs/evidence.
  try{writeFileSync('evidence/self-send.json',JSON.stringify({...result,observedAt:new Date().toISOString()},null,2)+'\n',{mode:0o600});}catch{}
})){
  return definePlatform('local_self_imessage',{
    config:z.object({address:z.email(),chatId:z.string().min(1)}),
    lifecycle:{createClient:async({config})=>factory(config),destroyClient:async({client})=>client.sdk.close()},
    user:{resolve:async({input})=>{if(input.userID!=='self')throw new Error('self_only');return{id:'self'};}},
    space:{create:async()=>{throw new Error('self_mode_cannot_create_conversations');},get:async({input,config})=>{if(input.id!==config.chatId)throw new Error('self_only');return{id:input.id};}},
    messages:({client})=>client.messages(),
    send:async({client,space,content})=>{if(space.id!==client.config.chatId || content.type!=='text')throw new Error('self_text_only');return client.send(content.text);},
  });
}
export const selfIMessage=createSelfProvider();
