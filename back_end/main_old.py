import os
from typing import List, Optional
from datetime import date, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session, select

# 1. CONFIGURAÇÃO
sqlite_file_name = "twobolsos.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

# 2. MODELOS
class Negocio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    categoria: str = "PADRAO"
    cor: str = "#0d6efd"
    transacoes: List["Transacao"] = Relationship(back_populates="negocio")
    fixas: List["DespesaFixa"] = Relationship(back_populates="negocio")

class DespesaFixa(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    nome: str
    valor: float
    tag: str = "Fixas"
    dia_vencimento: int = 1
    negocio: Optional[Negocio] = Relationship(back_populates="fixas")

class Transacao(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    fixa_id: Optional[int] = None 
    
    tag: str = "Geral" 
    
    descricao: str
    valor: float
    tipo: str 
    data: date
    km: Optional[float] = 0.0
    litros: Optional[float] = 0.0
    negocio: Optional[Negocio] = Relationship(back_populates="transacoes")

# 3. APP
app = FastAPI(title="TwoBolsos V13")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# 4. ROTAS
@app.post("/negocios")
def criar_negocio(n: Negocio, session: Session = Depends(get_session)):
    session.add(n); session.commit(); session.refresh(n); return n

@app.get("/negocios")
def listar_negocios(session: Session = Depends(get_session)):
    negocios = session.exec(select(Negocio)).all()
    lista = []
    for n in negocios:
        rec = sum(t.valor for t in n.transacoes if t.tipo == 'receita')
        desp = sum(t.valor for t in n.transacoes if t.tipo == 'despesa')
        lista.append({"id": n.id, "nome": n.nome, "categoria": n.categoria, "cor": n.cor, "saldo": rec - desp})
    return lista

@app.delete("/negocios/{id}")
def deletar_negocio(id: int, session: Session = Depends(get_session)):
    n = session.get(Negocio, id)
    if not n: raise HTTPException(404)
    for t in n.transacoes: session.delete(t)
    for f in n.fixas: session.delete(f)
    session.delete(n); session.commit(); return {"ok": True}

@app.post("/fixas")
def criar_fixa(f: DespesaFixa, session: Session = Depends(get_session)):
    session.add(f); session.commit(); session.refresh(f); return f

@app.get("/negocios/{id}/fixas")
def listar_fixas(id: int, session: Session = Depends(get_session)):
    fixas = session.exec(select(DespesaFixa).where(DespesaFixa.negocio_id == id)).all()
    hoje = date.today()
    resposta = []
    for f in fixas:
        query = select(Transacao).where(Transacao.fixa_id == f.id, Transacao.data >= date(hoje.year, hoje.month, 1))
        pagamentos = session.exec(query).all()
        foi_pago = any(p.data.month == hoje.month and p.data.year == hoje.year for p in pagamentos)
        resposta.append({"id": f.id, "nome": f.nome, "valor": f.valor, "tag": f.tag, "pago_neste_mes": foi_pago})
    return resposta

@app.post("/fixas/{id}/pagar")
def pagar_fixa(id: int, session: Session = Depends(get_session)):
    f = session.get(DespesaFixa, id)
    if not f: raise HTTPException(404)
    hoje = date.today()
    existentes = session.exec(select(Transacao).where(Transacao.fixa_id == id)).all()
    if any(t.data.month == hoje.month and t.data.year == hoje.year for t in existentes):
        raise HTTPException(status_code=400, detail="Pago")
    
    t = Transacao(
        negocio_id=f.negocio_id, fixa_id=f.id, 
        descricao=f"{f.nome} (Ref: {hoje.strftime('%m/%Y')})", 
        valor=f.valor, tipo="despesa", data=hoje, 
        tag=f.tag
    )
    session.add(t); session.commit(); return t

@app.delete("/fixas/{id}")
def deletar_fixa(id: int, session: Session = Depends(get_session)):
    f = session.get(DespesaFixa, id); session.delete(f); session.commit(); return {"ok": True}

@app.post("/transacoes")
def nova_transacao(t: Transacao, session: Session = Depends(get_session)):
    if isinstance(t.data, str): t.data = date.fromisoformat(t.data)
    session.add(t); session.commit(); session.refresh(t); return t

@app.delete("/transacoes/{id}")
def deletar_transacao(id: int, session: Session = Depends(get_session)):
    t = session.get(Transacao, id); session.delete(t); session.commit(); return {"ok": True}

@app.get("/negocios/{id}/dashboard")
def get_dashboard(id: int, dias: int = 7, session: Session = Depends(get_session)):
    negocio = session.get(Negocio, id)
    if not negocio: raise HTTPException(404)
    transacoes = session.exec(select(Transacao).where(Transacao.negocio_id == id).order_by(Transacao.data.desc())).all()
    
    rec = sum(t.valor for t in transacoes if t.tipo == 'receita')
    desp = sum(t.valor for t in transacoes if t.tipo == 'despesa')
    km = sum(t.km for t in transacoes if t.km)
    lit = sum(t.litros for t in transacoes if t.litros)
    
    kml = 0.0
    rendimento_km = 0.0
    if lit > 0: kml = km / lit
    if km > 0: rendimento_km = (rec - desp) / km

    hoje = date.today()
    grafico_linha = {"labels": [], "receitas": [], "despesas": []}
    for i in range(dias - 1, -1, -1):
        dia = hoje - timedelta(days=i)
        grafico_linha["labels"].append(dia.strftime("%d/%m"))
        do_dia = [t for t in transacoes if t.data == dia]
        grafico_linha["receitas"].append(sum(t.valor for t in do_dia if t.tipo == 'receita'))
        grafico_linha["despesas"].append(sum(t.valor for t in do_dia if t.tipo == 'despesa'))

    mes_inicio = hoje - timedelta(days=30)
    gastos_pizza = {}
    for t in transacoes:
        if t.tipo == 'despesa' and t.data >= mes_inicio:
            cat = t.tag if t.tag else "Outros"
            gastos_pizza[cat] = gastos_pizza.get(cat, 0) + t.valor

    return {
        "negocio": negocio,
        "kpis": {"receita": rec, "despesa": desp, "saldo": rec-desp, "total_km": km, "total_litros": lit, "autonomia": kml, "rendimento": rendimento_km},
        "grafico": grafico_linha,
        "pizza": gastos_pizza,
        "extrato": transacoes
    }

# 5. FRONT-END
path_front = os.path.join(os.path.dirname(__file__), "../front_end")
if os.path.exists(path_front):
    app.mount("/", StaticFiles(directory=path_front, html=True), name="static")