"""
TwoBolsos Backend - Transactions Router
========================================

Router responsável por operações de transações financeiras.

Endpoints:
    POST /transacoes: Criar nova transação
    DELETE /transacoes/{id}: Deletar transação

Permissões:
    - Owner: Pode criar e deletar qualquer transação
    - Editor: Pode criar e deletar transações
    - Viewer: Não pode modificar transações

Notificações:
    Todas as alterações disparam UPDATE_DASHBOARD via WebSocket
    para todos os membros da carteira afetada.

Autor: K4nishi
Versão: 3.0.0
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session

from app.database import get_session
from app.models import Transacao, Negocio, TransacaoCreate, NegocioShare, User
from app.auth import get_current_user
from app.realtime.manager import manager


router = APIRouter(prefix="/transacoes", tags=["Transacoes"])
"""Router de transações com prefixo /transacoes"""


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

def check_edit_permission(session: Session, user_id: int, negocio_id: int) -> bool:
    """
    Verifica se o usuário tem permissão para editar a carteira.
    
    Retorna True se o usuário é:
    - Dono da carteira
    - Membro com role 'admin' ou 'editor'
    
    Args:
        session: Sessão do banco de dados
        user_id: ID do usuário a verificar
        negocio_id: ID da carteira
        
    Returns:
        bool: True se tem permissão, False caso contrário
    """
    n = session.get(Negocio, negocio_id)
    if not n: 
        return False
    
    # Dono sempre pode editar
    if n.owner_id == user_id: 
        return True
    
    # Verifica role do membro
    share = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == negocio_id, 
        NegocioShare.user_id == user_id
    ).first()
    
    if share and share.role in ['admin', 'editor']: 
        return True
        
    return False


def get_wallet_members(session: Session, negocio_id: int) -> list:
    """
    Retorna lista de IDs de todos os membros de uma carteira.
    
    Inclui o dono e todos os membros compartilhados.
    Usado para broadcast de notificações WebSocket.
    
    Args:
        session: Sessão do banco de dados
        negocio_id: ID da carteira
        
    Returns:
        list: Lista de user_ids dos membros
    """
    n = session.get(Negocio, negocio_id)
    if not n: 
        return []
    
    # Começa com o dono
    ids = [n.owner_id]
    
    # Adiciona membros compartilhados
    shares = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == negocio_id
    ).all()
    
    for s in shares:
        ids.append(s.user_id)
        
    return ids


# ============================================================
# ENDPOINTS
# ============================================================

@router.post("", response_model=Transacao)
def nova_transacao(
    t_in: TransacaoCreate, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Cria uma nova transação em uma carteira.
    
    Adiciona uma receita ou despesa à carteira especificada.
    O campo created_by_id é automaticamente preenchido com o
    ID do usuário que está criando.
    
    Args:
        t_in: Dados da transação
        background_tasks: Para enviar notificações assíncronas
        session: Sessão do banco de dados
        user: Usuário autenticado atual
        
    Returns:
        Transacao: Transação criada
        
    Raises:
        HTTPException 403: Se não tiver permissão de edição
        
    Exemplo de request:
        ```json
        POST /transacoes
        {
            "negocio_id": 1,
            "tipo": "despesa",
            "valor": 150.00,
            "descricao": "Supermercado",
            "tag": "Alimentação",
            "data": "2024-12-26",
            "km": 0,
            "litros": 0
        }
        ```
    """
    # Verifica permissão
    if not check_edit_permission(session, user.id, t_in.negocio_id):
        raise HTTPException(403, "Sem permissão para adicionar transações")

    # Cria a transação
    data = t_in.dict()
    t = Transacao(**data)
    t.created_by_id = user.id  # Registra quem criou
    
    session.add(t)
    session.commit()
    session.refresh(t)

    # Notifica todos os membros da carteira via WebSocket
    member_ids = get_wallet_members(session, t.negocio_id)
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", member_ids)

    return t


@router.delete("/{id}")
def deletar_transacao(
    id: int, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Deleta uma transação existente.
    
    Remove permanentemente uma transação do banco de dados.
    Todos os membros da carteira são notificados da alteração.
    
    Args:
        id: ID da transação a deletar
        background_tasks: Para enviar notificações assíncronas
        session: Sessão do banco de dados
        user: Usuário autenticado atual
        
    Returns:
        dict: Confirmação de sucesso
        
    Raises:
        HTTPException 404: Se transação não existir
        HTTPException 403: Se não tiver permissão
        
    Exemplo:
        ```
        DELETE /transacoes/15
        ```
    """
    # Busca a transação
    t = session.get(Transacao, id)
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # Verifica permissão
    if not check_edit_permission(session, user.id, t.negocio_id):
        raise HTTPException(403, "Sem permissão")
    
    # Guarda o negocio_id antes de deletar
    nid = t.negocio_id
    
    # Deleta
    session.delete(t)
    session.commit()

    # Notifica membros
    member_ids = get_wallet_members(session, nid)
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", member_ids)

    return {"ok": True}
