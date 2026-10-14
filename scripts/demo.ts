import { Engine } from '../src/engine.js';import { Store } from '../src/store.js';import { FixtureResearch } from '../src/research.js';
console.log('OFFLINE TERMINAL SIMULATION — fixture research; NOT iMessage or live TinyFish proof.');
let now=Date.now();const store=new Store(':memory:');const engine=new Engine(store,new FixtureResearch(),{platform:'offline',conversation:'demo',sender:'test'},{now:()=>now});
for(const [id,text] of [['help','help'],['question','https://example.com/ What is the purpose of this domain?'],['question','https://example.com/ What is the purpose of this domain?'],['follow','Can I use the example domain in documents?'],['extra','What else can I use it for?'],['private','https://127.0.0.1/ What is here?']]){
  now+=61000;console.log('\nTEST INPUT:',text);console.log('OUTCOME:',await engine.handle({id,text,platform:'offline',conversation:'demo',sender:'test',direction:'inbound'},async reply=>{console.log('OFFLINE REPLY:',reply);return 'confirmed';}));
}
store.close();
