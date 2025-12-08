from typing import List, Optional, Dict, Any
from datetime import date, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session, select

# ==========================================
# 1. CONFIGURAÇÃO E BANCO DE DADOS
# ==========================================

sqlite_file_name = "financeiro.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# check_same_thread=False é necessário para SQLite com FastAPI
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

# ==========================================
# 2. MODELOS DE DADOS (TABELAS)
# ==========================================

class Negocio(SQLModel, table=True):
    """Representa uma Carteira/Negócio (Ex: Mottu, Pessoal, Loja)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    categoria: str = "PADRAO"  # Opções: 'PADRAO' ou 'MOTORISTA'
    cor: str = "#0d6efd"       # Cor para o Front-End
    
    # Relacionamento: Um negócio tem várias transações
    transacoes: List["Transacao"] = Relationship(back_populates="negocio")

class Transacao(SQLModel, table=True):
    """Representa uma Receita ou Despesa"""
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    
    descricao: str
    valor: float
    tipo: str  # 'receita' ou 'despesa'
    data: date # O Python converte ISO (YYYY-MM-DD) automaticamente
    
    # Campos exclusivos para Módulo Motorista (Opcionais)
    km: Optional[float] = 0.0      # KM Rodado (Geralmente na receita)
    litros: Optional[float] = 0.0  # Litros Abastecidos (Geralmente na despesa)
    
    negocio: Optional[Negocio] = Relationship(back_populates="transacoes")

# ==========================================
# 3. INICIALIZAÇÃO DA API
# ==========================================

app = FastAPI(title="Finance SaaS API", version="Final")

# Configuração de CORS (Permite que o Front-End acesse o Back-End)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria as tabelas ao ligar o servidor
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# Injeção de Dependência para Sessão do Banco
def get_session():
    with Session(engine) as session:
        yield session

# ==========================================
# 4. ROTAS: GESTÃO DE NEGÓCIOS
# ==========================================

@app.post("/negocios", response_model=Negocio)
def criar_negocio(n: Negocio, session: Session = Depends(get_session)):
    session.add(n)
    session.commit()
    session.refresh(n)
    return n

@app.get("/negocios")
def listar_negocios(session: Session = Depends(get_session)):
    """Lista todos os negócios com saldo calculado"""
    negocios = session.exec(select(Negocio)).all()
    lista_resumo = []
    
    for n in negocios:
        # Cálculo rápido de saldo na listagem
        receitas = sum(t.valor for t in n.transacoes if t.tipo == 'receita')
        despesas = sum(t.valor for t in n.transacoes if t.tipo == 'despesa')
        
        lista_resumo.append({
            "id": n.id,
            "nome": n.nome,
            "categoria": n.categoria,
            "cor": n.cor,
            "saldo": receitas - despesas
        })
    return lista_resumo

@app.delete("/negocios/{id}")
def deletar_negocio(id: int, session: Session = Depends(get_session)):
    n = session.get(Negocio, id)
    if not n:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")
    
    # Deleta todas as transações antes de deletar o negócio (Limpeza)
    for t in n.transacoes:
        session.delete(t)
        
    session.delete(n)
    session.commit()
    return {"ok": True}

# ==========================================
# 5. ROTAS: TRANSAÇÕES (CRUD)
# ==========================================

@app.post("/transacoes", response_model=Transacao)
def criar_transacao(t: Transacao, session: Session = Depends(get_session)):
    # Garante compatibilidade de data se vier como string
    if isinstance(t.data, str):
        t.data = date.fromisoformat(t.data)
        
    session.add(t)
    session.commit()
    session.refresh(t)
    return t

@app.delete("/transacoes/{id}")
def deletar_transacao(id: int, session: Session = Depends(get_session)):
    t = session.get(Transacao, id)
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    session.delete(t)
    session.commit()
    return {"ok": True}

# ==========================================
# 6. ROTA INTELIGENTE: DASHBOARD
# ==========================================

@app.get("/negocios/{id}/dashboard")
def obter_dashboard(id: int, session: Session = Depends(get_session)):
    """
    Retorna TUDO que o front precisa de uma vez só:
    KPIs, Gráficos e Extrato atualizado.
    """
    negocio = session.get(Negocio, id)
    if not negocio:
        raise HTTPException(status_code=404, detail="Negócio não encontrado")
    
    # Busca todas as transações desse negócio (Mais recentes primeiro)
    query = select(Transacao).where(Transacao.negocio_id == id).order_by(Transacao.data.desc())
    transacoes = session.exec(query).all()
    
    # 1. Cálculos Gerais (Financeiro)
    total_receita = sum(t.valor for t in transacoes if t.tipo == 'receita')
    total_despesa = sum(t.valor for t in transacoes if t.tipo == 'despesa')
    
    # 2. Cálculos Específicos (Motorista)
    total_km = sum(t.km for t in transacoes if t.km)
    total_litros = sum(t.litros for t in transacoes if t.litros)
    
    # 3. Montagem do Gráfico Semanal (Últimos 7 dias)
    hoje = date.today()
    grafico_data = {"labels": [], "receitas": [], "despesas": []}
    
    for i in range(6, -1, -1):
        dia_alvo = hoje - timedelta(days=i)
        label = dia_alvo.strftime("%d/%m") # Ex: 12/08
        
        # Filtra transações apenas deste dia
        do_dia = [t for t in transacoes if t.data == dia_alvo]
        
        rec_dia = sum(t.valor for t in do_dia if t.tipo == 'receita')
        desp_dia = sum(t.valor for t in do_dia if t.tipo == 'despesa')
        
        grafico_data["labels"].append(label)
        grafico_data["receitas"].append(rec_dia)
        grafico_data["despesas"].append(desp_dia)

    # Retorno JSON pronto para o Front
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
        "extrato": transacoes
    }