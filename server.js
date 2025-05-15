const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static('public'));
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para obtener la lista de usuarios (simulada desde JSON)
app.get('/api/usuarios', (req, res) => {
  fs.readFile('./data/usuarios.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo usuarios:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    try {
      const usuarios = JSON.parse(data);
      res.json(usuarios);
    } catch (parseErr) {
      console.error('Error parseando usuarios:', parseErr);
      res.status(500).json({ error: 'Error al procesar datos' });
    }
  });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { correo, contraseña } = req.body;

  fs.readFile('./data/usuarios.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo usuarios:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const usuarios = JSON.parse(data);
    const usuario = usuarios.find(u => u.correo === correo && u.contraseña === contraseña);

    if (usuario) {
      res.json({ success: true, redirect: '/Chats.html', usuario });
    } else {
      res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
    }
  });
});

// Lógica de conexión con Socket.io
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  // Unirse a una sala (chat individual o grupal)
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    console.log(`Usuario se unió a la sala: ${roomId}`);
  });

  // Envío de mensajes
  socket.on('message', ({ roomId, message }) => {
    io.to(roomId).emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
