const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

const sample = '¡Hola, soy Lito! Vamos a aprender jugando. ¡Tú puedes!';

test('El estado del servicio no expone ninguna clave de Azure', async () => {
  const response = await request(app).get('/api/voice/status').expect(200);
  assert.equal(response.body.data.voice, 'es-MX-MarinaNeural');
  assert.equal(response.body.data.provider, 'Microsoft Azure Speech');
  assert.ok(!JSON.stringify(response.body).includes('AZURE_SPEECH_KEY'));
});

test('No permite sintetizar texto arbitrario ni contenido enviado por niños', async () => {
  const response = await request(app).post('/api/voice/speak')
    .send({ text: 'Texto no incluido en LectoAprende' }).expect(400);
  assert.match(response.body.message, /no pertenece/i);
});

test('Si no hay clave, devuelve 503 para activar el respaldo del navegador', async () => {
  const prevKey = process.env.AZURE_SPEECH_KEY;
  const prevRegion = process.env.AZURE_SPEECH_REGION;
  delete process.env.AZURE_SPEECH_KEY;
  delete process.env.AZURE_SPEECH_REGION;
  try {
    const response = await request(app).post('/api/voice/speak')
      .send({ text: sample }).expect(503);
    assert.match(response.body.message, /no está configurada/i);
  } finally {
    if (prevKey === undefined) delete process.env.AZURE_SPEECH_KEY;
    else process.env.AZURE_SPEECH_KEY = prevKey;
    if (prevRegion === undefined) delete process.env.AZURE_SPEECH_REGION;
    else process.env.AZURE_SPEECH_REGION = prevRegion;
  }
});

test('Con Azure activado entrega MP3 y envía la voz infantil sin divulgar credenciales', async () => {
  const oldFetch = global.fetch;
  const oldKey = process.env.AZURE_SPEECH_KEY;
  const oldRegion = process.env.AZURE_SPEECH_REGION;
  process.env.AZURE_SPEECH_KEY = 'clave_de_prueba_local';
  process.env.AZURE_SPEECH_REGION = 'eastus';
  const sampleMp3 = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]);
  let requestCount = 0;
  global.fetch = async (url, options) => {
    requestCount++;
    assert.equal(url, 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1');
    assert.equal(options.headers['Ocp-Apim-Subscription-Key'], 'clave_de_prueba_local');
    assert.match(options.body, /es-MX-MarinaNeural/);
    return new Response(sampleMp3, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
  };
  try {
    const response = await request(app).post('/api/voice/speak')
      .send({ text: sample }).expect(200);
    assert.match(response.headers['content-type'], /audio\/mpeg/);
    assert.deepEqual(response.body, sampleMp3);
    const second = await request(app).post('/api/voice/speak').send({ text: sample }).expect(200);
    assert.deepEqual(second.body, sampleMp3);
    assert.equal(requestCount, 1, 'debe utilizar la caché en los mensajes repetidos');
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.AZURE_SPEECH_KEY;
    else process.env.AZURE_SPEECH_KEY = oldKey;
    if (oldRegion === undefined) delete process.env.AZURE_SPEECH_REGION;
    else process.env.AZURE_SPEECH_REGION = oldRegion;
  }
});
