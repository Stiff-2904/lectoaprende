const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const exercises = require('../src/data/exercises');
const store = require('../src/store/sessionStore');
const sessions = require('../src/services/session.service');

const client = fs.readFileSync(path.join(__dirname, '../public/js/kids.js'), 'utf8');
const saveKey = 'lectoaprende-aventuras-v2';
const tick = () => new Promise(resolve => setTimeout(resolve, 10));

class Element {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.children = [];
    this.attributes = {};
    this.style = { width: '', setProperty(){} };
    const names = new Set();
    this.classList = {
      add: (...cls) => cls.forEach(c => names.add(c)),
      remove: (...cls) => cls.forEach(c => names.delete(c)),
      contains: cls => names.has(cls),
      toggle: (cls, force) => {
        const enabled = force === undefined ? !names.has(cls) : Boolean(force);
        if (enabled) names.add(cls); else names.delete(cls);
        return enabled;
      }
    };
  }
  setAttribute(k,v){this.attributes[k] = v;}
  removeAttribute(k){delete this.attributes[k]; if(k==='href') this.href=undefined;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children = [...children];}
  querySelectorAll(selector){return selector === 'button' ? this.children.filter(b=>b.tagName === 'button') : [];}
  querySelector(selector){
    if (selector==='.pill') return this.children.find(e=>e.className==='pill') || null;
    return this.querySelectorAll(selector)[0] || null;
  }
  focus(){this.focused=true;}
}

const completedBefore = id => Array.from({length:(id-1)*5},(_,i)=>`m${Math.floor(i/5)+1}-e${i%5+1}`);
function voiceProbe() {
  const spoken=[];
  const speechSynthesis={getVoices:()=>[], speak:msg=>spoken.push(msg.text), cancel() {}, addEventListener() {}};
  class SpeechSynthesisUtterance { constructor(text){this.text=text;} }
  return {spoken, speechSynthesis, SpeechSynthesisUtterance};
}

async function boot(moduleId, {completed=[], search='', voiceConfigured=false, azureFailureStatus=null}={}) {
  store.resetStore();
  const elements = new Map();
  const ids = ['options','title','number','exercise-count','instruction','prompt',
    'visual-hint','order','retry','next','finish','repeat','bar','track','status','listen'];
  for (const id of ids) elements.set(id, new Element());
  const local = new Map([[saveKey, JSON.stringify({completed, stories:[]})]]);
  const sessionStorage = new Map();
  const storage = map => ({
    getItem:k=>map.get(k)||null,
    setItem:(k,v)=>map.set(k,String(v)),
    removeItem:k=>map.delete(k)
  });
  const sid = sessions.createAnonymousSession().sessionId;
  const voice=voiceProbe();
  async function fetch(url, options={}) {
    const json = data => ({ok:true,json:async()=>({data})});
    if(url === `/api/modules/${moduleId}/exercises`)
      return json(exercises.filter(e=>e.moduleId===moduleId).map(({correctAnswer,feedback,...publicPart})=>publicPart));
    if(url === '/api/sessions' && options.method === 'POST') return json({sessionId:sid});
    if(url === '/api/voice/status') return json({configured:voiceConfigured});
    if(url === '/api/voice/speak' && azureFailureStatus)
      return {ok:false,status:azureFailureStatus};
    if(url.includes('/attempts')) {
      const payload=JSON.parse(options.body);
      return json(sessions.recordAttempt(sid,payload));
    }
    if(url.endsWith('/progress')) return json(sessions.getProgress(sid));
    throw new Error(`Solicitud imprevista: ${url}`);
  }
  const document = {
    getElementById:id=>elements.get(id)||null,
    querySelectorAll:()=>[],
    createElement:tag=>new Element(tag)
  };
  vm.runInNewContext(client, {
    document, window:{speechSynthesis:voice.speechSynthesis,SpeechSynthesisUtterance:voice.SpeechSynthesisUtterance},
    speechSynthesis:voice.speechSynthesis, SpeechSynthesisUtterance:voice.SpeechSynthesisUtterance,
    localStorage:storage(local), sessionStorage:storage(sessionStorage),
    location:{pathname:`/module${moduleId}`, search}, fetch, URLSearchParams,
    setTimeout:fn=>{fn();return 1;}, AbortController, console
  }, {filename:'kids.js'});
  await tick();
  return {el:id=>elements.get(id), saved:()=>JSON.parse(local.get(saveKey)), sessionId:sid, spoken:voice.spoken};
}

async function press(button){assert.ok(button,'La opción debe existir'); await button.onclick(); await tick();}
function option(el,value){return el('options').children.find(b=>b.textContent===value);}

