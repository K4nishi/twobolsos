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

@router.post("/fixas", response_model=DespesaFixa)
def criar_fixa(f_in: DespesaFixaCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not check_edit_permission(session, user.id, f_in.negocio_id):
        raise HTTPException(403, "Sem permissão")
    f = DespesaFixa.from_orm(f_in)
    session.add(f)
    session.commit()
    session.refresh(f)
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
        # Logic to check if paid: data is string in new model
        foi_pago = False
        for p in pagamentos:
            d = date.fromisoformat(p.data) 
            if d.month == hoje.month and d.year == hoje.year:
                foi_pago = True
                break
        
        resposta.append({
            "id": f.id, 
            "nome": f.nome, 
            "valor": f.valor, 
            "tag": f.tag, 
            "pago_neste_mes": foi_pago
        })
    return resposta

@router.post("/fixas/{id}/pagar", response_model=Transacao)
def pagar_fixa(id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    f = session.get(DespesaFixa, id)
    if not f: raise HTTPException(404, "Não encontrada")
    
    if not check_edit_permission(session, user.id, f.negocio_id):
         raise HTTPException(403, "Sem permissão")

    hoje = date.today()
    existentes = session.exec(select(Transacao).where(Transacao.fixa_id == id)).all()
    
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
        tag=f.tag
    )
    
    session.add(t)
    session.commit()
    session.refresh(t)
    return t

@router.delete("/fixas/{id}")
def deletar_fixa(id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    f = session.get(DespesaFixa, id)
    if not f: raise HTTPException(404)
    if not check_edit_permission(session, user.id, f.negocio_id): raise HTTPException(403)
    session.delete(f)
    session.commit()
    return {"ok": True}
