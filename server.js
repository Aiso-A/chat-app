const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const usuarios = require('./usuarios');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const usuarioValido = usuarios.find(u => u.email === email && u.password === password);

  if (usuarioValido) {
    return res.send(`
      <script>
        sessionStorage.setItem('correo', '${usuarioValido.email}');
        window.location.href = '/Pantallas/Chats.html';
      </script>
    `);
  } else {
    return res.send(`<script>alert('Credenciales inválidas'); window.location.href='/Pantallas/LogIn.html';</script>`);
  }
});

// API para obtener usuarios (solo email y username)
app.get('/api/usuarios', (req, res) => {
  const lista = usuarios.map(u => ({ email: u.email, username: u.username }));
  res.json(lista);
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Un usuario se conectó');
  socket.on('disconnect', () => {
    console.log('Un usuario se desconectó');
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});