
const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config(); // Cargar variables de entorno desde .env

const Usuario = require('./models/Usuarios'); // Asegúrate de tener el modelo Usuario

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose.connect(uri)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// Middlewares para archivos estáticos
app.use(express.static(path.join(__dirname, 'Pantallas')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Sirve CSS/JS desde raíz

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta para procesar el login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const usuarioValido = usuarios.find(
    (u) => u.email === email && u.password === password
  );

  if (usuarioValido) {
    return res.redirect('/Pantallas/Chats.html');
  } else {
    return res.send('<script>alert("Credenciales inválidas"); window.location.href="/LogIn.html";</script>');
  }
});

// WebSockets
io.on('connection', (socket) => {
  console.log('🟢 Un usuario se conectó');

  socket.on('disconnect', () => {
    console.log('🔴 Un usuario se desconectó');
  });
});

// Ruta de registro de nuevo usuario
app.post('/register', async (req, res) => {
  const { nombreCompleto, usuario, email, password } = req.body;

  try {
   
    const usuarioExistente = await Usuario.findOne({ email });

    if (usuarioExistente) {
      return res.send('<script>alert("Ya existe un usuario con ese correo"); window.location.href="/Pantallas/LogIn.html";</script>');
    }

    // Crear y guardar el nuevo usuario
    const nuevoUsuario = new Usuario({ nombreCompleto, usuario, email, password });
    await nuevoUsuario.save();

    
    return res.send('<script>alert("Usuario registrado correctamente"); window.location.href="/Pantallas/LogIn.html";</script>');
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    return res.status(500).send('<script>alert("Hubo un error en el servidor, intenta nuevamente."); window.location.href="/Pantallas/LogIn.html";</script>');
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});