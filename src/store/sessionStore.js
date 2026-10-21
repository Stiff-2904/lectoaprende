const modules = require("../data/modules");
const { randomUUID } = require("node:crypto");

const sessions = new Map();

function newProgress() {
  return Object.fromEntries(modules.map(module => [module.id, 0]));
}

function createSession() {
  const session = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    progress: newProgress(),
    attempts: [],
    completed: Object.fromEntries(modules.map(module => [module.id, []]))
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
