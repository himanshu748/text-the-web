import { Spectrum } from '@spectrum-ts/core';
import { acquireLock } from '../lock.js';
import { liveEngine } from '../config.js';
import { selfIMessage } from './self-provider.js';
import { receive } from './spectrum.js';
import { writeFileSync } from 'node:fs';
try{
  if(process.platform!=='darwin' || process.env.LOCAL_MAC_AUTHORIZED!=='true' || process.env.SELF_CHAT_MODE!=='true')throw new Error('authorized_self_mode_required');
  const address=process.env.SELF_IMESSAGE_ADDRESS,chatId=process.env.TEST_CONVERSATION_ID;
  if(!address || !chatId || process.env.TEST_SENDER_ID!=='self')throw new Error('pair_self_chat_first');
  acquireLock('.data/imessage.lock');
  const engine=liveEngine('local_self_imessage');
  const app=await Spectrum({providers:[selfIMessage.config({address,chatId})],telemetry:false,options:{logLevel:'silent'}});
  for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void app.stop().finally(()=>{engine.store.close();process.exit(0);});});
  const status={code:'self_adapter_started',adapterRevision:'native-creation-v2',applicationRevision:'research-guards-v3',startedAt:new Date().toISOString(),processId:process.pid,researchLimit:engine.limit,researchUsed:engine.store.used(),researchRemaining:engine.remaining};
  writeFileSync('.data/self-runtime.json',JSON.stringify(status),{mode:0o600});
  console.log(JSON.stringify({...status,mode:'explicit_self_chat_commands_only',prefix:'/web '}));
  for await(const [space,message] of app.messages)await receive(engine,space,message);
}catch{console.error(JSON.stringify({code:'self_adapter_unavailable_check_mac_permission_and_pairing'}));process.exitCode=1;}
