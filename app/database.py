"""
Módulo de conexión y operaciones de base de datos
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from contextlib import contextmanager
from decimal import Decimal
from typing import List, Optional
import logging

# Importar modelos
try:
    from app.models import Usuario, EstadisticasUsuarios
except ImportError:
    from models import Usuario, EstadisticasUsuarios

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Clase para manejar conexiones a la base de datos"""
    
    def __init__(self):
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'user': os.getenv('DB_USER', 'mcpuser'),
            'password': os.getenv('DB_PASSWORD', 'mcppassword'),
            'database': os.getenv('DB_NAME', 'usuarios_db')
        }
        self._test_connection()
    
    def _test_connection(self):
        """Probar conexión a la base de datos"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    logger.info("✅ Conexión a base de datos exitosa")
        except Exception as e:
            logger.error(f"❌ Error de conexión: {e}")
            raise
    
    @contextmanager
    def get_connection(self):
        """Context manager para manejar conexiones"""
        conn = psycopg2.connect(**self.config)
        try:
            yield conn
        finally:
            conn.close()

    @staticmethod
    def _json_safe(value):
        if isinstance(value, Decimal):
            return float(value)
        return value
    
    def obtener_usuarios(self, limite: int = 100, offset: int = 0) -> List[Usuario]:
        """
        Obtener lista de usuarios con paginación
        
        Args:
            limite: Número de usuarios a retornar
            offset: Número de registros a saltar
            
        Returns:
            Lista de objetos Usuario
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM usuarios 
                    ORDER BY id 
                    LIMIT %s OFFSET %s
                """, (limite, offset))
                rows = cur.fetchall()
                return [self._row_to_usuario(row) for row in rows]
    
    def obtener_usuario_por_id(self, usuario_id: int) -> Optional[Usuario]:
        """
        Obtener un usuario específico por ID
        
        Args:
            usuario_id: ID del usuario
            
        Returns:
            Objeto Usuario o None si no existe
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM usuarios WHERE id = %s", (usuario_id,))
                row = cur.fetchone()
                return self._row_to_usuario(row) if row else None
    
    def buscar_por_email(self, email: str) -> Optional[Usuario]:
        """
        Buscar usuario por email
        
        Args:
            email: Email del usuario
            
        Returns:
            Objeto Usuario o None
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM usuarios WHERE LOWER(email) = LOWER(%s)", (email,))
                row = cur.fetchone()
                return self._row_to_usuario(row) if row else None
    
    def buscar_por_nombre(self, nombre: str, limite: int = 100) -> List[Usuario]:
        """
        Buscar usuarios por nombre (búsqueda parcial)
        
        Args:
            nombre: Nombre o parte del nombre a buscar
            limite: Número máximo de resultados
            
        Returns:
            Lista de usuarios encontrados
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM usuarios 
                    WHERE LOWER(nombre) LIKE LOWER(%s)
                    ORDER BY nombre
                    LIMIT %s
                """, (f"%{nombre}%", limite))
                rows = cur.fetchall()
                return [self._row_to_usuario(row) for row in rows]
    
    def buscar_por_ciudad(self, ciudad: str, limite: int = 100) -> List[Usuario]:
        """
        Buscar usuarios por ciudad
        
        Args:
            ciudad: Nombre de la ciudad
            limite: Número máximo de resultados
            
        Returns:
            Lista de usuarios en esa ciudad
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM usuarios 
                    WHERE LOWER(ciudad) LIKE LOWER(%s)
                    ORDER BY nombre
                    LIMIT %s
                """, (f"%{ciudad}%", limite))
                rows = cur.fetchall()
                return [self._row_to_usuario(row) for row in rows]
    
    def buscar_por_pais(self, pais: str, limite: int = 100) -> List[Usuario]:
        """
        Buscar usuarios por país
        
        Args:
            pais: Nombre del país
            limite: Número máximo de resultados
            
        Returns:
            Lista de usuarios de ese país
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM usuarios 
                    WHERE LOWER(pais) LIKE LOWER(%s)
                    ORDER BY nombre
                    LIMIT %s
                """, (f"%{pais}%", limite))
                rows = cur.fetchall()
                return [self._row_to_usuario(row) for row in rows]
    
    def obtener_usuarios_por_edad(self, edad_minima: int = 0, 
                                  edad_maxima: int = 150) -> List[Usuario]:
        """
        Obtener usuarios por rango de edad
        
        Args:
            edad_minima: Edad mínima
            edad_maxima: Edad máxima
            
        Returns:
            Lista de usuarios en ese rango
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM usuarios 
                    WHERE edad >= %s AND edad <= %s
                    ORDER BY edad
                """, (edad_minima, edad_maxima))
                rows = cur.fetchall()
                return [self._row_to_usuario(row) for row in rows]
    
    def obtener_estadisticas(self) -> dict:
        """
        Obtener estadísticas generales de usuarios
        
        Returns:
            Diccionario con estadísticas
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN activo THEN 1 END) as activos,
                        COUNT(CASE WHEN activo = false THEN 1 END) as inactivos,
                        ROUND(AVG(edad)::numeric, 2) as edad_promedio,
                        MIN(edad) as edad_minima,
                        MAX(edad) as edad_maxima,
                        COUNT(DISTINCT ciudad) as ciudades_unicas,
                        COUNT(DISTINCT pais) as paises_unicos
                    FROM usuarios
                """)
                row = cur.fetchone()
                return {k: self._json_safe(v) for k, v in row.items()}
    
    def crear_usuario(self, nombre: str, email: str, edad: Optional[int] = None, 
                     ciudad: Optional[str] = None, pais: Optional[str] = None, 
                     telefono: Optional[str] = None) -> Usuario:
        """
        Crear un nuevo usuario
        
        Args:
            nombre: Nombre del usuario
            email: Email (debe ser único)
            edad: Edad (opcional)
            ciudad: Ciudad (opcional)
            pais: País (opcional)
            telefono: Teléfono (opcional)
            
        Returns:
            Objeto Usuario creado
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                try:
                    cur.execute("""
                        INSERT INTO usuarios (nombre, email, edad, ciudad, pais, telefono)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING *
                    """, (nombre, email, edad, ciudad, pais, telefono))
                    row = cur.fetchone()
                    conn.commit()
                    logger.info(f"Usuario creado: {email}")
                    return self._row_to_usuario(row)
                except psycopg2.IntegrityError as e:
                    conn.rollback()
                    logger.error(f"Error de integridad: {e}")
                    raise ValueError(f"El email {email} ya existe")
    
    def actualizar_usuario(self, usuario_id: int, **kwargs) -> Optional[Usuario]:
        """
        Actualizar un usuario
        
        Args:
            usuario_id: ID del usuario
            **kwargs: Campos a actualizar (nombre, email, edad, etc.)
            
        Returns:
            Usuario actualizado o None
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                campos = []
                valores = []
                
                for campo, valor in kwargs.items():
                    if campo in ['nombre', 'email', 'edad', 'ciudad', 'pais', 'telefono', 'activo']:
                        campos.append(f"{campo} = %s")
                        valores.append(valor)
                
                if not campos:
                    return None
                
                valores.append(usuario_id)
                
                query = f"""
                    UPDATE usuarios 
                    SET {', '.join(campos)}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING *
                """
                
                cur.execute(query, valores)
                row = cur.fetchone()
                conn.commit()
                
                if row:
                    logger.info(f"Usuario {usuario_id} actualizado")
                    return self._row_to_usuario(row)
                return None
    
    def eliminar_usuario(self, usuario_id: int) -> bool:
        """
        Eliminar un usuario (borrado lógico)
        
        Args:
            usuario_id: ID del usuario
            
        Returns:
            True si se eliminó, False si no existe
        """
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE usuarios SET activo = false WHERE id = %s", (usuario_id,))
                conn.commit()
                return cur.rowcount > 0
    
    @staticmethod
    def _row_to_usuario(row) -> Usuario:
        """Convertir una fila de base de datos a objeto Usuario"""
        if not row:
            return None
        
        return Usuario(
            id=row['id'],
            nombre=row['nombre'],
            email=row['email'],
            edad=row['edad'],
            ciudad=row['ciudad'],
            pais=row['pais'],
            telefono=row['telefono'],
            activo=row['activo'],
            created_at=row['created_at']
        )