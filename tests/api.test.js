const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const sessionStore = require("../src/store/sessionStore");

test.beforeEach(() => {
  sessionStore.resetStore();
});

test("GET /api/health responde correctamente", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, "LectoAprende API");
});

test("GET /api/modules devuelve los ocho módulos", async () => {
  const response = await request(app).get("/api/modules").expect(200);
  assert.equal(response.body.data.length, 8);
  assert.equal(response.body.data[0].title, "Letras y sonidos");
});

test("GET /api/modules/1/exercises no expone la respuesta correcta", async () => {
  const response = await request(app).get("/api/modules/1/exercises").expect(200);
  assert.equal(response.body.data.length, 5);
  assert.equal(response.body.data[0].id, "m1-e1");
  assert.equal("correctAnswer" in response.body.data[0], false);
});

test("flujo de sesión: crear, responder y consultar progreso", async () => {
  const sessionResponse = await request(app).post("/api/sessions").expect(201);
  const sessionId = sessionResponse.body.data.sessionId;

  const attemptResponse = await request(app)
    .post(`/api/sessions/${sessionId}/attempts`)
    .send({ moduleId: 1, exerciseId: "m1-e1", answer: "M" })
    .expect(201);

  assert.equal(attemptResponse.body.data.correct, true);
  assert.equal(attemptResponse.body.data.progress.totalStars, 1);

  const progressResponse = await request(app)
    .get(`/api/sessions/${sessionId}/progress`)
    .expect(200);

  assert.equal(progressResponse.body.data.modules[0].stars, 1);
});

test("una respuesta incorrecta devuelve pista y permite reintentar", async () => {
  const sessionResponse = await request(app).post("/api/sessions").expect(201);
  const sessionId = sessionResponse.body.data.sessionId;

  const response = await request(app)
    .post(`/api/sessions/${sessionId}/attempts`)
    .send({ moduleId: 2, exerciseId: "m2-e1", answer: "d" })
    .expect(201);

  assert.equal(response.body.data.correct, false);
  assert.equal(response.body.data.canRetry, true);
  assert.equal(response.body.data.progress.totalStars, 0);
});

test("Módulo 4 valida el orden de las sílabas", async () => {
  const sessionResponse = await request(app).post("/api/sessions").expect(201);
  const sessionId = sessionResponse.body.data.sessionId;

  const response = await request(app)
    .post(`/api/sessions/${sessionId}/attempts`)
    .send({ moduleId: 4, exerciseId: "m4-e1", answer: ["ME", "SA"] })
    .expect(201);

  assert.equal(response.body.data.correct, true);
  assert.equal(response.body.data.progress.modules[3].stars, 1);
});

test("GET adult-summary genera un resumen sin datos personales", async () => {
  const sessionResponse = await request(app).post("/api/sessions").expect(201);
  const sessionId = sessionResponse.body.data.sessionId;

  await request(app)
    .post(`/api/sessions/${sessionId}/attempts`)
    .send({ moduleId: 3, exerciseId: "m3-e1", answer: "A" })
    .expect(201);

  const response = await request(app)
    .get(`/api/sessions/${sessionId}/adult-summary`)
    .expect(200);

  assert.deepEqual(response.body.data.practicedModules, ["Construyo sílabas"]);
  assert.equal(response.body.data.totalStars, 1);
  assert.match(response.body.data.privacy, /anónima/i);
});

test("rechaza intentos con datos inválidos", async () => {
  const sessionResponse = await request(app).post("/api/sessions").expect(201);
  const sessionId = sessionResponse.body.data.sessionId;

  await request(app)
    .post(`/api/sessions/${sessionId}/attempts`)
    .send({ moduleId: 9, exerciseId: "x", answer: "A" })
    .expect(400);
});

test("una sesión inexistente responde 404", async () => {
  await request(app)
    .get("/api/sessions/no-existe/progress")
    .expect(404);
});


