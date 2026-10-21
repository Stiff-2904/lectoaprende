require("dotenv").config();

const app = require("./app");

// Hosting como Render asigna PORT; 0.0.0.0 permite conexiones externas.
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LectoAprende listo en el puerto ${PORT}`);
});
