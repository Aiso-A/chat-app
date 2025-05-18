const socket = io();
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");

let peerConnection;
let localStream;
const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
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

socket.on("usuario-listo", async () => {
    peerConnection = crearPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("oferta", offer, salaId);
});

socket.on("oferta", async (oferta) => {
    peerConnection = crearPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    await peerConnection.setRemoteDescription(new RTCSessionDescription(oferta));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("respuesta", answer, salaId);
});

socket.on("respuesta", async (respuesta) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(respuesta));
});

socket.on("ice-candidato", async (candidato) => {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidato));
    } catch (e) {
        console.error("Error al añadir candidato ICE", e);
    }
});

function crearPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidato", event.candidate, salaId);
        }
    };

    return pc;
}

iniciarLlamada();