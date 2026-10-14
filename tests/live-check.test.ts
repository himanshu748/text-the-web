import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLiveCheckEngine } from '../scripts/live-check.js';
import { Store } from '../src/store.js';
import type { Event, Researcher } from '../src/types.js';

test('live-check honors the configured allowance before making any provider call',async()=>{
 const previous=process.env.MAX_REQUESTS;process.env.MAX_REQUESTS='1';
 const store=new Store(':memory:');let calls=0;
 const research:Researcher={mode:'live',async research(url){calls++;return{text:'Synthetic test answer',sources:[url],mode:'live'};}};
 const event:Event={id:'new-event',platform:'offline',conversation:'browser-test',sender:'test-user',direction:'inbound',text:'https://93.184.215.14/ What is this public page?'};
 try{
  const engine=createLiveCheckEngine(store,research);
  assert.equal(engine.limit,1);
  assert.equal(store.reserve(event,Date.now()-61000,1),'ok');
  const messages:string[]=[];
  const result=await engine.handle(event,async text=>{messages.push(text);return 'confirmed';});
  assert.equal(result.code,'budget');assert.equal(calls,0);assert.equal(engine.remaining,0);
  assert.match(messages[0],/does not reset tomorrow/);
 }finally{store.close();if(previous===undefined)delete process.env.MAX_REQUESTS;else process.env.MAX_REQUESTS=previous;}
});
