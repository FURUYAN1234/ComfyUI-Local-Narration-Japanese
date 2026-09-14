const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E{
 constructor(tag){this.tag=tag;this.style={};this.children=[];this.value='';}
 append(e){this.children.push(e);e.parentElement=this;}addEventListener(k,f){this[k]=f;}setAttribute(k,v){this[k]=v;}
 querySelector(){return this.children.find(e=>e.className==='narration-caption');}showModal(){}close(){}remove(){this.removed=true;}focus(){}
}
const body=new E('body');let extension;let responses=[];
const ctx={document:{createElement:t=>new E(t),body},app:{graph:{setDirtyCanvas(){},links:{}},registerExtension:e=>extension=e},api:{addEventListener(){},fetchApi:async()=>({ok:true,json:async()=>responses.shift()})},queueMicrotask:f=>f(),setInterval:()=>1,clearInterval(){},Date};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(process.argv[2],'utf8').replace(/^import .*;$/gm,''),ctx);
const values={text:'元の台詞。',purpose:'旧用途を保持',mode:'AI提案＋手動上書き',engine:'おまかせ',voice_mode:'デザイン',speaker:'Ono_anna',style:'旧声質を保持',speed:0,seed:42,character:'自由指定',reference_text:''};
const widgets=Object.entries(values).map(([name,value])=>({name,value,options:{values:name==='character'?['自由指定','落ち着いた女性ナレーター']:[]},...(['text','purpose','style'].includes(name)?{inputEl:new E('textarea')}:{})}));
const original=widgets.map(w=>w.value);
const node={comfyClass:'LocalNarrationDirection',widgets,addDOMWidget(name,t,panel,options){const w={name,options,panel};this.widgets.push(w);return w;}};
extension.nodeCreated(node);assert.deepEqual(widgets.slice(0,original.length).map(w=>w.value),original,'old serialization indexes preserved');
const panel=widgets.at(-1).panel;const select=label=>panel.children.find(e=>e.textContent===label).children[0];
const mode=select('Control / 設定方法'),purpose=select('Purpose / 用途'),tone=select('Tone / 口調');
function choose(w,v){w.value=v;w.onchange();node.onDrawForeground();}
function field(n){return widgets.find(w=>w.name===n);}
assert.equal(purpose.value,'自由入力');assert.equal(field('purpose').hidden,false);
choose(purpose,'解説・紹介');assert.equal(field('purpose').hidden,true);assert(field('purpose').value.includes('解説'));
choose(purpose,'会話');choose(purpose,'自由入力');assert.equal(field('purpose').value,'旧用途を保持');
choose(tone,'明るい');assert(field('style').value.includes('明るく'));assert(field('style').hidden);
choose(tone,'淡々と');choose(tone,'自由入力');assert.equal(field('style').value,'旧声質を保持');assert.equal(field('style').hidden,false);
choose(mode,'すべて手動');assert.equal(field('mode').value,'手動');assert(field('text').hidden);assert(field('purpose').hidden);
choose(mode,'AIにおまかせ');assert.equal(field('mode').value,'AIおまかせ');assert(field('style').hidden);assert.equal(field('text').hidden,false);
(async()=>{
 panel.children.find(e=>e.textContent==='Consult AI / おまかせ設定を相談・編集').onclick();
 let dialog=body.children.at(-1);let inputs=dialog.children.filter(e=>e.tag==='label').map(e=>e.children[0]);
 inputs[0].value='落ち着いた紹介動画';responses.push({engine:'Irodori',style:'AIの提案文',speed:1,reason:'紹介向け'});
 await dialog.children.find(e=>e.textContent==='Suggest / AIに文章を考えてもらう').onclick();
 assert.equal(field('style').value,'旧声質を保持','proposal must not mutate before adoption');
 inputs[1].value='ユーザーが直した提案文';
 dialog.children.at(-1).children[0].onclick();assert.equal(field('style').value,'旧声質を保持','cancel preserves inputs');
 panel.children.find(e=>e.textContent==='Consult AI / おまかせ設定を相談・編集').onclick();
 dialog=body.children.at(-1);inputs=dialog.children.filter(e=>e.tag==='label').map(e=>e.children[0]);inputs[0].value='明るい案内';responses.push({engine:'Qwen',style:'AI案',speed:1.1,reason:'案内'});
 await dialog.children.find(e=>e.textContent==='Suggest / AIに文章を考えてもらう').onclick();
 inputs[1].value='採用する修正文';dialog.children.at(-1).children[1].onclick();
 assert.equal(field('style').value,'採用する修正文');assert.equal(field('engine').value,'Qwen');assert.equal(field('mode').value,'AI提案＋手動上書き');assert.equal(field('text').value,'元の台詞。');
 console.log('PASS legacy values/indexes, preset/custom visibility, draft restoration, mode compatibility, consultation edit/cancel/adopt and original script preservation');
})().catch(e=>{console.error(e);process.exitCode=1});

