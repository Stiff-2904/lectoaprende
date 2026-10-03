const { z } = require("zod");
const sessionService = require("../services/session.service");
const HttpError = require("../utils/httpError");

const attemptSchema = z.object({
  moduleId: z.coerce.number().int().min(1).max(4),
  exerciseId: z.string().min(1),
  answer: z.union([
    z.string().min(1),
    z.array(z.string().min(1)).min(1)
  ])
});

function createSession(req, res) {
  res.status(201).json({ data: sessionService.createAnonymousSession() });
}

function addAttempt(req, res) {
  const parsed = attemptSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Datos del intento inválidos.", parsed.error.flatten());
  }

  res.status(201).json({
    data: sessionService.recordAttempt(req.params.sessionId, parsed.data)
  });
}

function getProgress(req, res) {
  res.json({ data: sessionService.getProgress(req.params.sessionId) });
}

function getAdultSummary(req, res) {
  res.json({ data: sessionService.getAdultSummary(req.params.sessionId) });
}

function deleteSession(req, res) {
  res.json({ data: sessionService.resetSession(req.params.sessionId) });
}

module.exports = {
  createSession,
  addAttempt,
  getProgress,
  getAdultSummary,
  deleteSession
};
