const modules = require("../data/modules");
const sessionStore = require("../store/sessionStore");
const { getInternalExercise } = require("./module.service");
const { buildProgress } = require("../utils/progress");
const HttpError = require("../utils/httpError");

function normalizeAnswer(answer) {
  if (Array.isArray(answer)) {
    return answer.map((item) => String(item).trim().toUpperCase());
  }
  return String(answer).trim().toUpperCase();
}

function isCorrectAnswer(answer, correctAnswer) {
  const normalizedAnswer = normalizeAnswer(answer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (Array.isArray(normalizedCorrect)) {
    return (
      Array.isArray(normalizedAnswer) &&
      normalizedAnswer.length === normalizedCorrect.length &&
      normalizedAnswer.every((item, index) => item === normalizedCorrect[index])
    );
  }

  return !Array.isArray(normalizedAnswer) && normalizedAnswer === normalizedCorrect;
}

function requireSession(sessionId) {
  const session = sessionStore.getSession(sessionId);
  if (!session) throw new HttpError(404, "Sesión no encontrada o reiniciada.");
  return session;
}

function createAnonymousSession() {
  const session = sessionStore.createSession();
  return {
    sessionId: session.id,
    createdAt: session.createdAt,
    message: "Sesión anónima creada. No se solicitaron datos personales."
  };
}

function recordAttempt(sessionId, payload) {
  const session = requireSession(sessionId);
  const exercise = getInternalExercise(payload.moduleId, payload.exerciseId);
  // Las respuestas deben provenir de las opciones presentadas al estudiante.
  // Para ordenar sílabas o palabras se acepta exclusivamente una permutación de todas ellas.
  const answer = normalizeAnswer(payload.answer);
  const options = exercise.options.map(option => normalizeAnswer(option));
  const isOrder = ["order-syllables", "order-words"].includes(exercise.type);
  const valid = isOrder
    ? Array.isArray(answer) && answer.length === options.length &&
      [...answer].sort().join("\u0000") === [...options].sort().join("\u0000")
    : !Array.isArray(answer) && options.includes(answer);
  if (!valid) throw new HttpError(400, "La respuesta no coincide con las opciones del ejercicio.");
  const correct = isCorrectAnswer(payload.answer, exercise.correctAnswer);

  const attempt = {
    id: session.attempts.length + 1,
    moduleId: payload.moduleId,
    exerciseId: payload.exerciseId,
    answer: payload.answer,
    correct,
    createdAt: new Date().toISOString()
  };

  session.attempts.push(attempt);

  if (correct) {
    const list = session.completed[payload.moduleId];
    if (!list.includes(exercise.id)) list.push(exercise.id);
    const n = list.length;
    session.progress[payload.moduleId] = n >= 5 ? 3 : n >= 3 ? 2 : 1;
  }

  return {
    attemptId: attempt.id,
    correct,
    feedback: correct ? exercise.feedback.correct : exercise.feedback.incorrect,
    canRetry: !correct,
    progress: buildProgress(session.progress, session.completed)
  };
}

function getProgress(sessionId) {
  const session = requireSession(sessionId);
  return buildProgress(session.progress, session.completed);
}

function getAdultSummary(sessionId) {
  const session = requireSession(sessionId);
  const progress = buildProgress(session.progress, session.completed);
  const practicedIds = new Set(session.attempts.map((attempt) => attempt.moduleId));
  const practicedModules = modules
    .filter((module) => practicedIds.has(module.id))
    .map((module) => module.title);

  const correctAttempts = session.attempts.filter((attempt) => attempt.correct).length;

  return {
    purpose: "Resumen breve del avance para la persona adulta.",
    practicedModules,
    attempts: session.attempts.length,
    correctAttempts,
    totalStars: progress.totalStars,
    maxStars: progress.maxStars,
    recommendation: progress.recommendation.message,
    privacy: "La sesión es anónima y no almacena nombre, correo, fotografía ni ubicación."
  };
}

function resetSession(sessionId) {
  requireSession(sessionId);
  sessionStore.deleteSession(sessionId);
  return { message: "Sesión eliminada correctamente." };
}

module.exports = {
  createAnonymousSession,
  recordAttempt,
  getProgress,
  getAdultSummary,
  resetSession
};