test('Mundo 1 retoma el primer reto pendiente y permite corregir errores', async()=>{
  const {el,saved} = await boot(1,{completed:['m1-e1','m1-e2']});
  assert.equal(el('exercise-count').textContent,'Reto 3 de 5');
  assert.equal(el('track').attributes['aria-valuenow'],40);
  await press(option(el,'L'));
  assert.equal(el('retry').classList.contains('hide'),false);
  assert.equal(saved().completed.length,2);
  await press(el('retry'));
  assert.equal(option(el,'L').disabled,false);
  await press(option(el,'S'));
  assert.ok(saved().completed.includes('m1-e3'));
  assert.equal(el('next').classList.contains('hide'),false);
  await press(el('next'));
  assert.equal(el('exercise-count').textContent,'Reto 4 de 5');
});

test('Mundo 3 muestra la sílaba construida y la guarda correctamente', async()=>{
  const {el,saved} = await boot(3,{completed:completedBefore(3)});
  await press(option(el,'A'));
  assert.equal(el('order').textContent,'M + A = MA');
  assert.ok(saved().completed.includes('m3-e1'));
});

test('Mundo 4 permite reordenar sílabas después de un error', async()=>{
  const {el,saved} = await boot(4,{completed:completedBefore(4)});
  await press(option(el,'SA'));
  assert.match(el('order').textContent,/SA/);
  await press(option(el,'ME'));
  assert.equal(el('retry').classList.contains('hide'),false);
  await press(el('retry'));
  assert.equal(option(el,'SA').classList.contains('picked'),false);
  await press(option(el,'ME'));
  await press(option(el,'SA'));
  assert.ok(saved().completed.includes('m4-e1'));
  assert.equal(el('next').classList.contains('hide'),false);
});

test('Los ocho mundos muestran finalización y disponen de un modo para repetir',async()=>{
  for(let moduleId=1;moduleId<=8;moduleId++) {
    const completed=[...completedBefore(moduleId), ...Array.from({length:5},(_,i)=>`m${moduleId}-e${i+1}`)];
    const {el}=await boot(moduleId,{completed});
    assert.match(el('prompt').textContent,/Aventura terminada/);
    assert.equal(el('options').children.length,0);
    assert.equal(el('repeat').href,`/module${moduleId}?repetir=1`);
    assert.equal(el('finish').href,moduleId<8?`/module${moduleId+1}`:'/progress');
    assert.equal(el('track').attributes['aria-valuenow'],100);
    const replay=await boot(moduleId,{completed,search:'?repetir=1'});
    assert.equal(replay.el('exercise-count').textContent,'Reto 1 de 5');
    assert.ok(replay.el('options').children.length>=2);
  }
});

async function bootPage(kind, {completed=[], stories=[], search='', attempts={total:0,correct:0}}={}) {
  const definitions={
    menu:['adventure-map','journey-summary',...Array.from({length:8},(_,i)=>`map-progress-${i+1}`),...Array.from({length:8},(_,i)=>`map-card-${i+1}`)],
    progress:['cards','stickers','total','advice','progress-detail'],
    adults:['adult-summary','reset','message'],
    stories:['story-library','story-reader','story-message','story-title','story-subtitle','story-quiz','story-page',
      'story-scene','story-text','page-number','story-prev','story-next','story-listen','story-question',
      'story-answer-options','story-result','story-back','story-question-listen']
  };
  const elements = new Map(definitions[kind].map(id=>[id,new Element()]));
  if(kind==='menu') for(let m=1;m<=8;m++){
    const pill=new Element('span');pill.className='pill';
    elements.get(`map-card-${m}`).append(pill);
  }
  const local = new Map([[saveKey, JSON.stringify({completed, stories, attempts})]]);
  const voice=voiceProbe();
  const localStorage={
    getItem:k=>local.get(k)||null,
    setItem:(k,v)=>local.set(k,String(v)),
    removeItem:k=>local.delete(k)
  };
  const sessionStorage={getItem:()=>null,removeItem(){},setItem(){}};
  const document={
    getElementById:id=>elements.get(id)||null,
    querySelectorAll:()=>[],
    createElement:tag=>new Element(tag)
  };
  const allStories=require('../public/data/stories.json');
  const fetch=async url=>{
    if(url==='/data/stories.json') return {ok:true,json:async()=>allStories};
    if(url==='/api/voice/status') return {ok:true,json:async()=>({data:{configured:false}})};
    throw Error(`Unexpected URL: ${url}`);
  };
  vm.runInNewContext(client, {
    document, window:{speechSynthesis:voice.speechSynthesis,SpeechSynthesisUtterance:voice.SpeechSynthesisUtterance},
    speechSynthesis:voice.speechSynthesis, SpeechSynthesisUtterance:voice.SpeechSynthesisUtterance,
    localStorage, sessionStorage,
    location:{pathname:kind==='stories'?'/stories':kind==='adults'?'/adults':kind==='progress'?'/progress':'/menu',search},
    fetch, URLSearchParams, setTimeout:fn=>{fn();return 1;},
    confirm:()=>true, AbortController, console
  });
  await tick();
  return {el:id=>elements.get(id),saved:()=>JSON.parse(local.get(saveKey)||'null'),spoken:voice.spoken};
}

