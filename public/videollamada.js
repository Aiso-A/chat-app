const socket = io("https://servidorpoi.onrender.com");

const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

//Capturar y enviar el flujo de video/audio
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    document.getElementById("localVideo").srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => console.error("Error al acceder a la cámara:", error));

//Manejo del evento 'track' para recibir video del otro usuario
peerConnection.ontrack = (event) => {
  document.getElementById("remoteVideo").srcObject = event.streams[0];
};

//Manejo de señalización WebRTC
socket.on("offer", async (data) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { target: data.sender, answer });
});

socket.on("answer", async (data) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("ice-candidate", async (data) => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

//Iniciar una llamada
async function startCall(targetId) {
    // Redirigir al usuario a la pantalla de videollamadas
    window.location.href = `/Pantallas/Videollamada.html?id=${targetId}`;

    // Crear la oferta y enviarla
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { sender: socket.id, target: targetId, offer });
}