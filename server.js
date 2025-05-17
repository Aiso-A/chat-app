const cookieParser = require('cookie-parser');
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
mongoose.connect(uri)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// Middlewares
app.use(express.static(path.join(__dirname, 'Pantallas')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'lax',
    secure: false,
    path: '/' 
  }
}));


///////Endpoints///////


// Obtener lista de usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, 'nombreUsuario email avatar _id');
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener usuarios');
  }
});

// Página principal (login)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'LogIn.html'));
});

// Obtener usuario actual desde la sesión
app.get('/api/usuario-actual', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json(req.session.usuario);
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

// Obtener todos los chats del usuario
app.get('/api/chats', async (req, res) => {
  try {
    if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado' });

    
    const chats = await Chat.find({ usuarios: req.session.usuario._id }).populate('usuarios', 'nombreUsuario avatar');
    
    
    const individuales = chats.filter(chat => chat.tipo === 'individual').map(chat => {
      
      const otroUsuario = chat.usuarios.find(u => u._id.toString() !== req.session.usuario._id.toString());
      return {
        _id: chat._id,
        nombre: otroUsuario?.nombreUsuario || "Usuario desconocido",
        avatar: otroUsuario?.avatar || "/default-avatar.png"
      };
    });

    const grupales = chats.filter(chat => chat.tipo === 'grupo');

    res.json({ individuales, grupales });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar los chats' });
  }
});

// Crear chat individual
app.post('/api/chats/individual', async (req, res) => {
  try {
    const { receptorId } = req.body;
    if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado' });

    const nuevoChat = new Chat({
      tipo: 'individual',
      usuarios: [req.session.usuario._id, receptorId]
    });

    await nuevoChat.save();

    io.emit('nuevoChat');

    res.json({ mensaje: 'Chat individual creado', chatId: nuevoChat._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear chat individual' });
  }
});

// Crear chat grupal
app.post('/api/chats/grupo', async (req, res) => {
  try {
    const { nombre, usuarios } = req.body;
    if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado' });

    if (!usuarios.includes(req.session.usuario._id.toString())) {
      usuarios.push(req.session.usuario._id.toString());
    }

    const nuevoGrupo = new Chat({
      tipo: 'grupo',
      nombre,
      usuarios
    });

    await nuevoGrupo.save();

    io.emit('nuevoChat');

    res.json({ mensaje: 'Grupo creado', chatId: nuevoGrupo._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// Enviar mensaje en un chat
app.post('/api/enviar-mensaje', async (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado' });
  const { chatId, texto } = req.body;
  try {
    const nuevoMensaje = new Mensaje({
      chat: chatId,
      sender: req.session.usuario._id,
      texto
    });
    await nuevoMensaje.save();
    const mensajeConInfo = await Mensaje.findById(nuevoMensaje._id).populate('sender', 'nombreUsuario');
    // Emitir el mensaje a todos los sockets que estén en la sala (es decir, en ese chat)
    io.to(chatId).emit('nuevoMensaje', mensajeConInfo);
    res.json(mensajeConInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// Obtener información de un chat (para header)
// Para chats individuales, devuelve datos del otro usuario; para grupales, el nombre del grupo.
app.get('/api/chat-info', async (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const { id, tipo } = req.query;
  try {
    const chat = await Chat.findById(id).populate('usuarios', 'nombreUsuario avatar');
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }
    if (tipo === 'individual') {
      const otroUsuario = chat.usuarios.find(u => u._id.toString() !== req.session.usuario._id.toString());
      if (!otroUsuario) return res.status(404).json({ error: 'Usuario receptor no encontrado' });
      return res.json({ 
        nombre: otroUsuario.nombreUsuario, 
        avatar: otroUsuario.avatar 
      });
    } else {
      return res.json({ nombre: chat.nombre });
    }
  } catch (error) {
    console.error('Error al obtener info del chat:', error);
    res.status(500).json({ error: 'Error interno al obtener la información del chat' });
  }
});

// Obtener el historial de mensajes del chat
app.get('/api/mensajes', async (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const { chatId } = req.query;
  try {
    const mensajes = await Mensaje.find({ chat: chatId })
      .populate('sender', 'nombreUsuario')
      .sort({ fecha: 1 }); // Orden ascendente (los mensajes se muestran desde el más antiguo al más reciente)
    res.json(mensajes);
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
    res.status(500).json({ error: 'Error interno al obtener los mensajes' });
  }
});

//Socket.io//
 
const usuariosConectados = new Map();
 
io.on('connection', (socket) => {
  console.log('🟢 Un usuario se conectó');
 
  // Permitir que un socket se una a una sala específica (para recibir mensajes de un chat)
  socket.on('joinRoom', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} se unió a la sala ${chatId}`);
  });
 
  // Registrar usuario conectado con verificación para evitar desconexión innecesaria
  socket.on('usuarioConectado', (nombreUsuario) => {
    console.log(`🟢 Intentando conectar a ${nombreUsuario}...`);
 
    if (usuariosConectados.has(nombreUsuario)) {
      const socketIdAnterior = usuariosConectados.get(nombreUsuario);
 
      // Verificar si el socket anterior aún está activo antes de cerrarlo
      if (io.sockets.sockets.get(socketIdAnterior)) {
        io.to(socketIdAnterior).emit('duplicado');
        io.sockets.sockets.get(socketIdAnterior).disconnect();
        console.log(`🔁 Usuario ${nombreUsuario} inició sesión en otro lugar. Cerrando la sesión anterior.`);
      }
    }
 
    usuariosConectados.set(nombreUsuario, socket.id);
    console.log(`✅ ${nombreUsuario} está conectado (${socket.id})`);
  });
 
  // Detectar desconexión y verificar antes de eliminar al usuario
  socket.on('disconnect', () => {
    setTimeout(() => {
      for (const [nombreUsuario, id] of usuariosConectados.entries()) {
        if (id === socket.id) {
          // Esperar para verificar si el usuario realmente se ha desconectado
          if (!usuariosConectados.has(nombreUsuario)) {
            usuariosConectados.delete(nombreUsuario);
            console.log(`🔴 Confirmado: ${nombreUsuario} se desconectó completamente.`);
          } else {
            console.log(`✅ Usuario aún activo, no se eliminará.`);
          }
          break;
        }
      }
    }, 5000); // Esperar 5 segundos antes de confirmar desconexión
  });
 
  // Mantener la conexión activa para evitar que el servidor cierre la sesión por inactividad
  socket.on('mantenerConexion', (nombreUsuario) => {
    console.log(`💡 Refrescando conexión con: ${nombreUsuario}`);
    usuariosConectados.set(nombreUsuario, socket.id); // Refrescar conexión activa
  });
});
 

// Middleware catch-all
app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'public', 'LogIn.html'));
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