test('El mapa refleja la cantidad real de retos completos',async()=>{
  const {el}=await bootPage('menu',{completed:['m1-e1','m1-e2','m2-e1','m4-e1'],stories:['luna']});
  assert.match(el('map-progress-1').textContent,/2\/5/);
  assert.match(el('map-progress-2').textContent,/1\/5/);
  assert.match(el('map-progress-3').textContent,/0\/5/);
  assert.match(el('journey-summary').textContent,/4 de 40 retos superados/);
  assert.match(el('journey-summary').textContent,/1 de 4 cuentos leídos/);
  assert.equal(el('map-card-1').href,'/module1');
  for(let m=2;m<=8;m++){
    assert.equal(el(`map-card-${m}`).href,undefined);
    assert.equal(el(`map-card-${m}`).attributes['aria-disabled'],'true');
    assert.match(el(`map-card-${m}`).children[0].textContent,/bloqueado/);
  }
});

test('El álbum presenta ocho tarjetas, veinticuatro posibles estrellas y doce pegatinas',async()=>{
  const completed=Array.from({length:5},(_,i)=>`m1-e${i+1}`);
  const {el}=await bootPage('progress',{completed,stories:['luna']});
  assert.equal(el('cards').children.length,8);
  assert.equal(el('stickers').children.length,12);
  assert.match(el('total').textContent,/3 de 24/);
  assert.equal(el('cards').children[0].children[3].href,'/module1?repetir=1');
  assert.equal(el('cards').children[1].children[3].href,'/module2');
  assert.equal(el('cards').children[2].children[3].tagName,'span');
  assert.equal(el('stickers').children.filter(e=>e.className.includes('earned')).length,2);
});

test('Los cuatro cuentos permiten leer, responder y obtener su pegatina',async()=>{
  for(const {id,correctIndex,pages} of require('../public/data/stories.json')) {
    const {el,saved}=await bootPage('stories',{search:`?cuento=${id}`});
    assert.equal(el('story-library').hidden,true);
    assert.equal(el('story-reader').hidden,false);
    assert.equal(el('page-number').textContent,`Página 1 de ${pages.length}`);
    for(let i=1;i<pages.length;i++) await press(el('story-next'));
    assert.equal(el('page-number').textContent,`Página ${pages.length} de ${pages.length}`);
    await press(el('story-next'));
    assert.equal(el('story-quiz').hidden,false);
    assert.equal(el('story-answer-options').children.length,3);
    await press(el('story-answer-options').children[correctIndex]);
    assert.ok(saved().stories.includes(id));
    assert.equal(el('story-back').hidden,false);
  }
});

test('La pantalla de adultos resume los ocho módulos y reinicia el progreso',async()=>{
  const {el,saved}=await bootPage('adults',{
    completed:['m1-e1','m2-e1','m3-e1','m4-e1'],stories:['sapo'],
    attempts:{total:7,correct:4}
  });
  assert.match(el('adult-summary').textContent,/Retos superados: 4\/40/);
  assert.match(el('adult-summary').textContent,/7 \(4 correctos\)/);
  assert.match(el('adult-summary').textContent,/Letras y sonidos: 1\/5/);
  await press(el('reset'));
  assert.equal(saved(),null);
  assert.match(el('message').textContent,/Se borraron los logros/);
});


test('Los mundos 2, 3 y 4 no se pueden abrir ni con URL directa ni en modo repetir',async()=>{
  for(let id=2;id<=4;id++) {
    const progress=completedBefore(id).slice(0,-1);
    for(const search of ['', '?repetir=1']) {
      const {el,spoken}=await boot(id,{completed:progress,search});
      assert.match(el('prompt').textContent,/Sigue tu aventura en orden/);
      assert.equal(el('options').children.length,0);
      assert.equal(el('finish').href,`/module${id-1}`);
      assert.ok(el('listen').classList.contains('hide'));
      assert.equal(spoken.length,0);
    }
  }
});

test('Desbloquea cada mundo sólo al haber terminado todos los mundos anteriores',async()=>{
  for(let id=1;id<=4;id++){
    const complete=completedBefore(id);
    const {el,spoken}=await boot(id,{completed:complete});
    assert.equal(el('exercise-count').textContent,'Reto 1 de 5');
    assert.ok(el('options').children.length>=2);
    assert.equal(spoken.length,1);
  }
  const map=await bootPage('menu',{completed:completedBefore(3)});
  assert.equal(map.el('map-card-2').href,'/module2');
  assert.equal(map.el('map-card-3').href,'/module3');
  assert.equal(map.el('map-card-4').href,undefined);
});

