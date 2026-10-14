import { test } from 'node:test';import assert from 'node:assert/strict';import { readFileSync } from 'node:fs';import { TinyFishResearch } from '../src/research.js';import { TinyFish } from '@tiny-fish/sdk';
// All responses in this file are explicitly synthetic provider-contract fixtures.
const wallet={available_balance:'37.00',currency:'USD',as_of:new Date().toISOString(),auto_reload:{state:'off',threshold:'0',recharge_to:'0'},pending_top_up:null,rates:null};
const page={results:[{url:'https://example.com/',final_url:'https://example.com/',title:'Example Domain',description:null,language:'en',author:null,published_date:null,text:'Example Domain is used for illustrative examples in documents.',latency_ms:10,format:'markdown'}],errors:[]};
const done={status:'COMPLETED',deep_result:{result:'Example Domain illustrates documentation examples.',citations:['https://example.com/']}};
async function withTransport(handler:(url:string,init?:RequestInit)=>Response|Promise<Response>,run:()=>Promise<void>){const original=globalThis.fetch;globalThis.fetch=(async (url,init)=>handler(String(url),init)) as typeof fetch;try{await run();}finally{globalThis.fetch=original;}}
const response=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
function transport(overrides:Record<string,unknown>={},calls:string[]=[],bodies:unknown[]=[]){return (url:string,init?:RequestInit)=>{const u=new URL(url);calls.push(u.href);if(init?.body)bodies.push(JSON.parse(String(init.body)));if(u.pathname.endsWith('/cancel'))return response({cancelled:true});if(u.pathname.endsWith('/wallet'))return response(overrides.wallet??wallet);if(u.hostname==='api.fetch.tinyfish.ai')return response(overrides.page??page);if(u.pathname.endsWith('run-research-async'))return response({research_run_id:'fixture-run-id'});if(u.pathname.endsWith('fixture-run-id'))return response(overrides.run??done);throw new Error('Unexpected documented route');};}
function provider(){return new TinyFishResearch('contract-test-key-not-real',{validate:async u=>{if(new URL(u).hostname!=='example.com')throw new Error('unsafe');return u;},sleep:async()=>{},polls:2});}
test('official SDK uses bounded documented routes, instant mode, no retries',async()=>{const calls:string[]=[],bodies:unknown[]=[];await withTransport(transport({},calls,bodies),async()=>{const a=await provider().research('https://example.com/','What is its purpose?',new AbortController().signal);assert.equal(a.mode,'live');assert.deepEqual(a.sources,['https://example.com/']);assert.equal(calls.length,4);const request=bodies.find(x=>(x as {mode?:string}).mode) as {mode:string;query:string;domain_filter:unknown};assert.equal(request.mode,'instant');assert.match(request.query,/untrusted data/);assert.deepEqual(request.domain_filter,{mode:'exclusive',domains:['example.com'],block:[]});});});
test('expired key maps to credentials and makes one HTTP attempt',async()=>{let calls=0;await withTransport(()=>{calls++;return response({error:{message:'RAW_SECRET_NEVER_LOG',code:'UNAUTHORIZED'}},401);},async()=>{await assert.rejects(provider().research('https://example.com/','purpose',new AbortController().signal),{code:'credentials'});assert.equal(calls,1);});});
test('503 not retried',async()=>{let calls=0;await withTransport(()=>{calls++;return response({message:'service'},503);},async()=>{await assert.rejects(provider().research('https://example.com/','purpose',new AbortController().signal),{code:'unavailable'});assert.equal(calls,1);});});
test('provider HTTP 429 is distinct from the local budget and is not retried',async()=>{let calls=0;await withTransport(()=>{calls++;return response({message:'rate limited'},429);},async()=>{await assert.rejects(provider().research('https://example.com/','purpose',new AbortController().signal),{code:'provider_rate_limit'});assert.equal(calls,1);});});
for (const [name, balance] of [
 ['missing', undefined], ['null', null], ['garbage', 'unknown'], ['NaN', 'NaN'],
 ['positive infinity', 'Infinity'], ['negative infinity', '-Infinity'], ['overflow', '9'.repeat(400)],
 ['zero string', '0.00'], ['numeric zero', 0], ['numeric positive', 37],
 ['negative string', '-1.25'], ['negative number', -1.25], ['empty', ''], ['whitespace', ' '],
 ['boolean', true], ['array', [37]], ['object', {value:37}], ['hex', '0x25'], ['exponent', '1e2'], ['trailing newline','37\n'],
] as const) test(`wallet ${name} balance prevents all billable requests`, async()=>{
 const calls:string[]=[];
 await withTransport(transport({wallet:{...wallet,available_balance:balance}},calls), async()=>{
  // Non-string values fail the SDK schema; malformed decimal strings fail the local credit gate.
  await assert.rejects(provider().research('https://example.com/','purpose',new AbortController().signal), {code:typeof balance==='string'?'credits':'unavailable'});
  assert.equal(calls.length,1);
  assert.equal(new URL(calls[0]!).pathname.endsWith('/wallet'),true);
 });
});
for (const balance of ['37.00','0.01','37']) test(`positive decimal wallet balance ${JSON.stringify(balance)} permits research`, async()=>{
 await withTransport(transport({wallet:{...wallet,available_balance:balance}}),async()=>{
  assert.deepEqual((await provider().research('https://example.com/','purpose',new AbortController().signal)).sources,['https://example.com/']);
 });
});
test('an unconfigured auto-reload state with positive credits permits research',async()=>{
 await withTransport(transport({wallet:{...wallet,auto_reload:{state:'unconfigured'}}}),async()=>{
  assert.equal((await provider().research('https://example.com/','purpose',new AbortController().signal)).mode,'live');
 });
});
test('report prose removes arbitrary HTTP links regardless of case and preserves validated citations',async()=>{
 const result='Documentation examples [1]. HTTPS://127.0.0.1/private and hTtPs://user:password@example.com/private and HTTP://169.254.169.254/metadata and //127.0.0.1/private are untrusted. Read [details](HTTPS://127.0.0.1/private).';
 await withTransport(transport({run:{...done,deep_result:{...done.deep_result,result}}}),async()=>{
  const answer=await provider().research('https://example.com/','purpose',new AbortController().signal);
  assert.equal(answer.text,'Documentation examples [1]. [source] and [source] and [source] and [source] are untrusted. Read details.');
  assert.doesNotMatch(answer.text,/https?:\/\/|password|127\.0\.0\.1|169\.254\.169\.254/i);
  assert.deepEqual(answer.sources,['https://example.com/']);
 });
});
test('successful cited research may explain CAPTCHA, login, and access-denied errors',async()=>{
 const result='This page documents CAPTCHA handling, access denied responses, login required errors, and blocked website diagnostics.';
 await withTransport(transport({run:{...done,deep_result:{...done.deep_result,result}}}),async()=>{
  const answer=await provider().research('https://example.com/','Explain the documented errors.',new AbortController().signal);
  assert.equal(answer.text,result);
  assert.deepEqual(answer.sources,['https://example.com/']);
 });
});
for(const [name,overrides,code] of [
 ['website challenge',{page:{results:[],errors:[{url:'https://example.com/',error:'bot_blocked'}]}},'blocked'],
 ['website login wall',{page:{results:[],errors:[{url:'https://example.com/',error:'login_required'}]}},'blocked'],
 ['website timeout',{page:{results:[],errors:[{url:'https://example.com/',error:'timeout'}]}},'timeout'],
 ['unsafe redirect',{page:{...page,results:[{...page.results[0],final_url:'https://127.0.0.1/'}]}},'unavailable'],
 ['no citations',{run:{status:'COMPLETED',deep_result:{result:'unverified claim',citations:[]}}},'no_answer'],
 ['unsafe source',{run:{status:'COMPLETED',deep_result:{result:'unsafe claim',citations:['https://127.0.0.1/']}}},'no_answer'],
 ['enabled auto-reload',{wallet:{...wallet,auto_reload:{state:'on',threshold:'5',recharge_to:'10'}}},'credits'],
 ['unknown auto-reload',{wallet:{...wallet,auto_reload:null}},'credits'],
 ['pending top-up',{wallet:{...wallet,pending_top_up:{amount:'5',started_at:new Date().toISOString()}}},'credits'],
] as const)test(`${name} fails closed`,async()=>{await withTransport(transport(overrides),async()=>assert.rejects(provider().research('https://example.com/','purpose',new AbortController().signal),{code}));});
test('bounded polling exhaustion makes one cancellation attempt',async()=>{const calls:string[]=[];await withTransport(transport({run:{status:'RUNNING',deep_result:null}},calls),async()=>{await assert.rejects(provider().research('https://example.com/','purpose',new AbortController().signal),{code:'timeout'});assert.equal(calls.filter(x=>x.endsWith('/cancel')).length,1);assert.equal(calls.length,6);});});
test('SDK cancellation prevents research creation after interrupted fetch',async()=>{const ctrl=new AbortController();let calls=0;await withTransport((url,init)=>{calls++;if(new URL(url).hostname==='api.fetch.tinyfish.ai')ctrl.abort();return transport()(url,init);},async()=>{await assert.rejects(provider().research('https://example.com/','purpose',ctrl.signal),{code:'timeout'});assert.equal(calls,2);});});
test('SDK key serialization redacts credentials',()=>{const sdk=new TinyFish({apiKey:'should-never-appear'});assert.ok(!JSON.stringify(sdk).includes('should-never-appear'));});
test('tracked package safety patches disable internal send retries',()=>{const cloud=readFileSync('node_modules/@spectrum-ts/imessage/dist/index.js','utf8');assert.ok(!cloud.includes('retry: true,'));assert.equal(cloud.split('retry: false,').length-1,3);for(const file of ['index.js','index.cjs'])assert.ok(readFileSync(`node_modules/@photon-ai/imessage-kit/dist/${file}`,'utf8').includes('var RETRY_ATTEMPTS = 1;'));});
