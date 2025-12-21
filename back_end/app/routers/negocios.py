from datetime import date, timedelta, datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.database import get_session
from app.models import Negocio, Transacao, User, NegocioShare, InviteCode, NegocioBase
from app.auth import get_current_user
from app.realtime.manager import manager
import random
import string

router = APIRouter(prefix="/negocios", tags=["Negocios"])

@router.post("", response_model=Negocio)
def criar_negocio(n_in: NegocioBase, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    # Create dictionary from input and add owner_id before instantiating
    data = n_in.dict()
    n = Negocio(**data, owner_id=user.id)
    session.add(n)
    session.commit()
    session.refresh(n)
    background_tasks.add_task(manager.send_personal_message, "UPDATE_LIST", user.id)
    return n

@router.get("", response_model=List[Dict[str, Any]])
def listar_negocios(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    # Get Owned
    owned = session.query(Negocio).filter(Negocio.owner_id == user.id).all()
    # Get Shared
    shared_links = session.query(NegocioShare).filter(NegocioShare.user_id == user.id).all()
    shared = [link.negocio for link in shared_links]
    
    all_negocios = owned + shared
    
    lista = []
    for n in all_negocios:
        # Determine Role
        is_owner = n.owner_id == user.id
        role = "owner"
        if not is_owner:
            share_link = next((s for s in shared_links if s.negocio_id == n.id), None)
            role = share_link.role if share_link else "viewer"

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
def deletar_negocio(id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    n = session.get(Negocio, id)
    if not n:
        raise HTTPException(status_code=404, detail="Negocio não encontrado")
    if n.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Apenas o dono pode deletar")
    
    session.delete(n)
    session.commit()
    return {"ok": True}

@router.get("/{id}/dashboard")
def get_dashboard(id: int, dias: int = 7, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    # Access Check
    n = session.get(Negocio, id)
    if not n: raise HTTPException(404)
    
    # Check permissions
    is_owner = n.owner_id == user.id
    share_link = session.query(NegocioShare).filter(NegocioShare.negocio_id == id, NegocioShare.user_id == user.id).first()
    
    if not is_owner and not share_link:
        raise HTTPException(403, "Sem permissão")
    
    # Get Transactions
    transacoes = session.exec(select(Transacao).where(Transacao.negocio_id == id).order_by(Transacao.data.desc())).all()
    
    # ... Same KPI logic as before ...
    rec = sum(t.valor for t in transacoes if t.tipo == 'receita')
    desp = sum(t.valor for t in transacoes if t.tipo == 'despesa')
    km = sum(t.km for t in transacoes if t.km)
    lit = sum(t.litros for t in transacoes if t.litros)
    
    kml = km / lit if lit > 0 else 0.0
    rendimento_km = (rec - desp) / km if km > 0 else 0.0

    hoje = date.today()
    grafico_linha = {"labels": [], "receitas": [], "despesas": []}
    for i in range(dias - 1, -1, -1):
        dia = hoje - timedelta(days=i)
        dia_str = dia.isoformat() 
        grafico_linha["labels"].append(dia.strftime("%d/%m"))
        do_dia = [t for t in transacoes if t.data == dia_str]
        grafico_linha["receitas"].append(sum(t.valor for t in do_dia if t.tipo == 'receita'))
        grafico_linha["despesas"].append(sum(t.valor for t in do_dia if t.tipo == 'despesa'))

    mes_inicio = (hoje - timedelta(days=30)).isoformat()
    gastos_pizza = {}
    for t in transacoes:
        if t.tipo == 'despesa' and t.data >= mes_inicio:
            cat = t.tag if t.tag else "Outros"
            gastos_pizza[cat] = gastos_pizza.get(cat, 0) + t.valor

    # Enhance transactions with creator name
    extrato_rich = []
    for t in transacoes:
        t_dict = t.dict()
        if t.created_by:
            t_dict["created_by_name"] = t.created_by.username
        else:
            t_dict["created_by_name"] = "N/A"
        extrato_rich.append(t_dict)

    return {
        "negocio": n,
        "role": "owner" if is_owner else share_link.role,
        "kpis": {"receita": rec, "despesa": desp, "saldo": rec - desp, "total_km": km, "total_litros": lit, "autonomia": kml, "rendimento": rendimento_km},
        "grafico": grafico_linha,
        "pizza": gastos_pizza,
        "extrato": extrato_rich
    }

# --- SHARING FEATURES ---

@router.post("/{id}/invite")
def create_invite(id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    n = session.get(Negocio, id)
    if not n or n.owner_id != user.id:
        raise HTTPException(403, "Apenas dono pode convidar")
    
    # Generate Code
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    invite = InviteCode(code=code, negocio_id=n.id, expires_at=datetime.utcnow()+timedelta(days=1))
    session.add(invite)
    session.commit()
    return {"code": code, "expires": invite.expires_at}

@router.post("/join")
def join_negocio(code: str, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    invite = session.query(InviteCode).filter(InviteCode.code == code, InviteCode.active == True).first()
    if not invite:
        raise HTTPException(404, "Código inválido")
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(400, "Código expirado")
    
    # Check if already member
    exists = session.query(NegocioShare).filter(NegocioShare.user_id == user.id, NegocioShare.negocio_id == invite.negocio_id).first()
    n = session.get(Negocio, invite.negocio_id)
    if n.owner_id == user.id:
        raise HTTPException(400, "Você é o dono")
    
    if not exists:
        share = NegocioShare(user_id=user.id, negocio_id=invite.negocio_id, role="editor")
        session.add(share)
        session.commit()
        # Notify owner/others?
        background_tasks.add_task(manager.send_personal_message, "UPDATE_LIST", user.id)
    
    return {"msg": "Entrou no bolso com sucesso!", "negocio": n.nome}

@router.get("/{id}/members")
def list_members(id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    n = session.get(Negocio, id)
    # Allow if member or owner
    is_owner = n.owner_id == user.id
    share = session.query(NegocioShare).filter(NegocioShare.negocio_id == id, NegocioShare.user_id == user.id).first()
    if not is_owner and not share: raise HTTPException(403, "Sem permissão")
    
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == id).all()
    members = []
    for s in shares:
        members.append({"user_id": s.user_id, "username": s.user.username, "role": s.role})
    return members

from pydantic import BaseModel
class RoleUpdate(BaseModel):
    role: str

@router.patch("/{id}/members/{user_id}")
def update_member_role(id: int, user_id: int, role_data: RoleUpdate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    n = session.get(Negocio, id)
    if n.owner_id != user.id:
        raise HTTPException(403, "Apenas dono pode gerenciar membros")
        
    share = session.query(NegocioShare).filter(NegocioShare.negocio_id == id, NegocioShare.user_id == user_id).first()
    if not share:
        raise HTTPException(404, "Membro não encontrado")
    
    if role_data.role not in ['editor', 'viewer']:
         raise HTTPException(400, "Role inválida")

    share.role = role_data.role
    session.add(share)
    session.commit()
    return {"ok": True}

@router.delete("/{id}/members/{user_id}")
def remove_member(id: int, user_id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    n = session.get(Negocio, id)
    if n.owner_id != user.id:
        raise HTTPException(403, "Apenas dono pode remover membros")
    
    share = session.query(NegocioShare).filter(NegocioShare.negocio_id == id, NegocioShare.user_id == user_id).first()
    if share:
        session.delete(share)
        session.commit()
    return {"ok": True}
