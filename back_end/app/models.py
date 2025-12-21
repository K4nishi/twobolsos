from typing import List, Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

# --- USER ---
class UserBase(SQLModel):
    username: str = Field(index=True, unique=True)
    email: Optional[str] = None

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    
    # Relationships
    owned_negocios: List["Negocio"] = Relationship(back_populates="owner")
    shared_entries: List["NegocioShare"] = Relationship(back_populates="user")

# --- SHARES ---
class NegocioShare(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id", primary_key=True)
    role: str = "editor"
    
    user: User = Relationship(back_populates="shared_entries")
    negocio: "Negocio" = Relationship(back_populates="shares")

# --- INVITES ---
class InviteCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    expires_at: datetime
    active: bool = True

# --- NEGOCIO ---
class NegocioBase(SQLModel):
    nome: str
    categoria: str = "PADRAO"
    cor: str = "#0d6efd"

class Negocio(NegocioBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    
    owner: User = Relationship(back_populates="owned_negocios")
    shares: List[NegocioShare] = Relationship(back_populates="negocio")
    
    transacoes: List["Transacao"] = Relationship(back_populates="negocio", sa_relationship_kwargs={"cascade": "all, delete"})
    fixas: List["DespesaFixa"] = Relationship(back_populates="negocio", sa_relationship_kwargs={"cascade": "all, delete"})

# --- FIXAS ---
class DespesaFixaBase(SQLModel):
    nome: str
    valor: float
    tag: str = "Fixas"
    dia_vencimento: int = 1

class DespesaFixaCreate(DespesaFixaBase):
    negocio_id: int

class DespesaFixa(DespesaFixaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    
    negocio: Optional[Negocio] = Relationship(back_populates="fixas")

# --- TRANSACOES ---
class TransacaoBase(SQLModel):
    tag: str = "Geral" 
    descricao: str
    valor: float
    tipo: str  
    data: str 
    km: Optional[float] = 0.0
    litros: Optional[float] = 0.0
    fixa_id: Optional[int] = None 

class TransacaoCreate(TransacaoBase):
    negocio_id: int

class Transacao(TransacaoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    
    negocio: Optional[Negocio] = Relationship(back_populates="transacoes")
    
    created_by_id: Optional[int] = Field(foreign_key="user.id", default=None)
    created_by: Optional["User"] = Relationship()
