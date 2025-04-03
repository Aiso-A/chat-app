const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

// Conexión de sockets
io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado');

  socket.on('mensaje', (msg) => {
    console.log('Mensaje recibido:', msg);
    io.emit('mensaje', msg); // Enviar mensaje a todos los clientes
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
