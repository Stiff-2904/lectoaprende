const express = require("express");
const controller = require("../controllers/module.controller");

const router = express.Router();

router.get("/", controller.listModules);
router.get("/:moduleId", controller.getModule);
router.get("/:moduleId/exercises", controller.listExercises);
router.get("/:moduleId/exercises/:exerciseId", controller.getExercise);

module.exports = router;
