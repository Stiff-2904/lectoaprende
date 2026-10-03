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

test("GET /api/modules devuelve los cuatro módulos", async () => {
  const response = await request(app).get("/api/modules").expect(200);
  assert.equal(response.body.data.length, 4);
  assert.equal(response.body.data[0].title, "Letras y sonidos");
});

test("GET /api/modules/1/exercises no expone la respuesta correcta", async () => {
  const response = await request(app).get("/api/modules/1/exercises").expect(200);
  assert.equal(response.body.data.length, 1);
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
  assert.equal(attemptResponse.body.data.progress.totalStars, 3);

  const progressResponse = await request(app)
    .get(`/api/sessions/${sessionId}/progress`)
    .expect(200);

  assert.equal(progressResponse.body.data.modules[0].stars, 3);
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
  assert.equal(response.body.data.progress.modules[3].stars, 3);
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
  assert.equal(response.body.data.totalStars, 3);
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
