// Voice control — Whisper + TTS + comandos naturales

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let micStream = null;
let micInitPromise = null;

let micPermisoConcedido = false;
let selectedMicId = localStorage.getItem('micDeviceId') || '';

function cerrarStreamMic() {
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  mediaRecorder = null;
}

function reiniciarMicrofono() {
  cerrarStreamMic();
  micInitPromise = null;
  micPermisoConcedido = false;
}

function getAudioConstraints() {
  const constraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  if (selectedMicId) {
    constraints.deviceId = { ideal: selectedMicId };
  }
  return { audio: constraints };
}

function esDispositivoAudifonos(label) {
  const l = (label || '').toLowerCase();
  return /headset|headphone|earbud|airpod|bluetooth|beats|sony|bose|jabra|logitech|usb audio|external/i.test(l);
}

async function cargarListaMicrofonos() {
  const select = $('select-mic');
  if (!select || !navigator.mediaDevices?.enumerateDevices) return;

  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs = devices.filter((d) => d.kind === 'audioinput');
  const saved = selectedMicId;

  select.innerHTML = `<option value="">${t('voice.mic.deviceDefault')}</option>`;
  inputs.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `${t('voice.mic.deviceUnknown')} ${i + 1}`;
    select.appendChild(opt);
  });

  select.disabled = inputs.length === 0;

  if (saved && inputs.some((d) => d.deviceId === saved)) {
    select.value = saved;
  } else {
    const headset = inputs.find((d) => esDispositivoAudifonos(d.label));
    if (headset) {
      select.value = headset.deviceId;
      selectedMicId = headset.deviceId;
      localStorage.setItem('micDeviceId', selectedMicId);
    }
  }
}

function configurarSelectorMicrofono() {
  const select = $('select-mic');
  if (!select) return;

  select.addEventListener('change', async () => {
    selectedMicId = select.value;
    if (selectedMicId) {
      localStorage.setItem('micDeviceId', selectedMicId);
    } else {
      localStorage.removeItem('micDeviceId');
    }
    reiniciarMicrofono();
    if (select.value) {
      try {
        await inicializarMicrofono();
      } catch {
        actualizarEstadoMic('denegado');
      }
    } else {
      actualizarEstadoMic('pendiente');
    }
  });

  navigator.mediaDevices?.addEventListener('devicechange', () => {
    cargarListaMicrofonos();
  });
}

function getMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return types.find((mime) => MediaRecorder.isTypeSupported(mime)) || '';
}

function micIdleHtml() {
  return `<span class="microfono-icon">🎤</span><span class="microfono-text">${t('voice.mic.press')}</span>`;
}

function micRecordingHtml() {
  return `<span class="microfono-icon">⏹️</span><span class="microfono-text">${t('voice.mic.release')}</span>`;
}

function setYouSaid(text) {
  $('texto-escuchado').innerHTML = `<span data-i18n="voice.youSay">${t('voice.youSay')}</span> ${escapar(text)}`;
}

function $(id) {
  return document.getElementById(id);
}

