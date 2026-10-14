import '../src/env.js';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
let readable=false;
if(process.platform==='darwin' && process.env.LOCAL_MAC_AUTHORIZED==='true'){
  try {const db=new DatabaseSync(`${homedir()}/Library/Messages/chat.db`,{readOnly:true});db.prepare('SELECT 1').get();db.close();readable=true;}catch{/* No private content or raw errors are printed. */}
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),tinyfishKeyConfigured:!!process.env.TINYFISH_API_KEY,freeCreditApprovalConfigured:process.env.FREE_CREDITS_APPROVED==='true',photonCredentialsConfigured:!!process.env.SPECTRUM_PROJECT_ID&&!!process.env.SPECTRUM_PROJECT_SECRET,cloudEntitlement:'not verified by credentials alone',macOS:process.platform==='darwin',messagesDatabaseExists:existsSync(`${homedir()}/Library/Messages/chat.db`),localAuthorizationConfigured:process.env.LOCAL_MAC_AUTHORIZED==='true',messagesDatabaseReadable:readable,testConversationConfigured:!!process.env.TEST_CONVERSATION_ID,testSenderConfigured:!!process.env.TEST_SENDER_ID,messagingEnabled:process.env.ENABLE_IMESSAGE==='true'},null,2));
