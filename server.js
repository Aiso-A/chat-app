const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();

// Models
const Usuario = require('./models/Usuarios');
const Chat = require('./models/Chat');
const Mensaje = require('./models/Mensaje');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

// Conectar a MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// Middlewares
app.use(express.static(path.join(__dirname, 'Pantallas')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'secretoByteTalk',
  resave: false,
  saveUninitialized: false
}));

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (usuario && await usuario.comparePassword(password)) {
      req.session.usuario = {
        id: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email
      };
      return res.redirect('/chats');
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

// RUTA /chats (Renderiza el HTML con el nombre del usuario en el sidebar)
app.get('/chats', async (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/Pantallas/LogIn.html');
  }

  try {
    const html = fs.readFileSync(path.join(__dirname, 'Pantallas', 'Chats.html'), 'utf8');
    const htmlConUsuario = html.replace('{{usuario}}', req.session.usuario.nombreUsuario);
    res.send(htmlConUsuario);
  } catch (err) {
    console.error('❌ Error al cargar Chats.html:', err);
    res.status(500).send('Error interno');
  }
});

//API para obtener usuarios disponibles (para crear chats)
app.get('/api/usuarios', async (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado' });

  try {
    const usuarios = await Usuario.find({ _id: { $ne: req.session.usuario.id } }, 'nombreUsuario nombreCompleto');
    res.json(usuarios);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

//Crear chat individual
app.post('/api/chats/individual', async (req, res) => {
  const userId = req.session.usuario?.id;
  const { receptorId } = req.body;

  try {
    const existente = await Chat.findOne({
      tipo: 'individual',
      participantes: { $all: [userId, receptorId], $size: 2 }
    });

    if (existente) return res.json({ chatId: existente._id });

    const nuevoChat = new Chat({ tipo: 'individual', participantes: [userId, receptorId] });
    await nuevoChat.save();
    res.json({ chatId: nuevoChat._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando chat' });
  }
});

//Crear chat grupal
app.post('/api/chats/grupo', async (req, res) => {
  const userId = req.session.usuario?.id;
  const { nombre, usuarios } = req.body;

  try {
    if (!nombre || !usuarios || usuarios.length < 2) {
      return res.status(400).json({ error: 'Datos incompletos para crear grupo' });
    }

    const nuevoChat = new Chat({
      tipo: 'grupo',
      nombre,
      participantes: [userId, ...usuarios]
    });

    await nuevoChat.save();
    res.json({ chatId: nuevoChat._id });
  } catch (err) {
    console.error('Error creando chat grupal:', err);
    res.status(500).json({ error: 'Error creando grupo' });
  }
});

//Enviar mensaje
app.post('/api/mensajes', async (req, res) => {
  const userId = req.session.usuario?.id;
  const { chatId, texto } = req.body;

  try {
    const mensaje = new Mensaje({ chat: chatId, sender: userId, texto });
    await mensaje.save();

    await Chat.findByIdAndUpdate(chatId, { $push: { mensajes: mensaje._id } });

    res.json(mensaje);
  } catch (err) {
    console.error('Error al guardar mensaje:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('🟢 Un usuario se conectó');
  socket.on('disconnect', () => {
    console.log('🔴 Un usuario se desconectó');
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(` Servidor corriendo en puerto ${PORT}`);
});
