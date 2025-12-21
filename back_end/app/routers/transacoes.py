from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.models import Transacao, Negocio, TransacaoCreate, NegocioShare
from app.auth import get_current_user
from app.models import User
from app.realtime.manager import manager
from fastapi import BackgroundTasks

router = APIRouter(prefix="/transacoes", tags=["Transacoes"])

# Helper to check permission
def check_edit_permission(session, user_id, negocio_id):
    n = session.get(Negocio, negocio_id)
    if not n: return False
    if n.owner_id == user_id: return True
    # Check share explicitly
    share = session.query(NegocioShare).filter(
        NegocioShare.negocio_id == negocio_id, 
        NegocioShare.user_id == user_id
    ).first()
    if share and share.role in ['admin', 'editor']: return True
    return False

def get_wallet_members(session, negocio_id):
    n = session.get(Negocio, negocio_id)
    if not n: return []
    ids = [n.owner_id]
    # Explicit query
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == negocio_id).all()
    for s in shares:
        ids.append(s.user_id)
    return ids

@router.post("", response_model=Transacao)
def nova_transacao(t_in: TransacaoCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not check_edit_permission(session, user.id, t_in.negocio_id):
        raise HTTPException(403, "Sem permissão para adicionar transações")

    data = t_in.dict()
    t = Transacao(**data)
    t.created_by_id = user.id # Set Creator
    
    session.add(t)
    session.commit()
    session.refresh(t)

    # Broadcast
    member_ids = get_wallet_members(session, t.negocio_id)
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", member_ids)

    return t

@router.delete("/{id}")
def deletar_transacao(id: int, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    t = session.get(Transacao, id)
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    if not check_edit_permission(session, user.id, t.negocio_id):
         raise HTTPException(403, "Sem permissão")
    
    nid = t.negocio_id
    session.delete(t)
    session.commit()

    # Broadcast
    member_ids = get_wallet_members(session, nid)
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", member_ids)

    return {"ok": True}
