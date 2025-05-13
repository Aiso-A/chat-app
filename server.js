const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const Usuario = require('./models/Usuarios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

const uri = process.env.MONGO_URI;

// Conectar a MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Middlewares
app.use(express.static(path.join(__dirname, 'Pantallas')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });
    if (usuario && await usuario.comparePassword(password)) {
      return res.redirect('/Pantallas/Chats.html');
    } else {
      return res.send('<script>alert("Credenciales inválidas"); window.location.href="/Pantallas/LogIn.html";</script>');
    }
  } catch (err) {
    console.error('❌ Error en login:', err);
    return res.status(500).send('<script>alert("Error en el servidor."); window.location.href="/Pantallas/LogIn.html";</script>');
  }
});

// REGISTRO
app.post('/registro', async (req, res) => {
  const { nombreCompleto, nombreUsuario, email, password } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.send('<script>alert("Ya existe un usuario con ese correo"); window.location.href="/Pantallas/LogIn.html";</script>');
    }

    const nuevoUsuario = new Usuario({ nombreCompleto, nombreUsuario, email, password });
    await nuevoUsuario.save();

    return res.send('<script>alert("Usuario registrado correctamente"); window.location.href="/Pantallas/LogIn.html";</script>');
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    return res.status(500).send('<script>alert("Hubo un error en el servidor."); window.location.href="/Pantallas/LogIn.html";</script>');
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('🟢 Un usuario se conectó');

  socket.on('disconnect', () => {
    console.log('🔴 Un usuario se desconectó');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});