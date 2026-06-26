# MCP Usuarios DB

Sistema de gestión de usuarios con **PostgreSQL**, expuesto de tres formas:

1. **Servidor MCP** — integración con ChatGPT/OpenAI (herramientas de función)
2. **API REST** — Flask + Gunicorn
3. **App web** — HTML/CSS/JS con búsqueda por voz (Whisper + TTS)

Todo corre en un solo `docker-compose.yml` con base de datos compartida.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     docker-compose.yml                       │
├──────────────┬──────────────────┬───────────────────────────┤
│   postgres   │    mcp-server    │         mcp-api           │
│  PostgreSQL  │  app/server.py   │      app/api.py           │
│   :5433      │  (MCP + OpenAI)  │  Flask + web/static       │
│              │                  │       :5001               │
└──────┬───────┴────────┬─────────┴───────────┬───────────────┘
       │                │                     │
       └────────────────┴─────────────────────┘
                    usuarios_db
```

---

## Estructura del proyecto

```
mcp-db/
├── app/
│   ├── __init__.py
│   ├── api.py              # API REST Flask + rutas de voz
│   ├── i18n.py               # Mensajes API ES/EN
│   ├── database.py           # Conexión PostgreSQL y CRUD
│   ├── models.py             # Modelos Usuario y EstadisticasUsuarios
│   ├── server.py             # Servidor MCP para ChatGPT
│   └── voice.py              # Whisper, TTS e interpretación de comandos
├── web/static/
│   ├── i18n.js               # Traducciones ES/EN
│   ├── index.html            # Interfaz web
│   ├── style.css             # Estilos
│   ├── script.js             # Lógica UI (búsqueda, crear, stats)
│   └── voice.js              # Grabación, permisos micrófono, voz
├── db/
│   ├── init.sql              # Esquema tabla usuarios
│   └── seed.sql              # ~1000 usuarios de prueba
├── docker-compose.yml        # postgres + mcp-server + mcp-api
├── Dockerfile                # Imagen MCP server
├── Dockerfile-web            # Imagen API web
├── requirements.txt          # Deps MCP (openai, psycopg2)
├── requirements-web.txt      # Deps web (flask, gunicorn, openai)
├── .env.example              # Variables de entorno de ejemplo
└── README.md
```

---

## Requisitos

- [Docker](https://www.docker.com/) y Docker Compose
- Cuenta [OpenAI](https://platform.openai.com/) con API key (MCP + voz)

---

## Configuración

1. Clona el repositorio:

```bash
git clone https://github.com/hmmatus/mcp-db.git
cd mcp-db
```

2. Crea el archivo `.env` desde el ejemplo:

```bash
cp .env.example .env
```

3. Edita `.env` y agrega tu clave de OpenAI:

```env
OPENAI_API_KEY=sk-tu-clave-aqui
```

Las variables de PostgreSQL ya están configuradas en `docker-compose.yml` para Docker. Para desarrollo local fuera de Docker usa `DB_PORT=5433`.

---

## Ejecutar con Docker

Levantar todos los servicios:

```bash
docker compose up -d
```

Solo base de datos y API web:

```bash
docker compose up -d postgres mcp-api
```

Ver logs:

```bash
docker compose logs -f mcp-api
```

Detener:

```bash
docker compose down
```

---

## URLs y puertos

| Servicio     | URL / Puerto              | Descripción                    |
|--------------|---------------------------|--------------------------------|
| Web + API    | http://localhost:5001     | Interfaz y REST API            |
| PostgreSQL   | localhost:5433            | BD (usuario: `mcpuser`)        |
| MCP server   | (stdin, sin puerto HTTP)  | Para integración con Cursor/IDE |

> **Nota macOS:** el puerto 5000 suele estar ocupado por AirPlay. La API web usa **5001** en el host.

---

## API REST

Base: `http://localhost:5001/api`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios?limite=10&offset=0` | Listar usuarios |
| GET | `/usuarios/<id>` | Usuario por ID |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/<id>` | Actualizar usuario |
| DELETE | `/usuarios/<id>` | Borrado lógico |
| GET | `/search/email?email=` | Buscar por email |
| GET | `/search/nombre?nombre=` | Buscar por nombre |
| GET | `/search/ciudad?ciudad=` | Buscar por ciudad |
| GET | `/search/edad?edad_minima=&edad_maxima=` | Buscar por edad |
| GET | `/estadisticas` | Estadísticas globales |
| GET | `/health` | Health check |
| POST | `/voice/transcribe` | Audio → texto (Whisper) |
| POST | `/voice/procesar-comando` | Interpretar comando de voz |
| POST | `/voice/sintetizar` | Texto → audio (TTS) |

Respuesta estándar:

```json
{
  "exito": true,
  "lang": "en",
  "datos": {},
  "error": null,
  "cantidad": 10,
  "mensaje": "User created"
}
```

### Idioma (ES / EN)

- **Web:** botones **ES | EN** en la barra de navegación
- **API:** parámetro `?lang=en` o header `Accept-Language: en`

Ejemplo:

```bash
curl -s "http://localhost:5001/api/usuarios?limite=2&lang=en"
```

---

## Probar desde terminal

Base URL: `http://localhost:5001`  
Añade `&lang=en` para respuestas en inglés.

### Health

```bash
curl -s http://localhost:5001/health
curl -s "http://localhost:5001/health?lang=en"
```

### Listar usuarios

```bash
curl -s "http://localhost:5001/api/usuarios?limite=5&offset=0"
curl -s "http://localhost:5001/api/usuarios?limite=5&lang=en"
```

### Usuario por ID

```bash
curl -s http://localhost:5001/api/usuarios/1
```

