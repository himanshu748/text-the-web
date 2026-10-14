import { acquireLock } from '../src/lock.js';
import { randomUUID } from 'node:crypto';import { writeFile,mkdir } from 'node:fs/promises';import { Engine } from '../src/engine.js';import { Store } from '../src/store.js';import { researcher,requestCap } from '../src/config.js';
import { resolve } from 'node:path';import { pathToFileURL } from 'node:url';import type { Researcher } from '../src/types.js';
export function createLiveCheckEngine(store:Store,research:Researcher){
 if(research.mode!=='live')throw new Error('Requires explicitly configured live research');
 return new Engine(store,research,{platform:'offline',conversation:'browser-test',sender:'test-user'},{maxDaily:requestCap()});
}
async function main(){
const research=researcher();if(research.mode!=='live')throw new Error('Requires explicitly configured live research');
acquireLock('.data/offline.lock');
const store=new Store('.data/offline.sqlite');const engine=createLiveCheckEngine(store,research);
const replies:string[]=[];const start=Date.now();const result=await engine.handle({id:randomUUID(),platform:'offline',conversation:'browser-test',sender:'test-user',direction:'inbound',text:'https://example.com/ What is the purpose of this domain?'},async text=>{replies.push(text);return 'confirmed';});
const evidence={checkedAt:new Date().toISOString(),transport:'offline terminal adapter — NOT iMessage proof',research:'genuine TinyFish SDK calls',elapsedMs:Date.now()-start,...result,replies};await mkdir('evidence',{recursive:true});await writeFile('evidence/live-research.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));store.close();if(result.code!=='ok')process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(()=>{console.error(JSON.stringify({code:'live_check_failed'}));process.exitCode=1;});
}
