const modules = require("../data/modules");

function buildProgress(progress) {
  const moduleProgress = modules.map((module) => ({
    moduleId: module.id,
    title: module.title,
    stars: progress[module.id] ?? 0,
    maxStars: 3
  }));

  const totalStars = moduleProgress.reduce((sum, item) => sum + item.stars, 0);
  const maxStars = moduleProgress.reduce((sum, item) => sum + item.maxStars, 0);

  const incomplete = moduleProgress.filter((item) => item.stars < item.maxStars);
  const weakest = incomplete.sort((a, b) => a.stars - b.stars || a.moduleId - b.moduleId)[0];

  return {
    modules: moduleProgress,
    totalStars,
    maxStars,
    recommendation: weakest
      ? {
          moduleId: weakest.moduleId,
          title: weakest.title,
          message: `Practica un poco más: ${weakest.title}.`
        }
      : {
          moduleId: null,
          title: null,
          message: "¡Excelente! Has completado los cuatro módulos."
        }
  };
}

module.exports = { buildProgress };
