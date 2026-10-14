import '../src/env.js';
import { randomBytes } from 'node:crypto';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { IMessageSDK } from '@photon-ai/imessage-kit';
import { isSelfRow } from '../src/adapters/self-provider.js';
import { acquireLock } from '../src/lock.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export async function pairSelf(){
  if(process.platform!=='darwin'||process.env.LOCAL_MAC_AUTHORIZED!=='true'||!process.env.SELF_IMESSAGE_ADDRESS)throw new Error('authorized_mac_and_self_address_required');
  const release=acquireLock('.data/imessage.lock');
  const address=process.env.SELF_IMESSAGE_ADDRESS;
  const nonce=randomBytes(8).toString('hex');const command=`/web pair ${nonce}`;const startedAt=Date.now();const deadlineMs=600000;
  const sdk=new IMessageSDK({debug:false,maxConcurrentSends:1,sendTimeout:15000});let timer:ReturnType<typeof setTimeout>;
  const paired=new Promise<string>((resolve,reject)=>{
    timer=setTimeout(()=>reject(new Error('pairing_timeout')),deadlineMs);
    void sdk.startWatching({onFromMeMessage:row=>{if(isSelfRow(row,address) && row.createdAt.getTime()>=startedAt && row.text===command)resolve(row.chatId!);},onError:()=>reject(new Error('watcher_unavailable'))}).catch(()=>reject(new Error('watcher_unavailable')));
  });
  await mkdir('.data',{recursive:true,mode:0o700});
  await writeFile('.data/self-pairing.json',JSON.stringify({code:'pairing_ready',command,expiresAt:new Date(startedAt+deadlineMs).toISOString()}),{mode:0o600});
  console.log(JSON.stringify({code:'pairing_ready',instruction:'In Messages on your iPad or Mac, message your own enabled iMessage email with this exact command',command,deadlineSeconds:deadlineMs/1000,noMessagesSentByScript:true,noTinyFishCalls:true}));
  try{
    const chatId=await paired;
    let env=await readFile('.env','utf8').catch(()=> '');
    for(const key of ['TEST_CONVERSATION_ID','TEST_SENDER_ID','SELF_CHAT_MODE'])env=env.replace(new RegExp(`^${key}=.*\\n?`,'m'),'');
    // Actual observed native chat ID, not an inferred ID. Pairing never enables sends.
    env=env.trimEnd()+`\nTEST_CONVERSATION_ID=${chatId}\nTEST_SENDER_ID=self\nSELF_CHAT_MODE=true\n`;
    await writeFile('.env',env,{mode:0o600});
    process.env.TEST_CONVERSATION_ID=chatId;process.env.TEST_SENDER_ID='self';process.env.SELF_CHAT_MODE='true';
    await writeFile('.data/self-pairing.json',JSON.stringify({code:'self_chat_paired',pairedAt:new Date().toISOString()}),{mode:0o600});
    console.log(JSON.stringify({code:'self_chat_paired',conversationStoredPrivately:true,messagingStillDisabled:process.env.ENABLE_IMESSAGE!=='true'}));
  }catch(error){
    await writeFile('.data/self-pairing.json',JSON.stringify({code:'pairing_expired_or_unavailable',endedAt:new Date().toISOString(),restartRequired:true}),{mode:0o600});
    throw error;
  }finally{clearTimeout(timer!);await sdk.close();release();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{await pairSelf();}catch{console.error(JSON.stringify({code:'self_pairing_unavailable_check_mac_permission'}));process.exitCode=1;}
}
