const express = require('express');
const exercises = require('../data/exercises');
const stories = require('../../public/data/stories.json');

const router = express.Router();
const VOICE_NAME = 'es-MX-MarinaNeural';
const VOICE_LABEL = 'Lito · Marina (voz infantil, español latinoamericano)';
const PREVIEW_TEXT = '¡Hola, soy Lito! Vamos a aprender jugando. ¡Tú puedes!';
const ALLOWED_TEXTS = new Set([
  PREVIEW_TEXT,
  '¡Hola, amiguito! Soy Lito y te acompaño en esta aventura. ¡Vamos a jugar!',
  '¡Qué bien lo hiciste! Ganaste una nueva estrella.',
  '¡Terminaste esta aventura! Estoy muy orgulloso de tu esfuerzo.',
  '¡Bienvenido a nuestros cuentos! Escucha y lee a tu ritmo.',
  ...stories.flatMap(story => [story.question, story.correctMessage, story.tryMessage, ...story.pages.map(page => page.text)]),
  ...exercises.flatMap(exercise => [
    exercise.instruction,
    exercise.feedback.correct,
    exercise.feedback.incorrect
  ])
].map(normalizeText));
const CACHE_LIMIT = 80;
const cache = new Map();
const requestLog = new Map();

function normalizeText(text) {
  return text.replace(/[🌟💡🎉✨]/gu, '').replace(/\s+/g, ' ').trim();
}

function isConfigured() {
  return Boolean(process.env.AZURE_SPEECH_KEY && /^[a-z][a-z0-9]{1,30}$/i.test(process.env.AZURE_SPEECH_REGION || ''));
}

function xmlEscape(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function setCache(key, value) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
}

function overLimit(ip) {
  const now = Date.now();
  // Un máximo de 20 solicitudes no almacenadas por minuto y por conexión.
  // Además, sólo se permiten los textos educativos incluidos en el proyecto.
  if (requestLog.size > 2000) {
    for (const [key, record] of requestLog) {
      if (now - record.since >= 60_000) requestLog.delete(key);
    }
  }
  let record = requestLog.get(ip);
  if (!record || now - record.since >= 60_000) {
    record = { since: now, count: 0 };
    requestLog.set(ip, record);
  }
  record.count += 1;
  return record.count > 20;
}

router.get('/status', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ data: {
    configured: isConfigured(),
    voice: VOICE_NAME,
    label: VOICE_LABEL,
    provider: 'Microsoft Azure Speech',
    fallback: 'Voz en español del navegador'
  } });
});

router.post('/speak', async (req, res) => {
  const input = req.body && req.body.text;
  if (typeof input !== 'string' || input.length > 400 || !input.trim()) {
    return res.status(400).json({ message: 'Seleccione un mensaje de audio válido.' });
  }

  const text = normalizeText(input);
  if (!ALLOWED_TEXTS.has(text)) {
    return res.status(400).json({ message: 'Este mensaje no pertenece a las actividades de LectoAprende.' });
  }
  if (!isConfigured()) {
    return res.status(503).json({ message: 'La voz infantil aún no está configurada. Se utilizará la voz del navegador.' });
  }
  if (cache.has(text)) {
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'private, max-age=3600');
    return res.send(cache.get(text));
  }
  if (overLimit(req.ip || 'unknown')) {
    return res.status(429).json({ message: 'Se alcanzó el límite temporal de audio. Inténtelo más tarde.' });
  }

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-MX"><voice name="${VOICE_NAME}"><prosody rate="-6%" pitch="+4%">${xmlEscape(text)}</prosody></voice></speak>`;
  try {
    const region = process.env.AZURE_SPEECH_REGION;
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LectoAprende-educacion'
      },
      body: ssml,
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      console.error(`Azure Speech respondió ${response.status}`);
      return res.status(502).json({ message: 'La voz infantil no está disponible temporalmente.' });
    }
    const data = Buffer.from(await response.arrayBuffer());
    if (!data.length || data.length > 2_000_000) {
      return res.status(502).json({ message: 'No fue posible generar este audio.' });
    }
    setCache(text, data);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'private, max-age=3600');
    return res.send(data);
  } catch (error) {
    console.error('No se pudo reproducir la voz de Lito:', error.message);
    return res.status(502).json({ message: 'El servicio de voz no respondió.' });
  }
});

module.exports = router;
