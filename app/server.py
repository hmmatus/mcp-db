"""
Servidor MCP para base de datos de usuarios - OPENAI VERSION
Permite a OpenAI (ChatGPT) ejecutar herramientas para consultar y modificar usuarios
"""

import json
import os
import sys
import logging
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

# Cargar variables de entorno desde .env
load_dotenv()

# Importar módulos locales
try:
    from app.database import DatabaseConnection
except ImportError:
    from database import DatabaseConnection

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Inicializar cliente OpenAI
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    logger.error("❌ OPENAI_API_KEY no está configurada")
    logger.error("   Soluciones:")
    logger.error("   1. Crear archivo .env en la raíz del proyecto:")
    logger.error("      echo 'OPENAI_API_KEY=sk-...' > .env")
    logger.error("   2. O exportar la variable:")
    logger.error("      export OPENAI_API_KEY=sk-...")
    logger.error("   3. O agregar al docker-compose.yml:")
    logger.error("      environment:")
    logger.error("        OPENAI_API_KEY: sk-...")
    sys.exit(1)

logger.info("✅ OPENAI_API_KEY cargada correctamente")
client = OpenAI(api_key=api_key)

# Variable global para la base de datos
db = None


def inicializar_bd():
    """Inicializar conexión a la base de datos"""
    global db
    try:
        logger.info("Inicializando conexión a base de datos...")
        db = DatabaseConnection()
        logger.info("✅ Base de datos conectada exitosamente")
        return True
    except Exception as e:
        logger.error(f"❌ Error al conectar a BD: {e}")
        return False


