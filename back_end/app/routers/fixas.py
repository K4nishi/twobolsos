"""
TwoBolsos Backend - Fixed Expenses Router
==========================================

Router responsável por despesas fixas mensais.

Endpoints:
    POST /negocios/{id}/fixas: Criar despesa fixa
    GET /negocios/{id}/fixas: Listar fixas com status de pagamento
    POST /negocios/{id}/fixas/{fixa_id}/pagar: Marcar como paga no mês
    DELETE /negocios/{id}/fixas/{fixa_id}: Deletar despesa fixa

Conceito de Despesas Fixas:
    São contas que se repetem mensalmente (aluguel, internet, etc).
    O sistema rastreia se já foram pagas no mês atual, gerando
    uma transação quando o usuário clica em "Pagar".

Autor: K4nishi
Versão: 3.0.0
"""

from datetime import date
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select

from app.database import get_session
from app.models import (
    DespesaFixa, 
    Transacao, 
    Negocio, 
    DespesaFixaCreate, 
    User,
    NegocioShare
)
from app.auth import get_current_user
from app.realtime.manager import manager


router = APIRouter(tags=["Fixas"])
"""Router de despesas fixas (sem prefixo, usa o path completo)"""


# ============================================================
# FUNÇÕES AUXILIARES DE PERMISSÃO
# ============================================================

def check_read_permission(session: Session, user_id: int, negocio_id: int) -> bool:
    """
    Verifica se o usuário pode visualizar a carteira.
    
    Retorna True se o usuário é dono ou membro (qualquer role).
    
    Args:
        session: Sessão do banco de dados
        user_id: ID do usuário
        negocio_id: ID da carteira
        
    Returns:
        bool: True se pode visualizar
    """
    n = session.get(Negocio, negocio_id)
    if not n: 
        return False
    
    # Dono sempre pode ver
    if n.owner_id == user_id: 
        return True
    
    # Qualquer membro pode ver
    share = next((s for s in n.shares if s.user_id == user_id), None)
    return share is not None


def check_edit_permission(session: Session, user_id: int, negocio_id: int) -> bool:
    """
    Verifica se o usuário pode editar a carteira.
    
    Retorna True se é dono ou membro com role editor/admin.
    
    Args:
        session: Sessão do banco de dados
        user_id: ID do usuário
        negocio_id: ID da carteira
        
    Returns:
        bool: True se pode editar
    """
    n = session.get(Negocio, negocio_id)
    if not n: 
        return False
    
    # Dono sempre pode editar
    if n.owner_id == user_id: 
        return True
    
    # Verifica role do membro
    share = next((s for s in n.shares if s.user_id == user_id), None)
    if share and share.role in ['admin', 'editor']: 
        return True
        
    return False


# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/negocios/{id}/fixas", response_model=DespesaFixa)
def criar_fixa(
    id: int, 
    f_in: DespesaFixaCreate, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Cria uma nova despesa fixa em uma carteira.
    
    Adiciona uma conta recorrente mensal à carteira.
    O sistema irá rastrear se foi paga em cada mês.
    
    Args:
        id: ID da carteira
        f_in: Dados da despesa fixa
        background_tasks: Para notificações WebSocket
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        DespesaFixa: Despesa fixa criada
        
    Raises:
        HTTPException 403: Se não tiver permissão de edição
        
    Exemplo de request:
        ```json
        POST /negocios/1/fixas
        {
            "nome": "Internet",
            "valor": 99.90,
            "tag": "Moradia",
            "dia_vencimento": 10,
            "negocio_id": 1
        }
        ```
    """
    if not check_edit_permission(session, user.id, id):
        raise HTTPException(403, "Sem permissão")
    
    # Garante que o negocio_id é o do path
    data = f_in.dict()
    data['negocio_id'] = id
    
    f = DespesaFixa(**data)
    session.add(f)
    session.commit()
    session.refresh(f)
    
    # Notifica membros
    n = session.get(Negocio, id)
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == id).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)
    
    return f


@router.get("/negocios/{id}/fixas", response_model=List[Dict[str, Any]])
def listar_fixas_de_negocio(
    id: int, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Lista todas as despesas fixas de uma carteira com status de pagamento.
    
    Para cada despesa fixa, verifica se já existe uma transação
    de pagamento no mês atual e retorna essa informação.
    
    Args:
        id: ID da carteira
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        list: Lista de fixas com campos:
            - id: ID da despesa fixa
            - nome: Nome da despesa
            - valor: Valor mensal
            - tag: Categoria
            - pago_neste_mes: Boolean indicando se foi paga
            
    Raises:
        HTTPException 403: Se não tiver permissão de visualização
        
    Exemplo de resposta:
        ```json
        [
            {
                "id": 1,
                "nome": "Aluguel",
                "valor": 1200.00,
                "tag": "Moradia",
                "pago_neste_mes": true
            },
            {
                "id": 2,
                "nome": "Internet",
                "valor": 99.90,
                "tag": "Moradia",
                "pago_neste_mes": false
            }
        ]
        ```
    """
    if not check_read_permission(session, user.id, id):
        raise HTTPException(403, "Sem permissão")

    # Busca todas as fixas da carteira
    fixas = session.exec(
        select(DespesaFixa).where(DespesaFixa.negocio_id == id)
    ).all()
    
    hoje = date.today()
    resposta = []
    
    for f in fixas:
        # Busca transações desta fixa no mês atual
        query = select(Transacao).where(
            Transacao.fixa_id == f.id, 
            Transacao.data >= date(hoje.year, hoje.month, 1).isoformat()
        )
        pagamentos = session.exec(query).all()
        
        # Verifica se algum pagamento é do mês atual
        foi_pago = any(
            date.fromisoformat(p.data).month == hoje.month and 
            date.fromisoformat(p.data).year == hoje.year 
            for p in pagamentos
        )
        
        resposta.append({
            "id": f.id, 
            "nome": f.nome, 
            "valor": f.valor, 
            "tag": f.tag, 
            "pago_neste_mes": foi_pago
        })
        
    return resposta


@router.post("/negocios/{id}/fixas/{fixa_id}/pagar", response_model=Transacao)
def pagar_fixa(
    id: int, 
    fixa_id: int, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Registra o pagamento de uma despesa fixa no mês atual.
    
    Cria uma transação do tipo 'despesa' vinculada à despesa fixa.
    Se a fixa já foi paga neste mês, retorna erro.
    
    Args:
        id: ID da carteira
        fixa_id: ID da despesa fixa a pagar
        background_tasks: Para notificações WebSocket
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        Transacao: Transação de pagamento criada
        
    Raises:
        HTTPException 404: Se a despesa fixa não existir
        HTTPException 403: Se não tiver permissão de edição
        HTTPException 400: Se já foi paga neste mês
        
    Exemplo:
        ```
        POST /negocios/1/fixas/5/pagar
        ```
    """
    # Busca a despesa fixa
    f = session.get(DespesaFixa, fixa_id)
    if not f or f.negocio_id != id: 
        raise HTTPException(404, "Não encontrada")
    
    if not check_edit_permission(session, user.id, f.negocio_id):
        raise HTTPException(403, "Sem permissão")

    # Verifica se já foi paga neste mês
    hoje = date.today()
    existentes = session.exec(
        select(Transacao).where(Transacao.fixa_id == fixa_id)
    ).all()
    
    for t in existentes:
        d = date.fromisoformat(t.data)
        if d.month == hoje.month and d.year == hoje.year:
            raise HTTPException(400, "Já pago")
    
    # Cria transação de pagamento
    t = Transacao(
        negocio_id=f.negocio_id,
        fixa_id=f.id, 
        descricao=f"{f.nome} (Ref: {hoje.strftime('%m/%Y')})", 
        valor=f.valor,
        tipo="despesa",
        data=hoje.isoformat(), 
        tag=f.tag,
        created_by_id=user.id
    )
    
    session.add(t)
    session.commit()
    session.refresh(t)

    # Notifica membros
    n = session.get(Negocio, id)
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == id).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)
    
    return t


@router.delete("/negocios/{id}/fixas/{fixa_id}")
def deletar_fixa(
    id: int, 
    fixa_id: int, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Deleta uma despesa fixa.
    
    Remove permanentemente a despesa fixa. As transações de
    pagamento já criadas NÃO são removidas (histórico mantido).
    
    Args:
        id: ID da carteira
        fixa_id: ID da despesa fixa a deletar
        background_tasks: Para notificações WebSocket
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        dict: Confirmação de sucesso
        
    Raises:
        HTTPException 404: Se não encontrada
        HTTPException 403: Se sem permissão
    """
    f = session.get(DespesaFixa, fixa_id)
    if not f or f.negocio_id != id: 
        raise HTTPException(404)
    
    if not check_edit_permission(session, user.id, f.negocio_id): 
        raise HTTPException(403)
    
    session.delete(f)
    session.commit()

    # Notifica membros
    n = session.get(Negocio, id)
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == id).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)

    return {"ok": True}
