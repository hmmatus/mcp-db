"""
API REST Flask para gestión de usuarios
"""

import base64
import logging
import os
import tempfile
import uuid
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

load_dotenv()

try:
    from app.database import DatabaseConnection
    from app import voice as voice_module
except ImportError:
    from database import DatabaseConnection
    import voice as voice_module

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

WEB_STATIC = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web", "static")
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), "mcp-voice")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=WEB_STATIC, static_url_path="/static")
CORS(app)

db = None


def get_db():
    global db
    if db is None:
        db = DatabaseConnection()
    return db


def respuesta(exito=True, datos=None, error=None, cantidad=None, mensaje=None, status=200):
    body = {"exito": exito}
    if datos is not None:
        body["datos"] = datos
    if error:
        body["error"] = error
    if cantidad is not None:
        body["cantidad"] = cantidad
    if mensaje:
        body["mensaje"] = mensaje
    return jsonify(body), status


def manejar_errores_db(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except ValueError as e:
            return respuesta(exito=False, error=str(e), status=400)
        except Exception as e:
            logger.exception("Error en %s: %s", fn.__name__, e)
            return respuesta(exito=False, error="Error interno del servidor", status=500)

    return wrapper


@app.route("/")
def index():
    return send_from_directory(WEB_STATIC, "index.html")


@app.route("/health")
def health():
    try:
        get_db()
        return respuesta(exito=True, mensaje="OK")
    except Exception as e:
        return respuesta(exito=False, error=str(e), status=503)


@app.route("/api/usuarios", methods=["GET"])
@manejar_errores_db
def listar_usuarios():
    limite = request.args.get("limite", 10, type=int)
    offset = request.args.get("offset", 0, type=int)
    usuarios = get_db().obtener_usuarios(limite=limite, offset=offset)
    datos = [u.to_dict() for u in usuarios]
    return respuesta(exito=True, datos=datos, cantidad=len(datos))


@app.route("/api/usuarios/<int:usuario_id>", methods=["GET"])
@manejar_errores_db
def obtener_usuario(usuario_id):
    usuario = get_db().obtener_usuario_por_id(usuario_id)
    if not usuario:
        return respuesta(exito=False, error="Usuario no encontrado", status=404)
    return respuesta(exito=True, datos=usuario.to_dict())


@app.route("/api/usuarios", methods=["POST"])
@manejar_errores_db
def crear_usuario():
    data = request.get_json(silent=True) or {}
    nombre = (data.get("nombre") or "").strip()
    email = (data.get("email") or "").strip()

    if not nombre or not email:
        return respuesta(exito=False, error="nombre y email son requeridos", status=400)

    usuario = get_db().crear_usuario(
        nombre=nombre,
        email=email,
        edad=data.get("edad"),
        ciudad=data.get("ciudad"),
        pais=data.get("pais"),
        telefono=data.get("telefono"),
    )
    return respuesta(exito=True, datos=usuario.to_dict(), mensaje="Usuario creado", status=201)


@app.route("/api/usuarios/<int:usuario_id>", methods=["PUT"])
@manejar_errores_db
def actualizar_usuario(usuario_id):
    data = request.get_json(silent=True) or {}
    if not data:
        return respuesta(exito=False, error="No hay datos para actualizar", status=400)

    campos = {}
    for key in ("nombre", "email", "edad", "ciudad", "pais", "telefono", "activo"):
        if key in data:
            campos[key] = data[key]

    usuario = get_db().actualizar_usuario(usuario_id, **campos)
    if not usuario:
        return respuesta(exito=False, error="Usuario no encontrado", status=404)
    return respuesta(exito=True, datos=usuario.to_dict(), mensaje="Usuario actualizado")


@app.route("/api/usuarios/<int:usuario_id>", methods=["DELETE"])
@manejar_errores_db
def eliminar_usuario(usuario_id):
    ok = get_db().eliminar_usuario(usuario_id)
    if not ok:
        return respuesta(exito=False, error="Usuario no encontrado", status=404)
    return respuesta(exito=True, mensaje="Usuario eliminado (borrado lógico)")


@app.route("/api/search/email")
@manejar_errores_db
def buscar_email():
    email = (request.args.get("email") or "").strip()
    if not email:
        return respuesta(exito=False, error="email es requerido", status=400)

    usuario = get_db().buscar_por_email(email)
    if not usuario:
        return respuesta(exito=False, error="Usuario no encontrado", status=404)
    return respuesta(exito=True, datos=usuario.to_dict())


@app.route("/api/search/nombre")
@manejar_errores_db
def buscar_nombre():
    nombre = (request.args.get("nombre") or "").strip()
    if not nombre:
        return respuesta(exito=False, error="nombre es requerido", status=400)

    limite = request.args.get("limite", 50, type=int)
    usuarios = get_db().buscar_por_nombre(nombre, limite=limite)
    datos = [u.to_dict() for u in usuarios]
    return respuesta(exito=True, datos=datos, cantidad=len(datos))


@app.route("/api/search/ciudad")
@manejar_errores_db
def buscar_ciudad():
    ciudad = (request.args.get("ciudad") or "").strip()
    if not ciudad:
        return respuesta(exito=False, error="ciudad es requerida", status=400)

    limite = request.args.get("limite", 50, type=int)
    usuarios = get_db().buscar_por_ciudad(ciudad, limite=limite)
    datos = [u.to_dict() for u in usuarios]
    return respuesta(exito=True, datos=datos, cantidad=len(datos))


@app.route("/api/search/edad")
@manejar_errores_db
def buscar_edad():
    edad_minima = request.args.get("edad_minima", 0, type=int)
    edad_maxima = request.args.get("edad_maxima", 150, type=int)

    if edad_minima > edad_maxima:
        return respuesta(exito=False, error="edad_minima no puede ser mayor que edad_maxima", status=400)

    usuarios = get_db().obtener_usuarios_por_edad(edad_minima, edad_maxima)
    datos = [u.to_dict() for u in usuarios]
    return respuesta(exito=True, datos=datos, cantidad=len(datos))


@app.route("/api/estadisticas")
@manejar_errores_db
def estadisticas():
    stats = get_db().obtener_estadisticas()
    return respuesta(exito=True, datos=stats)


# ── Voz ─────────────────────────────────────────────────────

@app.route("/api/voice/transcribe", methods=["POST"])
def transcribir_audio_route():
    filepath = None
    try:
        if "audio" not in request.files:
            return respuesta(exito=False, error="No se recibió archivo de audio", status=400)

        audio_file = request.files["audio"]
        ext = os.path.splitext(secure_filename(audio_file.filename or "audio.webm"))[1] or ".webm"
        filepath = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}{ext}")
        audio_file.save(filepath)

        texto = voice_module.transcribir_audio(filepath)
        return jsonify({"exito": True, "texto": texto})
    except ValueError as e:
        return respuesta(exito=False, error=str(e), status=400)
    except Exception as e:
        logger.exception("Error transcribiendo audio: %s", e)
        return respuesta(exito=False, error=str(e), status=500)
    finally:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)


