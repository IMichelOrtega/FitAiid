// backend/src/server.js
require("dotenv").config();
const cors = require("cors");
const app = require("./app");

// Activar CORS globalmente
app.use(cors());

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Manejo de errores no capturados
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🗂️  Ambiente: ${NODE_ENV}`);
  console.log(`📅 Iniciado: ${new Date().toLocaleString()}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔴 SIGTERM recibido. Cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});
