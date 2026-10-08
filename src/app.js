const express = require("express");
const path = require('path');
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

// Servir archivos estáticos (CSS, imágenes, JS del cliente)
app.use(express.static(path.join(__dirname, '../public')));

// --- RUTAS PARA LAS VISTAS HTML SEPARADAS ---
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

app.get("/menu", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/menu.html'));
});

app.get("/module1", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/module1.html'));
});

app.get("/progress", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/progress.html'));
});

app.get("/adults", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/adult.html'));
});

// --- RUTAS DE LA API BACKEND ---
app.use("/api/health", healthRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;