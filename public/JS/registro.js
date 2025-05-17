document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevenir envío tradicional del formulario

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

    const resultado = await response.json(); // Leer la respuesta JSON

    if (resultado.exito) {
      alert(resultado.mensaje); // Mostrar mensaje al usuario
      window.location.href = '/Pantallas/Dashboard.html'; // Redirigir al dashboard
    } else {
      alert(resultado.mensaje); // Mostrar mensaje de error
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Hubo un error. Intenta nuevamente.');
  }
});