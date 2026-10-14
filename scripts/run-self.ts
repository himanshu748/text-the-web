import '../src/env.js';
import { DatabaseSync } from 'node:sqlite';
import { homedir } from 'node:os';
import { writeFile } from 'node:fs/promises';
import { pairSelf } from './pair-self.js';
try{
 const db=new DatabaseSync(`${homedir()}/Library/Messages/chat.db`,{readOnly:true});db.prepare('SELECT 1').get();db.close();
 console.log(JSON.stringify({code:'messages_access_verified',researchNotStarted:true}));
 await writeFile('evidence/terminal-access.json',JSON.stringify({checkedAt:new Date().toISOString(),messagesDatabaseReadable:true,scope:'read-only SELECT 1; no chat content queried'},null,2)+'\n');
 if(!process.env.TEST_CONVERSATION_ID||process.env.TEST_SENDER_ID!=='self'||process.env.SELF_CHAT_MODE!=='true')await pairSelf();
 process.env.ENABLE_IMESSAGE='true';
 console.log(JSON.stringify({code:'paired_self_mode_enabled',instruction:'Send /web help, then /web https://example.com/ What is the purpose of this domain? in the paired self-chat'}));
 await import('../src/adapters/self.js');
}catch{console.error(JSON.stringify({code:'self_launcher_unavailable',instruction:'Check Terminal Full Disk Access, the configured account, and pairing. No reply was sent by this launcher.'}));process.exitCode=1;}
