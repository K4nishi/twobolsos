from datetime import date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import DespesaFixa, Transacao, Negocio, DespesaFixaCreate
from app.auth import get_current_user
from app.models import User

router = APIRouter(tags=["Fixas"]) 

def check_read_permission(session, user_id, negocio_id):
    n = session.get(Negocio, negocio_id)
    if not n: return False
    if n.owner_id == user_id: return True
    share = next((s for s in n.shares if s.user_id == user_id), None)
    return share is not None

def check_edit_permission(session, user_id, negocio_id):
    n = session.get(Negocio, negocio_id)
    if not n: return False
    if n.owner_id == user_id: return True
    share = next((s for s in n.shares if s.user_id == user_id), None)
    if share and share.role in ['admin', 'editor']: return True
    return False

from fastapi import BackgroundTasks
from app.realtime.manager import manager
from app.models import NegocioShare

@router.post("/negocios/{id}/fixas", response_model=DespesaFixa)
def criar_fixa(id: int, f_in: DespesaFixaCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not check_edit_permission(session, user.id, id):
        raise HTTPException(403, "Sem permissão")
    
    # Override negocio_id in input to be safe, or just check
    data = f_in.dict()
    data['negocio_id'] = id
    
    f = DespesaFixa(**data)
    session.add(f)
    session.commit()
    session.refresh(f)
    
    # Broadcast
    n = session.get(Negocio, id)
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == id).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)
    
    return f

@router.get("/negocios/{id}/fixas", response_model=List[Dict[str, Any]])
def listar_fixas_de_negocio(id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not check_read_permission(session, user.id, id):
        raise HTTPException(403, "Sem permissão")

    fixas = session.exec(select(DespesaFixa).where(DespesaFixa.negocio_id == id)).all()
    hoje = date.today()
    resposta = []
    
    for f in fixas:
        query = select(Transacao).where(
            Transacao.fixa_id == f.id, 
            Transacao.data >= date(hoje.year, hoje.month, 1).isoformat()
        )
        pagamentos = session.exec(query).all()
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
def pagar_fixa(id: int, fixa_id: int, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    f = session.get(DespesaFixa, fixa_id)
    if not f or f.negocio_id != id: raise HTTPException(404, "Não encontrada")
    
    if not check_edit_permission(session, user.id, f.negocio_id):
         raise HTTPException(403, "Sem permissão")

    hoje = date.today()
    existentes = session.exec(select(Transacao).where(Transacao.fixa_id == fixa_id)).all()
    
    for t in existentes:
        d = date.fromisoformat(t.data)
        if d.month == hoje.month and d.year == hoje.year:
            raise HTTPException(400, "Já pago")
    
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

    # Broadcast
    n = session.get(Negocio, id)
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == id).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)
    
    return t

@router.delete("/negocios/{id}/fixas/{fixa_id}")
def deletar_fixa(id: int, fixa_id: int, background_tasks: BackgroundTasks, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    f = session.get(DespesaFixa, fixa_id)
    if not f or f.negocio_id != id: raise HTTPException(404)
    if not check_edit_permission(session, user.id, f.negocio_id): raise HTTPException(403)
    
    session.delete(f)
    session.commit()

    # Broadcast
    n = session.get(Negocio, id)
    shares = session.query(NegocioShare).filter(NegocioShare.negocio_id == id).all()
    all_ids = [n.owner_id] + [s.user_id for s in shares]
    background_tasks.add_task(manager.broadcast_to_wallet, "UPDATE_DASHBOARD", all_ids)

    return {"ok": True}
