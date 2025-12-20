from datetime import date, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Negocio, Transacao

router = APIRouter(prefix="/negocios", tags=["Negocios"])

@router.post("", response_model=Negocio)
def criar_negocio(n: Negocio, session: Session = Depends(get_session)):
    session.add(n)
    session.commit()
    session.refresh(n)
    return n

@router.get("", response_model=List[Dict[str, Any]])
def listar_negocios(session: Session = Depends(get_session)):
    negocios = session.exec(select(Negocio)).all()
    lista = []
    for n in negocios:
        rec = sum(t.valor for t in n.transacoes if t.tipo == 'receita')
        desp = sum(t.valor for t in n.transacoes if t.tipo == 'despesa')
        lista.append({
            "id": n.id, 
            "nome": n.nome, 
            "categoria": n.categoria, 
            "cor": n.cor, 
            "saldo": rec - desp
        })
    return lista

@router.delete("/{id}")
def deletar_negocio(id: int, session: Session = Depends(get_session)):
    n = session.get(Negocio, id)
    if not n:
        raise HTTPException(status_code=404, detail="Negocio não encontrado")
    
    # Cascading delete manually since SQLite/SQLAlchemy might not always be configured for strict cascade in this setup
    for t in n.transacoes:
        session.delete(t)
    for f in n.fixas:
        session.delete(f)
        
    session.delete(n)
    session.commit()
    return {"ok": True}

@router.get("/{id}/dashboard")
def get_dashboard(id: int, dias: int = 7, session: Session = Depends(get_session)):
    negocio = session.get(Negocio, id)
    if not negocio:
        raise HTTPException(status_code=404, detail="Negocio não encontrado")
    
    transacoes = session.exec(
        select(Transacao)
        .where(Transacao.negocio_id == id)
        .order_by(Transacao.data.desc())
    ).all()
    
    # Calculate KPIs
    rec = sum(t.valor for t in transacoes if t.tipo == 'receita')
    desp = sum(t.valor for t in transacoes if t.tipo == 'despesa')
    km = sum(t.km for t in transacoes if t.km)
    lit = sum(t.litros for t in transacoes if t.litros)
    
    kml = km / lit if lit > 0 else 0.0
    rendimento_km = (rec - desp) / km if km > 0 else 0.0

    # Line Chart Data
    hoje = date.today()
    grafico_linha = {"labels": [], "receitas": [], "despesas": []}
    
    for i in range(dias - 1, -1, -1):
        dia = hoje - timedelta(days=i)
        grafico_linha["labels"].append(dia.strftime("%d/%m"))
        do_dia = [t for t in transacoes if t.data == dia]
        
        grafico_linha["receitas"].append(sum(t.valor for t in do_dia if t.tipo == 'receita'))
        grafico_linha["despesas"].append(sum(t.valor for t in do_dia if t.tipo == 'despesa'))

    # Pie Chart Data (Last 30 days)
    mes_inicio = hoje - timedelta(days=30)
    gastos_pizza = {}
    for t in transacoes:
        if t.tipo == 'despesa' and t.data >= mes_inicio:
            cat = t.tag if t.tag else "Outros"
            gastos_pizza[cat] = gastos_pizza.get(cat, 0) + t.valor

    return {
        "negocio": negocio,
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
        "extrato": transacoes
    }
