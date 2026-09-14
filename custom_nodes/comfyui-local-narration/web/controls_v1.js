import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
const labels={character:"Character / 声のキャラクター",review_readings:"Reading review / 生成前に読み確認",text:"Script / 読み上げ原稿",purpose:"Purpose / 用途・おまかせ指示",mode:"Control / 設定方法",engine:"Model / 音声モデル",voice_mode:"Voice source / 声の作り方",speaker:"Speaker / 用意された話者",style:"Voice and tone / 声質・口調",speed:"Speed / 話速（0＝おまかせ）",reference_text:"Reference transcript / 参照音声の原稿",seed:"Seed / 候補番号",pitch_semitones:"Pitch / 音程（半音）",volume_db:"Volume / 音量（dB）",pause_ms:"Pause / 区間の間（ms）",irodori_steps:"Irodori steps / 生成ステップ",irodori_text_strength:"Irodori text / 原稿への強さ",irodori_style_strength:"Irodori style / 口調への強さ",irodori_voice_strength:"Irodori reference / 参照声への強さ",irodori_duration_scale:"Irodori duration / 予測尺の倍率",qwen_temperature:"Qwen temperature / 変化の大きさ",qwen_top_p:"Qwen top-p / 候補の累積確率",qwen_top_k:"Qwen top-k / 候補の数",qwen_repetition_penalty:"Qwen repetition / 反復抑制"};

