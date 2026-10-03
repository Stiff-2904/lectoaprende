const moduleService = require("../services/module.service");

function listModules(req, res) {
  res.json({ data: moduleService.getModules() });
}

function getModule(req, res) {
  res.json({ data: moduleService.getModuleById(Number(req.params.moduleId)) });
}

function listExercises(req, res) {
  res.json({ data: moduleService.getExercisesByModule(Number(req.params.moduleId)) });
}

function getExercise(req, res) {
  res.json({
    data: moduleService.getExercise(Number(req.params.moduleId), req.params.exerciseId)
  });
}

module.exports = {
  listModules,
  getModule,
  listExercises,
  getExercise
};
