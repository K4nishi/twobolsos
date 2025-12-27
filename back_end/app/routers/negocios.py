"""
TwoBolsos Backend - Wallets (Negocios) Router
==============================================

Router responsável por carteiras financeiras e compartilhamento.

Endpoints:
    CRUD de Carteiras:
        POST /negocios: Criar carteira
        GET /negocios: Listar carteiras do usuário
        DELETE /negocios/{id}: Deletar carteira
        GET /negocios/{id}/dashboard: Dashboard completo
        
    Compartilhamento:
        POST /negocios/{id}/invite: Gerar código de convite
        POST /negocios/join: Entrar em carteira com código
        GET /negocios/{id}/members: Listar membros
        PATCH /negocios/{id}/members/{user_id}: Alterar permissão
        DELETE /negocios/{id}/members/{user_id}: Remover membro

Dashboard:
    O endpoint /dashboard retorna todos os dados necessários para
    a interface, incluindo KPIs, gráficos e extrato de transações.

Autor: K4nishi
Versão: 3.0.0
"""

from datetime import date, timedelta, datetime
from typing import List, Dict, Any
import random
import string

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.models import (
    Negocio, 
    Transacao, 
    User, 
    NegocioShare, 
    InviteCode, 
    NegocioBase
)
from app.auth import get_current_user
from app.realtime.manager import manager


router = APIRouter(prefix="/negocios", tags=["Negocios"])
"""Router de carteiras com prefixo /negocios"""


# ============================================================
# SCHEMAS AUXILIARES
# ============================================================

class RoleUpdate(BaseModel):
    """Schema para atualização de role de membro."""
    role: str


# ============================================================
# CRUD DE CARTEIRAS
# ============================================================