@app.route("/api/voice/procesar-comando", methods=["POST"])
def procesar_comando_route():
    try:
        data = request.get_json(silent=True) or {}
        comando = (data.get("comando") or "").strip()
        if not comando:
            return respuesta(exito=False, error="comando es requerido", status=400)

        resultado = voice_module.procesar_comando_voz(comando)
        return jsonify({
            "exito": True,
            "tipo_comando": resultado["tipo_comando"],
            "parametros": resultado["parametros"],
            "descripcion": resultado.get("descripcion", ""),
        })
    except ValueError as e:
        return respuesta(exito=False, error=str(e), status=400)
    except Exception as e:
        logger.exception("Error procesando comando: %s", e)
        return respuesta(exito=False, error=str(e), status=500)


@app.route("/api/voice/sintetizar", methods=["POST"])
def sintetizar_voz_route():
    audio_path = None
    try:
        data = request.get_json(silent=True) or {}
        texto = (data.get("texto") or "").strip()
        if not texto:
            return respuesta(exito=False, error="texto es requerido", status=400)

        audio_path = voice_module.sintetizar_voz(texto)
        with open(audio_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode()

        return jsonify({
            "exito": True,
            "audio_url": f"data:audio/mp3;base64,{audio_b64}",
        })
    except ValueError as e:
        return respuesta(exito=False, error=str(e), status=400)
    except Exception as e:
        logger.exception("Error sintetizando voz: %s", e)
        return respuesta(exito=False, error=str(e), status=500)
    finally:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)


@app.errorhandler(404)
def not_found(_e):
    if request.path.startswith("/api/"):
        return respuesta(exito=False, error="Endpoint no encontrado", status=404)
    return send_from_directory(WEB_STATIC, "index.html")


@app.errorhandler(500)
def server_error(_e):
    return respuesta(exito=False, error="Error interno del servidor", status=500)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
