const modules = require("../data/modules");
const exercises = require("../data/exercises");
const HttpError = require("../utils/httpError");

function sanitizeExercise(exercise) {
  const { correctAnswer, feedback, ...publicExercise } = exercise;
  return publicExercise;
}

function getModules() {
  return modules.map((module) => ({
    ...module,
    exerciseCount: exercises.filter((exercise) => exercise.moduleId === module.id).length
  }));
}

function getModuleById(moduleId) {
  const module = modules.find((item) => item.id === moduleId);
  if (!module) throw new HttpError(404, "Módulo no encontrado.");
  return {
    ...module,
    exerciseCount: exercises.filter((exercise) => exercise.moduleId === module.id).length
  };
}

function getExercisesByModule(moduleId) {
  getModuleById(moduleId);
  return exercises
    .filter((exercise) => exercise.moduleId === moduleId)
    .map(sanitizeExercise);
}

function getExercise(moduleId, exerciseId) {
  getModuleById(moduleId);
  const exercise = exercises.find(
    (item) => item.moduleId === moduleId && item.id === exerciseId
  );

  if (!exercise) throw new HttpError(404, "Ejercicio no encontrado.");
  return sanitizeExercise(exercise);
}

function getInternalExercise(moduleId, exerciseId) {
  const exercise = exercises.find(
    (item) => item.moduleId === moduleId && item.id === exerciseId
  );

  if (!exercise) throw new HttpError(404, "Ejercicio no encontrado.");
  return exercise;
}

module.exports = {
  getModules,
  getModuleById,
  getExercisesByModule,
  getExercise,
  getInternalExercise
};
