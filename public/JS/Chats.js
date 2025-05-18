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