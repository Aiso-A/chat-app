const socket = io("https://servidorpoi.onrender.com");

//Configuración de WebRTC
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

let activeTargetId; //Guardar el ID del usuario destino

//Capturar y enviar el flujo de video/audio
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    document.getElementById("localVideo").srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => console.error("❌ Error al acceder a la cámara:", error));

//Manejo del evento 'track' para recibir video del otro usuario
peerConnection.ontrack = (event) => {
  console.log("📡 Recibiendo stream remoto:", event.streams);
  if (event.streams.length > 0) {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  } else {
    console.error("❌ No se recibió ningún stream remoto.");
  }
};

//Enviar candidatos ICE para conectar correctamente
peerConnection.onicecandidate = (event) => {
  if (event.candidate && activeTargetId) {
    console.log("📡 Enviando candidato ICE:", event.candidate);
    socket.emit("ice-candidate", { target: activeTargetId, candidate: event.candidate });
  } else {
    console.error("❌ No se pudo enviar el candidato ICE.");
  }
};

//Manejo de señalización WebRTC
socket.on("offer", async (data) => {
  console.log("📡 Recibiendo oferta de:", data.sender);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("📡 Enviando respuesta...");
  socket.emit("answer", { target: data.sender, answer });
});

socket.on("answer", async (data) => {
  console.log("📡 Recibiendo respuesta de:", data.target);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("ice-candidate", async (data) => {
  console.log("📡 Recibiendo candidato ICE:", data.candidate);
  await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

//Iniciar una llamada
async function startCall(targetId) {
    if (!targetId || targetId.trim() === "") {
        console.error("❌ Error: targetId no definido.");
        return;
    }

    activeTargetId = targetId; //Guardamos el targetId globalmente

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { sender: socket.id, target: targetId, offer });

    window.location.href = `/Pantallas/Videollamada.html?id=${targetId}`;
}