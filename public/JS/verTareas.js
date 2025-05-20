// archivo: public/JS/verTareas.js
fetch('/api/tareas')
  .then(res => res.json())
  .then(tareas => {
    const contenedor = document.getElementById('mis-Tareas');

    if (tareas.length === 0) {
      contenedor.innerHTML = '<p>No hay tareas registradas.</p>';
      return;
    }

    tareas.forEach(tarea => {
      const li = document.createElement('li');
      li.innerHTML = `
        <h3>${tarea.titulo}</h3>
        <p><strong>Fecha entrega:</strong> ${new Date(tarea.fecha_entrega).toLocaleString()}</p>
        <hr>
      `;
      contenedor.appendChild(li);
    });
  })
  .catch(err => {
    console.error('Error al cargar tareas:', err);
    document.getElementById('mis-Tareas').innerText = 'Error al cargar tareas.';
  });
