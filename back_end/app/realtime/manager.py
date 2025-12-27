"""
TwoBolsos Backend - WebSocket Connection Manager
=================================================

Este módulo gerencia conexões WebSocket para atualizações em tempo real.

Funcionalidades:
    - Conexões múltiplas por usuário (multi-dispositivo)
    - Broadcast para todos os membros de uma carteira
    - Mensagens individuais para usuários específicos

Arquitetura:
    O manager mantém um dicionário que mapeia user_id para uma
    lista de conexões WebSocket. Isso permite que um usuário
    esteja conectado de vários dispositivos simultaneamente.

Tipos de mensagem:
    - 'UPDATE_DASHBOARD': Dados da carteira foram alterados
    - 'UPDATE_LIST': Lista de carteiras do usuário mudou

Fluxo de notificação:
    1. Usuário faz uma alteração (ex: nova transação)
    2. Router adiciona task em background_tasks
    3. Manager envia mensagem para todos os membros da carteira
    4. Frontend recebe e atualiza a interface

Autor: K4nishi
Versão: 3.0.0
"""

from typing import List, Dict

from fastapi import WebSocket


class ConnectionManager:
    """
    Gerenciador de conexões WebSocket para atualizações em tempo real.
    
    Esta classe mantém um registro de todas as conexões WebSocket
    ativas, organizadas por user_id. Permite que usuários recebam
    notificações instantâneas quando dados são alterados.
    
    Attributes:
        active_connections: Dicionário mapeando user_id -> lista de WebSockets
        
    Exemplo de uso:
        >>> manager = ConnectionManager()
        >>> await manager.connect(user_id=1, websocket=ws)
        >>> await manager.send_personal_message("UPDATE", user_id=1)
        >>> manager.disconnect(user_id=1, websocket=ws)
    """
    
    def __init__(self):
        """
        Inicializa o manager com dicionário vazio de conexões.
        """
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        """
        Aceita e registra uma nova conexão WebSocket.
        
        Um usuário pode ter múltiplas conexões (ex: celular e computador).
        Todas as conexões do mesmo usuário receberão as mesmas mensagens.
        
        Args:
            user_id: ID do usuário que está conectando
            websocket: Objeto WebSocket da conexão
            
        Exemplo:
            >>> @app.websocket("/ws/{user_id}")
            >>> async def ws_endpoint(websocket: WebSocket, user_id: int):
            ...     await manager.connect(user_id, websocket)
        """
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
            
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        """
        Remove uma conexão WebSocket quando ela é fechada.
        
        Remove apenas a conexão específica, mantendo outras conexões
        do mesmo usuário ativas (se houver).
        
        Args:
            user_id: ID do usuário que está desconectando
            websocket: Objeto WebSocket da conexão a remover
        """
        if user_id in self.active_connections:
            # Remove a conexão específica
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # Se não houver mais conexões, remove a entrada do dicionário
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int) -> None:
        """
        Envia uma mensagem para todas as conexões de um usuário específico.
        
        Útil para notificar apenas um usuário sobre mudanças que
        afetam apenas ele (ex: sua lista de carteiras mudou).
        
        Args:
            message: Texto da mensagem a enviar
            user_id: ID do usuário destinatário
            
        Exemplo:
            >>> # Notifica usuário 1 que sua lista de carteiras mudou
            >>> await manager.send_personal_message("UPDATE_LIST", 1)
        """
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Ignora erros de conexões já fechadas
                    pass

    async def broadcast_to_wallet(self, message: str, user_ids: List[int]) -> None:
        """
        Envia uma mensagem para todos os membros de uma carteira.
        
        Usado quando uma alteração afeta todos os membros de uma
        carteira compartilhada (ex: nova transação adicionada).
        
        Args:
            message: Texto da mensagem a enviar
            user_ids: Lista de IDs dos usuários membros da carteira
            
        Exemplo:
            >>> # Carteira com dono (id=1) e membro (id=2)
            >>> member_ids = [1, 2]
            >>> await manager.broadcast_to_wallet("UPDATE_DASHBOARD", member_ids)
        """
        for uid in user_ids:
            await self.send_personal_message(message, uid)


# Instância global do manager (singleton)
manager = ConnectionManager()
"""
Instância única do ConnectionManager usada por toda a aplicação.

Importar e usar em outros módulos:
    >>> from app.realtime.manager import manager
    >>> await manager.send_personal_message("UPDATE", user_id)
"""