// Presets edit the existing API fields, so older workflows and queued prompts remain compatible.
function installPresets(node) {
 const get=n=>node.widgets.find(w=>w.name===n);
 const modes={'AIにおまかせ':'AIおまかせ','一部を指定してAIにおまかせ':'AI提案＋手動上書き','すべて手動':'手動'};
 const purposes={'台詞から自動判断':'','解説・紹介':'解説・紹介動画。内容を分かりやすく伝える。','物語・朗読':'物語・朗読。情景と流れが伝わる読み方。','会話':'会話。相手に話しかける自然な読み方。','案内':'案内。要点を明瞭に伝える。'};
 const tones={'AIにおまかせ／標準':'','落ち着いた':'落ち着いた口調で、自然な抑揚で話す。','親しみやすい':'親しみやすく、やわらかな口調で話す。','明るい':'明るく軽快な口調で話す。','淡々と':'淡々と、抑揚を控えて明瞭に話す。'};
 const panel=document.createElement('div');
 Object.assign(panel.style,{padding:'8px',boxSizing:'border-box',background:'#222',color:'#eee',fontSize:'13px',display:'grid',gap:'6px',height:'100%',overflowY:'auto',alignContent:'start'});
 panel.addEventListener('pointerdown',e=>e.stopPropagation());
 const rows={};
 function row(name,label,values,change){
  const box=document.createElement('label');box.textContent=label;
  const select=document.createElement('select');select.setAttribute('aria-label',label);
  Object.assign(select.style,{width:'100%',height:'28px',background:'#383838',color:'#fff',border:'1px solid #666',borderRadius:'4px'});
  for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);}
  select.onchange=()=>{change(select.value);app.graph.setDirtyCanvas(true,true);sync();};
  box.append(select);panel.append(box);rows[name]={box,select};return select;
 }
 function set(name,value){const w=get(name);w.value=value;w.callback?.(value);}
 const mode=row('mode','Control / 設定方法',Object.keys(modes),v=>set('mode',modes[v]));
 const purpose=row('purpose','Purpose / 用途', [...Object.keys(purposes),'自由入力'],v=>{
  node.properties ||= {};node.properties.narrationPurposeCustom=v==='自由入力';
  if(v!=='自由入力'){if(!Object.values(purposes).includes(get('purpose').value))node.properties.narrationPurposeDraft=get('purpose').value;set('purpose',purposes[v]);}
  else set('purpose',node.properties.narrationPurposeDraft||'');
 });
 const characterValues=get('character').options?.values||[];
 const character=row('character','Character / 声のキャラクター',['AIにおまかせ／標準','自由入力',...characterValues.filter(v=>v!=='自由指定')],v=>{node.properties ||= {};node.properties.narrationCharacterCustom=v==='自由入力';set('character',['AIにおまかせ／標準','自由入力'].includes(v)?'自由指定':v);if(v==='自由入力')node.properties.narrationToneCustom=true;});
 const tone=row('tone','Tone / 口調', [...Object.keys(tones),'自由入力'],v=>{
  node.properties ||= {};node.properties.narrationToneCustom=v==='自由入力';
  if(v!=='自由入力'){if(!Object.values(tones).includes(get('style').value))node.properties.narrationToneDraft=get('style').value;set('style',tones[v]);}
  else set('style',node.properties.narrationToneDraft||'');
 });
 const hint=document.createElement('div');Object.assign(hint.style,{fontSize:'12px',lineHeight:'1.5',color:'#b9d9e8'});panel.append(hint);

 function consult(kind) {
  const dialog=document.createElement('dialog');
  Object.assign(dialog.style,{width:'min(640px,90vw)',maxHeight:'85vh',overflow:'auto',background:'#252525',color:'#eee',border:'1px solid #777',borderRadius:'10px',padding:'20px'});
  const title=document.createElement('h3');title.textContent='Consult AI / AIに相談して文章を作る';dialog.append(title);
  function field(label,value){const box=document.createElement('label');box.textContent=label;const input=document.createElement('textarea');input.value=value;input.setAttribute('aria-label',label);Object.assign(input.style,{display:'block',width:'100%',minHeight:'90px',boxSizing:'border-box',margin:'8px 0',background:'#151515',color:'#fff'});box.append(input);dialog.append(box);return input;}
  const brief=field('Request / 希望・相談内容',kind==='plan'?get('purpose').value:kind==='purpose'?get('purpose').value:kind==='style'?get('style').value:'');
  brief.placeholder='例：初心者向けの紹介動画。やさしく親しみのある雰囲気にしたい。';
  const status=document.createElement('p');status.setAttribute('role','status');dialog.append(status);
  const propose=document.createElement('button');propose.textContent='Suggest / AIに文章を考えてもらう';dialog.append(propose);
  const result=field('Proposal / 提案文（編集できます）','');result.parentElement.style.display='none';
  const engine=document.createElement('select');engine.setAttribute('aria-label','Model / 提案モデル');for(const v of ['Irodori','Qwen']){const o=document.createElement('option');o.value=v;o.textContent=v;engine.append(o);}
  const speed=document.createElement('input');speed.type='number';speed.min='.5';speed.max='2';speed.step='.05';speed.setAttribute('aria-label','Speed / 提案話速');
  engine.style.display=speed.style.display='none';dialog.append(engine);dialog.append(speed);
  const actions=document.createElement('div');Object.assign(actions.style,{display:'flex',justifyContent:'space-between',marginTop:'16px'});
  const cancel=document.createElement('button');cancel.textContent='Cancel / キャンセルして戻る';
  const apply=document.createElement('button');apply.textContent='Apply / 修正内容を採用';apply.disabled=true;actions.append(cancel);actions.append(apply);dialog.append(actions);
  let alive=true,busy=false,timer;const initial={text:get('text').value,purpose:get('purpose').value,style:get('style').value,mode:get('mode').value};
  const close=()=>{alive=false;clearInterval(timer);dialog.close();dialog.remove();};
  cancel.onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  propose.onclick=async()=>{
   if(busy)return;if(!brief.value.trim()){status.textContent='希望・相談内容を入力してください。';return;}
   busy=true;propose.disabled=true;apply.disabled=true;const start=Date.now();
   status.textContent='AIに相談中です。閉じても設定は変更されません。';
   timer=setInterval(()=>{if(alive)status.textContent='AIに相談中 / 経過 '+Math.floor((Date.now()-start)/1000)+'秒。閉じた場合も計算終了後にGPUを解放します。';},1000);
   try{
    const response=await api.fetchApi('/local-narration/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,text:initial.text,brief:brief.value,seed:get('seed').value})});
    const data=await response.json();if(!response.ok)throw Error(data.error||'相談に失敗しました。');
    if(!alive)return;
    result.value=kind==='plan'?data.style:data.text;result.parentElement.style.display='';
    if(kind==='plan'){engine.value=data.engine;speed.value=String(data.speed);engine.style.display=speed.style.display='';}
    status.textContent=kind==='plan'?data.reason:'提案文を確認・修正してから採用してください。';apply.disabled=false;
   }catch(e){if(alive)status.textContent='エラー：'+e.message;}
   finally{clearInterval(timer);busy=false;if(alive)propose.disabled=false;}
  };
  apply.onclick=()=>{
   if(!result.value.trim()){status.textContent='採用する文章を入力してください。';return;}
   if(kind==='plan'&&(!Number.isFinite(Number(speed.value))||Number(speed.value)<.5||Number(speed.value)>2)){status.textContent='話速は0.5〜2.0で指定してください。';return;}
   const affected=kind==='plan'?['text','purpose','style','mode']:[kind==='purpose'?'purpose':kind==='script'?'text':'style'];
   if(affected.some(n=>get(n).value!==initial[n])){status.textContent='相談中に元の入力が変わりました。キャンセルして開き直してください。';return;}
   node.properties ||= {};
   if(kind==='plan'){set('mode','AI提案＋手動上書き');set('engine',engine.value);set('character','自由指定');set('speed',Number(speed.value));set('style',result.value);node.properties.narrationToneCustom=true;}
   else {set(kind==='script'?'text':kind,result.value);if(kind==='purpose')node.properties.narrationPurposeCustom=true;if(kind==='style')node.properties.narrationToneCustom=true;}
   app.graph.setDirtyCanvas(true,true);sync();close();
  };
  document.body.append(dialog);dialog.showModal();brief.focus();
 }
 const consultButtons={};
 for(const [kind,label] of [['plan','Consult AI / おまかせ設定を相談・編集'],['purpose','Consult purpose / 用途の文章を相談'],['style','Consult tone / 声質・口調の文章を相談']]){
  const button=document.createElement('button');button.textContent=label;button.onclick=()=>consult(kind);panel.append(button);consultButtons[kind]=button;
 }


 let panelHeight=300,lastLayout='';
 const widget=node.addDOMWidget('narration_presets','div',panel,{serialize:false,hideOnZoom:false,getMinHeight:()=>panelHeight,getMaxHeight:()=>panelHeight,getHeight:()=>panelHeight});
 widget.options ||= {};widget.options.serialize=false;
 widget.computeSize=()=>[320,panelHeight];
 // Non-serialized controls do not consume a slot in widgets_values.

 function hide(w,hidden){if(!w)return;if(!w._presetSize)w._presetSize={computeSize:w.computeSize,computeLayoutSize:w.computeLayoutSize};w.hidden=hidden;if(w._presetSize.computeLayoutSize)w.computeLayoutSize=hidden?()=>({minHeight:0,maxHeight:0,minWidth:0}):w._presetSize.computeLayoutSize;w.computeSize=hidden?()=>[0,-4]:w._presetSize.computeSize;if(w.inputEl){w.inputEl.style.display=hidden?'none':'';const caption=w.inputEl.parentElement?.querySelector('.narration-caption');if(caption)caption.style.display=hidden?'none':'';}}
 function sync(){
  const manual=get('mode').value==='手動',auto=get('mode').value==='AIおまかせ';
  mode.value=Object.keys(modes).find(k=>modes[k]===get('mode').value)||'AIにおまかせ';
  purpose.value=node.properties?.narrationPurposeCustom?'自由入力':Object.keys(purposes).find(k=>purposes[k]===get('purpose').value)??'自由入力';
  tone.value=node.properties?.narrationToneCustom?'自由入力':Object.keys(tones).find(k=>tones[k]===get('style').value)??'自由入力';
  character.value=node.properties?.narrationCharacterCustom?'自由入力':get('character').value==='自由指定'?'AIにおまかせ／標準':get('character').value;
  rows.purpose.box.style.display=manual?'none':'';
  rows.character.box.style.display=auto?'none':'';
  rows.tone.box.style.display=auto?'none':'';
  character.disabled=!!get('character').disabled;tone.disabled=!!get('style').inputEl?.disabled;
  hide(get('text'),manual);
  hide(get('mode'),true);hide(get('character'),true);
  hide(get('purpose'),manual||purpose.value!=='自由入力');
  hide(get('style'),auto||tone.disabled||tone.value!=='自由入力');
  consultButtons.plan.style.display=manual?"none":"";
  consultButtons.purpose.style.display=!manual&&purpose.value==="自由入力"?"":"none";
  consultButtons.style.style.display=!auto&&!tone.disabled&&tone.value==="自由入力"?"":"none";
  panelHeight=18+Object.values(rows).filter(r=>r.box.style.display!=='none').length*54+60+Object.values(consultButtons).filter(b=>b.style.display!=='none').length*32;
  const layout=[manual,auto,purpose.value,tone.value,tone.disabled,panelHeight].join('|');
  if(lastLayout!==layout){lastLayout=layout;queueMicrotask(()=>{if(node.computeSize&&node.setSize)node.setSize([Math.max(node.size[0],460),node.computeSize()[1]]);});}
  hint.textContent=auto?'台詞と用途から、モデル・声・口調・話速をAIが選びます。':manual?'モデル・声・口調を指定します。「標準」は自然な読み方です。':'指定した項目を優先し、それ以外はAIが選びます。相談ボタンで提案文を確認・修正できます。';
 }
 return sync;
}


