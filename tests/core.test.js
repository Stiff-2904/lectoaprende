const test=require('node:test');
const assert=require('node:assert/strict');
const exercises=require('../src/data/exercises');
const modules=require('../src/data/modules');
const stories=require('../public/data/stories.json');
const sessionStore=require('../src/store/sessionStore');
const service=require('../src/services/session.service');

test('Cada módulo tiene cinco ejercicios únicos',()=>{
  assert.equal(exercises.length,40);
  assert.equal(modules.length,8);
  for(let m=1;m<=8;m++){
    const list=exercises.filter(e=>e.moduleId===m);
    assert.equal(list.length,5);
    assert.equal(new Set(list.map(e=>e.id)).size,5);
  }
});
test('Todas las soluciones son válidas dentro de las opciones',()=>{
  for(const e of exercises){
    const answer=Array.isArray(e.correctAnswer)?e.correctAnswer:[e.correctAnswer];
    for(const a of answer)assert.ok(e.options.includes(a),`${e.id}: ${a}`);
  }
});
test('Estrellas: 1/3/5 retos distintos, sin premiar repeticiones',()=>{
  sessionStore.resetStore();
  const sid=service.createAnonymousSession().sessionId;
  const expected=['M','P','S','L','T'];
  for(let i=1;i<=5;i++){
    const out=service.recordAttempt(sid,{moduleId:1,exerciseId:`m1-e${i}`,answer:expected[i-1]});
    assert.equal(out.progress.modules[0].stars,i>=5?3:i>=3?2:1);
  }
  service.recordAttempt(sid,{moduleId:1,exerciseId:'m1-e1',answer:'M'});
  const result=service.getProgress(sid);
  assert.equal(result.modules[0].completedExercises,5);
  assert.equal(result.totalStars,3);
});
test('Cuatro cuentos completos con preguntas',()=>{
  assert.equal(stories.length,4);
  assert.ok(stories.every(s=>s.pages.length>=4 && s.answers[s.correctIndex]));
});

test('Todos los módulos resuelven sus cinco retos, acumulan veinticuatro estrellas y permiten repeticiones',()=>{
  sessionStore.resetStore();
  const sid=service.createAnonymousSession().sessionId;
  for(let moduleId=1;moduleId<=8;moduleId++){
    const list=exercises.filter(ex=>ex.moduleId===moduleId);
    for(const ex of list){
      const result=service.recordAttempt(sid,{moduleId,exerciseId:ex.id,answer:ex.correctAnswer});
      assert.equal(result.correct,true,ex.id);
      assert.equal(result.canRetry,false);
    }
    const progress=service.getProgress(sid);
    assert.equal(progress.modules[moduleId-1].completedExercises,5);
    assert.equal(progress.modules[moduleId-1].stars,3);
  }
  const done=service.getProgress(sid);
  assert.equal(done.totalStars,24);
  assert.equal(done.maxStars,24);
  assert.equal(done.recommendation.moduleId,null);
  const repeated=service.recordAttempt(sid,{moduleId:4,exerciseId:'m4-e1',answer:['ME','SA']});
  assert.equal(repeated.progress.totalStars,24);
  assert.equal(repeated.progress.modules[3].completedExercises,5);
});

test('La API de intentos rechaza opciones ajenas, arreglos incompletos y sílabas duplicadas',()=>{
  sessionStore.resetStore();
  const sid=service.createAnonymousSession().sessionId;
  for(const payload of [
    {moduleId:1,exerciseId:'m1-e1',answer:'Z'},
    {moduleId:3,exerciseId:'m3-e1',answer:['A']},
    {moduleId:4,exerciseId:'m4-e1',answer:['ME']},
    {moduleId:4,exerciseId:'m4-e1',answer:['ME','ME']},
    {moduleId:4,exerciseId:'m4-e1',answer:'ME'}
  ]) assert.throws(()=>service.recordAttempt(sid,payload),{status:400});
  assert.equal(service.getAdultSummary(sid).attempts,0);
});

test('Cada uno de los ocho módulos permite fallar y luego acertar',()=>{
  sessionStore.resetStore();
  const sid=service.createAnonymousSession().sessionId;
  for(let moduleId=1;moduleId<=8;moduleId++){
    const ex=exercises.find(e=>e.moduleId===moduleId);
    const wrong=['order-syllables','order-words'].includes(ex.type)?[...ex.correctAnswer].reverse():ex.options.find(o=>o!==ex.correctAnswer);
    const retry=service.recordAttempt(sid,{moduleId,exerciseId:ex.id,answer:wrong});
    assert.equal(retry.correct,false);
    assert.equal(retry.canRetry,true);
    const win=service.recordAttempt(sid,{moduleId,exerciseId:ex.id,answer:ex.correctAnswer});
    assert.equal(win.correct,true);
    assert.equal(win.progress.modules[moduleId-1].completedExercises,1);
  }
});

test('El nuevo reto de ordenar oraciones valida listas completas sin duplicados',()=>{
  sessionStore.resetStore();
  const sid=service.createAnonymousSession().sessionId;
  const exercise=exercises.find(e=>e.id==='m8-e1');
  for(const answer of ["La",["La","La","brilla"],["La","luna"],["La","luna","palabra"]])
    assert.throws(()=>service.recordAttempt(sid,{moduleId:8,exerciseId:exercise.id,answer}),{status:400});
  const wrong=service.recordAttempt(sid,{moduleId:8,exerciseId:exercise.id,answer:["brilla","luna","La"]});
  assert.equal(wrong.correct,false);
  const right=service.recordAttempt(sid,{moduleId:8,exerciseId:exercise.id,answer:exercise.correctAnswer});
  assert.equal(right.correct,true);
});

test('Cuatro mundos nuevos incorporan mecánicas variadas',()=>{
  const styles=new Set(exercises.filter(e=>e.moduleId>=5).map(e=>e.type));
  for(const type of ['fill-vowel','rhyme-match','count-syllables','complete-word','order-words'])
    assert.ok(styles.has(type),`Falta actividad ${type}`);
  for(const s of stories){
    assert.ok(new Set(s.answers).size===s.answers.length);
    assert.ok(s.pages.every(p=>p.text && p.scene));
  }
});


test('Las instrucciones del Mundo 4 se leen con sílabas en minúsculas para una voz natural', () => {
  const world4 = exercises.filter(exercise => exercise.moduleId === 4);
  assert.equal(world4.length, 5);
  for(const exercise of world4) {
    assert.match(exercise.instruction, /Ordena las sílabas .* para formar la palabra /);
    assert.ok(!/[A-Z]{2,}/.test(exercise.instruction));
  }
});
