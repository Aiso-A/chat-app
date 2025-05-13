const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const usuarios = require('./usuarios');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Middlewares para archivos estáticos
app.use(express.static(path.join(__dirname, 'Pantallas')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // sirve CSS/JS desde raíz

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta para procesar el login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const usuarioValido = usuarios.find(
    (u) => u.email === email && u.password === password
  );

  if (usuarioValido) {
    return res.redirect('/Chats.html');
  } else {
    return res.send(`<script>alert('Credenciales inválidas'); window.location.href='/LogIn.html';</script>`);
  }
});

// WebSockets
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