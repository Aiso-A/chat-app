// public/JS/registro.js
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevenir que el formulario se envíe de forma tradicional

  const formData = new FormData(this);
  const datos = {
    nombreCompleto: formData.get('nombreCompleto'),
    nombreUsuario: formData.get('nombreUsuario'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  try {
    const response = await fetch('/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });

    if (response.ok) {
      // Guardar el correo en sessionStorage antes de redirigir
      sessionStorage.setItem('correo', datos.email);
      window.location.href = '/Pantallas/Chats.html'; // Redirigir a la página de chats
    } else {
      alert('Error al registrar el usuario. Inténtalo nuevamente.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Hubo un error. Intenta nuevamente.');
  }
});