from datetime import date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import DespesaFixa, Transacao

router = APIRouter(tags=["Fixas"]) # No prefix to allow flexible paths

@router.post("/fixas", response_model=DespesaFixa)
def criar_fixa(f: DespesaFixa, session: Session = Depends(get_session)):
    session.add(f)
    session.commit()
    session.refresh(f)
    return f

@router.get("/negocios/{id}/fixas", response_model=List[Dict[str, Any]])
def listar_fixas_de_negocio(id: int, session: Session = Depends(get_session)):
    fixas = session.exec(select(DespesaFixa).where(DespesaFixa.negocio_id == id)).all()
    hoje = date.today()
    resposta = []
    
    for f in fixas:
        # Check if paid this month
        query = select(Transacao).where(
            Transacao.fixa_id == f.id, 
            Transacao.data >= date(hoje.year, hoje.month, 1)
        )
        pagamentos = session.exec(query).all()
        foi_pago = any(p.data.month == hoje.month and p.data.year == hoje.year for p in pagamentos)
        
        resposta.append({
            "id": f.id, 
            "nome": f.nome, 
            "valor": f.valor, 
            "tag": f.tag, 
            "pago_neste_mes": foi_pago
        })
    return resposta

@router.post("/fixas/{id}/pagar", response_model=Transacao)
def pagar_fixa(id: int, session: Session = Depends(get_session)):
    f = session.get(DespesaFixa, id)
    if not f:
        raise HTTPException(status_code=404, detail="Despesa fixa não encontrada")
    
    hoje = date.today()
    existentes = session.exec(select(Transacao).where(Transacao.fixa_id == id)).all()
    
    # Check if already paid this month
    if any(t.data.month == hoje.month and t.data.year == hoje.year for t in existentes):
        raise HTTPException(status_code=400, detail="Já pago este mês")
    
    t = Transacao(
        negocio_id=f.negocio_id,
        fixa_id=f.id, 
        descricao=f"{f.nome} (Ref: {hoje.strftime('%m/%Y')})", 
        valor=f.valor,
        tipo="despesa",
        data=hoje, 
        tag=f.tag
    )
    
    session.add(t)
    session.commit()
    session.refresh(t)
    return t

@router.delete("/fixas/{id}")
def deletar_fixa(id: int, session: Session = Depends(get_session)):
    f = session.get(DespesaFixa, id)
    if not f:
        raise HTTPException(status_code=404, detail="Não encontrado")
    session.delete(f)
    session.commit()
    return {"ok": True}
