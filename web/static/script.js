const API_BASE = '/api';

// ── Navegación ──────────────────────────────────────────────

function cambiarSeccion(nombre) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const seccion = document.getElementById(`seccion-${nombre}`);
  if (seccion) seccion.classList.add('activa');

  const btn = document.querySelector(`[data-seccion="${nombre}"]`);
  if (btn) btn.classList.add('active');

  if (nombre === 'estadisticas') cargarEstadisticas();
  if (nombre === 'inicio') cargarUltimosUsuarios();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => cambiarSeccion(btn.dataset.seccion));
});

// ── Helpers ─────────────────────────────────────────────────

function mostrarResultado(elemento, mensaje, exito) {
  elemento.innerHTML = `<div class="msg ${exito ? 'msg-exito' : 'msg-error'}">${mensaje}</div>`;
}

function renderUsuarioCard(u) {
  const activo = u.activo
    ? '<span class="badge badge-activo">Activo</span>'
    : '<span class="badge badge-inactivo">Inactivo</span>';
  return `
    <div class="usuario-card">
      <h4>${escapar(u.nombre)}</h4>
      <p>📧 ${escapar(u.email)}</p>
      ${u.edad != null ? `<p>🎂 ${u.edad} años</p>` : ''}
      ${u.ciudad ? `<p>🏙️ ${escapar(u.ciudad)}</p>` : ''}
      ${u.pais ? `<p>🌎 ${escapar(u.pais)}</p>` : ''}
      ${u.telefono ? `<p>📞 ${escapar(u.telefono)}</p>` : ''}
      ${activo}
    </div>`;
}

function renderListaUsuarios(usuarios, contenedor) {
  if (!usuarios.length) {
    contenedor.innerHTML = '<div class="resultado-lista"><p>Sin resultados</p></div>';
    return;
  }
  const items = usuarios.map(u =>
    `<div class="item"><strong>${escapar(u.nombre)}</strong> — ${escapar(u.email)}` +
    `${u.ciudad ? ` · ${escapar(u.ciudad)}` : ''}` +
    `${u.edad != null ? ` · ${u.edad} años` : ''}</div>`
  ).join('');
  contenedor.innerHTML =
    `<div class="resultado-lista">` +
    `<div class="contador">${usuarios.length} resultado(s)</div>${items}</div>`;
}