@router.post("", response_model=Negocio)
def criar_negocio(
    n_in: NegocioBase, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Cria uma nova carteira para o usuário autenticado.
    
    O usuário se torna automaticamente o dono (owner) da carteira.
    Após criação, uma notificação é enviada para atualizar a lista.
    
    Args:
        n_in: Dados da carteira (nome, categoria, cor)
        background_tasks: Para notificações assíncronas
        session: Sessão do banco de dados
        user: Usuário autenticado (será o dono)
        
    Returns:
        Negocio: Carteira criada
        
    Exemplo de request:
        ```json
        POST /negocios
        {
            "nome": "Uber Março",
            "categoria": "MOTORISTA",
            "cor": "#22c55e"
        }
        ```
    """
    # Cria carteira com usuário como dono
    data = n_in.dict()
    n = Negocio(**data, owner_id=user.id)
    
    session.add(n)
    session.commit()
    session.refresh(n)
    
    # Notifica usuário para atualizar lista de carteiras
    background_tasks.add_task(manager.send_personal_message, "UPDATE_LIST", user.id)
    
    return n


@router.get("", response_model=List[Dict[str, Any]])
def listar_negocios(
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Lista todas as carteiras do usuário (próprias e compartilhadas).
    
    Retorna carteiras onde o usuário é dono ou membro convidado,
    incluindo o saldo atual calculado e a role do usuário.
    
    Args:
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        list: Lista de carteiras com:
            - id: ID da carteira
            - nome: Nome da carteira
            - categoria: 'PADRAO' ou 'MOTORISTA'
            - cor: Cor hexadecimal
            - saldo: Receitas - Despesas
            - role: 'owner', 'editor' ou 'viewer'
            - owner_name: Nome do dono (ou "Você")
    """
    # Carteiras próprias
    owned = session.query(Negocio).filter(Negocio.owner_id == user.id).all()
    
    # Carteiras compartilhadas
    shared_links = session.query(NegocioShare).filter(
        NegocioShare.user_id == user.id
    ).all()
    shared = [link.negocio for link in shared_links]
    
    all_negocios = owned + shared
    
    lista = []
    for n in all_negocios:
        # Determina a role do usuário
        is_owner = n.owner_id == user.id
        role = "owner"
        if not is_owner:
            share_link = next(
                (s for s in shared_links if s.negocio_id == n.id), 
                None
            )
            role = share_link.role if share_link else "viewer"

        # Calcula saldo
        rec = sum(t.valor for t in n.transacoes if t.tipo == 'receita')
        desp = sum(t.valor for t in n.transacoes if t.tipo == 'despesa')
        
        lista.append({
            "id": n.id, 
            "nome": n.nome, 
            "categoria": n.categoria, 
            "cor": n.cor, 
            "saldo": rec - desp,
            "role": role,
            "owner_name": n.owner.username if not is_owner else "Você"
        })
        
    return lista


@router.delete("/{id}")
def deletar_negocio(
    id: int, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Deleta uma carteira (apenas dono pode deletar).
    
    Remove a carteira e todas as transações associadas (cascade).
    Membros compartilhados perdem acesso automaticamente.
    
    Args:
        id: ID da carteira a deletar
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        dict: Confirmação de sucesso
        
    Raises:
        HTTPException 404: Se carteira não existe
        HTTPException 403: Se não é o dono
    """
    n = session.get(Negocio, id)
    if not n:
        raise HTTPException(status_code=404, detail="Negocio não encontrado")
    
    if n.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Apenas o dono pode deletar")
    
    session.delete(n)
    session.commit()
    
    return {"ok": True}


@router.get("/{id}/dashboard")
def get_dashboard(
    id: int, 
    dias: int = 7, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Retorna dados completos do dashboard de uma carteira.
    
    Inclui KPIs (totais, média), dados para gráficos (linha e pizza)
    e extrato completo de transações ordenado por data.
    
    Args:
        id: ID da carteira
        dias: Quantidade de dias para o gráfico de linha (default: 7)
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        dict: Dados do dashboard contendo:
            - negocio: Dados da carteira
            - role: Role do usuário ('owner'/'editor'/'viewer')
            - kpis: Receita, despesa, saldo, KM, litros, autonomia
            - grafico: Dados para gráfico de linha (últimos N dias)
            - pizza: Dados para gráfico de pizza (gastos por categoria)
            - extrato: Lista de transações com nome do criador
            
    Raises:
        HTTPException 404: Se carteira não existe
        HTTPException 403: Se não tem permissão
        
    Estrutura do retorno:
        ```json
        {
            "negocio": {...},
            "role": "owner",
            "kpis": {
                "receita": 5000.00,
                "despesa": 3500.00,
                "saldo": 1500.00,
                "total_km": 1200,
                "total_litros": 150,
                "autonomia": 8.0,
                "rendimento": 1.25
            },
            "grafico": {
                "labels": ["20/12", "21/12", ...],
                "receitas": [200, 0, 150, ...],
                "despesas": [50, 100, 30, ...]
            },
            "pizza": {
                "Alimentação": 500,
                "Transporte": 300,
                "Lazer": 200
            },
            "extrato": [...]
        }
        ```
    """
    # Verifica existência e permissão
    n = session.get(Negocio, id)
    if not n: 
        raise HTTPException(404)
    
    is_owner = n.owner_id == user.id
    share_link = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == id, 
        NegocioShare.user_id == user.id
    ).first()
    
    if not is_owner and not share_link:
        raise HTTPException(403, "Sem permissão")
    
    # Busca transações ordenadas por data
    transacoes = session.exec(
        select(Transacao)
        .where(Transacao.negocio_id == id)
        .order_by(Transacao.data.desc())
    ).all()
    
    # ==================== KPIs ====================
    rec = sum(t.valor for t in transacoes if t.tipo == 'receita')
    desp = sum(t.valor for t in transacoes if t.tipo == 'despesa')
    km = sum(t.km for t in transacoes if t.km)
    lit = sum(t.litros for t in transacoes if t.litros)
    
    # Autonomia (KM por litro)
    kml = km / lit if lit > 0 else 0.0
    
    # Rendimento por KM rodado
    rendimento_km = (rec - desp) / km if km > 0 else 0.0

    # ==================== Gráfico de Linha ====================
    hoje = date.today()
    grafico_linha = {"labels": [], "receitas": [], "despesas": []}
    
    for i in range(dias - 1, -1, -1):
        dia = hoje - timedelta(days=i)
        dia_str = dia.isoformat() 
        grafico_linha["labels"].append(dia.strftime("%d/%m"))
        
        do_dia = [t for t in transacoes if t.data == dia_str]
        grafico_linha["receitas"].append(
            sum(t.valor for t in do_dia if t.tipo == 'receita')
        )
        grafico_linha["despesas"].append(
            sum(t.valor for t in do_dia if t.tipo == 'despesa')
        )

    # ==================== Gráfico de Pizza ====================
    mes_inicio = (hoje - timedelta(days=30)).isoformat()
    gastos_pizza = {}
    
    for t in transacoes:
        if t.tipo == 'despesa' and t.data >= mes_inicio:
            cat = t.tag if t.tag else "Outros"
            gastos_pizza[cat] = gastos_pizza.get(cat, 0) + t.valor

    # ==================== Extrato Enriquecido ====================
    extrato_rich = []
    for t in transacoes:
        t_dict = t.dict()
        # Adiciona nome do criador
        if t.created_by:
            t_dict["created_by_name"] = t.created_by.username
        else:
            t_dict["created_by_name"] = "N/A"
        extrato_rich.append(t_dict)

    return {
        "negocio": n,
        "role": "owner" if is_owner else share_link.role,
        "kpis": {
            "receita": rec, 
            "despesa": desp, 
            "saldo": rec - desp, 
            "total_km": km, 
            "total_litros": lit, 
            "autonomia": kml, 
            "rendimento": rendimento_km
        },
        "grafico": grafico_linha,
        "pizza": gastos_pizza,
        "extrato": extrato_rich
    }


# ============================================================
# SISTEMA DE COMPARTILHAMENTO
# ============================================================

@router.post("/{id}/invite")
def create_invite(
    id: int, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Gera um código de convite para a carteira (válido por 24h).
    
    Apenas o dono pode gerar códigos de convite. O código gerado
    é alfanumérico de 6 caracteres e expira em 24 horas.
    
    Args:
        id: ID da carteira
        session: Sessão do banco de dados
        user: Usuário autenticado (deve ser dono)
        
    Returns:
        dict: Código gerado e data de expiração
            - code: Código de 6 caracteres (ex: "A3B5K9")
            - expires: Data/hora de expiração
            
    Raises:
        HTTPException 403: Se não é o dono
        
    Exemplo de resposta:
        ```json
        {
            "code": "A3B5K9",
            "expires": "2024-12-27T21:50:38"
        }
        ```
    """
    n = session.get(Negocio, id)
    if not n or n.owner_id != user.id:
        raise HTTPException(403, "Apenas dono pode convidar")
    
    # Gera código aleatório de 6 caracteres
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    invite = InviteCode(
        code=code, 
        negocio_id=n.id, 
        expires_at=datetime.utcnow() + timedelta(days=1)
    )
    
    session.add(invite)
    session.commit()
    
    return {"code": code, "expires": invite.expires_at}


@router.post("/join")
def join_negocio(
    code: str, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Entra em uma carteira usando código de convite.
    
    O usuário torna-se membro da carteira com role 'editor'.
    Se já for membro, mantém a role atual (não é erro).
    
    Args:
        code: Código de convite de 6 caracteres
        background_tasks: Para notificações assíncronas
        session: Sessão do banco de dados
        user: Usuário autenticado (será o novo membro)
        
    Returns:
        dict: Mensagem de sucesso e nome da carteira
        
    Raises:
        HTTPException 404: Se código inválido
        HTTPException 400: Se código expirado ou é o dono
        
    Exemplo:
        ```
        POST /negocios/join?code=A3B5K9
        ```
    """
    # Busca código ativo
    invite = session.query(InviteCode).filter(
        InviteCode.code == code, 
        InviteCode.active == True
    ).first()
    
    if not invite:
        raise HTTPException(404, "Código inválido")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(400, "Código expirado")
    
    n = session.get(Negocio, invite.negocio_id)
    
    # Verifica se é o próprio dono
    if n.owner_id == user.id:
        raise HTTPException(400, "Você é o dono")
    
    # Verifica se já é membro
    exists = session.query(NegocioShare).filter(
        NegocioShare.user_id == user.id, 
        NegocioShare.negocio_id == invite.negocio_id
    ).first()
    
    if not exists:
        # Cria novo compartilhamento
        share = NegocioShare(
            user_id=user.id, 
            negocio_id=invite.negocio_id, 
            role="editor"
        )
        session.add(share)
        session.commit()
    
    # Notifica todos os membros
    shares = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == n.id
    ).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)
    
    return {"msg": "Entrou no bolso com sucesso!", "negocio": n.nome}


