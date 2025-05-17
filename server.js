const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Modelos
const Usuario = require('./models/Usuarios');
const Chat = require('./models/Chat');
const Mensaje = require('./models/Mensaje');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

// Conexión a MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

app.set('trust proxy', 1);
// Configuración del middleware de sesión
const sessionMiddleware = session({
  secret: 'secretoByteTalk',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri }),
    cookie: { secure: process.env.NODE_ENV === 'production' }
});
app.use(sessionMiddleware);

// Compartir la sesión con Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Middlewares
app.use(express.static(path.join(__dirname, 'Pantallas')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware para proteger rutas
function requireLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/Pantallas/LogIn.html');
  }
  next();
}

//Endpoint para la base de datos 
app.get('/verificar-bd', async (req, res) => {
  try {
    const usuarios = await Usuario.find({});
    res.json({
      exito: true,
      cantidad: usuarios.length,
      usuarios: usuarios.map(u => ({
        nombre: u.nombre,
        usuario: u.usuario,
        correo: u.correo 
      }))
    });
  } catch (error) {
    console.error('Error al acceder a la base de datos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al acceder a la base de datos',
      error: error.message
    });
  }
});


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
      return res.redirect('/dashboard');
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
      return res.status(400).json({ exito: false, mensaje: "Ya existe un usuario con ese correo." });
    }

    const nuevoUsuario = new Usuario({ nombreCompleto, nombreUsuario, email, password });
    await nuevoUsuario.save();

    return res.status(201).json({ exito: true, mensaje: "Usuario registrado correctamente." });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    return res.status(500).json({ exito: false, mensaje: "Hubo un error en el servidor." });
  }
});

// Ruta para el dashboard, protegida por el middleware requireLogin
app.get('/dashboard', requireLogin, (req, res) => {
  res.send(`Bienvenido, ${req.session.usuario.nombreUsuario}`);
});

//Obtener al usuario que inició sesión
app.get('/api/usuario', requireLogin, (req, res) => {
  res.json({ exito: true, nombreUsuario: req.session.usuario.nombreUsuario });
});

//Obtener chats del usuario
app.get('/api/chats', requireLogin, async (req, res) => {
  const usuarioId = req.session.usuario.id;
  try {
    const individuales = await Chat.find({ tipo: "individual", miembros: usuarioId });
    const grupales = await Chat.find({ tipo: "grupo", miembros: usuarioId });
    res.json({ individuales, grupales });
  } catch (error) {
    console.error("Error obteniendo chats:", error);
    res.status(500).json({ exito: false, mensaje: "Error al obtener los chats." });
  }
});

//Obtener todos los usuarios excepto el que inició sesión
app.get('/api/usuarios', requireLogin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({ _id: { $ne: req.session.usuario.id } });
    res.json({ usuarios });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ mensaje: "Error al obtener usuarios." });
  }
});

//Crear chat
app.post('/api/chats/crear', requireLogin, async (req, res) => {
  try {
    const nuevoChat = new Chat({ ...req.body, miembros: [req.session.usuario.id, ...req.body.miembros] });
    await nuevoChat.save();
    res.json({ exito: true });
  } catch (error) {
    console.error("Error creando chat:", error);
    res.status(500).json({ exito: false, mensaje: "Hubo un error al crear el chat." });
  }
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error cerrando sesión:', err);
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/Pantallas/LogIn.html');
  });
});


// WebSockets
io.on('connection', (socket) => {
  const sessionData = socket.request.session;
  if (!sessionData || !sessionData.usuario) {
    console.log('🟢 Un usuario no autenticado se conectó');
    return;
  }

  console.log(`🟢 ${sessionData.usuario.nombreUsuario} se conectó`);
  
  socket.on('disconnect', () => {
    console.log(`🔴 ${sessionData.usuario.nombreUsuario} se desconectó`);
  });
});


// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
