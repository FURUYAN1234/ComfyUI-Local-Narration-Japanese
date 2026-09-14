import {app} from '/scripts/app.js';
import {api} from '/scripts/api.js';
const opened=new Map();
function show(item){
 if(opened.has(item.request_id))return;
 const d=document.createElement('dialog');opened.set(item.request_id,d);
 Object.assign(d.style,{width:'min(900px,90vw)',boxSizing:'border-box',height:'90vh',background:'#20242c',color:'#fff',padding:'22px',borderRadius:'12px',border:'1px solid #64748b',zIndex:10000});
 const add=(tag,text,parent=d)=>{const e=document.createElement(tag);e.textContent=text||'';parent.append(e);return e;};
 add('h2','Review script and readings / 台詞と読みの確認');
 add('p',item.engine+'：各文の原文と読みを確認してください。生成開始後の修正は再生成になります。');
 const body=add('div');Object.assign(body.style,{overflow:'auto',flex:'1',minHeight:'0'});
 const fields=[];
 item.rows.forEach((text,i)=>{const row=add('section','',body);Object.assign(row.style,{background:'#111827',padding:'12px',marginBottom:'12px',borderRadius:'8px'});add('strong',(i+1)+'. Original / 元の台詞',row);add('p',text,row);add('label','Hiragana reading / ひらがなの読み',row);const t=add('textarea','',row);t.value=item.readings[i];t.setAttribute('aria-label','台詞'+(i+1)+'の読み');Object.assign(t.style,{width:'100%',minHeight:'70px',boxSizing:'border-box',fontSize:'16px',lineHeight:'1.6'});fields.push(t);});
 const label=add('label','',body);const remember=add('input','',label);remember.type='checkbox';add('span',' Remember edited readings / 修正した読みを記憶する',label);
 const details=add('details','',body);add('summary','Remembered readings / 記憶した読み',details);add('pre',Object.entries(item.remembered).map(([a,b])=>a+'='+b).join('\n')||'登録なし',details);
 const error=add('p');error.setAttribute('role','status');error.style.color='#fbbf24';
 const buttons=add('div');Object.assign(buttons.style,{display:'flex',justifyContent:'flex-end',flexWrap:'wrap',gap:'12px',paddingTop:'12px'});
 const close=()=>{d.close();d.remove();opened.delete(item.request_id);};
 async function submit(cancelled){const r=await api.fetchApi('/local-narration/reading-review/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id:item.request_id,readings:fields.map(t=>t.value),remember:remember.checked,cancelled})});const data=await r.json();if(!r.ok)throw Error(data.error||r.statusText);close();}
 function button(text,fn){const b=add('button',text,buttons);b.style.padding='12px';b.onclick=async()=>{b.disabled=true;error.textContent='';try{await fn();}catch(e){error.textContent=e.message;}finally{b.disabled=false;}};return b;}
 button('Cancel / 今回の生成を中止',()=>submit(true));
 const warning=add('div');warning.setAttribute('role','alert');Object.assign(warning.style,{display:'none',padding:'12px',border:'1px solid #fbbf24',borderRadius:'8px',color:'#fef3c7'});d.insertBefore(warning,buttons);
 warning.textContent='開始後は今回の読みを修正できません。修正して再生成すると、声の抑揚や長さが変わる場合があります。元の音声は残ります。 / After starting, corrections require regeneration; intonation and duration may change. Previous audio is retained.';
 let approved=false;
 const back=button('Back / 読みの編集に戻る',()=>{approved=false;warning.style.display='none';back.style.display='none';generate.textContent='Generate / この読みで音声生成';});back.style.display='none';
 const generate=button('Generate / この読みで音声生成',async()=>{if(!approved){approved=true;warning.style.display='block';back.style.display='';generate.textContent='Confirm and generate / 確認して音声生成';return;}await submit(false);});
 d.addEventListener('cancel',e=>{e.preventDefault();error.textContent='中止する場合は「今回の生成を中止」を押してください。';});
 document.body.append(d);d.showModal();d.style.display='flex';d.style.flexDirection='column';
}
app.registerExtension({name:'LocalNarration.ReadingReview',setup(){api.addEventListener('local_narration.reading_review',e=>show(e.detail));const recover=async()=>{try{const r=await api.fetchApi('/local-narration/reading-review/pending');if(!r.ok)return;const data=await r.json();for(const p of data.pending)show(p);for(const [id,d]of opened)if(!data.pending.some(p=>p.request_id===id)){d.close();d.remove();opened.delete(id);}}catch{}};api.addEventListener('reconnected',recover);recover();setInterval(recover,5000);}});
