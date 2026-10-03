const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "LectoAprende API",
    message: "LectoAprende API funcionando",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
