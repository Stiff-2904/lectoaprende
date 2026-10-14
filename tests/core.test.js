const test=require('node:test');
const assert=require('node:assert/strict');
const exercises=require('../src/data/exercises');
const stories=require('../public/data/stories.json');
const sessionStore=require('../src/store/sessionStore');
const service=require('../src/services/session.service');

test('Cada módulo tiene cinco ejercicios únicos',()=>{
  assert.equal(exercises.length,20);
  for(let m=1;m<=4;m++){
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
test('Dos cuentos completos con preguntas',()=>{
  assert.equal(stories.length,2);
  assert.ok(stories.every(s=>s.pages.length>=4 && s.answers[s.correctIndex]));
});
