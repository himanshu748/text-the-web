import { test } from 'node:test';import assert from 'node:assert/strict';import { once } from 'node:events';import { Engine } from '../src/engine.js';import { Store } from '../src/store.js';import { FixtureResearch } from '../src/research.js';import { makeServer } from '../src/server.js';
test('HTTP sandbox exercises help, research, duplicate, URL blocking, body/CSRF/Origin restrictions',async()=>{
 const store=new Store(':memory:');const engine=new Engine(store,new FixtureResearch(),{platform:'offline',conversation:'browser-test',sender:'test-user'});const server=makeServer(engine);server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address==='object');const base=`http://127.0.0.1:${address.port}`;
 try{
  const status=await (await fetch(base+'/api/status')).json() as {token:string;research:string};assert.equal(status.research,'fixture');
  const send=(id:string,text:string,headers={})=>fetch(base+'/api/events',{method:'POST',headers:{'Content-Type':'application/json','X-Session-Token':status.token,...headers},body:JSON.stringify({id,text})});
  assert.equal((await send('1','help',{'X-Session-Token':'wrong'})).status,403);assert.equal((await send('1','help',{Origin:'https://evil.example'})).status,403);
  const h=await (await send('help','help')).json() as {responses:string[]};assert.match(h.responses[0],/Text the Web/);
  const q=await (await send('research','https://example.com/ What is the purpose of this domain?')).json() as {responses:string[];state:string;research:string};assert.equal(q.state,'sent');assert.equal(q.research,'fixture');assert.match(q.responses[0],/OFFLINE FIXTURE/);
  const d=await (await send('research','https://example.com/ What is the purpose of this domain?')).json() as {state:string;responses:string[]};assert.equal(d.state,'duplicate');assert.equal(d.responses.length,0);
  const blocked=await (await send('blocked','https://127.0.0.1/ What is here?')).json() as {responses:string[]};assert.match(blocked.responses[0],/blocked/);
  assert.equal((await send('big','a'.repeat(5000))).status,413);
  const page=await fetch(base+'/');assert.ok(page.headers.get('Content-Security-Policy')?.includes("frame-ancestors 'none'"));assert.match(await page.text(),/not an iMessage/);
 }finally{server.close();await once(server,'close');store.close();}
});