function escapar(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

async function inicializarMicrofono() {
  if (micInitPromise) return micInitPromise;

  micInitPromise = (async () => {
    const btn = $('btn-microfono');
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(t('voice.err.browser'));
    }

    cerrarStreamMic();
    micStream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());
    await cargarListaMicrofonos();

    const mimeType = getMimeType();
    const options = mimeType ? { mimeType } : undefined;
    mediaRecorder = new MediaRecorder(micStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => procesarAudio();

    const select = $('select-mic');
    if (select) select.disabled = false;

    if (btn) {
      btn.disabled = false;
      btn.title = t('voice.mic.ready');
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
  btn.innerHTML = micRecordingHtml();
  grabandoDiv.classList.remove('hidden');
  $('audio-player-area').classList.add('hidden');
  $('resultado-voz-area').innerHTML = '';
  setYouSaid(t('voice.listening'));
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
  btn.innerHTML = micIdleHtml();
  $('grabando').classList.add('hidden');
}

async function procesarAudio() {
  const respuestaVozDiv = $('respuesta-voz');
  const textoEscuchado = $('texto-escuchado');
  respuestaVozDiv.classList.remove('hidden');
  setYouSaid(t('voice.processing'));

  try {
    const mimeType = mediaRecorder?.mimeType || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const audioBlob = new Blob(audioChunks, { type: mimeType });

    if (audioBlob.size < 1000) {
      mostrarErrorVoz(t('voice.err.short'));
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, `audio.${ext}`);

    const transcriptionResponse = await fetch(`/api/voice/transcribe?${apiLangQuery()}`, {
      method: 'POST',
      headers: { 'Accept-Language': getLang() },
      body: formData,
    });
    const transcriptionData = await transcriptionResponse.json();

    if (!transcriptionData.exito) {
      mostrarErrorVoz(transcriptionData.error || t('err.generic'));
      return;
    }

    const textoUsuario = transcriptionData.texto;
    setYouSaid(`"${textoUsuario}"`);
    await procesarComandoVoz(textoUsuario);
  } catch (error) {
    mostrarErrorVoz(error.message);
  }
}

async function procesarComandoVoz(texto) {
  try {
    const comandoResponse = await fetch(`/api/voice/procesar-comando?${apiLangQuery()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': getLang() },
      body: JSON.stringify({ comando: texto, lang: getLang() }),
    });
    const comandoData = await comandoResponse.json();

    if (!comandoData.exito) {
      mostrarErrorVoz(comandoData.error || t('voice.err.unknown'));
      return;
    }

    const { tipo_comando: tipo, parametros } = comandoData;
    const langHdr = { 'Accept-Language': getLang() };
    let resultado;

    switch (tipo) {
      case 'buscar_ciudad':
        resultado = await fetch(withLang(
          `${API_BASE}/search/ciudad?ciudad=${encodeURIComponent(parametros.ciudad)}&limite=10`
        ), { headers: langHdr });
        break;
      case 'buscar_nombre':
        resultado = await fetch(withLang(
          `${API_BASE}/search/nombre?nombre=${encodeURIComponent(parametros.nombre)}&limite=10`
        ), { headers: langHdr });
        break;
      case 'buscar_edad':
        resultado = await fetch(withLang(
          `${API_BASE}/search/edad?edad_minima=${parametros.edad_minima}&edad_maxima=${parametros.edad_maxima}`
        ), { headers: langHdr });
        break;
      case 'buscar_email':
        resultado = await fetch(withLang(
          `${API_BASE}/search/email?email=${encodeURIComponent(parametros.email)}`
        ), { headers: langHdr });
        break;
      case 'crear_usuario':
        resultado = await fetch(withLang(`${API_BASE}/usuarios`), {
          method: 'POST',
          headers: { ...langHdr, 'Content-Type': 'application/json' },
          body: JSON.stringify(parametros),
        });
        break;
      case 'estadisticas':
        resultado = await fetch(withLang(`${API_BASE}/estadisticas`), { headers: langHdr });
        break;
      case 'eliminar_usuario':
        resultado = await fetch(withLang(`${API_BASE}/usuarios/${parametros.usuario_id}`), {
          method: 'DELETE',
          headers: langHdr,
        });
        break;
      case 'listar':
        resultado = await fetch(withLang(
          `${API_BASE}/usuarios?limite=${parametros.limite || 10}&offset=0`
        ), { headers: langHdr });
        break;
      default:
        mostrarErrorVoz(`${t('voice.err.unknown')}: ${tipo}`);
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
    return datos.error || t('voice.resp.failed');
  }

  const lista = Array.isArray(datos.datos) ? datos.datos : (datos.datos ? [datos.datos] : []);
  const nombres = lista.slice(0, 5).map((u) => u.nombre).join(', ');

  switch (tipo) {
    case 'buscar_ciudad':
      return t('voice.resp.city', { n: lista.length, city: parametros.ciudad, names: nombres });
    case 'buscar_nombre':
      return t('voice.resp.name', { n: lista.length, names: nombres });
    case 'buscar_edad':
      return t('voice.resp.age', {
        n: lista.length, min: parametros.edad_minima, max: parametros.edad_maxima, names: nombres,
      });
    case 'buscar_email':
      return lista.length
        ? t('voice.resp.email', { name: lista[0].nombre, email: lista[0].email })
        : t('voice.resp.emailNotFound');
    case 'crear_usuario':
      return t('voice.resp.created', { name: parametros.nombre, email: parametros.email });
    case 'estadisticas': {
      const s = datos.datos;
      return t('voice.resp.stats', {
        total: s.total, avg: s.edad_promedio, cities: s.ciudades_unicas, countries: s.paises_unicos,
      });
    }
    case 'eliminar_usuario':
      return t('voice.resp.deleted', { id: parametros.usuario_id });
    case 'listar':
      return t('voice.resp.list', { n: lista.length, names: nombres });
    default:
      return datos.mensaje || t('voice.resp.done');
  }
}

async function sintetizarYReproducir(texto) {
  try {
    const response = await fetch(`/api/voice/sintetizar?${apiLangQuery()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': getLang() },
      body: JSON.stringify({ texto, lang: getLang() }),
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
    `${ok ? '✅' : '❌'} ${ok ? t('voice.ok') : t('voice.fail')} — ${tipo.replace(/_/g, ' ')}<br>${detalle || ''}</div>`;
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
    texto.textContent = t('voice.mic.ready');
    if (btn) btn.disabled = false;
  } else if (estado === 'denegado') {
    badge.classList.add('mic-estado--denegado');
    icon.textContent = '🚫';
    texto.textContent = t('voice.mic.denied');
    if (btn) btn.disabled = true;
  } else {
    badge.classList.add('mic-estado--pendiente');
    icon.textContent = '⏳';
    texto.textContent = t('voice.mic.pending');
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
    errorEl.textContent = t('modal.mic.denied');
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
        ? t('modal.mic.deniedShort')
        : `${t('err.generic')}: ${error.message}`;
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
  configurarSelectorMicrofono();
  verificarPermisosMicrofono();
}

document.addEventListener('langchange', () => {
  applyI18n();
  cargarListaMicrofonos();
  if (micPermisoConcedido) actualizarEstadoMic('ok');
  else actualizarEstadoMic('pendiente');
  const btn = $('btn-microfono');
  if (btn && !btn.classList.contains('recording')) btn.innerHTML = micIdleHtml();
});

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootVoice);
} else {
  bootVoice();
}
