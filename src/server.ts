import { acquireLock } from './lock.js';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { Engine } from './engine.js';
import { Store } from './store.js';
import { researcher, requestCap } from './config.js';
const files: Record<string,[string,string]> = {'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
export function makeServer(engine: Engine): Server {
  const token = randomBytes(32).toString('hex');
  return createServer(async (req,res) => {
    const address = serverAddress(res.socket?.localPort ?? 0);
    const host = req.headers.host;
    if (host !== address.replace('http://','')) { res.writeHead(403);res.end();return; }
    if (req.headers.origin && req.headers.origin !== address) { res.writeHead(403);res.end();return; }
    res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
    const json = (status:number,data:unknown) => {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    try {
      if (req.method === 'GET' && req.url === '/api/status') {
        return json(200,{transport:'offline browser adapter — not iMessage',research:engine.researcher.mode,token,stats:engine.store.stats(),max:engine.limit,remaining:engine.remaining});
      }
      if (req.method === 'POST' && req.url === '/api/events') {
        if (req.headers['x-session-token'] !== token || req.headers['content-type'] !== 'application/json') return json(403,{error:'request_not_authorized'});
        let size=0,raw='';
        for await (const chunk of req) {size+=chunk.length;if(size>4096) return json(413,{error:'message_too_large'});raw+=chunk.toString();}
        let body;
        try {body=JSON.parse(raw);} catch {return json(400,{error:'invalid_json'});}
        if (!body || typeof body !== 'object' || Object.keys(body).some(k => !['id','text'].includes(k))) return json(400,{error:'invalid_event'});
        const responses:string[]=[];
        const result=await engine.handle({id:body.id,text:body.text,platform:'offline',conversation:'browser-test',sender:'test-user',direction:'inbound'},async text => {responses.push(text);return 'confirmed';});
        return json(result.state==='invalid' ? 400 : 200,{...result,responses,transport:'offline',research:engine.researcher.mode,max:engine.limit,remaining:engine.remaining});
      }
      const asset=files[req.url??''];
      if (req.method==='GET' && asset) {const content=await readFile(resolve('public',asset[0]));res.writeHead(200,{'Content-Type':asset[1]});res.end(content);return;}
      json(404,{error:'not_found'});
    } catch {json(500,{error:'request_failed'});}
  });
}
function serverAddress(port:number) {return `http://127.0.0.1:${port}`;}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const port=Number(process.env.PORT || 3100);
    if (!Number.isInteger(port) || port<1024 || port>65535) throw new Error('port');
    const research=researcher();
    const stateName=research.mode==='live'?'offline':'fixture';
    acquireLock(`.data/${stateName}.lock`);
    const engine=new Engine(new Store(`.data/${stateName}.sqlite`),research,{platform:'offline',conversation:'browser-test',sender:'test-user'},{maxDaily:requestCap()});
    const server=makeServer(engine);
    server.requestTimeout=150000;
    server.once('error',()=>{console.error(JSON.stringify({code:'server_unavailable_check_port'}));engine.store.close();process.exitCode=1;});
    server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({code:'server_ready',url:serverAddress(port),transport:'offline',research:engine.researcher.mode})));
    for (const event of ['SIGINT','SIGTERM'] as const) process.once(event,()=>server.close(()=>{engine.store.close();process.exit(0);}));
  } catch {console.error(JSON.stringify({code:'startup_failed_check_configuration'}));process.exitCode=1;}
}
