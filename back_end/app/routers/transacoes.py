from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.models import Transacao, Negocio, TransacaoCreate
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/transacoes", tags=["Transacoes"])

# Helper to check permission
def check_edit_permission(session, user_id, negocio_id):
    n = session.get(Negocio, negocio_id)
    if not n: return False
    if n.owner_id == user_id: return True
    # Check share
    share = next((s for s in n.shares if s.user_id == user_id), None)
    if share and share.role in ['admin', 'editor']: return True
    return False

@router.post("", response_model=Transacao)
def nova_transacao(t_in: TransacaoCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not check_edit_permission(session, user.id, t_in.negocio_id):
        raise HTTPException(403, "Sem permissão para adicionar transações")

    t = Transacao.from_orm(t_in)
    if isinstance(t.data, str):
        t.data = t.data 
        
    session.add(t)
    session.commit()
    session.refresh(t)
    return t

@router.delete("/{id}")
def deletar_transacao(id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    t = session.get(Transacao, id)
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    if not check_edit_permission(session, user.id, t.negocio_id):
         raise HTTPException(403, "Sem permissão")
    
    session.delete(t)
    session.commit()
    return {"ok": True}
