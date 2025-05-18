const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");

let peerConnection;
let localStream;
const ICE_SERVERS = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const urlParams = new URLSearchParams(window.location.search);
const salaId = urlParams.get("sala");

// Inicializar cámara y micrófono
async function iniciarLlamada() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        socket.emit("unirse-sala", salaId);
    } catch (error) {
        alert("Error accediendo a cámara/micrófono");
        console.error(error);
    }
}

// Crear conexión WebRTC
function crearPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Recibir el stream remoto
    pc.ontrack = (event) => {
        console.log("✅ Stream remoto recibido:", event.streams[0]);
        remoteVideo.srcObject = event.streams[0];
    };

    // Enviar candidatos ICE
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidato", event.candidate, salaId);
        }
    };

    return pc;
}

// Flujo de oferta/respuesta WebRTC
socket.on("usuario-listo", async () => {
    if (!peerConnection) peerConnection = crearPeerConnection();

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("oferta", offer, salaId);
});

socket.on("oferta", async (oferta) => {
    if (!peerConnection) peerConnection = crearPeerConnection();

    await peerConnection.setRemoteDescription(new RTCSessionDescription(oferta));

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("respuesta", answer, salaId);
});

socket.on("respuesta", async (respuesta) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(respuesta));
});

// Corrección: *Asegurar que los candidatos ICE se añaden correctamente*
socket.on("ice-candidato", async (candidato) => {
    try {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidato));
        }
    } catch (e) {
        console.error("❌ Error al añadir candidato ICE", e);
    }
});

iniciarLlamada();