"""
TwoBolsos Backend - Realtime Package
=====================================

Este pacote contém módulos para comunicação em tempo real via WebSocket.

Módulos:
    - manager: Gerenciador de conexões WebSocket

Uso:
    >>> from app.realtime.manager import manager
    >>> await manager.broadcast_to_wallet("UPDATE_DASHBOARD", [1, 2, 3])
"""

from app.realtime.manager import manager

__all__ = ["manager"]
