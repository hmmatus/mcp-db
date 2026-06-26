"""
Modelos de datos para el servidor MCP de Usuarios
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Usuario:
    """Modelo de Usuario"""
    id: int
    nombre: str
    email: str
    edad: Optional[int]
    ciudad: Optional[str]
    pais: Optional[str]
    telefono: Optional[str]
    activo: bool
    created_at: datetime
    
    def to_dict(self):
        """Convertir usuario a diccionario"""
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'edad': self.edad,
            'ciudad': self.ciudad,
            'pais': self.pais,
            'telefono': self.telefono,
            'activo': self.activo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f"Usuario(id={self.id}, nombre='{self.nombre}', email='{self.email}')"


@dataclass
class EstadisticasUsuarios:
    """Modelo para estadísticas de usuarios"""
    total: int
    activos: int
    edad_promedio: float
    ciudades_unicas: int
    paises_unicos: int
    
    def to_dict(self):
        return {
            'total': self.total,
            'activos': self.activos,
            'edad_promedio': round(self.edad_promedio, 2) if self.edad_promedio else 0,
            'ciudades_unicas': self.ciudades_unicas,
            'paises_unicos': self.paises_unicos
        }