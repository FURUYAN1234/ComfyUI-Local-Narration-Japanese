import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";
const labels={character:"Character / 声のキャラクター",review_readings:"Reading review / 生成前に読み確認",text:"Script / 読み上げ原稿",purpose:"Purpose / 用途・おまかせ指示",mode:"Control / 設定方法",engine:"Model / 音声モデル",voice_mode:"Voice source / 声の作り方",speaker:"Speaker / 用意された話者",style:"Voice and tone / 声質・口調",speed:"Speed / 話速（0＝おまかせ）",reference_text:"Reference transcript / 参照音声の原稿",seed:"Seed / 候補番号",pitch_semitones:"Pitch / 音程（半音）",volume_db:"Volume / 音量（dB）",pause_ms:"Pause / 区間の間（ms）",irodori_steps:"Irodori steps / 生成ステップ",irodori_text_strength:"Irodori text / 原稿への強さ",irodori_style_strength:"Irodori style / 口調への強さ",irodori_voice_strength:"Irodori reference / 参照声への強さ",irodori_duration_scale:"Irodori duration / 予測尺の倍率",qwen_temperature:"Qwen temperature / 変化の大きさ",qwen_top_p:"Qwen top-p / 候補の累積確率",qwen_top_k:"Qwen top-k / 候補の数",qwen_repetition_penalty:"Qwen repetition / 反復抑制"};
app.registerExtension({name:"LocalNarration.Controls",nodeCreated(node){
 if(!node.comfyClass?.startsWith("LocalNarration"))return;
 for(const w of node.widgets||[])if(labels[w.name])w.label=labels[w.name];
 if(node.comfyClass==="LocalNarrationGenerate"){
 node.addWidget('button','Download models / 必須モデル一式を取得',null,async()=>{try{const r=await api.fetchApi('/local-narration/download-models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({node:node.id})});const d=await r.json();if(!r.ok)throw Error(d.error);alert('モデル一式の準備ができました。');}catch(e){alert(e.message);}});
 }
 if(node.comfyClass==="LocalNarrationDirection"){
 const update=()=>{const value=n=>node.widgets.find(w=>w.name===n)?.value;const auto=value("mode")==="AIおまかせ";let changed=false;
 for(const w of node.widgets||[]){if(!["engine","voice_mode","speaker","style","speed","reference_text","character"].includes(w.name))continue;const disabled=auto&&["engine","voice_mode","speaker","style","speed","reference_text","character"].includes(w.name)||w.name==="style"&&value("engine")==="Qwen"&&value("voice_mode")==="参照音声"||w.name==="speaker"&&value("voice_mode")!=="用意された声（Qwen）"||w.name==="reference_text"&&value("voice_mode")!=="参照音声";if(w.disabled!==disabled){w.disabled=disabled;changed=true;}if(w.inputEl){w.inputEl.disabled=disabled;w.inputEl.style.opacity=disabled?"0.45":"1";}}
 if(changed)app.graph.setDirtyCanvas(true,true);};
 for(const w of node.widgets||[])if(["mode","voice_mode","engine"].includes(w.name)){const original=w.callback;w.callback=function(...args){original?.apply(this,args);update();};}
 const draw=node.onDrawForeground;node.onDrawForeground=function(...args){update();return draw?.apply(this,args);};
 queueMicrotask(update);
 const old=node.onConfigure;node.onConfigure=function(...args){old?.apply(this,args);queueMicrotask(update);};
 }
}});
api.addEventListener("local_narration.status",({detail:d})=>{
 const node=app.graph.getNodeById(d.node);if(!node)return;
 node.title=(d.state==="complete"?"✅ ":d.state==="error"?"⚠️ ":"⏳ ")+d.text;
 node.color=d.state==="complete"?"#254d35":d.state==="error"?"#653232":"#34445b";
 app.graph.setDirtyCanvas(true,true);
});
