const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E{
 constructor(tag){this.tag=tag;this.style={};this.dataset={};this.children=[];this.value='';this.hidden=false;}
 append(e){this.children.push(e);e.parentElement=this;}addEventListener(k,f){this[k]=f;}setAttribute(k,v){this[k]=v;}
 replaceChildren(...es){this.children=[];es.forEach(e=>this.append(e));}querySelectorAll(t){return this.children.flatMap(e=>[...(e.tag===t?[e]:[]),...e.querySelectorAll(t)]);}querySelector(t){return this.children.find(e=>e.tag===t);}
 get lastElementChild(){return this.children.at(-1);}showModal(){this.open=true;}close(){this.open=false;}remove(){this.removed=true;}focus(){}scrollIntoView(){}
}
const body=new E('body'),events=[],requests=[];let resolveFetch,ext,geminiConfigured=false;const queued=[];
const ctx={document:{body,createElement:t=>new E(t),querySelector:()=>null},app:{queuePrompt:async(...args)=>queued.push(args),graph:{setDirtyCanvas(){},links:{}},registerExtension:e=>ext=e},api:{dispatchEvent:e=>events.push(e.detail),fetchApi:(url,o={})=>{if(url.includes('gemini-credential-status'))return Promise.resolve({ok:true,json:async()=>({configured:geminiConfigured})});requests.push(JSON.parse(o.body));return new Promise(r=>resolveFetch=r);}},CustomEvent:class{constructor(type,o){this.detail=o.detail;}},crypto:require('crypto').webcrypto,Map,Date,queueMicrotask:f=>f(),setInterval:()=>1,clearInterval(){}};
vm.createContext(ctx);const base=process.argv[2];
for(const f of ['dialogue_blocks.js','direction_editor.js'])vm.runInContext(fs.readFileSync(base+f,'utf8').replace(/^import .*;\n/gm,'').replace(/export function /g,'function '),ctx);
const vals={text:'元の台詞。',dialogue_blocks:'',purpose:'紹介',mode:'AIおまかせ',engine:'おまかせ',voice_mode:'デザイン',speaker:'Ono_anna',character:'自由指定',style:'',speed:0,seed:42,gemini_voice:'Kore｜芯のある安定した声',gemini_voice_design_preset:'落ち着いた女性ドキュメンタリー',gemini_voice_design:'',gemini_voice_id:'',gemini_emotion:'自動（原稿・口調から判断）',gemini_emotion_strength:'標準',gemini_emotion_custom:''};
const widgets=Object.entries(vals).map(([name,value])=>({name,value,options:{values:name==='speaker'?['Ono_anna','Ryan']:name==='character'?['自由指定','落ち着いた女性ナレーター']:name==='gemini_voice'?['Kore｜芯のある安定した声','Laomedeia｜快活でテンポのよい声','Puck｜陽気で弾む声']:name==='gemini_voice_design_preset'?['落ち着いた女性ドキュメンタリー','明るい女性ガイド','自由入力']:name==='gemini_emotion'?['自動（原稿・口調から判断）','喜び','自由入力']:name==='gemini_emotion_strength'?['控えめ','標準','強め']:[]}}));
const node={id:1,widgets,properties:{},comfyClass:'LocalNarrationDirection',addWidget(){return {};},addDOMWidget(name,type,panel,options){this.panel=panel;const w={name,options};widgets.push(w);return w;}};
ext.nodeCreated(node);ctx.installDirectionEditor(node);
const get=n=>widgets.find(w=>w.name===n),all=e=>e.children.flatMap(c=>[c,...all(c)]),find=(e,t)=>all(e).find(c=>c.textContent===t),field=(e,l)=>all(e).find(c=>c['aria-label']===l),tick=()=>new Promise(setImmediate);
assert.deepEqual(widgets.slice(0,Object.keys(vals).length).map(w=>w.value),Object.values(vals),'opening does not mutate legacy values');
assert(all(node.panel).some(e=>e.textContent.includes('声は未確定')));
(async()=>{
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();let d=body.children.at(-1);
 assert.deepEqual(find(d,'Suggest / AIに提案してもらう').parentElement.children.map(e=>e.textContent),['Cancel / キャンセル（変更を破棄）','Apply / 提案を台詞・声へ採用','Suggest / AIに提案してもらう']);
 field(d,'Request / AIへの依頼文（この内容を送信）').value='紹介台詞を5行作って';
 const running=find(d,'Suggest / AIに提案してもらう').onclick();
 await tick();
 assert.equal(requests.at(-1).kind,'compose');assert.equal(get('text').value,'元の台詞。');
 assert.equal(d.open,false,'consultation closes while the request runs');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();assert.equal(d.open,true,'consultation can be reopened while running');
 d.close();
 resolveFetch({ok:true,json:async()=>({text:'一行目です。\n二行目です。\n三行目です。\n四行目です。\n五行目です。',engine:'Irodori',style:'穏やかな声',speed:1,reason:'紹介向け'})});await running;
 assert.equal(d.open,true,'proposal reopens for review when ready');
 assert.equal(get('text').value,'元の台詞。','proposal must remain a draft');
 field(d,'Proposed script / 台詞の提案（1行に1文・編集可）').value='編集した一行目です。\n二行目です。\n三行目です。\n四行目です。\n五行目です。';
 find(d,'Apply script and voice / 台詞一覧と声へ採用').onclick();
 const blocks=JSON.parse(get('dialogue_blocks').value).blocks;assert.equal(blocks.length,5);assert.equal(blocks[0].text,'編集した一行目です。');assert.equal(get('text').value,blocks.map(b=>b.text).join('\n'));assert.equal(get('mode').value,'手動');assert.equal(get('style').value,'穏やかな声');
 assert(all(node.panel).some(e=>e.textContent==='1. Script / 採用済みの台詞 5件'));
 await find(node.panel,'Run / 実行して読みを確認').onclick();assert.deepEqual(queued,[[0,1]],'node Run must use standard graph queue once');
 node.narrationEditSentences();d=body.children.at(-1);assert.deepEqual(find(d,'Save / 台詞を保存して戻る').parentElement.children.map(e=>e.textContent),['Cancel / キャンセル（変更を破棄）','Save / 台詞を保存して戻る','削除を戻す / Undo remove','＋ 台詞を追加 / Add']);assert.equal(all(d).filter(e=>e.tag==='textarea').length,5);
 field(d,'台詞ブロック1').value='破棄';field(d,'台詞ブロック1').oninput();find(d,'Cancel / キャンセル（変更を破棄）').onclick();assert.equal(JSON.parse(get('dialogue_blocks').value).blocks[0].text,'編集した一行目です。');
 find(node.panel,'Voice settings / 声を確認・調整').onclick();d=body.children.at(-1);
 const tone=field(d,'Tone / 口調');tone.value='自由入力';tone.onchange();assert(!field(d,'Custom voice and tone / 声質・口調の自由入力').parentElement.hidden);
 tone.value='明るい';tone.onchange();assert(field(d,'Custom voice and tone / 声質・口調の自由入力').parentElement.hidden);
 find(d,'Cancel / キャンセル（変更を破棄）').onclick();assert.equal(get('style').value,'穏やかな声');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();d=body.children.at(-1);
 assert.equal(field(d,'Create / AIに作ってもらうもの').value,'台詞を作る・直す（声は変更しない）','adopted voice defaults to script-only consultation');
 assert.equal(field(d,'Voice gender / 声の性別').parentElement.hidden,true,'gender is hidden when voice is preserved');
 await tick();assert(all(d).some(e=>e.textContent?.startsWith('AI音声候補')&&e.hidden),'voice candidates are hidden in script-only mode');
 field(d,'Create / AIに作ってもらうもの').value='台詞を作る・直す（声は変更しない）';
 let req=find(d,'Suggest / AIに提案してもらう').onclick();await tick();assert.equal(requests.at(-1).kind,'script');
 resolveFetch({ok:true,json:async()=>({text:'台詞だけ変更しました。'})});await req;
 find(d,'Apply script / 台詞一覧へ採用').onclick();assert.equal(get('text').value,'台詞だけ変更しました。');assert.equal(get('style').value,'穏やかな声');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();d=body.children.at(-1);
 field(d,'Create / AIに作ってもらうもの').value='声だけ提案（台詞は変更しない）';
 req=find(d,'Suggest / AIに提案してもらう').onclick();await tick();assert.equal(requests.at(-1).kind,'plan');
 resolveFetch({ok:true,json:async()=>({engine:'Qwen',style:'穏やかな声',speed:1.1,reason:'声のみ変更'})});await req;
 find(d,'Apply voice / 声の設定へ採用').onclick();assert.equal(get('engine').value,'Qwen');assert.equal(get('text').value,'台詞だけ変更しました。');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();d=body.children.at(-1);const pending=find(d,'Suggest / AIに提案してもらう').onclick();await tick();assert.equal(d.open,false);find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();assert.equal(d.open,true);find(d,'Cancel / キャンセル（変更を破棄）').onclick();resolveFetch({ok:true,json:async()=>({text:'遅い結果',engine:'Qwen',style:'別の声',speed:1})});await pending;
 assert.equal(get('style').value,'穏やかな声');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();d=body.children.at(-1);const failed=find(d,'Suggest / AIに提案してもらう').onclick();await tick();assert.equal(d.open,false);resolveFetch({ok:false,json:async()=>({error:'テスト用エラー'})});await failed;assert.equal(d.open,true,'errors reopen the same dialog');assert(all(d).some(e=>e.textContent?.includes('テスト用エラー')));find(d,'Cancel / キャンセル（変更を破棄）').onclick();
 assert(events.some(e=>e.state==='running'));assert(events.some(e=>e.state==='complete'));assert(events.some(e=>e.state==='cancel'));
 geminiConfigured=true;get('engine').value='Gemini 3.8 Flash TTS';get('voice_mode').value='用意された声（Gemini）';get('gemini_voice').value='Laomedeia｜快活でテンポのよい声';get('style').value='落ち着いた深みのある男声で、温かい口調。';node.properties.narrationVoiceGender='女性';
 find(node.panel,'Voice settings / 声を確認・調整').onclick();d=body.children.at(-1);
 assert.equal(field(d,'Voice gender / 声の性別（自動・女性・男性・任意）').value,'女性');
 await find(d,'Apply voice / この声の設定を採用').onclick();
 assert.equal(d.removed,true,'adoption closes the dialog');
 assert.equal(get('style').value,'落ち着いた深みのある女声で、温かい口調。','old opposite-gender custom text is aligned without losing tone');
 assert.equal(get('gemini_voice').value,'Laomedeia｜快活でテンポのよい声');
 get('style').value='柔らかな男の声で話す。';node.properties.narrationVoiceGender='男性';
 find(node.panel,'Voice settings / 声を確認・調整').onclick();d=body.children.at(-1);
 const gender=field(d,'Voice gender / 声の性別（自動・女性・男性・任意）');gender.value='女性';gender.onchange();
 assert.equal(field(d,'Custom voice and tone / 声質・口調の自由入力').value,'柔らかな女の声で話す。','gender switch updates the visible custom field');
 await find(d,'Apply voice / この声の設定を採用').onclick();
 assert.equal(d.removed,true);assert.equal(get('style').value,'柔らかな女の声で話す。');
 get('style').value='男声と女声を混ぜる。';node.properties.narrationVoiceGender='女性';
 find(node.panel,'Voice settings / 声を確認・調整').onclick();d=body.children.at(-1);
 await find(d,'Apply voice / この声の設定を採用').onclick();
 assert.notEqual(d.removed,true,'ambiguous mixed-gender instruction remains blocked');
 assert.equal(get('style').value,'男声と女声を混ぜる。');find(d,'Cancel / キャンセル（変更を破棄）').onclick();
 console.log('PASS real editor modules: legacy preservation, 5-line proposal/edit/atomic adoption, sentence editor synchronization, preset/custom visibility, script-only/voice-only isolation, cancellation and late response discard');
})().catch(e=>{console.error(e);process.exitCode=1;});
