from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.models import Transacao

router = APIRouter(prefix="/transacoes", tags=["Transacoes"])

@router.post("", response_model=Transacao)
def nova_transacao(t: Transacao, session: Session = Depends(get_session)):
    # SQLModel/Pydantic automatically parses strings to date, but if manual intervention is needed:
    if isinstance(t.data, str):
        t.data = date.fromisoformat(t.data)
        
    session.add(t)
    session.commit()
    session.refresh(t)
    return t

@router.delete("/{id}")
def deletar_transacao(id: int, session: Session = Depends(get_session)):
    t = session.get(Transacao, id)
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    session.delete(t)
    session.commit()
    return {"ok": True}
