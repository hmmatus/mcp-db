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

try:
    from app.i18n import normalize_lang, t as i18n_t
except ImportError:
    from i18n import normalize_lang, t as i18n_t

logger = logging.getLogger(__name__)

_client: Optional[OpenAI] = None

SYSTEM_PROMPT_ES = """Eres un asistente que interpreta comandos de voz en español para una base de datos de usuarios.

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

SYSTEM_PROMPT_EN = """You interpret voice commands in English for a user database.

Valid command types:
- buscar_ciudad: search users in a city (params: ciudad)
- buscar_nombre: partial name search (params: nombre)
- buscar_edad: age range (params: edad_minima, edad_maxima)
- buscar_email: search by email (params: email)
- crear_usuario: create user (params: nombre, email; optional: edad, ciudad, pais, telefono)
- estadisticas: global statistics (params: {})
- eliminar_usuario: soft delete (params: usuario_id)
- listar: list users (params: optional limite, default 10)

Respond ONLY with JSON:
{
    "tipo_comando": "type",
    "parametros": {},
    "descripcion": "brief description of the interpreted command"
}"""


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(i18n_t("openai_key_missing", "en"))
        _client = OpenAI(api_key=api_key)
    return _client


def transcribir_audio(audio_file_path: str, lang: Optional[str] = None) -> str:
    """Transcribe audio with Whisper. Auto-detects language if lang is None."""
    client = get_client()
    kwargs = {"model": "whisper-1", "file": None}
    lang = normalize_lang(lang) if lang else None

    with open(audio_file_path, "rb") as f:
        create_kwargs = {"model": "whisper-1", "file": f}
        if lang in ("es", "en"):
            create_kwargs["language"] = lang
        transcript = client.audio.transcriptions.create(**create_kwargs)

    logger.info("Transcription: %s", transcript.text[:80])
    return transcript.text


def sintetizar_voz(texto: str, archivo_salida: Optional[str] = None) -> str:
    """Synthesize text to MP3 with OpenAI TTS."""
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


def procesar_comando_voz(texto_comando: str, lang: str = "es") -> dict:
    """Interpret voice command and return type, params, and description."""
    client = get_client()
    lang = normalize_lang(lang)
    system = SYSTEM_PROMPT_EN if lang == "en" else SYSTEM_PROMPT_ES

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system},
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
