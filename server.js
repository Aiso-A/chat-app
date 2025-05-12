const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http);

const users = [
  {email:'user@example.com', password:'12345', username:'UzuiPOI' },
  {email:'filo@gmail.com', password:'7894', username:'FiloLia' },
  {email:'inui@gmail.com', password:'4561', username:'InuiKo' },
  {email:'gomez@gmail.com', password:'asdfg', username:'GomezCito' },
  {email:'ride@gmail.com', password:'zxcvb', username:'TakeRide' }
];

// Servir archivos estáticos desde el frontend"
app.use(express.static(path.join(__dirname, 'public')));

//Esto es la ruta principal, redirige al login si es que es necesario
app.get('/', (req, res) =>{
  res.sendFile(path.join(__dirname, 'public', 'LogIn.html'))
})

// Lógica del chat usando Socket.io
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); //Reenvía a todos el mensaje
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

//  Para la escucha en el puerto asignado por Render o por defecto en local
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});