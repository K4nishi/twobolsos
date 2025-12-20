from typing import List, Optional
from datetime import date
from sqlmodel import SQLModel, Field, Relationship

class Negocio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    categoria: str = "PADRAO"
    cor: str = "#0d6efd"
    
    # Relationships
    transacoes: List["Transacao"] = Relationship(back_populates="negocio")
    fixas: List["DespesaFixa"] = Relationship(back_populates="negocio")

class DespesaFixa(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    nome: str
    valor: float
    tag: str = "Fixas"
    dia_vencimento: int = 1
    
    # Relationships
    negocio: Optional[Negocio] = Relationship(back_populates="fixas")

class Transacao(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    fixa_id: Optional[int] = None 
    
    tag: str = "Geral" 
    
    descricao: str
    valor: float
    tipo: str  # 'receita', 'despesa', 'neutro'
    data: date
    
    # Driver Specific
    km: Optional[float] = 0.0
    litros: Optional[float] = 0.0
    
    # Relationships
    negocio: Optional[Negocio] = Relationship(back_populates="transacoes")
