const socket = io("https://servidorpoi.onrender.com");

const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

// 🔹 Capturar y enviar el flujo de video/audio 🔹
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    document.getElementById("localVideo").srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => console.error("Error al acceder a la cámara:", error));

// 🔹 Manejo del evento 'track' para recibir video del otro usuario 🔹
peerConnection.ontrack = (event) => {
  console.log("📡 Recibiendo stream remoto");
  if (event.streams.length > 0) {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  }
};

// 🔹 Enviar candidatos ICE para conectar correctamente 🔹
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("ice-candidate", { target: targetId, candidate: event.candidate });
  }
};

// 🔹 Manejo de señalización WebRTC 🔹
socket.on("offer", async (data) => {
  console.log("📡 Recibiendo oferta de:", data.sender);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { target: data.sender, answer });
});

socket.on("answer", async (data) => {
  console.log("📡 Recibiendo respuesta de:", data.target);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("ice-candidate", async (data) => {
    console.log("📡 Recibiendo candidato ICE");
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// 🔹 Iniciar una llamada 🔹
async function startCall(targetId) {
    // 🔹 Verificar que hay un usuario destino antes de iniciar la llamada
    if (!targetId) {
        console.error("❌ Error: targetId no definido.");
        return;
    }

    // Redirigir al usuario a la pantalla de videollamadas
    window.location.href = `/Pantallas/Videollamada.html?id=${targetId}`;

    // Crear la oferta y enviarla
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { sender: socket.id, target: targetId, offer });
}