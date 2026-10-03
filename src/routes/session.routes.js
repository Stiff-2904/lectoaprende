const express = require("express");
const controller = require("../controllers/session.controller");

const router = express.Router();

router.post("/", controller.createSession);
router.post("/:sessionId/attempts", controller.addAttempt);
router.get("/:sessionId/progress", controller.getProgress);
router.get("/:sessionId/adult-summary", controller.getAdultSummary);
router.delete("/:sessionId", controller.deleteSession);

module.exports = router;
