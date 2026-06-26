// Internationalization (ES / EN)

const I18N = {
  es: {
    'meta.title': 'MCP Usuarios — Gestión de Base de Datos',
    'header.title': '👥 MCP Usuarios',
    'header.subtitle': 'Gestión de usuarios con PostgreSQL y API REST',
    'nav.voice': '🎤 Voz',
    'nav.home': '🏠 Inicio',
    'nav.search': '🔍 Buscar',
    'nav.create': '➕ Crear',
    'nav.stats': '📊 Estadísticas',
    'voice.title': '🎤 Buscar por Voz',
    'voice.mic.checking': 'Verificando permiso de micrófono...',
    'voice.mic.ready': 'Micrófono listo — mantén presionado para hablar',
    'voice.mic.pending': 'Se necesita permiso de micrófono para usar voz',
    'voice.mic.denied': 'Micrófono bloqueado — habilítalo en ajustes del navegador',
    'voice.mic.press': 'Presiona y habla',
    'voice.mic.release': 'Soltar para detener',
    'voice.mic.deviceLabel': 'Micrófono de entrada',
    'voice.mic.deviceDefault': 'Predeterminado del sistema',
    'voice.mic.deviceHint': 'Si usas audífonos, selecciona su micrófono aquí (no el del Mac).',
    'voice.mic.deviceUnknown': 'Micrófono',
    'voice.listening': 'Escuchando...',
    'voice.youSay': 'Tú dices:',
    'voice.processing': 'Procesando...',
    'voice.hearing': 'Tú dices: Escuchando...',
    'voice.transcribing': 'Tú dices: Procesando...',
    'voice.play': '🔊 Reproducir respuesta',
    'voice.examples': '📝 Ejemplos de comandos',
    'voice.ex1': '"Busca usuarios en San Salvador"',
    'voice.ex2': '"Dame los usuarios entre 25 y 35 años"',
    'voice.ex3': '"Busca a Juan"',
    'voice.ex4': '"Crea un usuario llamado Carlos Rodríguez con email carlos@mail.com"',
    'voice.ex5': '"Cuántos usuarios hay en total?"',
    'voice.ex6': '"Elimina el usuario 5"',
    'modal.mic.title': '🎤 Acceso al micrófono',
    'modal.mic.lead': 'Esta app usa tu voz para controlar la base de datos de usuarios.',
    'modal.mic.l1': 'Graba audio mientras mantienes presionado el botón 🎤',
    'modal.mic.l2': 'Transcribe tu comando con OpenAI Whisper',
    'modal.mic.l3': 'Ejecuta búsquedas, creación o estadísticas',
    'modal.mic.l4': 'Responde con voz sintetizada (TTS)',
    'modal.mic.note': 'El audio se procesa en el servidor y se envía a OpenAI solo para transcribir. No guardamos grabaciones en disco de forma permanente.',
    'modal.mic.allow': 'Permitir micrófono',
    'modal.mic.deny': 'Ahora no',
    'modal.mic.denied': 'Permiso denegado. Ve a ajustes del navegador → Privacidad → Micrófono y permite el acceso para este sitio.',
    'modal.mic.deniedShort': 'Permiso denegado. Habilítalo en los ajustes de privacidad del navegador.',
    'home.welcome': 'Bienvenido',
    'home.desc': 'Explora, busca y administra usuarios en tiempo real.',
    'home.f1': '🎤 Comandos de voz con Whisper y TTS',
    'home.f2': '📋 Listado paginado de usuarios',
    'home.f3': '🔎 Búsqueda por email, nombre, ciudad y edad',
    'home.f4': '➕ Creación de nuevos registros',
    'home.f5': '📊 Estadísticas globales de la base de datos',
    'home.latest': 'Últimos usuarios',
    'search.title': '🔍 Búsqueda de usuarios',
    'search.email': '📧 Por Email',
    'search.name': '👤 Por Nombre',
    'search.city': '🏙️ Por Ciudad',
    'search.age': '🎂 Por Edad',
    'search.btn': 'Buscar',
    'create.title': '➕ Crear nuevo usuario',
    'create.submit': 'Crear Usuario',
    'stats.title': '📊 Estadísticas globales',
    'footer': 'MCP Usuarios DB — Flask + PostgreSQL + Docker',
    'ph.email': 'usuario@ejemplo.com',
    'ph.name': 'Nombre o parte del nombre',
    'ph.city': 'Ciudad',
    'ph.min': 'Mín',
    'ph.max': 'Máx',
    'ph.fullname': 'Nombre completo',
    'ph.optional': 'Opcional',
    'lbl.name': 'Nombre *',
    'lbl.email': 'Email *',
    'lbl.age': 'Edad',
    'lbl.city': 'Ciudad',
    'lbl.country': 'País',
    'lbl.phone': 'Teléfono',
    'loading.users': 'Cargando usuarios',
    'loading.stats': 'Cargando estadísticas',
    'loading.search': 'Buscando',
    'no.users': 'No hay usuarios registrados',
    'no.results': 'Sin resultados',
    'results.count': '{n} resultado(s)',
    'badge.active': 'Activo',
    'badge.inactive': 'Inactivo',
    'years': 'años',
    'err.enterEmail': 'Ingresa un email',
    'err.enterName': 'Ingresa un nombre',
    'err.enterCity': 'Ingresa una ciudad',
    'err.enterAge': 'Ingresa rango de edad',
    'err.ageRange': 'Edad mínima > máxima',
    'err.nameEmail': 'Nombre y email requeridos',
    'err.generic': 'Error',
    'stats.total': 'Total usuarios',
    'stats.active': 'Activos',
    'stats.avgAge': 'Edad promedio',
    'stats.cities': 'Ciudades únicas',
    'stats.countries': 'Países únicos',
    'voice.err.short': 'Grabación muy corta. Mantén presionado y habla más tiempo.',
    'voice.err.browser': 'Tu navegador no soporta grabación de audio',
    'voice.err.unknown': 'Comando no reconocido',
    'voice.ok': 'Operación exitosa',
    'voice.fail': 'Error',
    'voice.resp.city': 'Encontré {n} usuarios en {city}. {names}',
    'voice.resp.name': 'Encontré {n} usuarios: {names}',
    'voice.resp.age': 'Encontré {n} usuarios entre {min} y {max} años. {names}',
    'voice.resp.email': 'Encontré a {name} con email {email}',
    'voice.resp.emailNotFound': 'No encontré ese email',
    'voice.resp.created': 'Usuario {name} creado con email {email}',
    'voice.resp.stats': 'Hay {total} usuarios en total. Edad promedio {avg} años. {cities} ciudades y {countries} países.',
    'voice.resp.deleted': 'Usuario {id} eliminado',
    'voice.resp.list': 'Listando {n} usuarios. {names}',
    'voice.resp.done': 'Operación completada',
    'voice.resp.failed': 'La operación no se pudo completar',
  },
  en: {
    'meta.title': 'MCP Users — Database Management',
    'header.title': '👥 MCP Users',
    'header.subtitle': 'User management with PostgreSQL and REST API',
    'nav.voice': '🎤 Voice',
    'nav.home': '🏠 Home',
    'nav.search': '🔍 Search',
    'nav.create': '➕ Create',
    'nav.stats': '📊 Statistics',
    'voice.title': '🎤 Voice Search',
    'voice.mic.checking': 'Checking microphone permission...',
    'voice.mic.ready': 'Microphone ready — hold to speak',
    'voice.mic.pending': 'Microphone permission required for voice',
    'voice.mic.denied': 'Microphone blocked — enable it in browser settings',
    'voice.mic.press': 'Press and speak',
    'voice.mic.release': 'Release to stop',
    'voice.mic.deviceLabel': 'Input microphone',
    'voice.mic.deviceDefault': 'System default',
    'voice.mic.deviceHint': 'Using headphones? Select their microphone here (not the Mac built-in).',
    'voice.mic.deviceUnknown': 'Microphone',
    'voice.listening': 'Listening...',
    'voice.youSay': 'You said:',
    'voice.processing': 'Processing...',
    'voice.hearing': 'You said: Listening...',
    'voice.transcribing': 'You said: Processing...',
    'voice.play': '🔊 Play response',
    'voice.examples': '📝 Example commands',
    'voice.ex1': '"Search users in San Salvador"',
    'voice.ex2': '"Show users between 25 and 35 years old"',
    'voice.ex3': '"Search for Juan"',
    'voice.ex4': '"Create a user named Carlos Rodriguez with email carlos@mail.com"',
    'voice.ex5': '"How many users are there in total?"',
    'voice.ex6': '"Delete user 5"',
    'modal.mic.title': '🎤 Microphone access',
    'modal.mic.lead': 'This app uses your voice to control the user database.',
    'modal.mic.l1': 'Records audio while you hold the 🎤 button',
    'modal.mic.l2': 'Transcribes your command with OpenAI Whisper',
    'modal.mic.l3': 'Runs searches, creation, or statistics',
    'modal.mic.l4': 'Responds with synthesized voice (TTS)',
    'modal.mic.note': 'Audio is processed on the server and sent to OpenAI only for transcription. We do not permanently store recordings.',
    'modal.mic.allow': 'Allow microphone',
    'modal.mic.deny': 'Not now',
    'modal.mic.denied': 'Permission denied. Go to browser settings → Privacy → Microphone and allow access for this site.',
    'modal.mic.deniedShort': 'Permission denied. Enable it in your browser privacy settings.',
    'home.welcome': 'Welcome',
    'home.desc': 'Explore, search, and manage users in real time.',
    'home.f1': '🎤 Voice commands with Whisper and TTS',
    'home.f2': '📋 Paginated user listing',
    'home.f3': '🔎 Search by email, name, city, and age',
    'home.f4': '➕ Create new records',
    'home.f5': '📊 Global database statistics',
    'home.latest': 'Latest users',
    'search.title': '🔍 User search',
    'search.email': '📧 By Email',
    'search.name': '👤 By Name',
    'search.city': '🏙️ By City',
    'search.age': '🎂 By Age',
    'search.btn': 'Search',
    'create.title': '➕ Create new user',
    'create.submit': 'Create User',
    'stats.title': '📊 Global statistics',
    'footer': 'MCP Users DB — Flask + PostgreSQL + Docker',
    'ph.email': 'user@example.com',
    'ph.name': 'Name or partial name',
    'ph.city': 'City',
    'ph.min': 'Min',
    'ph.max': 'Max',
    'ph.fullname': 'Full name',
    'ph.optional': 'Optional',
    'lbl.name': 'Name *',
    'lbl.email': 'Email *',
    'lbl.age': 'Age',
    'lbl.city': 'City',
    'lbl.country': 'Country',
    'lbl.phone': 'Phone',
    'loading.users': 'Loading users',
    'loading.stats': 'Loading statistics',
    'loading.search': 'Searching',
    'no.users': 'No registered users',
    'no.results': 'No results',
    'results.count': '{n} result(s)',
    'badge.active': 'Active',
    'badge.inactive': 'Inactive',
    'years': 'years',
    'err.enterEmail': 'Enter an email',
    'err.enterName': 'Enter a name',
    'err.enterCity': 'Enter a city',
    'err.enterAge': 'Enter age range',
    'err.ageRange': 'Minimum age > maximum',
    'err.nameEmail': 'Name and email required',
    'err.generic': 'Error',
    'stats.total': 'Total users',
    'stats.active': 'Active',
    'stats.avgAge': 'Average age',
    'stats.cities': 'Unique cities',
    'stats.countries': 'Unique countries',
    'voice.err.short': 'Recording too short. Hold longer and speak.',
    'voice.err.browser': 'Your browser does not support audio recording',
    'voice.err.unknown': 'Unrecognized command',
    'voice.ok': 'Operation successful',
    'voice.fail': 'Error',
    'voice.resp.city': 'Found {n} users in {city}. {names}',
    'voice.resp.name': 'Found {n} users: {names}',
    'voice.resp.age': 'Found {n} users between {min} and {max} years old. {names}',
    'voice.resp.email': 'Found {name} with email {email}',
    'voice.resp.emailNotFound': 'Email not found',
    'voice.resp.created': 'User {name} created with email {email}',
    'voice.resp.stats': 'There are {total} users in total. Average age {avg} years. {cities} cities and {countries} countries.',
    'voice.resp.deleted': 'User {id} deleted',
    'voice.resp.list': 'Listing {n} users. {names}',
    'voice.resp.done': 'Operation completed',
    'voice.resp.failed': 'Operation could not be completed',
  },
};

function getLang() {
  return localStorage.getItem('lang') || (navigator.language.startsWith('en') ? 'en' : 'es');
}

function setLang(lang) {
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  applyI18n();
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function t(key, vars = {}) {
  const lang = getLang();
  let text = (I18N[lang] && I18N[lang][key]) || I18N.es[key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

function apiLangQuery() {
  return `lang=${getLang()}`;
}

function withLang(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${apiLangQuery()}`;
}

function applyI18n() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = t('meta.title');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const micText = document.querySelector('.microfono-text');
  if (micText && !document.getElementById('btn-microfono')?.classList.contains('recording')) {
    micText.textContent = t('voice.mic.press');
  }
}

function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher();
  applyI18n();
});
