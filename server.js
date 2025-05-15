const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
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
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 día
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Página principal (login)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'LogIn.html'));
});

// Obtener el usuario actual
app.get('/api/usuario', async (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const usuario = await Usuario.findById(req.session.usuario._id).select('nombreUsuario');
  res.json(usuario);
});

// Obtener todos los usuarios (excepto el actual)
app.get('/api/usuarios', async (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const usuarios = await Usuario.find({ _id: { $ne: req.session.usuario._id } }).select('nombreUsuario');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener todos los chats del usuario
app.get('/api/chats', async (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const usuarioId = req.session.usuario._id;
    const chats = await Chat.find({ participantes: usuarioId }).populate('participantes', 'nombreUsuario');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los chats' });
  }
});

// Inicio de sesión
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const usuario = await Usuario.findOne({ email });

  if (!usuario || !(await usuario.comparePassword(password))) {
    return res.send('<script>alert("Credenciales inválidas"); window.location.href="/";</script>');
  }

  req.session.usuario = {
    _id: usuario._id,
    nombreUsuario: usuario.nombreUsuario
  };

  res.redirect('/Pantallas/Chats.html');
});

// Registro
app.post('/registro', async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    await nuevoUsuario.save();

    req.session.usuario = {
      _id: nuevoUsuario._id,
      nombreUsuario: nuevoUsuario.nombreUsuario
    };

    res.redirect('/Pantallas/Chats.html');
  } catch (err) {
    console.error(err);
    res.send('<script>alert("Error al registrarse. Intenta con otro correo o nombre de usuario."); window.location.href="/";</script>');
  }
});

// WebSocket: usuarios conectados
const usuariosConectados = new Map();

io.on('connection', (socket) => {
  console.log('🟢 Un usuario se conectó');

  socket.on('usuarioConectado', (nombreUsuario) => {
    if (usuariosConectados.has(nombreUsuario)) {
      const socketIdAnterior = usuariosConectados.get(nombreUsuario);
      io.to(socketIdAnterior).emit('duplicado');
      io.sockets.sockets.get(socketIdAnterior)?.disconnect();
      console.log(`🔁 Usuario ${nombreUsuario} inició sesión en otro lugar. Cerrando la sesión anterior.`);
    }

    usuariosConectados.set(nombreUsuario, socket.id);
    console.log(`✅ ${nombreUsuario} está conectado (${socket.id})`);
  });

  socket.on('disconnect', () => {
    for (const [nombreUsuario, id] of usuariosConectados.entries()) {
      if (id === socket.id) {
        usuariosConectados.delete(nombreUsuario);
        console.log(`🔴 ${nombreUsuario} se desconectó`);
        break;
      }
    }
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
