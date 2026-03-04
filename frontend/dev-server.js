#!/usr/bin/env node
/**
 * Simple desarrollo server para servir el frontend desde la carpeta /frontend/
 * 
 * Uso: node dev-server.js
 * Luego abre: http://localhost:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9000;
const FRONTEND_DIR = __dirname;

const server = http.createServer((req, res) => {
  // Procesar la ruta
  let filePath = path.join(FRONTEND_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Prevenir directory traversal attacks
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Si es una carpeta y no tiene index.html, devolver error
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Leer el archivo
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err}`);
      }
      return;
    }

    // Determinar content-type
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.webp': 'image/webp',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Headers CORS para desarrollo
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🚀 Frontend Dev Server - INICIADO                       ║
╚══════════════════════════════════════════════════════════╝

📍 URL: http://localhost:${PORT}

✅ Características:
   • Sirve desde: ${FRONTEND_DIR}
   • Service Workers: ✅ Soportados
   • CORS: ✅ Habilitado para desarrollo
   • Cache: ✅ Deshabilitado (desarrollo)

📝 Próximos pasos:
   1. Abre http://localhost:${PORT} en tu navegador
   2. Los Service Workers deberían registrarse correctamente
   3. Las notificaciones deberían funcionar

🛑 Para detener el servidor: Ctrl + C
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
    console.error('Intenta: netstat -ano | findstr :' + PORT);
  } else {
    console.error('❌ Error del servidor:', err);
  }
  process.exit(1);
});
