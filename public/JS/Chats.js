// Mostrar formulario de nuevo chat
document.getElementById('nuevoChatBtn').addEventListener('click', () => {
  const section = document.getElementById('nuevoChatSection');
  section.style.display = section.style.display === 'none' ? 'block' : 'none';
});

// Cargar usuarios diferentes al actual
async function cargarUsuarios() {
  try {
    const res = await fetch('/api/usuarios');
    const usuarios = await res.json();

    const miCorreo = sessionStorage.getItem('correo');
    document.getElementById('miCorreo').value = miCorreo;

    const select = document.getElementById('listaUsuarios');
    select.innerHTML = '';

    usuarios.forEach(u => {
      if (u.email !== miCorreo) {
        const option = document.createElement('option');
        option.value = u.email;
        option.textContent = `${u.nombreUsuario} (${u.email})`;
        select.appendChild(option);
      }
    });
  } catch (err) {
    console.error('Error al cargar usuarios:', err);
  }
}

async function enviarArchivo() {
    const archivo = document.getElementById("file-input").files[0];
    if (!archivo) return;

    const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oYXRndXFhdm1paXl0cHRldG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjE0NjcsImV4cCI6MjA2MzEzNzQ2N30.jeBEQmxvW0lBGcaOVlDTXraEHAFMEngyC2vyeLxqwtgY"; 
    const bucketUrl = "https://ohatguqavmiiytptetmy.supabase.co/storage/v1/object/public/chat-archivos";

    const formData = new FormData();
    formData.append("file", archivo);

    const respuesta = await fetch(`${bucketUrl}/${archivo.name}`, {
        method: "PUT", 
        headers: { 
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": archivo.type
        },
        body: archivo
    });

    if (respuesta.ok) {
        const urlArchivo = `${bucketUrl}/${archivo.name}`;
        
        // Agregar el `chatId` al mensaje antes de enviarlo
        const urlParams = new URLSearchParams(window.location.search);
        const chatId = urlParams.get('id');

        socket.emit("mensaje", { tipo: "archivo", contenido: urlArchivo, chatId: chatId });
        console.log("📂 Archivo subido:", urlArchivo);
    } else {
        console.error("Error al subir archivo:", respuesta.statusText);
    }
}


document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarios();

  // Cerrar sesión
  document.getElementById('cerrarSesion').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/LogIn.html';
  });

  // Enviar formulario de nuevo chat
  document.getElementById('formNuevoChat').addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario1 = document.getElementById('miCorreo').value;
    const usuario2 = document.getElementById('listaUsuarios').value;

    if (usuario1 && usuario2) {
      // Simulación: redirige con parámetros en la URL
      window.location.href = `/Pantallas/Chat.html?id=${usuario2}&tipo=individual`;
    }
  });
});