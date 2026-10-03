const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const moduleRoutes = require("./routes/module.routes");
const sessionRoutes = require("./routes/session.routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "50kb" }));

app.get("/", (req, res) => {
  res.json({
    name: "LectoAprende API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      modules: "/api/modules",
      sessions: "/api/sessions"
    }
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
