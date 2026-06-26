// Voice control — Whisper + TTS + comandos naturales

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let micStream = null;
let micInitPromise = null;

let micPermisoConcedido = false;

const MIC_IDLE = '<span class="microfono-icon">🎤</span><span class="microfono-text">Presiona y habla</span>';
const MIC_RECORDING = '<span class="microfono-icon">⏹️</span><span class="microfono-text">Soltar para detener</span>';

function $(id) {
  return document.getElementById(id);
}

function getMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
}

async function inicializarMicrofono() {
  if (micInitPromise) return micInitPromise;

  micInitPromise = (async () => {
    const btn = $('btn-microfono');
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Tu navegador no soporta grabación de audio');
    }

    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getMimeType();
    const options = mimeType ? { mimeType } : undefined;
    mediaRecorder = new MediaRecorder(micStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => procesarAudio();

    if (btn) {
      btn.disabled = false;
      btn.title = 'Mantén presionado para hablar';
    }
    micPermisoConcedido = true;
    actualizarEstadoMic('ok');
  })().catch((error) => {
    micInitPromise = null;
    micPermisoConcedido = false;
    console.error('Micrófono:', error);
    const btn = $('btn-microfono');
    if (btn) {
      btn.disabled = true;
      btn.title = 'Permiso de micrófono requerido';
    }
    actualizarEstadoMic('denegado');
    throw error;
  });

  return micInitPromise;
}

async function iniciarGrabacion(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!micPermisoConcedido) {
    mostrarModalPermiso();
    return;
  }

  try {
    await inicializarMicrofono();
  } catch {
    mostrarModalPermiso('denegado');
    return;
  }

  if (!mediaRecorder || mediaRecorder.state === 'recording') return;

  audioChunks = [];
  mediaRecorder.start();
  isRecording = true;

  const btn = $('btn-microfono');
  const grabandoDiv = $('grabando');
  btn.classList.add('recording');
  btn.innerHTML = MIC_RECORDING;
  grabandoDiv.classList.remove('hidden');
  $('audio-player-area').classList.add('hidden');
  $('resultado-voz-area').innerHTML = '';
  $('texto-escuchado').textContent = 'Tú dices: Escuchando...';
}

function detenerGrabacion(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!isRecording || !mediaRecorder || mediaRecorder.state !== 'recording') return;

  mediaRecorder.stop();
  isRecording = false;

  const btn = $('btn-microfono');
  btn.classList.remove('recording');
  btn.innerHTML = MIC_IDLE;
  $('grabando').classList.add('hidden');
}

async function procesarAudio() {
  const respuestaVozDiv = $('respuesta-voz');
  const textoEscuchado = $('texto-escuchado');
  respuestaVozDiv.classList.remove('hidden');
  textoEscuchado.textContent = 'Tú dices: Procesando...';

  try {
    const mimeType = mediaRecorder?.mimeType || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const audioBlob = new Blob(audioChunks, { type: mimeType });

    if (audioBlob.size < 1000) {
      mostrarErrorVoz('Grabación muy corta. Mantén presionado y habla más tiempo.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, `audio.${ext}`);

    const transcriptionResponse = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });
    const transcriptionData = await transcriptionResponse.json();

    if (!transcriptionData.exito) {
      mostrarErrorVoz(transcriptionData.error || 'Error al transcribir');
      return;
    }

    const textoUsuario = transcriptionData.texto;
    textoEscuchado.textContent = `Tú dices: "${textoUsuario}"`;
    await procesarComandoVoz(textoUsuario);
  } catch (error) {
    mostrarErrorVoz(error.message);
  }
}

