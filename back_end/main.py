from typing import List, Optional
from datetime import date ,datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session, select


# --- CONFIGURAÇÃO DO BANCO ---
sqlite_file_name = "financeiro.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

# --- MODELOS (TABELAS) ---

class Trabalho(SQLModel, table=True):
    """Representa uma fonte de renda (Ex: Exército, Moto, Loja)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str  # Ex: "Motorista App", "Soldado"
    tipo: str  # Ex: "Fixo", "Variavel"
    
    # Relacionamento: Um trabalho tem vários lançamentos
    lancamentos: List["Lancamento"] = Relationship(back_populates="trabalho")

class Lancamento(SQLModel, table=True):
    """Pode ser uma Receita (Ganho) ou Despesa (Gasto)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    descricao: str
    valor: float # Se for positivo é ganho, se for negativo é despesa? Não, vamos usar o campo 'tipo'
    tipo: str # "ganho" ou "gasto"
    data: date = Field(default_factory=date.today)
    
    # Chave estrangeira (A qual trabalho isso pertence?)
    trabalhpo_id: Optional[int] = Field(default=None, foreign_key="trabalho.id")
    trabalho: Optional[Trabalho] = Relationship(back_populates="lancamentos")

# --- BANCO E APP ---
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI(title="TwoBolsos 3.0", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

def get_session():
    with Session(engine) as session:
        yield session

# --- ROTAS DE TRABALHOS (CRIAR BOLSOS) ---

@app.post("/trabalhos", response_model=Trabalho)
def criar_trabalho(t: Trabalho, session: Session = Depends(get_session)):
    session.add(t)
    session.commit()
    session.refresh(t)
    return t

@app.get("/trabalhos")
def listar_trabalhos(session: Session = Depends(get_session)):
    """Retorna os trabalhos com o resumo financeiro de cada um"""
    trabalhos = session.exec(select(Trabalho)).all()
    resumo = []
    
    for t in trabalhos:
        # Calcula totais separadamente para cada trabalho
        ganhos = sum(l.valor for l in t.lancamentos if l.tipo == 'ganho')
        gastos = sum(l.valor for l in t.lancamentos if l.tipo == 'gasto')
        saldo = ganhos - gastos
        
        resumo.append({
            "id": t.id,
            "nome": t.nome,
            "tipo": t.tipo,
            "total_ganhos": ganhos,
            "total_gastos": gastos,
            "saldo": saldo
        })
    return resumo

@app.delete("/trabalhos/{id}")
def deletar_trabalho(id: int, session: Session = Depends(get_session)):
    # Deleta o trabalho e todos os lançamentos dele (Cascade manual simples)
    t = session.get(Trabalho, id)
    if not t: raise HTTPException(404)
    
    # Apaga lançamentos primeiro
    for l in t.lancamentos:
        session.delete(l)
    
    session.delete(t)
    session.commit()
    return {"ok": True}

# --- ROTAS DE LANÇAMENTOS (GANHOS E GASTOS) ---

@app.post("/lancamentos")
def adicionar_lancamento(l: Lancamento, session: Session = Depends(get_session)):
    # --- CORREÇÃO DO ERRO DE DATA ---
    # Se a data chegou como texto (string), converte para Objeto Date
    if isinstance(l.data, str):
        # Transforma "2025-12-08" em data real
        l.data = date.fromisoformat(l.data) 
    # --------------------------------
    
    # Verifica se o trabalho existe
    t = session.get(Trabalho, l.trabalho_id)
    if not t: raise HTTPException(404, detail="Trabalho não encontrado")
    
    session.add(l)
    session.commit()
    session.refresh(l)
    return l

@app.get("/lancamentos/{trabalho_id}")
def ver_extrato(trabalho_id: int, session: Session = Depends(get_session)):
    """Pega o histórico de um trabalho específico"""
    statement = select(Lancamento).where(Lancamento.trabalho_id == trabalho_id).order_by(Lancamento.data.desc())
    return session.exec(statement).all()

@app.delete("/lancamentos/{id}")
def deletar_lancamento(id: int, session: Session = Depends(get_session)):
    l = session.get(Lancamento, id)
    if not l: raise HTTPException(404)
    session.delete(l)
    session.commit()
    return {"ok": True}