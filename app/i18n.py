"""API message translations (ES / EN)."""

MESSAGES = {
    "ok": {"es": "OK", "en": "OK"},
    "user_not_found": {"es": "Usuario no encontrado", "en": "User not found"},
    "name_email_required": {"es": "nombre y email son requeridos", "en": "name and email are required"},
    "user_created": {"es": "Usuario creado", "en": "User created"},
    "no_update_data": {"es": "No hay datos para actualizar", "en": "No data to update"},
    "user_updated": {"es": "Usuario actualizado", "en": "User updated"},
    "user_deleted": {"es": "Usuario eliminado (borrado lógico)", "en": "User deleted (soft delete)"},
    "email_required": {"es": "email es requerido", "en": "email is required"},
    "name_required": {"es": "nombre es requerido", "en": "name is required"},
    "city_required": {"es": "ciudad es requerida", "en": "city is required"},
    "age_range_invalid": {
        "es": "edad_minima no puede ser mayor que edad_maxima",
        "en": "edad_minima cannot be greater than edad_maxima",
    },
    "endpoint_not_found": {"es": "Endpoint no encontrado", "en": "Endpoint not found"},
    "internal_error": {"es": "Error interno del servidor", "en": "Internal server error"},
    "no_audio": {"es": "No se recibió archivo de audio", "en": "No audio file received"},
    "command_required": {"es": "comando es requerido", "en": "command is required"},
    "text_required": {"es": "texto es requerido", "en": "text is required"},
    "openai_key_missing": {
        "es": "OPENAI_API_KEY no está configurada",
        "en": "OPENAI_API_KEY is not configured",
    },
}


def normalize_lang(lang: str | None) -> str:
    if not lang:
        return "es"
    return "en" if lang.lower().startswith("en") else "es"


def resolve_lang(request=None, explicit: str | None = None) -> str:
    if explicit:
        return normalize_lang(explicit)
    if request is not None:
        header = request.headers.get("Accept-Language", "")
        query = request.args.get("lang")
        body_lang = None
        if request.is_json:
            body = request.get_json(silent=True) or {}
            body_lang = body.get("lang")
        return normalize_lang(query or body_lang or header)
    return "es"


def t(key: str, lang: str = "es") -> str:
    entry = MESSAGES.get(key)
    if not entry:
        return key
    return entry.get(lang, entry.get("es", key))
