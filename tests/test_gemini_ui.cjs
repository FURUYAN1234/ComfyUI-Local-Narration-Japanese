const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E{
 constructor(tag){this.tag=tag;this.style={};this.dataset={};this.children=[];this.value='';this.hidden=false;this.textContent='';}
 append(e){this.children.push(e);e.parentElement=this;}addEventListener(k,f){this[k]=f;}setAttribute(k,v){this[k]=v;}
 replaceChildren(...items){this.children=[];items.forEach(e=>this.append(e));}showModal(){}close(){this.closed=true;}focus(){this.focused=true;}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(e=>e!==this);this.removed=true;}
}
const body=new E('body'),walk=e=>e.children.flatMap(child=>[child,...walk(child)]),find=(e,text)=>walk(e).find(x=>x.textContent===text),field=(e,label)=>walk(e).find(x=>x['aria-label']===label);
let configured=false;const handlers={};
const document={body,createElement:tag=>new E(tag),querySelector:selector=>selector==='[data-local-narration-gemini-credential]'?walk(body).find(e=>e.dataset.localNarrationGeminiCredential):null};
const api={addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:name=>delete handlers[name],dispatchEvent(event){handlers[event.type]?.(event);},fetchApi:async(url,options={})=>{
 if(url.endsWith('gemini-credential-status'))return {ok:true,json:async()=>({configured})};
 if(url.endsWith('gemini-credential')&&options.method==='DELETE'){configured=false;return {ok:true,json:async()=>({ok:true,configured:false})};}
 if(url.endsWith('gemini-credential')){assert.equal(JSON.parse(options.body).api_key,'test-credential-not-a-real-api-key');configured=true;return {ok:true,json:async()=>({ok:true})};}
 throw Error('unexpected request '+url);
}};
const app={graph:{setDirtyCanvas(){},links:{}},queuePrompt:async()=>{},registerExtension(){}};
const ctx={document,api,app,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},crypto:require('crypto').webcrypto,Map,Date,queueMicrotask:f=>f(),setInterval:()=>1,clearInterval(){}};vm.createContext(ctx);
const root=process.argv[2];
for(const file of ['dialogue_blocks.js','direction_editor.js'])vm.runInContext(fs.readFileSync(root+file,'utf8').replace(/^import .*;\n/gm,'').replace(/export function /g,'function '),ctx);
const values={text:'テストです。',purpose:'案内',mode:'手動',engine:'Irodori',voice_mode:'デザイン',speaker:'Ono_anna',style:'自然に',speed:1,seed:42,character:'自由指定',reference_text:'',dialogue_blocks:'',gemini_voice:'',gemini_voice_design_preset:'落ち着いた女性ドキュメンタリー',gemini_voice_design:'',gemini_voice_id:'',gemini_emotion:'自動（原稿・口調から判断）',gemini_emotion_strength:'標準',gemini_emotion_custom:''};
const options={speaker:['Ono_anna'],character:['自由指定'],gemini_voice:['Kore｜芯のある安定した声','Puck｜陽気で弾む声'],gemini_voice_design_preset:['落ち着いた女性ドキュメンタリー','明るい女性ガイド','自由入力'],gemini_emotion:['自動（原稿・口調から判断）','喜び','自由入力'],gemini_emotion_strength:['控えめ','標準','強め']};
const widgets=Object.entries(values).map(([name,value])=>({name,value,options:{values:options[name]||[]}}));
const node={widgets,properties:{},inputs:[],addDOMWidget(name,type,panel){this.panel=panel;const widget={name};widgets.push(widget);return widget;}};
ctx.installDirectionEditor(node);
(async()=>{
 const panelItems=walk(node.panel),apiButton=find(node.panel,'⚠️ Gemini API 未登録 / 入力（Gemini使用時のみ）'),consultButton=find(node.panel,'Consult AI / 作りたい内容をAIに相談'),voiceButton=find(node.panel,'Voice settings / 声を確認・調整');
 assert(apiButton&&consultButton&&voiceButton&&panelItems.indexOf(apiButton)<panelItems.indexOf(voiceButton)&&panelItems.indexOf(voiceButton)<panelItems.indexOf(consultButton),'node action order must be API, voice settings, then AI consultation');
 assert(panelItems.some(e=>e.textContent==='任意：Geminiを使う場合だけ必要です。Irodori / QwenはAPI登録なしで使えます。'));
 find(node.panel,'Voice settings / 声を確認・調整').onclick();const voiceDialog=body.children.at(-1),engine=field(voiceDialog,'Model / 音声モデル');
 assert(!find(voiceDialog,'Gemini API key / API入力・登録'),'voice settings must not duplicate the node-level API button');
 assert.equal(field(voiceDialog,'Gemini studio voice / 公式スタジオボイス（30種類）').value,'Kore｜芯のある安定した声','legacy blank voice falls back to the first official voice');
 engine.value='Gemini 3.8 Flash-Lite TTS';const choosing=engine.onchange();await new Promise(setImmediate);
 const keyDialog=body.children.at(-1);assert.notEqual(keyDialog,voiceDialog);field(keyDialog,'Gemini API key / APIキー').value='test-credential-not-a-real-api-key';await find(keyDialog,'Save / 認証して保存').onclick();await choosing;
 assert(keyDialog.removed&&configured,'successful save closes the API dialog and keeps the key in session state');assert.equal(engine.value,'Gemini 3.8 Flash-Lite TTS');
 const source=field(voiceDialog,'Voice source / 声の作り方');source.value='新しい声をデザイン（Gemini）';source.onchange();
 const preset=field(voiceDialog,'Voice design preset / 声イメージプリセット');preset.value='自由入力';preset.onchange();
 const customDesign=field(voiceDialog,'Gemini custom voice / 新しく作る声の特徴');customDesign.value='';
 await find(voiceDialog,'Apply voice / この声の設定を採用').onclick();
 assert(!voiceDialog.removed&&customDesign.focused,'blank custom voice design must stay open and focus the input');
 assert(walk(voiceDialog).some(e=>e.textContent.includes('声の特徴を入力するか')),'blank custom voice design must explain how to recover');
 source.value='用意された声（Gemini）';source.onchange();field(voiceDialog,'Gemini studio voice / 公式スタジオボイス（30種類）').value='Puck｜陽気で弾む声';field(voiceDialog,'Emotion / 感情').value='喜び';
 await find(voiceDialog,'Apply voice / この声の設定を採用').onclick();
 const get=name=>widgets.find(w=>w.name===name).value;assert.equal(get('engine'),'Gemini 3.8 Flash-Lite TTS');assert.equal(get('voice_mode'),'用意された声（Gemini）');assert.equal(get('gemini_voice'),'Puck｜陽気で弾む声');assert.equal(get('gemini_emotion'),'喜び');
 assert(find(node.panel,'✅ Gemini API 登録済み / 再入力（任意）'));
 const reopen=find(node.panel,'✅ Gemini API 登録済み / 再入力（任意）').onclick();await new Promise(setImmediate);const removeDialog=body.children.at(-1);await find(removeDialog,'Remove / このセッションの登録を解除').onclick();await reopen;assert.equal(configured,false);assert(find(node.panel,'⚠️ Gemini API 未登録 / 入力（Gemini使用時のみ）'));
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();await new Promise(setImmediate);const consultDialog=body.children.at(-1);assert(walk(consultDialog).some(e=>e.textContent==='AI音声候補：Irodori / Qwen（GeminiはAPI登録後に候補へ追加）'));
 const reRegister=find(node.panel,'⚠️ Gemini API 未登録 / 入力（Gemini使用時のみ）').onclick();await new Promise(setImmediate);const secondKeyDialog=body.children.at(-1);field(secondKeyDialog,'Gemini API key / APIキー').value='test-credential-not-a-real-api-key';await find(secondKeyDialog,'Save / 認証して保存').onclick();await reRegister;
 assert(walk(consultDialog).some(e=>e.textContent==='AI音声候補：Irodori / Qwen / Gemini 3.8 Flash / Flash-Lite（API登録済み）'));assert(walk(consultDialog).some(e=>e.textContent.includes('頭から選び直してください')));
 console.log('PASS Gemini UI: optional API first, legacy voice fallback, voice-design blank guard, session toggle, dynamic consultation candidates, auto-close, Flash-Lite/manual voice/emotion');
})().catch(error=>{console.error(error);process.exitCode=1;});