@router.get("/{id}/members")
def list_members(
    id: int, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Lista todos os membros de uma carteira.
    
    Retorna o dono e todos os membros compartilhados com suas
    respectivas roles. Qualquer membro pode visualizar a lista.
    
    Args:
        id: ID da carteira
        session: Sessão do banco de dados
        user: Usuário autenticado
        
    Returns:
        list: Lista de membros com:
            - user_id: ID do usuário
            - username: Nome do usuário
            - role: 'owner', 'editor' ou 'viewer'
            
    Raises:
        HTTPException 404: Se carteira não existe
        HTTPException 403: Se não é membro
    """
    n = session.get(Negocio, id)
    if not n:
        raise HTTPException(404, "Negocio não encontrado")
        
    # Verifica se é membro
    is_owner = n.owner_id == user.id
    share = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == id, 
        NegocioShare.user_id == user.id
    ).first()
    
    if not is_owner and not share: 
        raise HTTPException(403, "Sem permissão")
    
    # Monta lista de membros
    shares = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == id
    ).all()
    
    members = []
    
    # Adiciona dono primeiro
    members.append({
        "user_id": n.owner_id, 
        "username": n.owner.username, 
        "role": "owner"
    })
    
    # Adiciona compartilhados
    for s in shares:
        members.append({
            "user_id": s.user_id, 
            "username": s.user.username, 
            "role": s.role
        })
        
    return members


@router.patch("/{id}/members/{user_id}")
def update_member_role(
    id: int, 
    user_id: int, 
    role_data: RoleUpdate, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Altera a role (permissão) de um membro.
    
    Apenas o dono pode alterar permissões. Roles válidas:
    - 'editor': Pode adicionar/remover transações
    - 'viewer': Apenas visualização
    
    Args:
        id: ID da carteira
        user_id: ID do membro a alterar
        role_data: Nova role desejada
        background_tasks: Para notificações
        session: Sessão do banco de dados
        user: Usuário autenticado (deve ser dono)
        
    Returns:
        dict: Confirmação de sucesso
        
    Raises:
        HTTPException 403: Se não é o dono
        HTTPException 404: Se membro não existe
        HTTPException 400: Se role é inválida
    """
    n = session.get(Negocio, id)
    if n.owner_id != user.id:
        raise HTTPException(403, "Apenas dono pode gerenciar membros")
        
    share = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == id, 
        NegocioShare.user_id == user_id
    ).first()
    
    if not share:
        raise HTTPException(404, "Membro não encontrado")
    
    if role_data.role not in ['editor', 'viewer']:
        raise HTTPException(400, "Role inválida")

    share.role = role_data.role
    session.add(share)
    session.commit()

    # Notifica membros
    shares = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == id
    ).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)

    return {"ok": True}


@router.delete("/{id}/members/{user_id}")
def remove_member(
    id: int, 
    user_id: int, 
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
    user: User = Depends(get_current_user)
):
    """
    Remove um membro da carteira.
    
    O membro perde acesso imediatamente. As transações que
    ele criou permanecem no histórico.
    
    Args:
        id: ID da carteira
        user_id: ID do membro a remover
        background_tasks: Para notificações
        session: Sessão do banco de dados
        user: Usuário autenticado (deve ser dono)
        
    Returns:
        dict: Confirmação de sucesso
        
    Raises:
        HTTPException 403: Se não é o dono
    """
    n = session.get(Negocio, id)
    if n.owner_id != user.id:
        raise HTTPException(403, "Apenas dono pode remover membros")
    
    share = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == id, 
        NegocioShare.user_id == user_id
    ).first()
    
    if share:
        session.delete(share)
        session.commit()
    
    # Notifica todos os membros (incluindo o removido)
    shares = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == id
    ).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    all_ids.append(user_id)  # Notifica usuário removido também
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)

    return {"ok": True}
