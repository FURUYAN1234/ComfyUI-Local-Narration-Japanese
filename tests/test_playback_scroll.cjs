const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E{constructor(tag){this.tag=tag;this.children=[];this.style={};}append(e){this.children.push(e);}replaceChildren(){this.children=[];}}
let ext,root;const ctx={document:{createElement:t=>new E(t)},app:{registerExtension:e=>ext=e},api:{apiURL:u=>u},URLSearchParams};
vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8').replace(/^import .*;$/gm,''),ctx);
const blocks=Array.from({length:100},(_,i)=>({index:i+1,text:'台詞'+(i+1),filename:(i+1)+'.mp3',subfolder:'audio/test',type:'output'}));
const data={completed_audio:[{text:'全体音声',filename:'full.mp3',subfolder:'audio/test'}],dialogue_blocks:blocks};
const node={comfyClass:'LocalNarrationPlayback',properties:{completed_audio:data},size:[460,420],addDOMWidget(n,t,e){root=e;}};
ext.nodeCreated(node);
const all=(e,t)=>e.children.flatMap(c=>[...(c.tag===t?[c]:[]),...all(c,t)]);
assert.equal(all(root,'audio').length,101);assert(all(root,'audio').every(a=>a.preload==='none'));
assert.equal(all(root,'button').length,0);
assert.equal(root.style.overflowY,'auto');assert.equal(root.style.maxHeight,'420px');
assert(all(root,'a').some(a=>a.download==='1.mp3'));
assert(all(root,'a').some(a=>a.download==='100.mp3'));
assert.equal(node.properties.completed_audio.dialogue_blocks.length,100,'Scrolling must preserve all file references');
node.onExecuted({completed_audio:data.completed_audio,dialogue_blocks:[]});assert.equal(all(root,'audio').length,1);
console.log('PASS 100 audio references accessible in fixed-height scrolling list; lazy loading and empty list');