test('Las estrellas suben al completar 1, 3 y 5 retos distintos; no por repetir el mismo', async () => {
  const {body:{data:{sessionId}}} = await request(app).post('/api/sessions').expect(201);
  const answers=['M','P','S','L','T'];
  for (let i=1;i<=5;i++) {
    const r=await request(app).post(`/api/sessions/${sessionId}/attempts`)
      .send({moduleId:1,exerciseId:`m1-e${i}`,answer:answers[i-1]}).expect(201);
    assert.equal(r.body.data.progress.modules[0].stars, i>=5?3:i>=3?2:1);
  }
  const repeated=await request(app).post(`/api/sessions/${sessionId}/attempts`)
    .send({moduleId:1,exerciseId:'m1-e1',answer:'M'}).expect(201);
  assert.equal(repeated.body.data.progress.modules[0].completedExercises,5);
  assert.equal(repeated.body.data.progress.totalStars,3);
});

test('La página de cuentos y los datos de cuentos están disponibles', async () => {
  await request(app).get('/stories').expect(200);
  const r=await request(app).get('/data/stories.json').expect(200);
  const stories=JSON.parse(r.text);
  assert.equal(stories.length,4);
  assert.equal(stories[0].pages.length,4);
});

test('Las vistas de los ocho mundos cargan el mismo motor de retos',async()=>{
  for(let id=1;id<=8;id++){
    const response=await request(app).get(`/module${id}`).expect(200);
    assert.match(response.headers['content-type'],/html/);
    assert.match(response.text,/id="options"/);
    assert.match(response.text,/id="repeat"/);
  }
});

test('No se permiten respuestas fuera de las opciones ni palabras con sílabas repetidas',async()=>{
  const {body:{data:{sessionId}}}=await request(app).post('/api/sessions').expect(201);
  for(const attempt of [
    {moduleId:1,exerciseId:'m1-e1',answer:'Z'},
    {moduleId:4,exerciseId:'m4-e1',answer:['ME','ME']},
    {moduleId:4,exerciseId:'m4-e1',answer:['ME']}
  ]) await request(app).post(`/api/sessions/${sessionId}/attempts`).send(attempt).expect(400);
  const {body:{data}}=await request(app).get(`/api/sessions/${sessionId}/adult-summary`).expect(200);
  assert.equal(data.attempts,0);
});

test('Completación por API de los ocho mundos entrega veinticuatro estrellas',async()=>{
  const {body:{data:{sessionId}}}=await request(app).post('/api/sessions').expect(201);
  const exercises=require('../src/data/exercises');
  for(const ex of exercises){
    const result=await request(app).post(`/api/sessions/${sessionId}/attempts`)
      .send({moduleId:ex.moduleId,exerciseId:ex.id,answer:ex.correctAnswer}).expect(201);
    assert.equal(result.body.data.correct,true,ex.id);
  }
  const {body:{data}}=await request(app).get(`/api/sessions/${sessionId}/progress`).expect(200);
  assert.equal(data.totalStars,24);
  assert.ok(data.modules.every(m=>m.completedExercises===5&&m.stars===3));
});

test('La API de nuevos mundos no expone respuestas y valida preguntas y oraciones',async()=>{
  for(const id of [5,6,7,8]){
    const {body:{data}}=await request(app).get(`/api/modules/${id}/exercises`).expect(200);
    assert.equal(data.length,5);
    assert.ok(data.every(e=>!Object.hasOwn(e,'correctAnswer')));
  }
  const {body:{data:{sessionId}}}=await request(app).post('/api/sessions').expect(201);
  await request(app).post(`/api/sessions/${sessionId}/attempts`)
    .send({moduleId:8,exerciseId:'m8-e1',answer:['La','La','brilla']}).expect(400);
  const result=await request(app).post(`/api/sessions/${sessionId}/attempts`)
    .send({moduleId:8,exerciseId:'m8-e1',answer:['La','luna','brilla']}).expect(201);
  assert.equal(result.body.data.correct,true);
});

test('Rutas de mundos no reconocidos devuelven 404',async()=>{
  for(const url of ['/module0','/module9','/module10']) await request(app).get(url).expect(404);
});
