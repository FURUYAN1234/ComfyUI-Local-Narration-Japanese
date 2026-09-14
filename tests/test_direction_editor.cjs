const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E{
 constructor(tag){this.tag=tag;this.style={};this.dataset={};this.children=[];this.value='';this.hidden=false;}
 append(e){this.children.push(e);e.parentElement=this;}addEventListener(k,f){this[k]=f;}setAttribute(k,v){this[k]=v;}
 replaceChildren(...es){this.children=[];es.forEach(e=>this.append(e));}querySelectorAll(t){return this.children.flatMap(e=>[...(e.tag===t?[e]:[]),...e.querySelectorAll(t)]);}querySelector(t){return this.children.find(e=>e.tag===t);}
 get lastElementChild(){return this.children.at(-1);}showModal(){}close(){}remove(){this.removed=true;}focus(){}scrollIntoView(){}
}
const body=new E('body'),events=[],requests=[];let resolveFetch,ext;
const ctx={document:{body,createElement:t=>new E(t)},app:{graph:{setDirtyCanvas(){},links:{}},registerExtension:e=>ext=e},api:{dispatchEvent:e=>events.push(e.detail),fetchApi:(url,o)=>{requests.push(JSON.parse(o.body));return new Promise(r=>resolveFetch=r);}},CustomEvent:class{constructor(type,o){this.detail=o.detail;}},crypto:require('crypto').webcrypto,Map,Date,queueMicrotask:f=>f(),setInterval:()=>1,clearInterval(){}};
vm.createContext(ctx);const base=process.argv[2];
for(const f of ['dialogue_blocks.js','direction_editor.js'])vm.runInContext(fs.readFileSync(base+f,'utf8').replace(/^import .*;\n/gm,'').replace(/export function /g,'function '),ctx);
const vals={text:'元の台詞。',dialogue_blocks:'',purpose:'紹介',mode:'AIおまかせ',engine:'おまかせ',voice_mode:'デザイン',speaker:'Ono_anna',character:'自由指定',style:'',speed:0,seed:42};
const widgets=Object.entries(vals).map(([name,value])=>({name,value,options:{values:name==='speaker'?['Ono_anna','Ryan']:name==='character'?['自由指定','落ち着いた女性ナレーター']:[]}}));
const node={id:1,widgets,properties:{},comfyClass:'LocalNarrationDirection',addWidget(){return {};},addDOMWidget(name,type,panel,options){this.panel=panel;const w={name,options};widgets.push(w);return w;}};
ext.nodeCreated(node);ctx.installDirectionEditor(node);
const get=n=>widgets.find(w=>w.name===n),all=e=>e.children.flatMap(c=>[c,...all(c)]),find=(e,t)=>all(e).find(c=>c.textContent===t),field=(e,l)=>all(e).find(c=>c['aria-label']===l);
assert.deepEqual(widgets.slice(0,Object.keys(vals).length).map(w=>w.value),Object.values(vals),'opening does not mutate legacy values');
assert(all(node.panel).some(e=>e.textContent.includes('声は未確定')));
(async()=>{
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();let d=body.children.at(-1);
 field(d,'Request / 作りたい内容・希望').value='紹介台詞を5行作って';
 const running=find(d,'Suggest / AIに提案してもらう').onclick();
 assert.equal(requests.at(-1).kind,'compose');assert.equal(get('text').value,'元の台詞。');
 resolveFetch({ok:true,json:async()=>({text:'一行目です。\n二行目です。\n三行目です。\n四行目です。\n五行目です。',engine:'Irodori',style:'穏やかな声',speed:1,reason:'紹介向け'})});await running;
 assert.equal(get('text').value,'元の台詞。','proposal must remain a draft');
 field(d,'Proposed script / 台詞の提案（1行に1文・編集可）').value='編集した一行目です。\n二行目です。\n三行目です。\n四行目です。\n五行目です。';
 find(d,'Apply script and voice / 台詞一覧と声へ採用').onclick();
 const blocks=JSON.parse(get('dialogue_blocks').value).blocks;assert.equal(blocks.length,5);assert.equal(blocks[0].text,'編集した一行目です。');assert.equal(get('text').value,blocks.map(b=>b.text).join('\n'));assert.equal(get('mode').value,'手動');assert.equal(get('style').value,'穏やかな声');
 assert(all(node.panel).some(e=>e.textContent==='1. Script / 採用済みの台詞 5件'));
 node.narrationEditSentences();d=body.children.at(-1);assert.equal(all(d).filter(e=>e.tag==='textarea').length,5);
 field(d,'台詞ブロック1').value='破棄';field(d,'台詞ブロック1').oninput();find(d,'Cancel and return / 変更を破棄して戻る').onclick();assert.equal(JSON.parse(get('dialogue_blocks').value).blocks[0].text,'編集した一行目です。');
 find(node.panel,'Edit voice / 声をプリセットから選ぶ・調整').onclick();d=body.children.at(-1);
 const tone=field(d,'Tone / 口調');tone.value='自由入力';tone.onchange();assert(!field(d,'Custom voice and tone / 声質・口調の自由入力').parentElement.hidden);
 tone.value='明るい';tone.onchange();assert(field(d,'Custom voice and tone / 声質・口調の自由入力').parentElement.hidden);
 find(d,'Cancel / 変更を破棄').onclick();assert.equal(get('style').value,'穏やかな声');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();d=body.children.at(-1);
 field(d,'Create / AIに作ってもらうもの').value='台詞だけを作る・直す';
 let req=find(d,'Suggest / AIに提案してもらう').onclick();assert.equal(requests.at(-1).kind,'script');
 resolveFetch({ok:true,json:async()=>({text:'台詞だけ変更しました。'})});await req;
 find(d,'Apply script / 台詞一覧へ採用').onclick();assert.equal(get('text').value,'台詞だけ変更しました。');assert.equal(get('style').value,'穏やかな声');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();d=body.children.at(-1);
 field(d,'Create / AIに作ってもらうもの').value='声だけを決める';
 req=find(d,'Suggest / AIに提案してもらう').onclick();assert.equal(requests.at(-1).kind,'plan');
 resolveFetch({ok:true,json:async()=>({engine:'Qwen',style:'穏やかな声',speed:1.1,reason:'声のみ変更'})});await req;
 find(d,'Apply voice / 声の設定へ採用').onclick();assert.equal(get('engine').value,'Qwen');assert.equal(get('text').value,'台詞だけ変更しました。');
 find(node.panel,'Consult AI / 作りたい内容をAIに相談').onclick();d=body.children.at(-1);const pending=find(d,'Suggest / AIに提案してもらう').onclick();find(d,'Cancel / 変更を破棄して戻る').onclick();resolveFetch({ok:true,json:async()=>({text:'遅い結果',engine:'Qwen',style:'別の声',speed:1})});await pending;
 assert.equal(get('style').value,'穏やかな声');assert(events.some(e=>e.state==='running'));assert(events.some(e=>e.state==='complete'));assert(events.some(e=>e.state==='cancel'));
 console.log('PASS real editor modules: legacy preservation, 5-line proposal/edit/atomic adoption, sentence editor synchronization, preset/custom visibility, script-only/voice-only isolation, cancellation and late response discard');
})().catch(e=>{console.error(e);process.exitCode=1;});