### Buscar por email

```bash
curl -s "http://localhost:5001/api/search/email?email=pilar.flores5993@empresa.com&lang=en"
```

### Buscar por nombre (parcial)

```bash
curl -s "http://localhost:5001/api/search/nombre?nombre=Juan&limite=10"
curl -s "http://localhost:5001/api/search/nombre?nombre=Juan&limite=10&lang=en"
```

### Buscar por ciudad

```bash
curl -s "http://localhost:5001/api/search/ciudad?ciudad=San%20Salvador&limite=10"
curl -s "http://localhost:5001/api/search/ciudad?ciudad=San%20Salvador&lang=en"
```

### Buscar por rango de edad

```bash
curl -s "http://localhost:5001/api/search/edad?edad_minima=25&edad_maxima=35"
```

### Estadísticas

```bash
curl -s http://localhost:5001/api/estadisticas
curl -s "http://localhost:5001/api/estadisticas?lang=en"
```

### Crear usuario

```bash
curl -s -X POST http://localhost:5001/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{"nombre":"Test User","email":"test.user@example.com","edad":30,"ciudad":"San Salvador"}'
```

### Actualizar usuario

```bash
curl -s -X PUT http://localhost:5001/api/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{"ciudad":"Santa Ana"}'
```

### Eliminar usuario (borrado lógico)

```bash
curl -s -X DELETE "http://localhost:5001/api/usuarios/999&lang=en"
```

### Comando de voz (texto → acción)

```bash
# Interpretar comando en inglés
curl -s -X POST "http://localhost:5001/api/voice/procesar-comando?lang=en" \
  -H "Content-Type: application/json" \
  -d '{"comando":"Search users in San Salvador","lang":"en"}'

# Interpretar comando en español
curl -s -X POST http://localhost:5001/api/voice/procesar-comando \
  -H "Content-Type: application/json" \
  -d '{"comando":"Busca usuarios en San Salvador"}'
```

### PostgreSQL directo (psql)

```bash
# Conectar
psql -h localhost -p 5433 -U mcpuser -d usuarios_db

# Dentro de psql:
SELECT id, nombre, email, ciudad FROM usuarios LIMIT 5;
SELECT * FROM usuarios WHERE LOWER(ciudad) LIKE '%san salvador%' LIMIT 10;
SELECT COUNT(*) FROM usuarios WHERE activo = true;
SELECT ciudad, COUNT(*) FROM usuarios GROUP BY ciudad ORDER BY count DESC LIMIT 10;
```

### Formato JSON legible (opcional)

```bash
curl -s "http://localhost:5001/api/estadisticas?lang=en" | python3 -m json.tool
```

---

## App web

Abre **http://localhost:5001** en el navegador.

### Secciones

- **Voz** — mantén presionado el micrófono, habla un comando, escucha la respuesta
- **Inicio** — últimos usuarios registrados
- **Buscar** — por email, nombre, ciudad o rango de edad
- **Crear** — formulario de nuevo usuario
- **Estadísticas** — totales, edad promedio, ciudades y países

### Comandos de voz — Español

- "Busca usuarios en San Salvador"
- "Dame los usuarios entre 25 y 35 años"
- "Busca a Juan"
- "Crea un usuario llamado Carlos con email carlos@mail.com"
- "Cuántos usuarios hay en total?"
- "Elimina el usuario 5"

### Voice commands — English

- "Search users in San Salvador"
- "Show users between 25 and 35 years old"
- "Search for Juan"
- "Create a user named Carlos with email carlos@mail.com"
- "How many users are there in total?"
- "Delete user 5"

Al entrar, la app solicita permiso de micrófono. Usa **ES | EN** en el navbar para cambiar idioma.

---

## Servidor MCP (ChatGPT)

El servicio `mcp-server` ejecuta `python -m app.server` y expone herramientas OpenAI para consultar y modificar usuarios.

Requiere `OPENAI_API_KEY` en `.env`. Se usa con clientes MCP compatibles (Cursor, Claude Desktop, etc.).

```bash
docker compose up -d mcp-server
docker attach mcp-server   # modo interactivo
```

---

## Desarrollo local (sin Docker)

### API web

```bash
pip install -r requirements-web.txt
export DB_HOST=localhost DB_PORT=5433 DB_USER=mcpuser DB_PASSWORD=mcppassword DB_NAME=usuarios_db
export OPENAI_API_KEY=sk-...
python -m app.api
```

### Solo PostgreSQL en Docker

```bash
docker compose up -d postgres
```

---

## Base de datos

Tabla `usuarios`:

| Campo | Tipo |
|-------|------|
| id | SERIAL PK |
| nombre | VARCHAR(100) |
| email | VARCHAR(100) UNIQUE |
| edad | INTEGER |
| ciudad, pais | VARCHAR(100) |
| telefono | VARCHAR(20) |
| activo | BOOLEAN (default true) |
| created_at, updated_at | TIMESTAMP |

Conectar con `psql`:

```bash
psql -h localhost -p 5433 -U mcpuser -d usuarios_db
# password: mcppassword
```

---

## Variables de entorno

| Variable | Descripción | Default (Docker) |
|----------|-------------|------------------|
| `OPENAI_API_KEY` | Clave OpenAI (MCP + voz) | — |
| `DB_HOST` | Host PostgreSQL | `postgres` |
| `DB_PORT` | Puerto PostgreSQL | `5432` (contenedor) / `5433` (host) |
| `DB_USER` | Usuario BD | `mcpuser` |
| `DB_PASSWORD` | Contraseña BD | `mcppassword` |
| `DB_NAME` | Nombre BD | `usuarios_db` |

---

## Licencia

MIT