# Definir herramientas (Functions) de OpenAI
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "obtener_usuarios",
            "description": "Obtener una lista paginada de usuarios de la base de datos",
            "parameters": {
                "type": "object",
                "properties": {
                    "limite": {
                        "type": "integer",
                        "description": "Número máximo de usuarios a retornar (por defecto: 100)",
                        "default": 100
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Número de registros a saltar para paginación",
                        "default": 0
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "obtener_usuario_por_id",
            "description": "Obtener detalles de un usuario específico por su ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "usuario_id": {
                        "type": "integer",
                        "description": "ID del usuario a buscar"
                    }
                },
                "required": ["usuario_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_por_email",
            "description": "Buscar un usuario específico por su dirección de email",
            "parameters": {
                "type": "object",
                "properties": {
                    "email": {
                        "type": "string",
                        "description": "Email exacto del usuario a buscar"
                    }
                },
                "required": ["email"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_por_nombre",
            "description": "Buscar usuarios por nombre (búsqueda parcial)",
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre o parte del nombre a buscar"
                    },
                    "limite": {
                        "type": "integer",
                        "description": "Número máximo de resultados",
                        "default": 100
                    }
                },
                "required": ["nombre"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_por_ciudad",
            "description": "Buscar usuarios que viven en una ciudad específica",
            "parameters": {
                "type": "object",
                "properties": {
                    "ciudad": {
                        "type": "string",
                        "description": "Nombre de la ciudad"
                    },
                    "limite": {
                        "type": "integer",
                        "description": "Número máximo de resultados",
                        "default": 100
                    }
                },
                "required": ["ciudad"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_por_pais",
            "description": "Buscar usuarios por país",
            "parameters": {
                "type": "object",
                "properties": {
                    "pais": {
                        "type": "string",
                        "description": "Nombre del país"
                    },
                    "limite": {
                        "type": "integer",
                        "description": "Número máximo de resultados",
                        "default": 100
                    }
                },
                "required": ["pais"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_por_edad",
            "description": "Buscar usuarios dentro de un rango de edad",
            "parameters": {
                "type": "object",
                "properties": {
                    "edad_minima": {
                        "type": "integer",
                        "description": "Edad mínima",
                        "default": 0
                    },
                    "edad_maxima": {
                        "type": "integer",
                        "description": "Edad máxima",
                        "default": 150
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "obtener_estadisticas",
            "description": "Obtener estadísticas generales sobre todos los usuarios",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "crear_usuario",
            "description": "Crear un nuevo usuario en la base de datos",
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre completo del usuario"
                    },
                    "email": {
                        "type": "string",
                        "description": "Email del usuario (debe ser único)"
                    },
                    "edad": {
                        "type": "integer",
                        "description": "Edad del usuario (opcional)"
                    },
                    "ciudad": {
                        "type": "string",
                        "description": "Ciudad del usuario (opcional)"
                    },
                    "pais": {
                        "type": "string",
                        "description": "País del usuario (opcional)"
                    },
                    "telefono": {
                        "type": "string",
                        "description": "Teléfono del usuario (opcional)"
                    }
                },
                "required": ["nombre", "email"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "actualizar_usuario",
            "description": "Actualizar información de un usuario existente",
            "parameters": {
                "type": "object",
                "properties": {
                    "usuario_id": {
                        "type": "integer",
                        "description": "ID del usuario a actualizar"
                    },
                    "nombre": {
                        "type": "string",
                        "description": "Nuevo nombre (opcional)"
                    },
                    "email": {
                        "type": "string",
                        "description": "Nuevo email (opcional)"
                    },
                    "edad": {
                        "type": "integer",
                        "description": "Nueva edad (opcional)"
                    },
                    "ciudad": {
                        "type": "string",
                        "description": "Nueva ciudad (opcional)"
                    },
                    "pais": {
                        "type": "string",
                        "description": "Nuevo país (opcional)"
                    },
                    "telefono": {
                        "type": "string",
                        "description": "Nuevo teléfono (opcional)"
                    }
                },
                "required": ["usuario_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "eliminar_usuario",
            "description": "Eliminar un usuario (desactivar su cuenta)",
            "parameters": {
                "type": "object",
                "properties": {
                    "usuario_id": {
                        "type": "integer",
                        "description": "ID del usuario a eliminar"
                    }
                },
                "required": ["usuario_id"]
            }
        }
    }
]


def ejecutar_herramienta(nombre_herramienta: str, parametros: dict) -> Any:
    """
    Ejecutar una herramienta del MCP
    
    Args:
        nombre_herramienta: Nombre de la herramienta
        parametros: Parámetros de entrada
        
    Returns:
        Resultado de la ejecución
    """
    logger.info(f"Ejecutando: {nombre_herramienta} con {parametros}")
    
    try:
        if nombre_herramienta == "obtener_usuarios":
            usuarios = db.obtener_usuarios(
                limite=parametros.get("limite", 100),
                offset=parametros.get("offset", 0)
            )
            return {
                "exito": True,
                "datos": [u.to_dict() for u in usuarios],
                "cantidad": len(usuarios)
            }
        
        elif nombre_herramienta == "obtener_usuario_por_id":
            usuario = db.obtener_usuario_por_id(parametros["usuario_id"])
            if usuario:
                return {"exito": True, "datos": usuario.to_dict()}
            else:
                return {"exito": False, "error": f"Usuario con ID {parametros['usuario_id']} no encontrado"}
        
        elif nombre_herramienta == "buscar_por_email":
            usuario = db.buscar_por_email(parametros["email"])
            if usuario:
                return {"exito": True, "datos": usuario.to_dict()}
            else:
                return {"exito": False, "error": f"Usuario con email '{parametros['email']}' no encontrado"}
        
        elif nombre_herramienta == "buscar_por_nombre":
            usuarios = db.buscar_por_nombre(
                nombre=parametros["nombre"],
                limite=parametros.get("limite", 100)
            )
            return {
                "exito": True,
                "datos": [u.to_dict() for u in usuarios],
                "cantidad": len(usuarios)
            }
        
        elif nombre_herramienta == "buscar_por_ciudad":
            usuarios = db.buscar_por_ciudad(
                ciudad=parametros["ciudad"],
                limite=parametros.get("limite", 100)
            )
            return {
                "exito": True,
                "datos": [u.to_dict() for u in usuarios],
                "cantidad": len(usuarios),
                "ciudad": parametros["ciudad"]
            }
        
        elif nombre_herramienta == "buscar_por_pais":
            usuarios = db.buscar_por_pais(
                pais=parametros["pais"],
                limite=parametros.get("limite", 100)
            )
            return {
                "exito": True,
                "datos": [u.to_dict() for u in usuarios],
                "cantidad": len(usuarios),
                "pais": parametros["pais"]
            }
        
        elif nombre_herramienta == "buscar_por_edad":
            usuarios = db.obtener_usuarios_por_edad(
                edad_minima=parametros.get("edad_minima", 0),
                edad_maxima=parametros.get("edad_maxima", 150)
            )
            return {
                "exito": True,
                "datos": [u.to_dict() for u in usuarios],
                "cantidad": len(usuarios)
            }
        
        elif nombre_herramienta == "obtener_estadisticas":
            stats = db.obtener_estadisticas()
            return {"exito": True, "datos": stats}
        
        elif nombre_herramienta == "crear_usuario":
            usuario = db.crear_usuario(
                nombre=parametros["nombre"],
                email=parametros["email"],
                edad=parametros.get("edad"),
                ciudad=parametros.get("ciudad"),
                pais=parametros.get("pais"),
                telefono=parametros.get("telefono")
            )
            return {"exito": True, "datos": usuario.to_dict(), "mensaje": "Usuario creado exitosamente"}
        
        elif nombre_herramienta == "actualizar_usuario":
            kwargs = {k: v for k, v in parametros.items() if k != "usuario_id" and v is not None}
            usuario = db.actualizar_usuario(parametros["usuario_id"], **kwargs)
            if usuario:
                return {"exito": True, "datos": usuario.to_dict(), "mensaje": "Usuario actualizado"}
            else:
                return {"exito": False, "error": f"Usuario con ID {parametros['usuario_id']} no encontrado"}
        
        elif nombre_herramienta == "eliminar_usuario":
            if db.eliminar_usuario(parametros["usuario_id"]):
                return {"exito": True, "mensaje": f"Usuario {parametros['usuario_id']} eliminado"}
            else:
                return {"exito": False, "error": f"Usuario con ID {parametros['usuario_id']} no encontrado"}
        
        else:
            return {"exito": False, "error": f"Herramienta desconocida: {nombre_herramienta}"}
    
    except Exception as e:
        logger.error(f"Error ejecutando herramienta: {e}")
        return {"exito": False, "error": str(e)}


def procesar_conversacion(mensaje_usuario: str) -> str:
    """
    Procesar una conversación con OpenAI
    
    Args:
        mensaje_usuario: Mensaje del usuario
        
    Returns:
        Respuesta de OpenAI
    """
    messages = [{"role": "user", "content": mensaje_usuario}]
    
    # Loop para manejar function calls
    max_iterations = 10
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        
        try:
            response = client.chat.completions.create(
                model="gpt-5.4-mini",  # o "gpt-3.5-turbo" para modelos más baratos
                max_completion_tokens=2048,
                tools=TOOLS,
                messages=messages
            )
        except Exception as e:
            logger.error(f"Error al llamar OpenAI API: {e}")
            return f"Error al comunicarse con OpenAI: {e}"
        
        # Verificar si OpenAI quiere usar herramientas
        if response.choices[0].finish_reason == "tool_calls":
            # Agregar respuesta del asistente
            assistant_message = {"role": "assistant", "content": response.choices[0].message.content}
            assistant_message["tool_calls"] = response.choices[0].message.tool_calls
            messages.append(assistant_message)
            
            # Ejecutar herramientas
            tool_results = []
            for tool_call in response.choices[0].message.tool_calls:
                logger.info(f"Tool call detectado: {tool_call.function.name}")
                tool_result = ejecutar_herramienta(
                    tool_call.function.name,
                    json.loads(tool_call.function.arguments)
                )
                tool_results.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": tool_call.function.name,
                    "content": json.dumps(tool_result, ensure_ascii=False)
                })
            
            # Agregar resultados
            messages.extend(tool_results)
        else:
            # Respuesta final de texto
            if response.choices[0].message.content:
                return response.choices[0].message.content
            break
    
    return "No se pudo procesar la solicitud"


def main():
    """Función principal - Servidor interactivo"""
    
    # Inicializar BD
    if not inicializar_bd():
        logger.error("No se pudo conectar a la base de datos")
        sys.exit(1)
    
    # Obtener estadísticas iniciales
    try:
        stats = db.obtener_estadisticas()
        logger.info(f"📊 Total de usuarios: {stats['total']}")
    except Exception as e:
        logger.error(f"Error al obtener estadísticas: {e}")
    
    # Interfaz interactiva
    print("\n" + "="*70)
    print("🤖 MCP USUARIOS - OpenAI ChatGPT")
    print("="*70)
    print("\nEste servidor conecta ChatGPT a tu base de datos de usuarios.")
    print("\n📝 Ejemplos de consultas:")
    print("  • Dame los primeros 5 usuarios")
    print("  • Busca usuarios en Santa Tecla")
    print("  • Cuáles son las estadísticas de usuarios?")
    print("  • Busca el usuario con email juan@gmail.com")
    print("  • Crea un nuevo usuario named Carlos con email carlos@example.com")
    print("  • Cuántos usuarios menores de 30 años hay?")
    print("\n⌨️  Escribe 'salir' para terminar.\n")
    
    while True:
        try:
            entrada = input("👤 Tú: ").strip()
            
            if entrada.lower() in ['salir', 'exit', 'quit']:
                print("\n👋 ¡Hasta luego!")
                break
            
            if not entrada:
                continue
            
            print("\n⏳ ChatGPT está procesando...\n")
            respuesta = procesar_conversacion(entrada)
            print(f"🤖 ChatGPT: {respuesta}\n")
            print("-" * 70)
            
        except KeyboardInterrupt:
            print("\n\n👋 Servidor interrumpido.")
            break
        except Exception as e:
            logger.error(f"Error: {e}")
            print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    main()