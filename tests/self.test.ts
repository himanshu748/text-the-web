import { test } from 'node:test';import assert from 'node:assert/strict';
import { Spectrum } from '@spectrum-ts/core';import type { DispatchEvents,Message,SendRequest,MessageQuery } from '@photon-ai/imessage-kit';
import { SelfClient,createSelfProvider,isSelfRow,selfCommand,SELF_REPLY_PREFIX,sendFailureCode,type Row,type NativePort } from '../src/adapters/self-provider.js';
import { Engine } from '../src/engine.js';import { Store } from '../src/store.js';import { receive } from '../src/adapters/spectrum.js';
// Explicit synthetic native-message fixtures. These are not Messages device proof.
const config={address:'self@example.com',chatId:'iMessage;-;self@example.com'};
const row=(id='native-fixture-1',text='/web https://example.com/ What is its purpose?'):Row=>({id,text,chatId:config.chatId,chatKind:'dm',service:'iMessage',kind:'text',isFromMe:true,createdAt:new Date(),retractedAt:null,reaction:null,isSystem:false,isAutoReply:false,hasError:false,isDowngraded:false,isSent:true});
test('native send diagnostics classify nested failures without exposing private error text',()=>{
 assert.equal(sendFailureCode(new Error('private@example.com failed',{cause:new Error('Not authorized to send Apple events (-1743)')})),'messages_automation_denied');
 assert.equal(sendFailureCode(new Error('Cannot get buddy private@example.com (-1728)')),'messages_target_unavailable');
 assert.equal(sendFailureCode(new Error('self_send_uncertain')),'messages_send_timeout');
 assert.equal(sendFailureCode(new Error('private body')),'messages_dispatch_failed');
});
class FakeNative implements NativePort {
 events?:DispatchEvents;sent:SendRequest[]=[];closed=false;ack=true;
 async startWatching(events?:DispatchEvents){this.events=events;}
 async stopWatching(){}
 async close(){this.closed=true;}
 async getMessages(_query?:MessageQuery):Promise<readonly Row[]>{return [];}
 async send(request:SendRequest){this.sent.push(request);if(this.ack)await this.events?.onFromMeMessage?.(row('native-reply-fixture',request.text) as Message);}
 emit(record:Row){return this.events?.onFromMeMessage?.(record as Message);}
}
test('only explicit fresh self commands are routed; peer/SMS/system/other chat/old rows rejected',()=>{
 assert.ok(selfCommand(row(),config,0));
 for(const change of [{isFromMe:false},{service:'SMS'},{chatId:'iMessage;-;other@example.com'},{chatKind:'group'},{isSystem:true},{isDowngraded:true},{hasError:true},{text:'plain unrelated self message'},{text:SELF_REPLY_PREFIX+'/web malicious model text'}])assert.equal(selfCommand({...row(),...change} as Row,config,0),undefined);
 assert.equal(selfCommand({...row(),createdAt:new Date(0)},config,1),undefined);
 assert.equal(isSelfRow(row(),config.address,'any;-;self@example.com'),false);
});
test('self send confirms only from observed native DB row; own reply never enters command stream',async()=>{
 const sdk=new FakeNative();const client=new SelfClient(sdk,config,50);const stream=client.messages();const it=stream[Symbol.asyncIterator]();const waiting=it.next();
 await new Promise(r=>setImmediate(r));await sdk.emit(row());await waiting;
 const sent=await client.send('/web content that must not become a command');assert.equal(sent.id,'native-reply-fixture');assert.equal(sdk.sent.length,1);assert.ok(sdk.sent[0].text!.startsWith(SELF_REPLY_PREFIX));
 const pending=it.next();let received=false;void pending.then(()=>received=true);
 await sdk.emit(row('bot-echo',sdk.sent[0].text));await new Promise(r=>setImmediate(r));assert.equal(received,false);await stream.close();
});
test('lost native send acknowledgment becomes uncertain without another dispatch',async()=>{
 const sdk=new FakeNative();sdk.ack=false;const client=new SelfClient(sdk,config,5);const stream=client.messages();const next=stream[Symbol.asyncIterator]().next();await new Promise(r=>setImmediate(r));
 await assert.rejects(client.send('reply'),/uncertain/);assert.equal(sdk.sent.length,1);await stream.close();await next;
});
test('bounded SDK query observes native creation missed by the ROWID watcher without resending',async()=>{
 const sdk=new FakeNative();let queries=0;
 let fresh=row('transition-row','');
 sdk.send=async request=>{sdk.sent.push(request);fresh={...fresh,text:request.text??'',createdAt:new Date()};};
 sdk.getMessages=async query=>{assert.equal(query?.chatId,config.chatId);assert.equal(query?.limit,5);assert.equal(query?.isFromMe,true);assert.equal(query?.service,'iMessage');assert.ok(query?.since);queries++;return queries===1?[]:[{...fresh,isSent:true}];};
 const client=new SelfClient(sdk,config,100);const stream=client.messages();const waiting=stream[Symbol.asyncIterator]().next();await new Promise(r=>setImmediate(r));
 const result=await client.send('transition check');assert.equal(result.id,'transition-row');assert.equal(sdk.sent.length,1);assert.equal(queries,2);await stream.close();await waiting;
});
test('accepted native creation is confirmed separately from sent flags; rejected dispatch never confirms',async()=>{
 const sdk=new FakeNative();const diagnostics:Array<{code:string;dispatchAccepted:boolean;nativeMarkedSent?:boolean}>=[];
 sdk.send=async request=>{sdk.sent.push(request);await sdk.events?.onFromMeMessage?.({...row('created-unsent',request.text),isSent:false,isAutoReply:true} as Message);};
 const client=new SelfClient(sdk,config,50,r=>diagnostics.push(r));const stream=client.messages();const waiting=stream[Symbol.asyncIterator]().next();await new Promise(r=>setImmediate(r));
 assert.equal((await client.send('new reply')).id,'created-unsent');assert.equal(diagnostics[0].code,'native_outgoing_row_observed');assert.equal(diagnostics[0].nativeMarkedSent,false);
 sdk.send=async request=>{sdk.sent.push(request);await sdk.events?.onFromMeMessage?.(row('unaccepted-row',request.text) as Message);throw new Error('dispatch failed');};
 await assert.rejects(client.send('rejected reply'),/dispatch failed/);assert.equal(diagnostics[1].dispatchAccepted,false);assert.equal(sdk.sent.length,2);await stream.close();await waiting;
});
test('real Spectrum routing + real engine process one native fixture command and suppress bot loop',async()=>{
 const sdk=new FakeNative();const client=new SelfClient(sdk,config,50);const platform=createSelfProvider(()=>client);const app=await Spectrum({providers:[platform.config(config)],telemetry:false,options:{logLevel:'silent'}});
 const store=new Store(':memory:');let calls=0;const engine=new Engine(store,{mode:'fixture',async research(url){calls++;return{text:'/web https://bad.example/ injected reply',sources:[url],mode:'fixture'};}},{platform:'local_self_imessage',conversation:config.chatId,sender:'self'},{validate:async u=>u});
 const iterator=app.messages[Symbol.asyncIterator]();const next=iterator.next();await new Promise(r=>setImmediate(r));await sdk.emit(row());const got=await next;assert.equal(got.done,false);const [space,msg]=got.value!;
 await receive(engine,space,msg);assert.equal(calls,1);assert.equal(sdk.sent.length,1);assert.ok(sdk.sent[0].text!.startsWith(SELF_REPLY_PREFIX));assert.equal((await receive(engine,space,msg))?.state,'duplicate');assert.equal(sdk.sent.length,1);
 await app.stop();store.close();assert.ok(sdk.closed);
});