async function procesarComandoVoz(texto) {
  try {
    const comandoResponse = await fetch('/api/voice/procesar-comando', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comando: texto }),
    });
    const comandoData = await comandoResponse.json();

    if (!comandoData.exito) {
      mostrarErrorVoz(comandoData.error || 'Comando no interpretado');
      return;
    }

    const { tipo_comando: tipo, parametros } = comandoData;
    let resultado;

    switch (tipo) {
      case 'buscar_ciudad':
        resultado = await fetch(
          `${API_BASE}/search/ciudad?ciudad=${encodeURIComponent(parametros.ciudad)}&limite=10`
        );
        break;
      case 'buscar_nombre':
        resultado = await fetch(
          `${API_BASE}/search/nombre?nombre=${encodeURIComponent(parametros.nombre)}&limite=10`
        );
        break;
      case 'buscar_edad':
        resultado = await fetch(
          `${API_BASE}/search/edad?edad_minima=${parametros.edad_minima}&edad_maxima=${parametros.edad_maxima}`
        );
        break;
      case 'buscar_email':
        resultado = await fetch(
          `${API_BASE}/search/email?email=${encodeURIComponent(parametros.email)}`
        );
        break;
      case 'crear_usuario':
        resultado = await fetch(`${API_BASE}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parametros),
        });
        break;
      case 'estadisticas':
        resultado = await fetch(`${API_BASE}/estadisticas`);
        break;
      case 'eliminar_usuario':
        resultado = await fetch(`${API_BASE}/usuarios/${parametros.usuario_id}`, {
          method: 'DELETE',
        });
        break;
      case 'listar':
        resultado = await fetch(
          `${API_BASE}/usuarios?limite=${parametros.limite || 10}&offset=0`
        );
        break;
      default:
        mostrarErrorVoz(`Comando no reconocido: ${tipo}`);
        return;
    }

    const resultadoData = await resultado.json();
    const respuestaTexto = generarRespuestaTexto(tipo, resultadoData, parametros);
    await sintetizarYReproducir(respuestaTexto);
    mostrarResultadoVoz(resultadoData, tipo);
  } catch (error) {
    mostrarErrorVoz(error.message);
  }
}

function generarRespuestaTexto(tipo, datos, parametros) {
  if (!datos.exito) {
    return datos.error || 'La operación no se pudo completar';
  }

  const lista = Array.isArray(datos.datos) ? datos.datos : (datos.datos ? [datos.datos] : []);
  const nombres = lista.slice(0, 5).map(u => u.nombre).join(', ');

  switch (tipo) {
    case 'buscar_ciudad':
      return `Encontré ${lista.length} usuarios en ${parametros.ciudad}. ${nombres}`;
    case 'buscar_nombre':
      return `Encontré ${lista.length} usuarios: ${nombres}`;
    case 'buscar_edad':
      return `Encontré ${lista.length} usuarios entre ${parametros.edad_minima} y ${parametros.edad_maxima} años. ${nombres}`;
    case 'buscar_email':
      return lista.length
        ? `Encontré a ${lista[0].nombre} con email ${lista[0].email}`
        : 'No encontré ese email';
    case 'crear_usuario':
      return `Usuario ${parametros.nombre} creado con email ${parametros.email}`;
    case 'estadisticas': {
      const s = datos.datos;
      return `Hay ${s.total} usuarios en total. Edad promedio ${s.edad_promedio} años. ${s.ciudades_unicas} ciudades y ${s.paises_unicos} países.`;
    }
    case 'eliminar_usuario':
      return `Usuario ${parametros.usuario_id} eliminado`;
    case 'listar':
      return `Listando ${lista.length} usuarios. ${nombres}`;
    default:
      return datos.mensaje || 'Operación completada';
  }
}

async function sintetizarYReproducir(texto) {
  try {
    const response = await fetch('/api/voice/sintetizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    const data = await response.json();

    if (data.exito) {
      const audioRespuesta = $('audio-respuesta');
      audioRespuesta.src = data.audio_url;
      $('audio-player-area').classList.remove('hidden');
      $('respuesta-voz').classList.add('hidden');
      await audioRespuesta.play();
    } else {
      mostrarErrorVoz(data.error || 'Error al sintetizar voz');
    }
  } catch (error) {
    mostrarErrorVoz(error.message);
  }
}

function mostrarResultadoVoz(datos, tipo) {
  $('respuesta-voz').classList.add('hidden');
  const ok = datos.exito;
  let detalle = '';

  if (Array.isArray(datos.datos)) {
    detalle = datos.datos.map(u => `${u.nombre} (${u.email})`).join('<br>');
  } else if (datos.datos && typeof datos.datos === 'object') {
    detalle = `${datos.datos.nombre || ''} — ${datos.datos.email || JSON.stringify(datos.datos)}`;
  } else if (datos.mensaje) {
    detalle = datos.mensaje;
  }

  $('resultado-voz-area').innerHTML =
    `<div class="resultado-item ${ok ? 'success' : 'error'}">` +
    `${ok ? '✅' : '❌'} ${tipo.replace(/_/g, ' ')}<br>${detalle || ''}</div>`;
}

function mostrarErrorVoz(mensaje) {
  $('respuesta-voz').classList.add('hidden');
  $('resultado-voz-area').innerHTML = `<div class="resultado-item error">❌ ${mensaje}</div>`;
}

async function consultarEstadoPermiso() {
  if (!navigator.permissions?.query) return 'unknown';
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    return result.state;
  } catch {
    return 'unknown';
  }
}

function actualizarEstadoMic(estado) {
  const badge = $('mic-permiso-estado');
  const icon = $('mic-estado-icon');
  const texto = $('mic-estado-texto');
  const btn = $('btn-microfono');
  if (!badge) return;

  badge.className = 'mic-estado';
  if (estado === 'ok') {
    badge.classList.add('mic-estado--ok');
    icon.textContent = '✅';
    texto.textContent = 'Micrófono listo — mantén presionado para hablar';
    if (btn) btn.disabled = false;
  } else if (estado === 'denegado') {
    badge.classList.add('mic-estado--denegado');
    icon.textContent = '🚫';
    texto.textContent = 'Micrófono bloqueado — habilítalo en ajustes del navegador';
    if (btn) btn.disabled = true;
  } else {
    badge.classList.add('mic-estado--pendiente');
    icon.textContent = '⏳';
    texto.textContent = 'Se necesita permiso de micrófono para usar voz';
    if (btn) btn.disabled = true;
  }
}

function mostrarModalPermiso(modo) {
  const modal = $('modal-permiso-mic');
  const errorEl = $('modal-mic-error');
  if (!modal) return;

  errorEl.classList.add('hidden');
  errorEl.textContent = '';

  if (modo === 'denegado') {
    errorEl.textContent =
      'Permiso denegado. Ve a ajustes del navegador → Privacidad → Micrófono y permite el acceso para este sitio.';
    errorEl.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  $('btn-permitir-mic')?.focus();
}

function ocultarModalPermiso() {
  $('modal-permiso-mic')?.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

async function solicitarPermisoMicrofono() {
  const btnPermitir = $('btn-permitir-mic');
  const errorEl = $('modal-mic-error');
  btnPermitir.disabled = true;
  errorEl.classList.add('hidden');

  try {
    micInitPromise = null;
    await inicializarMicrofono();
    ocultarModalPermiso();
  } catch (error) {
    const msg =
      error.name === 'NotAllowedError'
        ? 'Permiso denegado. Habilítalo en los ajustes de privacidad del navegador.'
        : `Error: ${error.message}`;
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
    actualizarEstadoMic('denegado');
  } finally {
    btnPermitir.disabled = false;
  }
}

async function verificarPermisosMicrofono() {
  const estado = await consultarEstadoPermiso();

  if (estado === 'granted') {
    try {
      await inicializarMicrofono();
      return;
    } catch {
      mostrarModalPermiso('denegado');
      return;
    }
  }

  if (estado === 'denied') {
    actualizarEstadoMic('denegado');
    mostrarModalPermiso('denegado');
    return;
  }

  actualizarEstadoMic('pendiente');
  mostrarModalPermiso();
}

function configurarModalPermiso() {
  $('btn-permitir-mic')?.addEventListener('click', solicitarPermisoMicrofono);
  $('btn-rechazar-mic')?.addEventListener('click', () => {
    ocultarModalPermiso();
    actualizarEstadoMic('pendiente');
  });

  $('modal-permiso-mic')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-permiso-mic') ocultarModalPermiso();
  });

  consultarEstadoPermiso().then((estado) => {
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' }).then((perm) => {
        perm.onchange = () => verificarPermisosMicrofono();
      }).catch(() => {});
    }
  });
}

function configurarEventosVoz() {
  const btn = $('btn-microfono');
  const btnReproducir = $('btn-reproducir');
  if (!btn) return;

  // pointer events: mejor en desktop y móvil
  btn.addEventListener('pointerdown', (e) => {
    btn.setPointerCapture(e.pointerId);
    iniciarGrabacion(e);
  });
  btn.addEventListener('pointerup', detenerGrabacion);
  btn.addEventListener('pointercancel', detenerGrabacion);

  // fallback click-toggle para quien no pueda mantener presionado
  btn.addEventListener('click', (e) => e.preventDefault());

  if (btnReproducir) {
    btnReproducir.addEventListener('click', () => $('audio-respuesta').play());
  }
}

function bootVoice() {
  configurarEventosVoz();
  configurarModalPermiso();
  verificarPermisosMicrofono();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootVoice);
} else {
  bootVoice();
}
