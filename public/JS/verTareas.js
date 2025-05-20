// archivo: public/JS/verTareas.js
fetch('/api/tareas')
  .then(res => res.json())
  .then(tareas => {
    const contenedor = document.getElementById('listaTareas');

    if (tareas.length === 0) {
      contenedor.innerHTML = '<p>No hay tareas registradas.</p>';
      return;
    }

    tareas.forEach(tarea => {
      const div = document.createElement('div');
      div.innerHTML = `
        <h3>${tarea.titulo}</h3>
        <p><strong>Descripción:</strong> ${tarea.descripcion || 'N/A'}</p>
        <p><strong>Fecha entrega:</strong> ${new Date(tarea.fecha_entrega).toLocaleString()}</p>
        <p><strong>Puntos:</strong> ${tarea.puntos ?? 'N/A'}</p>
        <hr>
      `;
      contenedor.appendChild(div);
    });
  })
  .catch(err => {
    console.error('Error al cargar tareas:', err);
    document.getElementById('listaTareas').innerText = 'Error al cargar tareas.';
  });
