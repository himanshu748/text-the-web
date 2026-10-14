import { openSync,readFileSync,writeFileSync,closeSync,unlinkSync,mkdirSync } from 'node:fs';import { dirname } from 'node:path';
export function acquireLock(path:string){
 mkdirSync(dirname(path),{recursive:true,mode:0o700});
 const create=()=>{const fd=openSync(path,'wx',0o600);writeFileSync(fd,String(process.pid));closeSync(fd);};
 try{create();}catch{
  let pid:number;try{pid=Number(readFileSync(path,'utf8'));}catch{throw new Error('process_lock_unavailable');}
  if(!Number.isInteger(pid)||pid<1)throw new Error('process_lock_invalid');
  try{process.kill(pid,0);throw new Error('another_adapter_is_running');}catch(err){if((err as NodeJS.ErrnoException).code!=='ESRCH')throw new Error('another_adapter_is_running');}
  unlinkSync(path);create();
 }
 const release=()=>{try{if(readFileSync(path,'utf8')===String(process.pid))unlinkSync(path);}catch{}};
 process.once('exit',release);return release;
}
