"""
Módulo de voz: Whisper (transcripción), TTS y interpretación de comandos
"""

import json
import logging
import os
import tempfile
import uuid
from typing import Optional

from openai import OpenAI

logger = logging.getLogger(__name__)

_client: Optional[OpenAI] = None

SYSTEM_PROMPT = """Eres un asistente que interpreta comandos de voz en español para una base de datos de usuarios.

Tipos de comando válidos:
- buscar_ciudad: buscar usuarios en una ciudad (parametros: ciudad)
- buscar_nombre: buscar por nombre parcial (parametros: nombre)
- buscar_edad: rango de edad (parametros: edad_minima, edad_maxima)
- buscar_email: buscar por email (parametros: email)
- crear_usuario: crear usuario (parametros: nombre, email; opcionales: edad, ciudad, pais, telefono)
- estadisticas: estadísticas globales (parametros: {})
- eliminar_usuario: borrado lógico (parametros: usuario_id)
- listar: listar usuarios (parametros: limite opcional, default 10)

Responde SOLO JSON con esta estructura:
{
    "tipo_comando": "tipo",
    "parametros": {},
    "descripcion": "breve descripción del comando interpretado"
}"""


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY no está configurada")
        _client = OpenAI(api_key=api_key)
    return _client


def transcribir_audio(audio_file_path: str) -> str:
    """Transcribe audio MP3/WAV/WebM con Whisper."""
    client = get_client()
    with open(audio_file_path, "rb") as f:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            language="es",
        )
    logger.info("Transcripción: %s", transcript.text[:80])
    return transcript.text


def sintetizar_voz(texto: str, archivo_salida: Optional[str] = None) -> str:
    """Sintetiza texto a MP3 con OpenAI TTS. Retorna ruta del archivo."""
    client = get_client()
    if not archivo_salida:
        archivo_salida = os.path.join(tempfile.gettempdir(), f"tts_{uuid.uuid4().hex}.mp3")

    response = client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=texto[:4096],
    )
    response.stream_to_file(archivo_salida)
    return archivo_salida


def procesar_comando_voz(texto_comando: str) -> dict:
    """Interpreta comando de voz y retorna tipo, parámetros y descripción."""
    client = get_client()
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": texto_comando},
        ],
        response_format={"type": "json_object"},
    )
    parsed = json.loads(response.choices[0].message.content)
    return {
        "tipo_comando": parsed.get("tipo_comando", ""),
        "parametros": parsed.get("parametros", {}),
        "descripcion": parsed.get("descripcion", ""),
    }
