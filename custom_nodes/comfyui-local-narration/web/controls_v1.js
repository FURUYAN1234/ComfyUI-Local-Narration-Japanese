import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
const labels={character:"Character / 声のキャラクター",review_readings:"Reading review / 生成前に読み確認",text:"Script / 読み上げ原稿",purpose:"Purpose / 用途・おまかせ指示",mode:"Control / 設定方法",engine:"Model / 音声モデル",voice_mode:"Voice source / 声の作り方",speaker:"Speaker / 用意された話者",style:"Voice and tone / 声質・口調",speed:"Speed / 話速（0＝おまかせ）",reference_text:"Reference transcript / 参照音声の原稿",seed:"Seed / 候補番号",pitch_semitones:"Pitch / 音程（半音）",volume_db:"Volume / 音量（dB）",pause_ms:"Pause / 区間の間（ms）",irodori_steps:"Irodori steps / 生成ステップ",irodori_text_strength:"Irodori text / 原稿への強さ",irodori_style_strength:"Irodori style / 口調への強さ",irodori_voice_strength:"Irodori reference / 参照声への強さ",irodori_duration_scale:"Irodori duration / 予測尺の倍率",qwen_temperature:"Qwen temperature / 変化の大きさ",qwen_top_p:"Qwen top-p / 候補の累積確率",qwen_top_k:"Qwen top-k / 候補の数",qwen_repetition_penalty:"Qwen repetition / 反復抑制"};
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
 const update=()=>{const value=n=>node.widgets.find(w=>w.name===n)?.value;const auto=value('mode')==='AIおまかせ';const manual=value('mode')==='手動';const qwen=value('engine')==='Qwen';const input=node.inputs?.find(i=>i.name==='reference_audio');const link=input?.link!=null?app.graph.links[input.link]:null;const ref=link?app.graph.getNodeById(link.origin_id):null;const reference=!auto&&ref?.comfyClass==='LocalNarrationReference'&&ref.widgets.find(w=>w.name==='enabled')?.value;
 const source=node.widgets.find(w=>w.name==='voice_mode');source.options.values=qwen?['デザイン','用意された声（Qwen）']:['デザイン'];if(!source.options.values.includes(source.value))source.value='デザイン';
 for(const w of node.widgets||[]){if(!['engine','voice_mode','speaker','style','speed','reference_text','character','purpose'].includes(w.name))continue;
 const disabled=(auto&&w.name!=='purpose')||(w.name==='purpose'&&manual)||(w.name==='voice_mode'&&(reference||!qwen))||(w.name==='speaker'&&(reference||!qwen||value('voice_mode')!=='用意された声（Qwen）'))||(['style','character'].includes(w.name)&&reference&&qwen)||w.name==='reference_text';
 if(w.inputEl){w.disabled=false;w.inputEl.disabled=disabled;w.inputEl.style.opacity=disabled?'.4':'1';}else w.disabled=disabled;
 }
 const captions={text:'① Script / 読み上げる台詞（手動ブロック利用中は不使用）',purpose:'② AI purpose / 用途の指示（手動では不使用）',style:'③ Voice & tone / 声質・口調（読み上げない）'};
 for(const w of node.widgets||[]){if(w.name==='reference_text'){w.hidden=true;w.computeSize=()=>[0,-4];if(w.inputEl)w.inputEl.style.display='none';continue;}if(!captions[w.name]||!w.inputEl?.parentElement)continue;const el=w.inputEl;el.setAttribute('aria-label',captions[w.name]);el.placeholder=captions[w.name];el.style.paddingTop='26px';el.style.boxSizing='border-box';let label=el.parentElement.querySelector('.narration-caption');if(!label){label=document.createElement('div');label.className='narration-caption';Object.assign(label.style,{position:'absolute',top:'2px',left:'5px',right:'4px',fontSize:'11px',lineHeight:'20px',color:'#8bd6db',pointerEvents:'none',zIndex:'1',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});el.parentElement.append(label);}label.textContent=captions[w.name];}
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
