import { readFileSync, writeFileSync } from 'node:fs';
const edits=[
 ['node_modules/@spectrum-ts/imessage/dist/index.js','retry: true,','retry: false,',3],
 ['node_modules/@photon-ai/imessage-kit/dist/index.js','var RETRY_ATTEMPTS = 3;','var RETRY_ATTEMPTS = 1;',1],
 ['node_modules/@photon-ai/imessage-kit/dist/index.cjs','var RETRY_ATTEMPTS = 3;','var RETRY_ATTEMPTS = 1;',1],
];
for(const [path,before,after,count] of edits){
 const original=readFileSync(path,'utf8');
 if(original.split(before).length-1===count)writeFileSync(path,original.replaceAll(before,after));
 else if(original.split(after).length-1!==count)throw new Error('Provider changed: review send retry safety before running');
}
console.log('Provider send retries disabled (3 reviewed package files).');
