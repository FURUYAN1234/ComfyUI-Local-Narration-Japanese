import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
import {scriptBlocks,saveScript} from "./dialogue_blocks.js";

const purposePresets={'解説・紹介':'初心者向けの紹介動画。分かりやすく、親しみのある説明にしたい。','物語・朗読':'情景が伝わる、落ち着いた物語の朗読にしたい。','案内':'要点が明確で聞き取りやすい案内にしたい。','自由入力':''};
const tonePresets={'標準':'自然で聞き取りやすい日本語のナレーション。','落ち着いた':'落ち着いた口調で、自然な抑揚で話す。','親しみやすい':'親しみやすく、やわらかな口調で話す。','明るい':'明るく軽快な口調で話す。','淡々と':'淡々と、抑揚を控えて明瞭に話す。'};
const modes={'台詞を作る＋声もAIが提案':'compose','台詞を作る・直す（声は変更しない）':'script','声だけ提案（台詞は変更しない）':'plan'};
const style=(e,s)=>Object.assign(e.style,s);
function element(tag,text,parent){const e=document.createElement(tag);e.textContent=text||'';parent?.append(e);return e;}
function button(text,parent,fn){const b=element('button',text,parent);b.type='button';b.onclick=fn;style(b,{padding:'9px 12px',whiteSpace:'normal',cursor:'pointer'});return b;}
function input(label,parent,value='',type='textarea'){
 const box=element('label',label,parent);style(box,{display:'grid',gap:'5px',margin:'10px 0'});
 const e=element(type,'',box);e.setAttribute('aria-label',label);e.value=value;
 style(e,{width:'100%',boxSizing:'border-box',padding:'8px',background:'#171a20',color:'#fff',border:'1px solid #75808e',borderRadius:'5px',font:'14px/1.6 system-ui'});
 if(type==='textarea')style(e,{minHeight:'90px',resize:'vertical'});
 return e;
}
function select(label,parent,values,value){const e=input(label,parent,'','select');for(const v of values){const o=element('option',v,e);o.value=v;}e.value=value;return e;}
function modal(title){
 const d=element('dialog');d.className='local-narration-editor';element('style','.local-narration-editor [hidden] { display: none !important; }',d);style(d,{width:'min(760px,92vw)',maxHeight:'86vh',boxSizing:'border-box',overflowY:'auto',background:'#20242c',color:'#fff',border:'1px solid #718096',borderRadius:'12px',padding:'20px',font:'14px/1.6 system-ui'});
 element('h2',title,d);document.body.append(d);d.showModal();return d;
}
export function installDirectionEditor(node){
 node.title='1. Script and voice / 台詞と声を決める';
 const get=n=>node.widgets.find(w=>w.name===n);
 const value=n=>get(n)?.value;
 const set=(n,v)=>{const w=get(n);if(w){w.value=v;w.callback?.(v);}};
 const props=()=>node.properties ||= {};
 const text=()=>{try{return JSON.parse(value('dialogue_blocks')).blocks.map(b=>b.text).join('\n');}catch{return value('text')||'';}};
 const snapshot=()=>JSON.stringify(['text','dialogue_blocks','purpose','mode','engine','voice_mode','speaker','character','style','speed'].map(value));
 const dirty=()=>{app.graph.setDirtyCanvas(true,true);sync();};
 const reference=()=>{const id=node.inputs?.find(i=>i.name==='reference_audio')?.link;const link=app.graph.links?.[id];const n=link&&app.graph.getNodeById(link.origin_id);return n?.widgets?.find(w=>w.name==='enabled')?.value;};
 const ready=()=>value('mode')==='手動'||(value('mode')==='AI提案＋手動上書き'&&value('engine')!=='おまかせ'&&value('style')?.trim()&&value('speed'));
 const notify=(state,message,dialog)=>api.dispatchEvent(new CustomEvent('local_narration.consult_status',{detail:{state,text:message,dialog}}));
 const root=element('div');style(root,{padding:'12px',boxSizing:'border-box',background:'#20242c',color:'#fff',font:'13px/1.55 system-ui',display:'flex',flexDirection:'column',gap:'10px',height:'100%',overflow:'hidden'});
 root.addEventListener('pointerdown',e=>e.stopPropagation());
 style(button('Consult AI / 作りたい内容をAIに相談',root,()=>consult()),{flexShrink:0});
 const scripts=element('section','',root);style(scripts,{background:'#151920',padding:'10px',borderRadius:'7px',display:'flex',flexDirection:'column',flex:'1 1 0',minHeight:'130px'});
 const scriptTitle=element('strong','',scripts);
 element('small','Editable here / ここでも手入力で加筆・訂正できます（即時反映）',scripts);
 const toolbar=element('div','',scripts);style(toolbar,{display:'flex',flexWrap:'nowrap',justifyContent:'flex-end',gap:'4px',marginTop:'5px',flexShrink:0});
 const preview=element('textarea','',scripts);preview.setAttribute('aria-label','Script / 台詞を直接編集');preview.placeholder='台詞を入力、またはペーストしてください。';
 style(preview,{width:'100%',boxSizing:'border-box',background:'#151920',color:'#fff',border:'1px solid #75808e',borderRadius:'5px',font:'14px/1.6 system-ui',overflowY:'auto',flex:'1 1 0',minHeight:'60px',margin:'8px 0',resize:'none'});
 let lastScript,composing=false,history=[],historyIndex=-1;
 const editStatus=element('small','',scripts);editStatus.setAttribute('role','status');
 const commit=(remember=true)=>{if(remember&&history[historyIndex]!==preview.value){history.splice(historyIndex+1);history.push(preview.value);if(history.length>100)history.shift();historyIndex=history.length-1;}saveScript(node,{blocks:scriptBlocks(preview.value),target:''});lastScript=text();editStatus.textContent='';sync();};
 preview.oninput=()=>{if(!composing)commit();};
 preview.addEventListener('compositionstart',()=>{composing=true;});
 preview.addEventListener('compositionend',()=>{composing=false;commit();});
 preview.addEventListener('keydown',e=>{
  e.stopPropagation();if(composing||e.isComposing||!(e.ctrlKey||e.metaKey)||e.altKey)return;
  const key=e.key.toLowerCase();if(key==='z'||key==='y'){e.preventDefault();moveHistory(key==='y'||e.shiftKey?1:-1);}
 });
 function moveHistory(delta){const next=historyIndex+delta;if(composing||next<0||next>=history.length)return;historyIndex=next;preview.value=history[next];commit(false);preview.focus();}
 button('Copy / コピー',toolbar,async()=>{try{await navigator.clipboard.writeText(preview.value);editStatus.textContent='Copied / コピーしました。';}catch{preview.focus();preview.select();editStatus.textContent='Press Ctrl+C / Ctrl+Cでコピーしてください。';}});
 button('Paste / ペースト',toolbar,async()=>{
  const before=preview.value,start=preview.selectionStart,end=preview.selectionEnd;
  try{const pasted=await navigator.clipboard.readText();if(preview.value!==before){editStatus.textContent='Script changed; retry / 台詞が変わったため、もう一度ペーストしてください。';return;}preview.setRangeText(pasted,start,end,'end');commit();preview.focus();}
  catch{preview.focus();editStatus.textContent='Press Ctrl+V / Ctrl+Vでペーストしてください。';}
 });
 button('Clear / クリア',toolbar,()=>{if(!preview.value)return;preview.value='';commit();preview.focus();});
 const undo=button('Undo / 戻す',toolbar,()=>moveHistory(-1));
 const redo=button('Redo / やり直す',toolbar,()=>moveHistory(1));
 style(button('Edit script / 台詞を1文ずつ編集（＋／－）',scripts,()=>node.narrationEditSentences?.()),{flexShrink:0});
 for(const b of toolbar.children)style(b,{padding:'3px 5px',font:'10px/1.4 system-ui',minHeight:'24px',borderRadius:'0',border:'1px solid #606773',background:'#30363f',color:'#fff',boxShadow:'none',appearance:'none',whiteSpace:'nowrap'});
 const voices=element('section','',root);style(voices,{background:'#151920',padding:'10px',borderRadius:'7px',flexShrink:0});
 element('strong','2. Voice / 読み上げる声',voices);
 const summary=element('div','',voices);style(summary,{whiteSpace:'pre-wrap',margin:'8px 0',overflowY:'auto',maxHeight:'80px',overflowWrap:'anywhere'});
 button('Voice settings / 声を確認・調整',voices,()=>editVoice());
 const status=element('div','',root);status.setAttribute('role','status');
 let submitting=false;
 const run=button('Run / 実行して読みを確認',root,async()=>{
  if(submitting||!text().trim()||!ready())return;
  submitting=true;sync();
  let failure;
  try{await app.queuePrompt(0,1);}catch(e){failure=e;}
  finally{submitting=false;sync();if(failure)status.textContent='実行できませんでした：'+failure.message;}
 });style(run,{flexShrink:0,background:'#166534',color:'#fff'});
 element('small','Run → review readings → generate / 「実行」→読みの確認→音声生成',root);
 const widget=node.addDOMWidget('narration_editor','div',root,{serialize:false,hideOnZoom:false,getMinHeight:()=>630,getMaxHeight:()=>630,getHeight:()=>630});
 widget.options ||= {};widget.options.serialize=false;widget.computeSize=()=>[460,630];
 function sync(){
  for(const w of node.widgets){if(w===widget)continue;if(!w._narrationHidden){w._narrationHidden=true;w.hidden=true;w.computeSize=()=>[0,-4];if(w.computeLayoutSize)w.computeLayoutSize=()=>({minHeight:0,maxHeight:0,minWidth:0});}if(w.inputEl){w.inputEl.style.display='none';const c=w.inputEl.parentElement?.querySelector('.narration-caption');if(c)c.style.display='none';}}
  const t=text(),count=t.trim()?scriptBlocks(t).length:0;
  run.disabled=submitting||!count||!ready();
  style(run,{background:run.disabled?'#444b55':'#166534',color:run.disabled?'#aab0b8':'#fff',cursor:run.disabled?'not-allowed':'pointer'});
  run.title=!count?'台詞が空のため実行できません。':'';
  scriptTitle.textContent='1. Script / 採用済みの台詞 '+count+'件';if(t!==lastScript&&!composing){preview.value=t;lastScript=t;history=[t];historyIndex=0;}
  undo.disabled=composing||historyIndex<=0;redo.disabled=composing||historyIndex>=history.length-1;
  for(const b of [undo,redo])style(b,{opacity:b.disabled?'.45':'1',cursor:b.disabled?'not-allowed':'pointer'});
  summary.textContent=ready()?(value('engine')==='おまかせ'?'Irodori':value('engine'))+' · '+(value('speed')||1)+'倍\n'+(reference()?'参照音声を使用':value('voice_mode')==='用意された声（Qwen）'?'話者：'+value('speaker'):[value('character')==='自由指定'?'':value('character'),value('style')||'自然で聞き取りやすいナレーション'].filter(Boolean).join(' / ')):'声は未確定です。AIに相談するか、プリセットから選んでください。';
  status.textContent=!count?'実行不可：台詞を入力してください。':!ready()?'声の設定を確定してください。':'台詞と声を確認できたら「実行」へ。';
 }
 function editVoice(){
  const initial=snapshot(),d=modal('Voice settings / 読み上げる声を決める');
  const engine=select('Model / 音声モデル',d,['Irodori','Qwen'],value('engine')==='Qwen'?'Qwen':'Irodori');
  const source=select('Voice source / 声の作り方',d,['デザイン','用意された声（Qwen）'],value('voice_mode'));
  const speaker=select('Speaker / 話者',d,get('speaker').options.values,value('speaker'));
  const character=select('Character / 声のキャラクター',d,[...get('character').options.values.map(v=>v==='自由指定'?'標準／口調で指定':v),'自由入力'],value('character')==='自由指定'?'標準／口調で指定':value('character'));
  const tone=select('Tone / 口調',d,[...Object.keys(tonePresets),'自由入力'],Object.keys(tonePresets).find(k=>tonePresets[k]===value('style'))||(value('style')?'自由入力':'標準'));
  const custom=input('Custom voice and tone / 声質・口調の自由入力',d,value('style')||'');
  const speed=input('Speed / 話速（0.5〜2.0倍）',d,value('speed')||1,'input');speed.type='number';speed.min=.5;speed.max=2;speed.step=.05;
  const details=element('details','',d);element('summary','Advanced / 候補番号',details);
  const seed=input('Seed / 候補番号',details,value('seed'),'input');seed.type='number';seed.min=0;seed.max=2147483647;seed.step=1;
  const after=get('control_after_generate');const seedMode=after?select('After generation / 生成後の候補番号',details,after.options.values,after.value):null;
  const note=element('p','',d);note.setAttribute('role','status');
  function update(){source.parentElement.hidden=engine.value!=='Qwen'||!!reference();speaker.parentElement.hidden=engine.value!=='Qwen'||source.value!=='用意された声（Qwen）'||!!reference();const design=!(reference()&&engine.value==='Qwen')&&!(engine.value==='Qwen'&&source.value==='用意された声（Qwen）');character.parentElement.hidden=tone.parentElement.hidden=!design;custom.parentElement.hidden=!design||tone.value!=='自由入力';note.textContent=reference()?'参照音声がONです。参照ノードで指定した音声を使います。':'';}
  engine.onchange=source.onchange=tone.onchange=update;character.onchange=()=>{if(character.value==='自由入力')tone.value='自由入力';update();};update();
  const close=()=>{d.close();d.remove();};d.addEventListener('cancel',e=>{e.preventDefault();close();});
  button('Cancel / キャンセル（変更を破棄）',d,close);
  button('Apply voice / この声の設定を採用',d,()=>{
   if(snapshot()!==initial){note.textContent='元の入力が変わりました。開き直してください。';return;}
   if(!Number.isFinite(+speed.value)||+speed.value<.5||+speed.value>2||!Number.isInteger(+seed.value)||+seed.value<0||+seed.value>2147483647){note.textContent='話速と候補番号の範囲を確認してください。';return;}
   if(tone.value==='自由入力'&&!custom.value.trim()&&!custom.parentElement.hidden){note.textContent='声質・口調を入力してください。';return;}
   set('mode','手動');set('engine',engine.value);set('voice_mode',engine.value==='Qwen'?source.value:'デザイン');set('speaker',speaker.value);set('character',['標準／口調で指定','自由入力'].includes(character.value)?'自由指定':character.value);set('style',tone.value==='自由入力'?custom.value.trim():tonePresets[tone.value]);set('speed',+speed.value);set('seed',+seed.value);if(seedMode)set('control_after_generate',seedMode.value);dirty();close();
  });
 }
 function consult(){
  const initial=snapshot(),original=text(),d=modal('AI consultation / 台詞と声を相談して作る');
  style(d,{margin:'180px auto 24px',maxHeight:'calc(100vh - 204px)'});
  const target=select('Create / AIに作ってもらうもの',d,Object.keys(modes),'台詞を作る＋声もAIが提案');
  const purpose=select('Purpose / 用途の例',d,Object.keys(purposePresets),'自由入力');
  const brief=input('Request / 作りたい内容・希望',d,props().narrationBrief||value('purpose')||'');
  brief.placeholder='例：テラフォーマーについて、初心者にも分かる紹介と考察を作って。';
  element('small','Script length / 文数指定がなければ5文で構成。1文だけなどの指定もできます。',d);
  purpose.onchange=()=>{if(purpose.value!=='自由入力')brief.value=purposePresets[purpose.value];};
  element('p','選んだ項目だけをAIが提案します。「採用」で反映されます。採用済みの声を確認・変更する場合は、ノードの「声を確認・調整」を使います。',d);
  const local=element('p','',d);local.setAttribute('role','status');
  let propose;
  const draft=element('section','',d);draft.hidden=true;
  const script=input('Proposed script / 台詞の提案（1行に1文・編集可）',draft,'');style(script,{minHeight:'170px'});
  const engine=select('Proposed model / 提案モデル',draft,['Irodori','Qwen'],'Irodori');
  const voice=input('Proposed voice / 声質・口調の提案（編集可）',draft,'');
  const speed=input('Proposed speed / 提案話速',draft,1,'input');speed.type='number';speed.min=.5;speed.max=2;speed.step=.05;
  let alive=true,busy=false,timer,proposedKind,proposedBrief;
  const close=()=>{notify(busy?'cancel':'detach',busy?'相談を閉じました。提案は採用しません / Consultation dismissed':'',d);alive=false;clearInterval(timer);d.close();d.remove();};
  const footer=element('div','',d);style(footer,{display:'flex',flexWrap:'wrap',justifyContent:'flex-end',gap:'10px',marginTop:'14px'});
  button('Cancel / キャンセル（変更を破棄）',footer,close);
  const apply=button('Apply / 提案を台詞・声へ採用',footer,()=>{});apply.disabled=true;
  propose=button('Suggest / AIに提案してもらう',footer,()=>{});
  const invalidate=()=>{draft.hidden=true;apply.disabled=true;};target.onchange=brief.oninput=invalidate;
  purpose.onchange=()=>{if(purpose.value!=='自由入力')brief.value=purposePresets[purpose.value];invalidate();};
  d.addEventListener('cancel',e=>{e.preventDefault();close();});
  propose.onclick=async()=>{
   if(busy)return;if(!brief.value.trim()){local.textContent='作りたい内容を入力してください。';return;}
   const kind=modes[target.value];busy=true;propose.disabled=target.disabled=brief.disabled=purpose.disabled=apply.disabled=true;draft.hidden=true;
   const start=Date.now(),update=()=>local.textContent='AIに相談中 / 経過 '+Math.floor((Date.now()-start)/1000)+'秒';update();timer=setInterval(update,1000);notify('running','AIに相談中 / Consulting AI',d);
   try{
    const response=await api.fetchApi('/local-narration/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,text:original,brief:brief.value,seed:value('seed')})});
    const data=await response.json();if(!response.ok)throw Error(data.error||'相談に失敗しました。');if(!alive)return;
    if(kind!=='plan'&&!scriptBlocks(data.text||'').length)throw Error('台詞の提案が空です。');
    if(kind!=='script'&&(!['Irodori','Qwen'].includes(data.engine)||!data.style?.trim()||!Number.isFinite(data.speed)||data.speed<.5||data.speed>2))throw Error('声の提案が不正です。');
    proposedKind=kind;proposedBrief=brief.value;script.value=kind==='plan'?original:scriptBlocks(data.text).map(b=>b.text).join('\n');
    script.parentElement.hidden=kind==='plan';engine.parentElement.hidden=voice.parentElement.hidden=speed.parentElement.hidden=kind==='script';
    if(kind!=='script'){engine.value=data.engine;voice.value=data.style;speed.value=data.speed;}
    draft.hidden=false;apply.disabled=false;apply.textContent=kind==='script'?'Apply script / 台詞一覧へ採用':kind==='plan'?'Apply voice / 声の設定へ採用':'Apply script and voice / 台詞一覧と声へ採用';
    local.textContent=(kind==='plan'?'':scriptBlocks(script.value).length+'件の台詞を提案しました。 ')+(data.reason||'内容を確認・修正してから採用してください。');
    notify('complete','✅ AIの提案ができました。小窓で確認・修正してください / Proposal ready',d);
   }catch(e){if(alive){local.textContent='エラー：'+e.message;notify('error','⚠️ AI相談に失敗しました / Consultation failed\n'+e.message,d);}}
   finally{clearInterval(timer);busy=false;if(alive)propose.disabled=target.disabled=brief.disabled=purpose.disabled=false;}
  };
  apply.onclick=()=>{
   if(snapshot()!==initial){local.textContent='相談中に元の入力が変わりました。開き直してください。';return;}
   const kind=proposedKind;if(!kind)return;
   const blocks=kind==='plan'?null:scriptBlocks(script.value);
   if(blocks&&(!blocks.length||blocks.length>100||blocks.some(b=>b.text.length>10000))){local.textContent='台詞は1〜100文、各1万文字以内で入力してください。';return;}
   if(kind!=='script'&&(!voice.value.trim()||+speed.value<.5||+speed.value>2||!Number.isFinite(+speed.value))){local.textContent='声の指示と話速を確認してください。';return;}
   if(kind!=='script'&&reference()){local.textContent='参照音声がONです。提案した声を使う場合は参照をOFFにしてから相談してください。';return;}
   if(blocks)saveScript(node,{blocks,target:''});
   if(kind!=='script'){set('mode','手動');set('engine',engine.value);set('voice_mode','デザイン');set('character','自由指定');set('style',voice.value.trim());set('speed',+speed.value);}
   props().narrationBrief=proposedBrief;set('purpose',proposedBrief);dirty();close();
  };
 }
 sync();queueMicrotask(()=>{if(node.computeSize&&node.setSize)node.setSize([Math.max(node.size[0],460),node.computeSize()[1]]);});return sync;
}
