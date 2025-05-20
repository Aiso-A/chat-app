const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Modelos
const Usuario = require('./models/Usuarios');
const Chat = require('./models/Chat');
const Mensaje = require('./models/Mensaje');
// Tareas agregado
const Tareas = require('./models/Tareas');
const TareasE = require('./models/Tareas-E');
const Counter = require('./models/Contador');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

// Conexión a MongoDB
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
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri })
}));

// Middleware para proteger rutas
function requireLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/Pantallas/LogIn.html');
  }
  next();
}

const mongoose = require('mongoose');
const Usuario = require('./models/Usuario'); // Asegúrate de que este archivo existe

app.get('/verificar-bd', async (req, res) => {
  try {
    const usuarios = await Usuario.find({});
    res.json({
      exito: true,
      cantidad: usuarios.length,
      usuarios: usuarios.map(u => ({
        nombre: u.nombre,
        usuario: u.usuario,
        correo: u.correo // 👈 Aquí añadimos el correo
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

// Página principal de chats
app.get('/chats', requireLogin, async (req, res) => {
  try {
    const html = fs.readFileSync(path.join(__dirname, 'Pantallas', 'Chats.html'), 'utf8');
    const htmlConUsuario = html.replace('{{usuario}}', req.session.usuario.nombreUsuario);
    res.send(htmlConUsuario);
  } catch (err) {
    console.error('❌ Error al cargar Chats.html:', err);
    res.status(500).send('Error interno');
  }
});

// Obtener lista de usuarios
app.get('/api/usuarios', requireLogin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({ _id: { $ne: req.session.usuario.id } }, 'nombreUsuario nombreCompleto');
    res.json(usuarios);
  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Crear chat individual
app.post('/api/chats/individual', requireLogin, async (req, res) => {
  const userId = req.session.usuario.id;
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

// Crear chat grupal
app.post('/api/chats/grupo', requireLogin, async (req, res) => {
  const userId = req.session.usuario.id;
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

// Guardar mensaje
app.post('/api/mensajes', requireLogin, async (req, res) => {
  const userId = req.session.usuario.id;
  const { chatId, texto } = req.body;

  try {
    const mensaje = new Mensaje({ chat: chatId, sender: userId, texto });
    await mensaje.save();

    await Chat.findByIdAndUpdate(chatId, { $push: { mensajes: mensaje._id } });

    // Emitir mensaje a los sockets conectados
    io.emit('mensajeRecibido', mensaje);

    res.json(mensaje);
  } catch (err) {
    console.error('Error al guardar mensaje:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

//Creación de tareas
app.post('/crear-tarea', async (req, res) => {
  const { titulo, descripcion, fecha_entrega, grupoID, puntos } = req.body;

  try {
    // Validación básica
    if (!titulo || !fecha_entrega) {
      return res.send('<script>alert("Título y fecha de entrega son obligatorios."); window.location.href="/Pantallas/CrearTarea.html";</script>');
    }

    // Crear y guardar tarea
    const nuevaTarea = new Tarea({
      titulo,
      descripcion,
      fecha_entrega,
      grupoID,
      puntos
    });

    await nuevaTarea.save();

    return res.send('<script>alert("Tarea creada exitosamente."); window.location.href="/Pantallas/CrearTarea.html";</script>');
  } catch (err) {
    console.error('❌ Error al crear la tarea:', err);
    return res.status(500).send('<script>alert("Error en el servidor al crear la tarea."); window.location.href="/Pantallas/CrearTarea.html";</script>');
  }
});

//Obtener lista de tareas
app.get('/api/tareas', async (req, res) => {
  try {
    const tareas = await Tarea.find();
    res.json(tareas);
  } catch (err) {
    console.error('❌ Error al obtener tareas:', err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});


// Obtener mensajes de un chat
app.get('/api/mensajes/:chatId', requireLogin, async (req, res) => {
  try {
    const mensajes = await Mensaje.find({ chat: req.params.chatId }).populate('sender', 'nombreUsuario');
    res.json(mensajes);
  } catch (err) {
    console.error('Error obteniendo mensajes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// WebSockets
io.on('connection', (socket) => {
  console.log('🟢 Un usuario se conectó');

  socket.on('mensajeNuevo', (mensaje) => {
    io.emit('mensajeRecibido', mensaje);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Un usuario se desconectó');
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
