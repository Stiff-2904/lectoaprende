const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.join(__dirname,'../public/js/music.js'),'utf8');
const audioFolder = path.join(__dirname,'../public/audio/music');

function loadMusic({rejectPlay=false, preset={}}={}) {
  const settings = new Map(Object.entries(preset));
  const listeners = {};
  const docListeners = {};
  class MockAudio {
    constructor() { this.volume=1; this.src=''; this.paused=true; this.events={}; this.calls=0; this.loop=false; MockAudio.current=this; }
    addEventListener(type,fn) { this.events[type]=fn; }
    pause() { this.paused=true; }
    load() { this.loaded=true; }
    play() {
      this.calls++;
      if (rejectPlay && this.calls===1) return Promise.reject(new Error('Autoplay policy'));
      this.paused=false;
      Promise.resolve().then(() => this.events.playing?.());
      return Promise.resolve();
    }
  }
  const attrs={};
  const button={ disabled:false, textContent:'', title:'', setAttribute:(k,v)=>{attrs[k]=v;},
    addEventListener:(t,fn)=>{listeners[t]=fn;} };
  const document={ hidden:false, getElementById:id => id==='music-toggle'?button:null,
    addEventListener:(t,fn)=>{docListeners[t]=fn;} };
  const window={addEventListener:(t,fn)=>{listeners[t]=fn;}};
  vm.runInNewContext(script, {window,document,Audio:MockAudio,
    localStorage:{getItem:k=>settings.get(k)??null,setItem:(k,v)=>settings.set(k,v)}},
  {filename:'music.js'});
  return {player:MockAudio.current, button, settings, listeners, document, docListeners, music:window.LectoMusic, attrs};
}
const settle = ()=>new Promise(r=>setImmediate(r));

test('Hay 24 pistas MP3: dos arreglos propios por cada uno de 8 mundos y 4 cuentos', () => {
  const scenes=[...Array.from({length:8},(_,i)=>`mundo${i+1}`),'luna','sapo','semilla','cometa'];
  for(const scene of scenes) {
    const [first,second]=[1,2].map(n=>fs.readFileSync(path.join(audioFolder,`${scene}-${n}.mp3`)));
    assert.ok(first.length>10000 && second.length>10000, `Audio vacío para ${scene}`);
    assert.equal(first.subarray(0,3).toString(),'ID3');
    assert.notDeepEqual(first,second,`Deben variar los arreglos de ${scene}`);
  }
});

test('Cada mundo alterna música cuando se visita de nuevo, sin cambiar el resto',async() => {
  const a=loadMusic();
  a.music.enter('world',1); await settle();
  assert.equal(a.player.src,'/audio/music/mundo1-1.mp3');
  a.music.enter('world',1); await settle();
  assert.equal(a.player.src,'/audio/music/mundo1-2.mp3');
  a.music.enter('world',1); await settle();
  assert.equal(a.player.src,'/audio/music/mundo1-1.mp3');
  a.music.enter('world',8); await settle();
  assert.equal(a.player.src,'/audio/music/mundo8-1.mp3');
  a.music.enter('story','cometa'); await settle();
  assert.equal(a.player.src,'/audio/music/cometa-1.mp3');
  const prev=a.player.src;
  a.music.enter('story','desconocido');
  assert.equal(a.player.src,prev);
});

test('Lito baja el volumen de música al narrar y vuelve a subirlo al terminar',async()=>{
  const a=loadMusic();
  a.music.enter('story','luna'); await settle();
  assert.equal(a.player.volume,.38);
  a.music.onNarrationStart();
  assert.equal(a.player.volume,.075);
  a.music.onNarrationEnd();
  assert.equal(a.player.volume,.38);
  assert.equal(a.attrs['aria-pressed'],'true');
});

test('El niño puede silenciar y volver a activar; la preferencia persiste',async()=>{
  const a=loadMusic();
  a.music.enter('world',2); await settle();
  a.listeners.click();
  assert.equal(a.player.paused,true);
  assert.equal(a.settings.get('lectoaprende-musica-activada'),'false');
  a.listeners.click();await settle();
  assert.equal(a.player.paused,false);
  assert.equal(a.settings.get('lectoaprende-musica-activada'),'true');
  const b=loadMusic({preset:{'lectoaprende-musica-activada':'false'}});
  b.music.enter('story','sapo');await settle();
  assert.equal(b.player.paused,true);
});

test('Cuando autoplay está restringido, aparece botón para iniciar la música',async()=>{
  const a=loadMusic({rejectPlay:true});
  a.music.enter('world',4); await settle();
  assert.equal(a.button.textContent,'▶️ Iniciar música');
  a.listeners.click(); await settle();
  assert.equal(a.player.paused,false);
  assert.equal(a.button.textContent,'🔇 Silenciar música');
});

test('Al ocultar o abandonar la página, la música se detiene',async()=>{
  const a=loadMusic();
  a.music.enter('world',1); await settle();
  a.document.hidden=true;a.docListeners.visibilitychange();
  assert.equal(a.player.paused,true);
  a.document.hidden=false;a.docListeners.visibilitychange();await settle();
  assert.equal(a.player.paused,false);
  a.listeners.pagehide();
  assert.equal(a.player.paused,true);
});

test('Los mundos y las lecturas incluyen botón y script de música',()=>{
  for(const f of ['module1.html','stories.html']) {
    const html=fs.readFileSync(path.join(__dirname,'../public/views',f),'utf8');
    assert.match(html,/id="music-toggle"/);
    assert.match(html,/src="\/js\/music.js"/);
  }
  const script=fs.readFileSync(path.join(__dirname,'../public/js/kids.js'),'utf8');
  assert.match(script,/LectoMusic\?\.enter\('world', id\)/);
  assert.match(script,/LectoMusic\?\.enter\('story',active.id\)/);
  assert.match(script,/LectoMusic\?\.onNarrationStart\(\)/);
  assert.match(script,/LectoMusic\?\.onNarrationEnd\(\)/);
});