app.registerExtension({name:"LocalNarration.Controls",nodeCreated(node){
 if(!node.comfyClass?.startsWith("LocalNarration"))return;
 for(const w of node.widgets||[])if(labels[w.name])w.label=labels[w.name];
 if(node.comfyClass==="LocalNarrationGenerate"){
 const approval=node.widgets.find(w=>w.name==='review_readings');if(approval){approval.value=true;approval.disabled=true;approval.label='Approval required / 生成前の読み承認（必須）';}
 node.addWidget('button','Download models / 必須モデル一式を取得',null,async()=>{try{const r=await api.fetchApi('/local-narration/download-models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({node:node.id})});const d=await r.json();if(!r.ok)throw Error(d.error);alert('モデル一式の準備ができました。');}catch(e){alert(e.message);}});
 }
 if(node.comfyClass==="LocalNarrationReference"){
  const upload=node.addWidget('button','Upload reference / 参照音声を選択・アップロード',null,()=>{const input=document.createElement('input');input.type='file';input.accept='audio/*';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const body=new FormData();body.append('image',file);body.append('type','input');body.append('overwrite','false');const r=await api.fetchApi('/upload/image',{method:'POST',body});const d=await r.json();if(!r.ok)throw Error(d.error||r.statusText);node.widgets.find(w=>w.name==='audio').value=(d.subfolder?d.subfolder+'/':'')+d.name;app.graph.setDirtyCanvas(true,true);}catch(e){node.title='⚠️ '+e.message;}};input.click();},{serialize:false});
  const draw=node.onDrawForeground;node.onDrawForeground=function(...args){const linked=(node.outputs?.[0]?.links||[]).map(id=>app.graph.links[id]).map(l=>app.graph.getNodeById(l?.target_id)).filter(Boolean);const ignored=linked.length>0&&linked.every(d=>d.widgets?.find(w=>w.name==='mode')?.value==='AIおまかせ');const on=!!node.widgets.find(w=>w.name==='enabled')?.value&&!ignored;
   for(const w of node.widgets||[]){const disabled=w.name==='enabled'?ignored:!on;if(w.inputEl){w.disabled=false;w.inputEl.disabled=disabled;w.inputEl.style.opacity=disabled?'.4':'1';}else w.disabled=disabled;}
   node.title=ignored?'Reference ignored in AI / AI時は参照不使用':on?'Reference ON / 参照音声を使用':'Reference OFF / 参照音声は不使用';node.color=on?'#34445b':'#333333';return draw?.apply(this,args);};
 }
 if(node.comfyClass==="LocalNarrationDirection"){
 const presetSync=node.addDOMWidget?installPresets(node):()=>{};
 const update=()=>{const value=n=>node.widgets.find(w=>w.name===n)?.value;const auto=value('mode')==='AIおまかせ';const manual=value('mode')==='手動';const qwen=value('engine')==='Qwen';const input=node.inputs?.find(i=>i.name==='reference_audio');const link=input?.link!=null?app.graph.links[input.link]:null;const ref=link?app.graph.getNodeById(link.origin_id):null;const reference=!auto&&ref?.comfyClass==='LocalNarrationReference'&&ref.widgets.find(w=>w.name==='enabled')?.value;
 for(const name of ['text','purpose']){const w=node.widgets.find(w=>w.name===name);if(!w)continue;if(!w._narrationLayout)w._narrationLayout={computeSize:w.computeSize,hidden:w.hidden};w.hidden=manual;w.computeSize=manual?()=>[0,-4]:w._narrationLayout.computeSize;if(w.inputEl){w.inputEl.style.display=manual?'none':'';const caption=w.inputEl.parentElement?.querySelector('.narration-caption');if(caption)caption.style.display=manual?'none':'';}}
 const source=node.widgets.find(w=>w.name==='voice_mode');source.options.values=qwen?['デザイン','用意された声（Qwen）']:['デザイン'];if(!source.options.values.includes(source.value))source.value='デザイン';
 for(const w of node.widgets||[]){if(!['engine','voice_mode','speaker','style','speed','reference_text','character','purpose'].includes(w.name))continue;
 const disabled=(auto&&w.name!=='purpose')||(w.name==='purpose'&&manual)||(w.name==='voice_mode'&&(reference||!qwen))||(w.name==='speaker'&&(reference||!qwen||value('voice_mode')!=='用意された声（Qwen）'))||(['style','character'].includes(w.name)&&reference&&qwen)||w.name==='reference_text';
 if(w.inputEl){w.disabled=false;w.inputEl.disabled=disabled;w.inputEl.style.opacity=disabled?'.4':'1';}else w.disabled=disabled;
 }
 const captions={text:'Script / 読み上げる台詞',purpose:'AI purpose / 用途の指示',style:'Voice & tone / 声質・口調の指示（台詞ではありません）'};
 for(const w of node.widgets||[]){if(w.name==='reference_text'){w.hidden=true;w.computeSize=()=>[0,-4];if(w.inputEl)w.inputEl.style.display='none';continue;}if(!captions[w.name]||!w.inputEl?.parentElement)continue;const el=w.inputEl;el.setAttribute('aria-label',captions[w.name]);el.placeholder=captions[w.name];el.style.paddingTop='26px';el.style.boxSizing='border-box';let label=el.parentElement.querySelector('.narration-caption');if(!label){label=document.createElement('div');label.className='narration-caption';Object.assign(label.style,{position:'absolute',top:'2px',left:'5px',right:'4px',fontSize:'11px',lineHeight:'20px',color:'#8bd6db',pointerEvents:'none',zIndex:'1',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});el.parentElement.append(label);}label.textContent=captions[w.name];}
 presetSync();
 };
 const draw=node.onDrawForeground;node.onDrawForeground=function(...args){update();return draw?.apply(this,args);};queueMicrotask(update);
 }

}});
api.addEventListener("local_narration.status",({detail:d})=>{
 const node=app.graph.getNodeById(d.node);if(!node)return;
 node.title=(d.state==="complete"?"✅ ":d.state==="error"?"⚠️ ":"⏳ ")+d.text;
 node.color=d.state==="complete"?"#254d35":d.state==="error"?"#653232":"#34445b";
 app.graph.setDirtyCanvas(true,true);
});
