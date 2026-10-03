const { randomUUID } = require("node:crypto");

const sessions = new Map();

function newProgress() {
  return { 1: 0, 2: 0, 3: 0, 4: 0 };
}

function createSession() {
  const session = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    progress: newProgress(),
    attempts: []
  };

  sessions.set(session.id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id) ?? null;
}

function deleteSession(id) {
  return sessions.delete(id);
}

function resetStore() {
  sessions.clear();
}

module.exports = {
  createSession,
  getSession,
  deleteSession,
  resetStore
};