test('Cuando se completa el último reto del Mundo 1, aparece el paso al Mundo 2',async()=>{
  const {el,saved}=await boot(1,{completed:['m1-e1','m1-e2','m1-e3','m1-e4']});
  await press(option(el,'T'));
  assert.ok(saved().completed.includes('m1-e5'));
  assert.equal(el('finish').href,'/module2');
  assert.match(el('finish').textContent,/Ir al Mundo 2/);
  const menu=await bootPage('menu',{completed:saved().completed});
  assert.equal(menu.el('map-card-2').href,'/module2');
  assert.equal(menu.el('map-card-3').href,undefined);
});

test('Lito lee la instrucción una sola vez al entrar y el botón manual permite repetir',async()=>{
  const {el,spoken}=await boot(1);
  assert.equal(spoken.length,1);
  assert.equal(spoken[0],exercises[0].instruction);
  await press(el('listen'));
  assert.equal(spoken.length,2);
  assert.equal(spoken[1],exercises[0].instruction);
  await press(option(el,'M'));
  await press(el('next'));
  assert.equal(spoken.filter(t=>t===exercises[0].instruction).length,2);
  assert.equal(spoken.filter(t=>t===exercises[1].instruction).length,1);
  await press(el('listen')); // Repetición elegida por el niño, no automática.
  assert.equal(spoken.filter(t=>t===exercises[1].instruction).length,2);
});

test('Lito narra automáticamente cada página nueva y la pregunta, sin repetir al regresar',async()=>{
  const {el,spoken}=await bootPage('stories',{search:'?cuento=luna'});
  assert.equal(spoken.length,1);
  await press(el('story-next'));
  assert.equal(spoken.length,2);
  await press(el('story-prev'));
  assert.equal(spoken.length,2);
  for(let i=0;i<3;i++) await press(el('story-next'));
  assert.equal(spoken.length,4);
  await press(el('story-next'));
  assert.equal(spoken.length,5);
});

test('Marina no cambia a una voz extraña si Azure falla o limita solicitudes',async()=>{
  for(const status of [429,502,503]) {
    const {el,spoken}=await boot(4,{
      completed:completedBefore(4),voiceConfigured:true,azureFailureStatus:status
    });
    assert.equal(spoken.length,0,'no debe pasar a la voz del dispositivo');
    assert.match(el('status').textContent,/Lito no pudo hablar/);
    await press(el('listen'));
    assert.equal(spoken.length,0,'al reintentar debe conservar la voz elegida');
  }
});

test('Mundo 5: detectives de vocales permite completar una palabra',async()=>{
  const {el,saved}=await boot(5,{completed:completedBefore(5)});
  assert.equal(el('number').textContent,'Mundo 5 de 8');
  await press(option(el,'O'));
  assert.ok(saved().completed.includes('m5-e1'));
});

test('Mundo 6: rimas permite fallar, repetir y acertar',async()=>{
  const {el,saved}=await boot(6,{completed:completedBefore(6)});
  await press(option(el,'MESA'));
  assert.equal(el('retry').classList.contains('hide'),false);
  await press(el('retry'));
  await press(option(el,'PATO'));
  assert.ok(saved().completed.includes('m6-e1'));
});

test('Mundo 7: cuenta sílabas y completa palabras',async()=>{
  const {el,saved}=await boot(7,{completed:completedBefore(7)});
  for(const [n,answer] of [[1,'1'],[2,'2'],[3,'3'],[4,'PO'],[5,'MI']]){
    await press(option(el,answer));
    if(n<5) await press(el('next'));
  }
  assert.ok(saved().completed.includes('m7-e5'));
});

test('Mundo 8: ordena palabras para formar oraciones',async()=>{
  const {el,saved}=await boot(8,{completed:completedBefore(8)});
  for(const value of ['La','luna','brilla']) await press(option(el,value));
  assert.equal(el('order').textContent,'Tu oración: La luna brilla');
  assert.ok(saved().completed.includes('m8-e1'));
  assert.equal(el('next').classList.contains('hide'),false);
});

test('El mapa abre el Mundo 5 solo después de completar los primeros cuatro mundos',async()=>{
  const locked=await bootPage('menu',{completed:completedBefore(4)});
  assert.equal(locked.el('map-card-5').href,undefined);
  const available=await bootPage('menu',{completed:completedBefore(5)});
  assert.equal(available.el('map-card-5').href,'/module5');
  assert.equal(available.el('map-card-6').href,undefined);
});

test('La partida guardada de cuatro mundos conserva sus logros y permite seguir en el quinto',async()=>{
  const completed=completedBefore(5);
  const {el,saved}=await boot(5,{completed});
  assert.equal(saved().completed.length,20);
  assert.equal(el('exercise-count').textContent,'Reto 1 de 5');
});
