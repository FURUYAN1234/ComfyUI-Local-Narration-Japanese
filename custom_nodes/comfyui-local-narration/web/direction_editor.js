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
const geminiEngine=value=>value==='Gemini 3.8 Flash TTS'||value==='Gemini 3.8 Flash-Lite TTS';
const voiceGenders=['自動','女性','男性','任意'];
const qwenGender={Ono_anna:'女性',Serena:'女性',Sohee:'女性',Vivian:'女性',Aiden:'男性',Dylan:'男性',Eric:'男性',Ryan:'男性',Uncle_fu:'男性'};
// The same named studio voices are classified by Google Cloud's published voice list.
const geminiFemale=new Set(['Achernar','Aoede','Autonoe','Callirrhoe','Despina','Erinome','Gacrux','Kore','Laomedeia','Leda','Pulcherrima','Sulafat','Vindemiatrix','Zephyr']);
const geminiMale=new Set(['Achird','Algenib','Algieba','Alnilam','Charon','Enceladus','Fenrir','Iapetus','Orus','Puck','Rasalgethi','Sadachbia','Sadaltager','Schedar','Umbriel','Zubenelgenubi']);
const studioGender=label=>{const name=label.split('｜')[0];return geminiFemale.has(name)?'女性':geminiMale.has(name)?'男性':'任意';};
const presetGender=label=>label.includes('女性')?'女性':label.includes('男性')?'男性':'任意';
const characterGender=label=>label==='元気なアニメキャラクター'?'女性':label==='クールなアニメキャラクター'?'男性':presetGender(label);
const textGender=text=>{const female=/女性|女声|女の声/.test(text||''),male=/男性|男声|男の声/.test(text||'');return female!==male?(female?'女性':'男性'):'';};
const oppositeGender=(text,gender)=>gender==='女性'?/男性|男声|男の声/.test(text||''):gender==='男性'?/女性|女声|女の声/.test(text||''):false;
function groupedVoices(selectElement,values,genderOf,filter,preferred){
 const previous=preferred||selectElement.value;selectElement.replaceChildren();let choices=[];
 for(const group of ['女性','男性','任意']){
  const items=values.filter(item=>genderOf(item)===group&&(filter==='任意'||filter==='自動'||group===filter||group==='任意'&&['自由入力','標準／口調で指定'].includes(item)));
  if(!items.length)continue;const parent=document.createElement('optgroup');parent.label=group==='任意'?'共通・自由指定':group+'の声';selectElement.append(parent);
  for(const item of items){const option=document.createElement('option');option.value=item;option.textContent=item;parent.append(option);choices.push(item);}
 }
 const fallback=filter==='男性'&&choices.includes('Charon｜情報を伝える解説声')?'Charon｜情報を伝える解説声':choices[0];
 selectElement.value=choices.includes(previous)?previous:fallback||'';
}
let geminiCredentialRevision=0;
api.addEventListener?.('local_narration.gemini_credential_changed',()=>{geminiCredentialRevision+=1;});
function announceGeminiCredential(configured){api.dispatchEvent(new CustomEvent('local_narration.gemini_credential_changed',{detail:{configured:!!configured}}));}
async function geminiCredentialStatus(){
 const response=await api.fetchApi('/local-narration/gemini-credential-status',{cache:'no-store'}),data=await response.json();
 if(!response.ok)throw Error(data.error||'Gemini APIの登録状態を確認できません。');return !!data.configured;
}
function showGeminiCredentialDialog(){
 const previous=document.querySelector?.('[data-local-narration-gemini-credential]');if(previous){previous.close?.();previous.remove();}
 const d=modal('Gemini API key / APIキー入力');d.dataset.localNarrationGeminiCredential='true';
 element('p','任意の設定です。Irodori / Qwenだけを使う場合は登録不要です。Gemini 3.8 Flash TTS / Flash-Lite TTSで共通利用します。キーは動作中のComfyUIプロセスのメモリだけに保持し、ワークフロー・出力JSON・ログには保存しません。',d);
 const status=element('p','登録状態を確認中…',d);status.setAttribute('role','status');
 const key=input('Gemini API key / APIキー',d,'','input');key.type='password';key.autocomplete='off';
 const footer=element('div','',d);style(footer,{display:'flex',flexWrap:'wrap',justifyContent:'flex-end',gap:'10px',marginTop:'14px'});
 let done=false,finish;const result=new Promise(resolve=>finish=value=>{if(done)return;done=true;d.close();d.remove();resolve(value);});
 const remove=button('Remove / このセッションの登録を解除',footer,async()=>{
  remove.disabled=true;status.textContent='登録を解除中…';
  try{const response=await api.fetchApi('/local-narration/gemini-credential',{method:'DELETE'});const data=await response.json();if(!response.ok)throw Error(data.error||'登録解除に失敗しました。');key.value='';announceGeminiCredential(false);finish(false);}
  catch(error){status.textContent='エラー：'+error.message;remove.disabled=false;}
 });remove.hidden=true;
 button('Cancel / 閉じる',footer,()=>finish(false));const save=button('Save / 認証して保存',footer,async()=>{
  if(!key.value.trim())return;save.disabled=true;status.textContent='認証を確認中…';
  try{const response=await api.fetchApi('/local-narration/gemini-credential',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:key.value.trim()})});const data=await response.json();if(!response.ok)throw Error(data.error||'認証に失敗しました。');key.value='';announceGeminiCredential(true);finish(true);}
  catch(error){status.textContent='エラー：'+error.message;save.disabled=false;}
 });
 d.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
 geminiCredentialStatus().then(configured=>{if(!done){status.textContent=configured?'✅ このセッションに登録済みです。':'⚠️ 未登録です。';remove.hidden=!configured;}}).catch(error=>{if(!done)status.textContent='状態確認エラー：'+error.message;});
 queueMicrotask(()=>key.focus());return result;
}
async function ensureGeminiCredential(){try{if(await geminiCredentialStatus())return true;}catch{}return await showGeminiCredentialDialog();}
export function installDirectionEditor(node){
 node.title='1. Script and voice / 台詞と声を決める';
 const get=n=>node.widgets.find(w=>w.name===n);
 const value=n=>get(n)?.value;
 const set=(n,v)=>{const w=get(n);if(w){w.value=v;w.callback?.(v);}};
 const props=()=>node.properties ||= {};
 const text=()=>{try{return JSON.parse(value('dialogue_blocks')).blocks.map(b=>b.text).join('\n');}catch{return value('text')||'';}};
 const snapshot=()=>JSON.stringify([...['text','dialogue_blocks','purpose','mode','engine','voice_mode','speaker','character','style','speed','gemini_voice','gemini_voice_design_preset','gemini_voice_design','gemini_voice_id','gemini_emotion','gemini_emotion_strength','gemini_emotion_custom'].map(value),props().narrationVoiceGender]);
 const dirty=()=>{app.graph.setDirtyCanvas(true,true);sync();};
 const reference=()=>{const id=node.inputs?.find(i=>i.name==='reference_audio')?.link;const link=app.graph.links?.[id];const n=link&&app.graph.getNodeById(link.origin_id);return n?.widgets?.find(w=>w.name==='enabled')?.value;};
 const ready=()=>value('mode')==='手動'||(value('mode')==='AI提案＋手動上書き'&&value('engine')!=='おまかせ'&&value('style')?.trim()&&value('speed'));
 const notify=(state,message,dialog)=>api.dispatchEvent(new CustomEvent('local_narration.consult_status',{detail:{state,text:message,dialog}}));
 const root=element('div');style(root,{padding:'12px',boxSizing:'border-box',background:'#20242c',color:'#fff',font:'13px/1.55 system-ui',display:'flex',flexDirection:'column',gap:'10px',height:'100%',overflow:'hidden'});
 root.addEventListener('pointerdown',e=>e.stopPropagation());
 let geminiConfigured=false;
 const credentialArea=element('section','',root);style(credentialArea,{background:'#252b34',padding:'10px',borderRadius:'7px',flexShrink:0,border:'1px solid #8b6b16'});
 const geminiKey=button('Gemini API key / API登録（任意）',credentialArea,async()=>{await showGeminiCredentialDialog();try{geminiConfigured=await geminiCredentialStatus();}catch{geminiConfigured=false;}sync();});
 const geminiOptional=element('small','任意：Geminiを使う場合だけ必要です。Irodori / QwenはAPI登録なしで使えます。',credentialArea);style(geminiOptional,{display:'block',margin:'5px 0 0',color:'#d4d8de',lineHeight:'1.45'});
 style(button('Voice settings / 声を確認・調整',root,()=>editVoice()),{flexShrink:0});
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
  geminiCredentialStatus().then(value=>{geminiConfigured=value;sync();}).catch(()=>{});
  const credentialChanged=event=>{geminiConfigured=!!event.detail?.configured;sync();};api.addEventListener?.('local_narration.gemini_credential_changed',credentialChanged);
 const status=element('div','',root);status.setAttribute('role','status');
 let submitting=false;
 const run=button('Run / 実行して読みを確認',root,async()=>{
  if(submitting||!text().trim()||!ready())return;
  submitting=true;sync();
  let failure;
  try{if(geminiEngine(value('engine'))){if(!await ensureGeminiCredential())return;geminiConfigured=true;}await app.queuePrompt(0,1);}catch(e){failure=e;}
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
  const gemini=geminiEngine(value('engine')),geminiSource=value('voice_mode');
  summary.textContent=ready()?(value('engine')==='おまかせ'?'Irodori':value('engine'))+' · '+(value('speed')||1)+'倍\n'+(reference()&&!gemini?'参照音声を使用':gemini?([geminiSource==='用意された声（Gemini）'?value('gemini_voice'):geminiSource==='新しい声をデザイン（Gemini）'?(value('gemini_voice_design_preset')==='自由入力'?value('gemini_voice_design'):value('gemini_voice_design_preset')):'Voice ID: '+value('gemini_voice_id'),'感情：'+(value('gemini_emotion')||'自動（原稿・口調から判断）')].join(' / ')):value('voice_mode')==='用意された声（Qwen）'?'話者：'+value('speaker'):[value('character')==='自由指定'?'':value('character'),value('style')||'自然で聞き取りやすいナレーション'].filter(Boolean).join(' / ')):'声は未確定です。AIに相談するか、プリセットから選んでください。';
  geminiKey.hidden=false;geminiKey.textContent=geminiConfigured?'✅ Gemini API 登録済み / 再入力（任意）':'⚠️ Gemini API 未登録 / 入力（Gemini使用時のみ）';
  geminiKey.title='Gemini 3.8 Flash TTS / Flash-Lite TTS 共通のAPIキーを登録・再入力';
  style(geminiKey,{display:'block',width:'100%',margin:'6px 0 0',background:geminiConfigured?'#14532d':'#7c5d00',color:'#fff'});
  status.textContent=!count?'実行不可：台詞を入力してください。':!ready()?'声の設定を確定してください。':'台詞と声を確認できたら「実行」へ。';
 }
 function editVoice(){
  const initial=snapshot(),d=modal('Voice settings / 読み上げる声を決める');
  const engines=['Irodori','Qwen','Gemini 3.8 Flash TTS','Gemini 3.8 Flash-Lite TTS'];
  const engine=select('Model / 音声モデル',d,engines,engines.includes(value('engine'))?value('engine'):'Irodori');
  const gender=select('Voice gender / 声の性別（自動・女性・男性・任意）',d,voiceGenders,props().narrationVoiceGender||textGender(value('style'))||'自動');
  const source=select('Voice source / 声の作り方',d,[],value('voice_mode'));
  const speakerValues=[...get('speaker').options.values],speaker=select('Speaker / 話者',d,speakerValues,value('speaker'));
  const geminiVoiceValues=[...get('gemini_voice').options.values],selectedGeminiVoice=geminiVoiceValues.includes(value('gemini_voice'))?value('gemini_voice'):(geminiVoiceValues[0]||'');
  const geminiVoice=select('Gemini studio voice / 公式スタジオボイス（30種類）',d,geminiVoiceValues,selectedGeminiVoice);
  const geminiDesignPresetValues=[...get('gemini_voice_design_preset').options.values],selectedDesignPreset=geminiDesignPresetValues.includes(value('gemini_voice_design_preset'))?value('gemini_voice_design_preset'):(geminiDesignPresetValues[0]||'');
  const geminiDesignPreset=select('Voice design preset / 声イメージプリセット',d,geminiDesignPresetValues,selectedDesignPreset);
  const geminiDesign=input('Gemini custom voice / 新しく作る声の特徴',d,value('gemini_voice_design')||'');geminiDesign.placeholder='例：落ち着いた30代の女性。中低域が豊かで、明瞭な標準語。';
  const geminiId=input('Gemini saved Voice ID / 保存済みVoice ID',d,value('gemini_voice_id')||'','input');geminiId.placeholder='voice_...';
  const characterValues=[...get('character').options.values.map(v=>v==='自由指定'?'標準／口調で指定':v),'自由入力'];
  const character=select('Character / 声のキャラクター',d,characterValues,value('character')==='自由指定'?'標準／口調で指定':value('character'));
  const tone=select('Tone / 口調',d,[...Object.keys(tonePresets),'自由入力'],Object.keys(tonePresets).find(k=>tonePresets[k]===value('style'))||(value('style')?'自由入力':'標準'));
  const custom=input('Custom voice and tone / 声質・口調の自由入力',d,value('style')||'');
  const emotion=select('Emotion / 感情',d,get('gemini_emotion').options.values,value('gemini_emotion'));
  const emotionStrength=select('Emotion strength / 感情の強さ',d,get('gemini_emotion_strength').options.values,value('gemini_emotion_strength'));
  const emotionCustom=input('Custom emotion / 感情・演技の自由入力',d,value('gemini_emotion_custom')||'','input');
  const speed=input('Speed / 話速（0.5〜2.0倍）',d,value('speed')||1,'input');speed.type='number';speed.min=.5;speed.max=2;speed.step=.05;
  const details=element('details','',d);element('summary','Advanced / 候補番号',details);
  const seed=input('Seed / 候補番号',details,value('seed'),'input');seed.type='number';seed.min=0;seed.max=2147483647;seed.step=1;
  const after=get('control_after_generate');const seedMode=after?select('After generation / 生成後の候補番号',details,after.options.values,after.value):null;
  const note=element('p','',d);note.setAttribute('role','status');
  const sourceValues=()=>engine.value==='Qwen'?['デザイン','用意された声（Qwen）']:geminiEngine(engine.value)?['用意された声（Gemini）','新しい声をデザイン（Gemini）','保存済みVoice ID（Gemini）']:['デザイン'];
  function replaceOptions(selectElement,values,preferred){selectElement.replaceChildren();for(const item of values){const option=element('option',item,selectElement);option.value=item;}selectElement.value=values.includes(preferred)?preferred:values[0];}
  function update(){
   const gemini=geminiEngine(engine.value),ref=!!reference(),allowed=sourceValues();if(!allowed.includes(source.value))replaceOptions(source,allowed,value('voice_mode'));
   const filter=gender.value==='自動'?textGender(tone.value==='自由入力'?custom.value:value('style'))||'任意':gender.value;
   groupedVoices(speaker,speakerValues,v=>qwenGender[v]||'任意',filter,speaker.value);
   groupedVoices(geminiVoice,geminiVoiceValues,studioGender,filter,geminiVoice.value);
   groupedVoices(geminiDesignPreset,geminiDesignPresetValues,presetGender,filter,geminiDesignPreset.value);
   groupedVoices(character,characterValues,characterGender,filter,character.value);
   gender.parentElement.hidden=ref&&!gemini;
   source.parentElement.hidden=engine.value==='Irodori'||(ref&&!gemini);speaker.parentElement.hidden=engine.value!=='Qwen'||source.value!=='用意された声（Qwen）'||ref;
    geminiVoice.parentElement.hidden=!gemini||source.value!=='用意された声（Gemini）';geminiDesignPreset.parentElement.hidden=!gemini||source.value!=='新しい声をデザイン（Gemini）';geminiDesign.parentElement.hidden=geminiDesignPreset.parentElement.hidden||geminiDesignPreset.value!=='自由入力';geminiId.parentElement.hidden=!gemini||source.value!=='保存済みVoice ID（Gemini）';
   const design=!gemini&&!(ref&&engine.value==='Qwen')&&!(engine.value==='Qwen'&&source.value==='用意された声（Qwen）');character.parentElement.hidden=!design;tone.parentElement.hidden=engine.value==='Qwen'&&(ref||source.value==='用意された声（Qwen）');custom.parentElement.hidden=tone.parentElement.hidden||tone.value!=='自由入力';
   emotion.parentElement.hidden=emotionStrength.parentElement.hidden=emotionCustom.parentElement.hidden=!gemini;emotionCustom.parentElement.hidden=!gemini||emotion.value!=='自由入力';
   note.textContent=gemini?(ref?'Geminiでは参照音声を使いません。参照ノードをOFFにしてください。':geminiConfigured?'Gemini APIはこのセッションに登録済みです。':'Geminiを選ぶとAPI入力窓が開きます。キー登録後に利用できます。'):ref?'参照音声がONです。参照ノードで指定した音声を使います。':'';
  }
  replaceOptions(source,sourceValues(),value('voice_mode'));let acceptedEngine=engine.value;
  engine.onchange=async()=>{const selected=engine.value;if(geminiEngine(selected)){let configured=false;try{configured=await geminiCredentialStatus();}catch{}if(!configured&&!await showGeminiCredentialDialog()){engine.value=acceptedEngine;update();return;}geminiConfigured=true;}acceptedEngine=engine.value;replaceOptions(source,sourceValues(),value('voice_mode'));update();};
   source.onchange=gender.onchange=tone.onchange=custom.oninput=emotion.onchange=geminiDesignPreset.onchange=update;character.onchange=()=>{if(character.value==='自由入力')tone.value='自由入力';update();};update();
  const close=()=>{d.close();d.remove();};d.addEventListener('cancel',e=>{e.preventDefault();close();});
  button('Cancel / キャンセル（変更を破棄）',d,close);
  button('Apply voice / この声の設定を採用',d,async()=>{
   if(snapshot()!==initial){note.textContent='元の入力が変わりました。開き直してください。';return;}
   if(!Number.isFinite(+speed.value)||+speed.value<.5||+speed.value>2||!Number.isInteger(+seed.value)||+seed.value<0||+seed.value>2147483647){note.textContent='話速と候補番号の範囲を確認してください。';return;}
   if(tone.value==='自由入力'&&!custom.value.trim()&&!custom.parentElement.hidden){note.textContent='声質・口調を入力してください。';return;}
   if(geminiEngine(engine.value)){
    if(reference()){note.textContent='Geminiでは参照音声を使いません。参照ノードをOFFにしてください。';return;}
     if(source.value==='新しい声をデザイン（Gemini）'&&geminiDesignPreset.value==='自由入力'&&!geminiDesign.value.trim()){note.textContent='声の特徴を入力するか、声イメージプリセットを選んでください。';geminiDesign.focus();return;}
    if(source.value==='保存済みVoice ID（Gemini）'&&!/^voice_[A-Za-z0-9_-]+$/.test(geminiId.value.trim())){note.textContent='voice_... 形式のVoice IDを入力してください。';return;}
    if(emotion.value==='自由入力'&&!emotionCustom.value.trim()){note.textContent='感情・演技の指示を入力してください。';return;}
    if(!await ensureGeminiCredential())return;geminiConfigured=true;
   }
   let chosenStyle=tone.value==='自由入力'?custom.value.trim():tonePresets[tone.value];
   if(gender.value==='任意'){
    const selected=engine.value==='Qwen'&&source.value==='用意された声（Qwen）'?qwenGender[speaker.value]:geminiEngine(engine.value)&&source.value==='用意された声（Gemini）'?studioGender(geminiVoice.value):'';
    if(selected&&oppositeGender(chosenStyle,selected)){
     if(engine.value==='Qwen')chosenStyle='自然で聞き取りやすい日本語のナレーション。';
     else{note.textContent='選んだ公式声と声質・口調の性別が異なります。声質・口調を直してください。';return;}
    }
   }
   if(['女性','男性'].includes(gender.value)){
    if(oppositeGender(chosenStyle,gender.value)){
     if(engine.value==='Qwen'&&source.value==='用意された声（Qwen）')chosenStyle='自然で聞き取りやすい日本語のナレーション。';
     else{note.textContent='声質・口調の性別指定が選択と異なります。どちらかを直してください。';return;}
    }
    if(!textGender(chosenStyle))chosenStyle=gender.value+'の声。'+chosenStyle;
   }
   let designText=geminiDesign.value.trim();
   if(source.value==='新しい声をデザイン（Gemini）'&&geminiDesignPreset.value==='自由入力'&&['女性','男性'].includes(gender.value)&&oppositeGender(designText,gender.value)){note.textContent='声の特徴の性別指定が選択と異なります。';return;}
   if(source.value==='新しい声をデザイン（Gemini）'&&geminiDesignPreset.value==='自由入力'&&['女性','男性'].includes(gender.value)&&!textGender(designText))designText=gender.value+'の声。'+designText;
   set('mode','手動');set('engine',engine.value);set('voice_mode',source.value);set('speaker',speaker.value);set('character',geminiEngine(engine.value)?'自由指定':['標準／口調で指定','自由入力'].includes(character.value)?'自由指定':character.value);set('style',chosenStyle);set('gemini_voice',geminiVoice.value);set('gemini_voice_design_preset',geminiDesignPreset.value);set('gemini_voice_design',designText);set('gemini_voice_id',geminiId.value.trim());set('gemini_emotion',emotion.value);set('gemini_emotion_strength',emotionStrength.value);set('gemini_emotion_custom',emotionCustom.value.trim());set('speed',+speed.value);set('seed',+seed.value);props().narrationVoiceGender=gender.value;if(seedMode)set('control_after_generate',seedMode.value);dirty();close();
  });
 }
 function consult(){
  const initial=snapshot(),original=text(),d=modal('AI consultation / 台詞と声を相談して作る');
  style(d,{margin:'180px auto 24px',maxHeight:'calc(100vh - 204px)'});
  const target=select('Create / AIに作ってもらうもの',d,Object.keys(modes),'台詞を作る＋声もAIが提案');
  const desiredGender=select('Voice gender / 声の性別',d,voiceGenders,props().narrationVoiceGender||textGender(value('style'))||'自動');
  const purpose=select('Purpose / 用途の例',d,Object.keys(purposePresets),'自由入力');
  const brief=input('Request / 作りたい内容・希望',d,props().narrationBrief||value('purpose')||'');
  brief.placeholder='例：テラフォーマーについて、初心者にも分かる紹介と考察を作って。';
  element('small','Script length / 文数指定がなければ5文で構成。1文だけなどの指定もできます。',d);
   purpose.onchange=()=>{if(purpose.value!=='自由入力')brief.value=purposePresets[purpose.value];};
   element('p','選んだ項目だけをAIが提案します。「採用」で反映されます。採用済みの声を確認・変更する場合は、ノードの「声を確認・調整」を使います。',d);
   const providerInfo=element('p','AIの音声候補を確認中…',d);style(providerInfo,{padding:'8px 10px',background:'#151920',borderRadius:'6px'});
   const refreshProviderInfo=async()=>{let configured=false;try{configured=await geminiCredentialStatus();}catch{}providerInfo.textContent=configured?'AI音声候補：Irodori / Qwen / Gemini 3.8 Flash / Flash-Lite（API登録済み）':'AI音声候補：Irodori / Qwen（GeminiはAPI登録後に候補へ追加）';return configured;};refreshProviderInfo();
   const local=element('p','',d);local.setAttribute('role','status');
  let propose;
  const draft=element('section','',d);draft.hidden=true;
  const script=input('Proposed script / 台詞の提案（1行に1文・編集可）',draft,'');style(script,{minHeight:'170px'});
   const engine=select('Proposed model / 提案モデル',draft,['Irodori','Qwen','Gemini 3.8 Flash TTS','Gemini 3.8 Flash-Lite TTS'],'Irodori');
   const voice=input('Proposed voice / 声質・口調の提案（編集可）',draft,'');
   const proposedPresetValues=[...get('gemini_voice_design_preset').options.values].filter(v=>v!=='自由入力');
   const proposedPreset=select('Proposed Gemini voice / Gemini声イメージ',draft,proposedPresetValues,proposedPresetValues[0]);
   const refreshProposedPreset=()=>groupedVoices(proposedPreset,proposedPresetValues,presetGender,['女性','男性'].includes(desiredGender.value)?desiredGender.value:'任意',proposedPreset.value);
   const speed=input('Proposed speed / 提案話速',draft,1,'input');speed.type='number';speed.min=.5;speed.max=2;speed.step=.05;
   let alive=true,busy=false,timer,proposedKind,proposedBrief,consultCredentialChanged=()=>{};
   const close=()=>{notify(busy?'cancel':'detach',busy?'相談を閉じました。提案は採用しません / Consultation dismissed':'',d);alive=false;clearInterval(timer);api.removeEventListener?.('local_narration.gemini_credential_changed',consultCredentialChanged);d.close();d.remove();};
  const footer=element('div','',d);style(footer,{display:'flex',flexWrap:'wrap',justifyContent:'flex-end',gap:'10px',marginTop:'14px'});
  button('Cancel / キャンセル（変更を破棄）',footer,close);
  const apply=button('Apply / 提案を台詞・声へ採用',footer,()=>{});apply.disabled=true;
   propose=button('Suggest / AIに提案してもらう',footer,()=>{});
   const invalidate=()=>{draft.hidden=true;apply.disabled=true;desiredGender.parentElement.hidden=modes[target.value]==='script';};target.onchange=brief.oninput=invalidate;desiredGender.onchange=()=>{invalidate();refreshProposedPreset();};refreshProposedPreset();invalidate();
   consultCredentialChanged=event=>{providerInfo.textContent=event.detail?.configured?'AI音声候補：Irodori / Qwen / Gemini 3.8 Flash / Flash-Lite（API登録済み）':'AI音声候補：Irodori / Qwen（GeminiはAPI登録後に候補へ追加）';invalidate();local.textContent='API登録状態が変わりました。「AIに提案してもらう」で頭から選び直してください。';};api.addEventListener?.('local_narration.gemini_credential_changed',consultCredentialChanged);
  purpose.onchange=()=>{if(purpose.value!=='自由入力')brief.value=purposePresets[purpose.value];invalidate();};
  d.addEventListener('cancel',e=>{e.preventDefault();close();});
  propose.onclick=async()=>{
   if(busy)return;if(!brief.value.trim()){local.textContent='作りたい内容を入力してください。';return;}
    const kind=modes[target.value];busy=true;propose.disabled=target.disabled=brief.disabled=purpose.disabled=apply.disabled=true;draft.hidden=true;const requestCredentialRevision=geminiCredentialRevision,requestGeminiConfigured=await refreshProviderInfo();
   const start=Date.now(),update=()=>local.textContent='AIに相談中 / 経過 '+Math.floor((Date.now()-start)/1000)+'秒';update();timer=setInterval(update,1000);notify('running','AIに相談中 / Consulting AI',d);
   try{
    const genderBrief=kind==='script'?brief.value:brief.value+'\n【声の性別】'+desiredGender.value;
    const response=await api.fetchApi('/local-narration/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,text:original,brief:genderBrief,seed:value('seed')})});
     const data=await response.json();if(!response.ok)throw Error(data.error||'相談に失敗しました。');if(!alive)return;
     let currentGeminiConfigured=false;try{currentGeminiConfigured=await geminiCredentialStatus();}catch{}if(requestCredentialRevision!==geminiCredentialRevision||requestGeminiConfigured!==currentGeminiConfigured)throw Error('API登録状態が相談中に変わりました。もう一度「AIに提案してもらう」を押してください。');
    if(kind!=='plan'&&!scriptBlocks(data.text||'').length)throw Error('台詞の提案が空です。');
     if(kind!=='script'&&(!['Irodori','Qwen','Gemini 3.8 Flash TTS','Gemini 3.8 Flash-Lite TTS'].includes(data.engine)||!data.style?.trim()||!Number.isFinite(data.speed)||data.speed<.5||data.speed>2||geminiEngine(data.engine)&&!proposedPresetValues.includes(data.gemini_voice_design_preset)))throw Error('声の提案が不正です。');
    proposedKind=kind;proposedBrief=brief.value;script.value=kind==='plan'?original:scriptBlocks(data.text).map(b=>b.text).join('\n');
     script.parentElement.hidden=kind==='plan';engine.parentElement.hidden=voice.parentElement.hidden=speed.parentElement.hidden=kind==='script';proposedPreset.parentElement.hidden=kind==='script'||!geminiEngine(data.engine);
     if(kind!=='script'){engine.value=data.engine;voice.value=data.style;speed.value=data.speed;if(geminiEngine(data.engine))proposedPreset.value=data.gemini_voice_design_preset;}
    draft.hidden=false;apply.disabled=false;apply.textContent=kind==='script'?'Apply script / 台詞一覧へ採用':kind==='plan'?'Apply voice / 声の設定へ採用':'Apply script and voice / 台詞一覧と声へ採用';
    local.textContent=(kind==='plan'?'':scriptBlocks(script.value).length+'件の台詞を提案しました。 ')+(data.reason||'内容を確認・修正してから採用してください。');
    notify('complete','✅ AIの提案ができました。小窓で確認・修正してください / Proposal ready',d);
   }catch(e){if(alive){local.textContent='エラー：'+e.message;notify('error','⚠️ AI相談に失敗しました / Consultation failed\n'+e.message,d);}}
   finally{clearInterval(timer);busy=false;if(alive)propose.disabled=target.disabled=brief.disabled=purpose.disabled=false;}
  };
  apply.onclick=async()=>{
   if(snapshot()!==initial){local.textContent='相談中に元の入力が変わりました。開き直してください。';return;}
   const kind=proposedKind;if(!kind)return;
   const blocks=kind==='plan'?null:scriptBlocks(script.value);
   if(blocks&&(!blocks.length||blocks.length>100||blocks.some(b=>b.text.length>10000))){local.textContent='台詞は1〜100文、各1万文字以内で入力してください。';return;}
   if(kind!=='script'&&(!voice.value.trim()||+speed.value<.5||+speed.value>2||!Number.isFinite(+speed.value))){local.textContent='声の指示と話速を確認してください。';return;}
   if(kind!=='script'&&['女性','男性'].includes(desiredGender.value)){if(oppositeGender(voice.value,desiredGender.value)){local.textContent='提案した声質の性別が選択と異なります。声質を修正してください。';return;}if(geminiEngine(engine.value)&&presetGender(proposedPreset.value)!==desiredGender.value){local.textContent='Geminiの声イメージが性別指定と一致しません。';return;}}
   if(kind!=='script'&&reference()){local.textContent='参照音声がONです。提案した声を使う場合は参照をOFFにしてから相談してください。';return;}
   if(kind!=='script'&&geminiEngine(engine.value)&&!await ensureGeminiCredential()){local.textContent='Gemini APIキーを登録してください。';return;}
   if(blocks)saveScript(node,{blocks,target:''});
    if(kind!=='script'){set('mode','手動');set('engine',engine.value);set('voice_mode',geminiEngine(engine.value)?'新しい声をデザイン（Gemini）':'デザイン');set('character','自由指定');set('style',['女性','男性'].includes(desiredGender.value)&&!textGender(voice.value)?desiredGender.value+'の声。'+voice.value.trim():voice.value.trim());if(geminiEngine(engine.value)){set('gemini_voice_design_preset',proposedPreset.value);set('gemini_voice_design','');}set('gemini_emotion','自動（原稿・口調から判断）');set('speed',+speed.value);props().narrationVoiceGender=desiredGender.value;}
   props().narrationBrief=proposedBrief;set('purpose',proposedBrief);dirty();close();
  };
 }
  const previousRemoved=node.onRemoved;node.onRemoved=function(){api.removeEventListener?.('local_narration.gemini_credential_changed',credentialChanged);previousRemoved?.apply(this,arguments);};
  sync();queueMicrotask(()=>{if(node.computeSize&&node.setSize)node.setSize([Math.max(node.size[0],460),node.computeSize()[1]]);});return sync;
}
