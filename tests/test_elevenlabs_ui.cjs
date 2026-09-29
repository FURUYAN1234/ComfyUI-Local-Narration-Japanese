const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E {
 constructor(tag){this.tag=tag;this.style={};this.dataset={};this.children=[];this.value='';this.hidden=false;this.textContent='';}
 append(e){this.children.push(e);e.parentElement=this;}addEventListener(k,f){this[k]=f;}setAttribute(k,v){this[k]=v;}
 replaceChildren(...items){this.children=[];items.forEach(e=>this.append(e));}showModal(){this.open=true;}close(){this.open=false;}
 remove(){this.removed=true;}focus(){}
}
const body=new E('body'),walk=e=>e.children.flatMap(c=>[c,...walk(c)]),find=(e,t)=>walk(e).find(x=>x.textContent===t),field=(e,l)=>walk(e).find(x=>x['aria-label']===l);
let registered=false;const calls=[];
const api={addEventListener(){},removeEventListener(){},dispatchEvent(){},fetchApi:async(url,options={})=>{
 calls.push(url);
 if(url.endsWith('elevenlabs-credential-status'))return {ok:true,json:async()=>({configured:registered})};
 if(url.endsWith('elevenlabs-credential')&&options.method==='POST'){assert.equal(JSON.parse(options.body).api_key,'test-secret');registered=true;return {ok:true,json:async()=>({ok:true})};}
 if(url.endsWith('elevenlabs-voices'))return {ok:true,json:async()=>({voices:[{id:'voice00001',name:'Japanese Voice',description:'Natural',gender:'female',preview_url:'https://example.com/one.mp3'},{id:'voice00002',name:'Narrator',description:'Calm',gender:'male',preview_url:''}]})};
 if(url.endsWith('gemini-credential-status'))return {ok:true,json:async()=>({configured:false})};
 throw Error('unexpected request '+url);
}};
const document={body,createElement:t=>new E(t),querySelector:()=>null};
const app={graph:{setDirtyCanvas(){},links:{}},queuePrompt:async()=>{},registerExtension(){}};
const ctx={document,api,app,CustomEvent:class{},crypto:require('crypto').webcrypto,Map,Date,queueMicrotask:f=>f(),setInterval:()=>1,clearInterval(){}};
vm.createContext(ctx);const root=process.argv[2];
for(const file of ['dialogue_blocks.js','direction_editor.js'])vm.runInContext(fs.readFileSync(root+file,'utf8').replace(/^import .*;\n/gm,'').replace(/export function /g,'function '),ctx);
const values={text:'テストです。',purpose:'案内',mode:'手動',engine:'Irodori',voice_mode:'デザイン',speaker:'Ono_anna',style:'自然に',speed:1,seed:42,character:'自由指定',reference_text:'',dialogue_blocks:'',gemini_voice:'Kore',gemini_voice_design_preset:'落ち着いた女性ドキュメンタリー',gemini_voice_design:'',gemini_voice_id:'',gemini_emotion:'自動（原稿・口調から判断）',gemini_emotion_strength:'標準',gemini_emotion_custom:'',elevenlabs_voice_id:''};
const options={speaker:['Ono_anna'],character:['自由指定'],gemini_voice:['Kore'],gemini_voice_design_preset:['落ち着いた女性ドキュメンタリー'],gemini_emotion:['自動（原稿・口調から判断）'],gemini_emotion_strength:['標準']};
const widgets=Object.entries(values).map(([name,value])=>({name,value,options:{values:options[name]||[]}}));
const node={widgets,properties:{},inputs:[],addDOMWidget(name,type,panel){this.panel=panel;const widget={name};widgets.push(widget);return widget;}};
ctx.installDirectionEditor(node);
assert(calls.includes('/local-narration/elevenlabs-credential-status'));
assert.equal(node.panel.children[0].style.flexDirection,'column');
assert.equal(node.panel.children[0].children.filter(x=>x.tag==='button').length,2);
assert.equal(field(node.panel,'Script / 台詞を直接編集').style.minHeight,'240px');
assert.equal(widgets.find(w=>w.name==='narration_editor').computeSize()[1],930);
(async()=>{
 find(node.panel,'Voice settings / 声を確認・調整').onclick();
 const dialog=body.children.at(-1),engine=field(dialog,'Model / 音声モデル');
 engine.value='ElevenLabs';const choosing=engine.onchange();await new Promise(setImmediate);
 const keyDialog=body.children.at(-1);assert.notEqual(keyDialog,dialog);
 field(keyDialog,'ElevenLabs API key / APIキー').value='test-secret';await find(keyDialog,'Save / キーを設定').onclick();await choosing;
 const list=field(dialog,'ElevenLabs voice / 声を選択');
 assert.equal(list.children[0].textContent,'Japanese Voice · e00001');
 assert.equal(list.children[1].textContent,'Narrator · e00002');
 assert.equal(list.value,'voice00001');
 assert.equal(walk(dialog).find(x=>x.tag==='audio').src,'https://example.com/one.mp3');
 assert.equal(find(dialog,'ElevenLabs提供の試聴です。英語の場合もあります。日本語の発音は生成した音声で確認してください。').hidden,false);
 list.value='voice00002';list.onchange();
 await find(dialog,'Apply voice / この声の設定を採用').onclick();
 const get=n=>widgets.find(w=>w.name===n).value;
 assert.equal(get('engine'),'ElevenLabs');assert.equal(get('voice_mode'),'ElevenLabsの声');assert.equal(get('elevenlabs_voice_id'),'voice00002');
 assert(!JSON.stringify(values).includes('test-secret'));
 find(node.panel,'Voice settings / 声を確認・調整').onclick();const again=body.children.at(-1);
 await new Promise(setImmediate);
 const second=field(again,'ElevenLabs voice / 声を選択');second.value='__custom__';second.onchange();
 field(again,'ElevenLabs Voice ID / 一覧にない声だけ入力').value='custom00003';
 await find(again,'Apply voice / この声の設定を採用').onclick();
 assert.equal(get('elevenlabs_voice_id'),'custom00003');
 assert(calls.includes('/local-narration/elevenlabs-voices'));
 console.log('PASS ElevenLabs UI: key dialog, named voices, preview, selection, and custom Voice ID');
})().catch(error=>{console.error(error);process.exitCode=1;});
