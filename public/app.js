const $=id=>document.getElementById(id);let token,last,busy=false;
function bubble(text,kind='bot'){
  document.querySelector('.welcome')?.remove();
  const div=document.createElement('div');div.className='bubble '+kind;
  const label=document.createElement('small');label.textContent=kind==='user'?'YOU · SANDBOX':'TEXT THE WEB · '+(kind==='notice'?'EVENT STATUS':'RESEARCH');div.append(label);
  // Website/model text is data: never HTML or Markdown execution.
  for(const piece of text.split(/(https:\/\/[^\s]+)/g)){
    if(piece.startsWith('https://')){const a=document.createElement('a');a.href=piece;a.textContent=piece;a.target='_blank';a.rel='noopener noreferrer';div.append(a);}else div.append(document.createTextNode(piece));
  }
  $('messages').append(div);$('messages').scrollTop=$('messages').scrollHeight;
}
async function dispatch(replay=false){
  if(busy)return;const text=$('message').value.trim();if(!replay&&!text)return;
  busy=true;$('send').disabled=true;$('replay').disabled=true;$('activity').textContent='Researching… requests are bounded; this may take up to two minutes.';
  const body=replay?last:{id:crypto.randomUUID(),text};if(!replay){last=body;bubble(text,'user');$('message').value='';}
  try{const response=await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json','X-Session-Token':token},body:JSON.stringify(body)});const result=await response.json();
    if(!response.ok)throw new Error('Request rejected');
    $('budget-summary').textContent=result.remaining+' of '+result.max+' requests left · 1/min';result.responses.forEach(t=>bubble(t));if(!result.responses.length)bubble(result.state==='duplicate'?'Duplicate event ignored. No second research call or reply.':'Event status: '+result.state,'notice');
    $('activity').textContent=result.state==='sent'?'Reply shown · offline transport':'Event status: '+result.state;
  }catch{bubble('The console request failed. Delivery may be uncertain; it will not be retried automatically.','notice');$('activity').textContent='Request failed · no automatic retry';}
  finally{busy=false;$('send').disabled=false;$('replay').disabled=!last;}
}
$('composer').addEventListener('submit',e=>{e.preventDefault();dispatch();});$('example').addEventListener('click',()=>{$('message').value='https://example.com/ What is the purpose of this domain?';$('message').focus();});$('help').addEventListener('click',()=>{if(!busy){$('message').value='help';dispatch();}});$('replay').addEventListener('click',()=>dispatch(true));
try{const r=await fetch('/api/status');if(!r.ok)throw new Error();const status=await r.json();token=status.token;$('budget-summary').textContent=status.remaining+' of '+status.max+' requests left · 1/min';$('research-mode').textContent=status.research==='fixture'?'Fixture research · no TinyFish call. Only Example Domain questions are supported.':'Live TinyFish research · browser messaging remains offline.';$('research-mode').classList.toggle('live',status.research==='live');if(status.research==='live'){ $('example').childNodes[0].textContent='Use live example ';document.querySelector('.welcome p').textContent='Ask about Example Domain using live TinyFish research, or send help to see the commands.'; }}catch{$('activity').textContent='Server unavailable';$('send').disabled=true;}
