from typing import List, Optional
from datetime import date, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session, select

# --- CONFIGURAÇÃO ---
sqlite_file_name = "financeiro_saas.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

# --- MODELOS ---
class Negocio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    categoria: str = "PADRAO"
    cor: str = "#0d6efd"
    transacoes: List["Transacao"] = Relationship(back_populates="negocio")
    fixas: List["DespesaFixa"] = Relationship(back_populates="negocio")

class DespesaFixa(SQLModel, table=True):
    """Modelo para contas recorrentes (Faculdade, Spotify, etc)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    nome: str
    valor: float
    dia_vencimento: int = 1
    negocio: Optional[Negocio] = Relationship(back_populates="fixas")

class Transacao(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    descricao: str
    valor: float
    tipo: str # 'receita' ou 'despesa'
    data: date
    km: Optional[float] = 0.0
    litros: Optional[float] = 0.0
    negocio: Optional[Negocio] = Relationship(back_populates="transacoes")

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI(title="Finance SaaS V8", version="8.0.0")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

def get_session():
    with Session(engine) as session:
        yield session

# --- ROTAS DE NEGÓCIO ---
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

# --- ROTAS DE DESPESAS FIXAS (NOVIDADE) ---
@app.post("/fixas")
def criar_fixa(f: DespesaFixa, session: Session = Depends(get_session)):
    session.add(f); session.commit(); session.refresh(f); return f

@app.get("/negocios/{id}/fixas")
def listar_fixas(id: int, session: Session = Depends(get_session)):
    return session.exec(select(DespesaFixa).where(DespesaFixa.negocio_id == id)).all()

@app.delete("/fixas/{id}")
def deletar_fixa(id: int, session: Session = Depends(get_session)):
    f = session.get(DespesaFixa, id); session.delete(f); session.commit(); return {"ok": True}

@app.post("/fixas/{id}/pagar")
def pagar_fixa_no_mes(id: int, session: Session = Depends(get_session)):
    """Pega uma conta fixa e lança como transação HOJE"""
    f = session.get(DespesaFixa, id)
    if not f: raise HTTPException(404)
    
    nova_trans = Transacao(
        negocio_id=f.negocio_id,
        descricao=f"{f.nome} (Fixo)",
        valor=f.valor,
        tipo="despesa",
        data=date.today()
    )
    session.add(nova_trans)
    session.commit()
    return nova_trans

# --- ROTAS DE TRANSAÇÃO E DASHBOARD ---
@app.post("/transacoes")
def nova_transacao(t: Transacao, session: Session = Depends(get_session)):
    if isinstance(t.data, str): t.data = date.fromisoformat(t.data)
    session.add(t); session.commit(); session.refresh(t); return t

@app.delete("/transacoes/{id}")
def deletar_transacao(id: int, session: Session = Depends(get_session)):
    t = session.get(Transacao, id); session.delete(t); session.commit(); return {"ok": True}

@app.get("/negocios/{id}/dashboard")
def get_dashboard(id: int, session: Session = Depends(get_session)):
    negocio = session.get(Negocio, id)
    transacoes = session.exec(select(Transacao).where(Transacao.negocio_id == id).order_by(Transacao.data.desc())).all()
    
    rec = sum(t.valor for t in transacoes if t.tipo == 'receita')
    desp = sum(t.valor for t in transacoes if t.tipo == 'despesa')
    km = sum(t.km for t in transacoes if t.km)
    lit = sum(t.litros for t in transacoes if t.litros)
    
    # Gráfico Semanal
    hoje = date.today()
    grafico = {"labels": [], "receitas": [], "despesas": []}
    for i in range(6, -1, -1):
        dia = hoje - timedelta(days=i)
        grafico["labels"].append(dia.strftime("%d/%m"))
        do_dia = [t for t in transacoes if t.data == dia]
        grafico["receitas"].append(sum(t.valor for t in do_dia if t.tipo == 'receita'))
        grafico["despesas"].append(sum(t.valor for t in do_dia if t.tipo == 'despesa'))

    return {
        "negocio": negocio,
        "kpis": {"receita": rec, "despesa": desp, "saldo": rec-desp, "total_km": km, "total_litros": lit},
        "grafico": grafico,
        "extrato": transacoes
    }
# --- SUBSTIRUA APENAS A FUNÇÃO get_dashboard POR ESTA ---

@app.get("/negocios/{id}/dashboard")
def get_dashboard(id: int, dias: int = 7, session: Session = Depends(get_session)):
    """
    Retorna dashboard dinâmico. 
    Parâmetro opcional '?dias=15' define o tamanho do gráfico.
    """
    negocio = session.get(Negocio, id)
    if not negocio:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")
    
    # Busca todas as transações para calcular totais (Saldo geral não depende do filtro de dias)
    query = select(Transacao).where(Transacao.negocio_id == id).order_by(Transacao.data.desc())
    todas_transacoes = session.exec(query).all()
    
    # 1. Cálculos Gerais (Financeiro - Sempre Total)
    total_receita = sum(t.valor for t in todas_transacoes if t.tipo == 'receita')
    total_despesa = sum(t.valor for t in todas_transacoes if t.tipo == 'despesa')
    
    # 2. Cálculos Específicos (Motorista - Sempre Total)
    total_km = sum(t.km for t in todas_transacoes if t.km)
    total_litros = sum(t.litros for t in todas_transacoes if t.litros)
    
    # 3. Montagem do Gráfico (DINÂMICO BASEADO NOS DIAS)
    hoje = date.today()
    grafico_data = {"labels": [], "receitas": [], "despesas": []}
    
    # Loop reverso de X dias atrás até hoje
    # range(6, -1, -1) gera 7 dias (0 a 6). Então fazemos dias-1.
    for i in range(dias - 1, -1, -1):
        dia_alvo = hoje - timedelta(days=i)
        label = dia_alvo.strftime("%d/%m")
        
        # Filtra transações apenas deste dia
        do_dia = [t for t in todas_transacoes if t.data == dia_alvo]
        
        rec_dia = sum(t.valor for t in do_dia if t.tipo == 'receita')
        desp_dia = sum(t.valor for t in do_dia if t.tipo == 'despesa')
        
        grafico_data["labels"].append(label)
        grafico_data["receitas"].append(rec_dia)
        grafico_data["despesas"].append(desp_dia)

    return {
        "negocio": negocio,
        "kpis": {
            "receita": total_receita,
            "despesa": total_despesa,
            "saldo": total_receita - total_despesa,
            "total_km": total_km,
            "total_litros": total_litros
        },
        "grafico": grafico_data,
        "extrato": todas_transacoes # Manda tudo, front filtra se quiser
    }