function escapar(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ── Inicio ──────────────────────────────────────────────────

async function cargarUltimosUsuarios() {
  const grid = document.getElementById('grid-usuarios');
  grid.innerHTML = '<div class="loading">Cargando usuarios</div>';
  try {
    const data = await apiFetch(`${API_BASE}/usuarios?limite=6&offset=0`);
    if (!data.datos.length) {
      grid.innerHTML = '<p style="color:#fff">No hay usuarios registrados</p>';
      return;
    }
    grid.innerHTML = data.datos.map(renderUsuarioCard).join('');
  } catch (err) {
    grid.innerHTML = `<p style="color:#fff">Error: ${escapar(err.message)}</p>`;
  }
}

// ── Búsquedas ───────────────────────────────────────────────

async function buscarEmail() {
  const email = document.getElementById('input-email').value.trim();
  const el = document.getElementById('resultado-email');
  if (!email) return mostrarResultado(el, 'Ingresa un email', false);

  el.innerHTML = '<div class="loading" style="padding:12px">Buscando</div>';
  try {
    const data = await apiFetch(`${API_BASE}/search/email?email=${encodeURIComponent(email)}`);
    el.innerHTML = renderUsuarioCard(data.datos);
  } catch (err) {
    mostrarResultado(el, err.message, false);
  }
}

async function buscarNombre() {
  const nombre = document.getElementById('input-nombre').value.trim();
  const el = document.getElementById('resultado-nombre');
  if (!nombre) return mostrarResultado(el, 'Ingresa un nombre', false);

  el.innerHTML = '<div class="loading" style="padding:12px">Buscando</div>';
  try {
    const data = await apiFetch(
      `${API_BASE}/search/nombre?nombre=${encodeURIComponent(nombre)}&limite=50`
    );
    renderListaUsuarios(data.datos, el);
  } catch (err) {
    mostrarResultado(el, err.message, false);
  }
}

async function buscarCiudad() {
  const ciudad = document.getElementById('input-ciudad').value.trim();
  const el = document.getElementById('resultado-ciudad');
  if (!ciudad) return mostrarResultado(el, 'Ingresa una ciudad', false);

  el.innerHTML = '<div class="loading" style="padding:12px">Buscando</div>';
  try {
    const data = await apiFetch(
      `${API_BASE}/search/ciudad?ciudad=${encodeURIComponent(ciudad)}&limite=50`
    );
    renderListaUsuarios(data.datos, el);
  } catch (err) {
    mostrarResultado(el, err.message, false);
  }
}

async function buscarEdad() {
  const min = document.getElementById('input-edad-min').value;
  const max = document.getElementById('input-edad-max').value;
  const el = document.getElementById('resultado-edad');

  if (min === '' || max === '') return mostrarResultado(el, 'Ingresa rango de edad', false);
  if (Number(min) > Number(max)) return mostrarResultado(el, 'Edad mínima > máxima', false);

  el.innerHTML = '<div class="loading" style="padding:12px">Buscando</div>';
  try {
    const data = await apiFetch(
      `${API_BASE}/search/edad?edad_minima=${min}&edad_maxima=${max}`
    );
    renderListaUsuarios(data.datos, el);
  } catch (err) {
    mostrarResultado(el, err.message, false);
  }
}

// ── Crear ───────────────────────────────────────────────────

async function crearUsuario(event) {
  event.preventDefault();
  const el = document.getElementById('resultado-crear');

  const nombre = document.getElementById('crear-nombre').value.trim();
  const email = document.getElementById('crear-email').value.trim();
  if (!nombre || !email) return mostrarResultado(el, 'Nombre y email requeridos', false);

  const body = { nombre, email };
  const edad = document.getElementById('crear-edad').value;
  const ciudad = document.getElementById('crear-ciudad').value.trim();
  const pais = document.getElementById('crear-pais').value.trim();
  const telefono = document.getElementById('crear-telefono').value.trim();

  if (edad !== '') body.edad = Number(edad);
  if (ciudad) body.ciudad = ciudad;
  if (pais) body.pais = pais;
  if (telefono) body.telefono = telefono;

  try {
    const data = await apiFetch(`${API_BASE}/usuarios`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    mostrarResultado(el, `✅ ${data.mensaje}: ${data.datos.nombre}`, true);
    document.getElementById('form-crear').reset();
  } catch (err) {
    mostrarResultado(el, err.message, false);
  }
}

// ── Estadísticas ────────────────────────────────────────────

async function cargarEstadisticas() {
  const grid = document.getElementById('grid-stats');
  grid.innerHTML = '<div class="loading">Cargando estadísticas</div>';
  try {
    const data = await apiFetch(`${API_BASE}/estadisticas`);
    const s = data.datos;
    const cards = [
      { icon: '👥', num: s.total, label: 'Total usuarios' },
      { icon: '✅', num: s.activos, label: 'Activos' },
      { icon: '🎂', num: s.edad_promedio ?? '—', label: 'Edad promedio' },
      { icon: '🏙️', num: s.ciudades_unicas, label: 'Ciudades únicas' },
      { icon: '🌎', num: s.paises_unicos, label: 'Países únicos' },
    ];
    grid.innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="stat-icon">${c.icon}</div>
        <div class="stat-num">${c.num}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join('');
  } catch (err) {
    grid.innerHTML = `<p style="color:#fff">Error: ${escapar(err.message)}</p>`;
  }
}

// ── Init ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('seccion-inicio')?.classList.contains('activa')) {
    cargarUltimosUsuarios();
  }
});
