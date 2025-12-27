"""
TwoBolsos Backend - Data Models
===============================

Este módulo define todos os modelos de dados da aplicação usando SQLModel.
SQLModel combina Pydantic (validação) com SQLAlchemy (ORM).

Entidades:
    - User: Usuários do sistema
    - Negocio: Carteiras/Bolsos financeiros
    - NegocioShare: Compartilhamento de carteiras entre usuários
    - InviteCode: Códigos de convite temporários
    - Transacao: Receitas e despesas
    - DespesaFixa: Contas fixas mensais

Relacionamentos:
    User 1:N Negocio (proprietário)
    User N:M Negocio (via NegocioShare - compartilhamento)
    Negocio 1:N Transacao
    Negocio 1:N DespesaFixa
    Negocio 1:N InviteCode

Hierarquia de Classes:
    - Base classes (ex: UserBase) contêm apenas os campos compartilhados
    - Create classes (ex: TransacaoCreate) são para input de dados
    - Table classes (ex: User, Transacao) são as tabelas do banco

Autor: K4nishi
Versão: 3.0.0
"""

from typing import List, Optional
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship


# ============================================================
# USUÁRIO (USER)
# ============================================================

class UserBase(SQLModel):
    """
    Classe base com campos compartilhados do usuário.
    
    Attributes:
        username: Nome de usuário único (usado para login)
        email: Email opcional do usuário
    """
    username: str = Field(index=True, unique=True)
    email: Optional[str] = None


class User(UserBase, table=True):
    """
    Modelo de usuário para persistência no banco de dados.
    
    Representa um usuário cadastrado no sistema. Cada usuário
    pode ser dono de várias carteiras e ter acesso a carteiras
    compartilhadas por outros usuários.
    
    Attributes:
        id: Identificador único auto-gerado
        hashed_password: Senha criptografada com bcrypt
        owned_negocios: Lista de carteiras que o usuário é dono
        shared_entries: Lista de compartilhamentos onde é membro
        
    Relacionamentos:
        - Dono de N carteiras (owned_negocios)
        - Membro de N carteiras compartilhadas (shared_entries)
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    
    # Relacionamentos
    owned_negocios: List["Negocio"] = Relationship(back_populates="owner")
    shared_entries: List["NegocioShare"] = Relationship(back_populates="user")


# ============================================================
# COMPARTILHAMENTO DE CARTEIRAS (NEGOCIO SHARE)
# ============================================================

class NegocioShare(SQLModel, table=True):
    """
    Tabela de associação N:M entre User e Negocio.
    
    Representa o compartilhamento de uma carteira com um usuário.
    Inclui o nível de permissão (role) do usuário compartilhado.
    
    Attributes:
        user_id: ID do usuário que tem acesso
        negocio_id: ID da carteira compartilhada
        role: Nível de permissão ('editor' ou 'viewer')
        
    Roles disponíveis:
        - 'editor': Pode adicionar/remover transações
        - 'viewer': Apenas visualização (sem modificações)
        
    Notas:
        - Usa chave primária composta (user_id + negocio_id)
        - O dono da carteira NÃO aparece nesta tabela
    """
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id", primary_key=True)
    role: str = "editor"
    
    # Relacionamentos
    user: User = Relationship(back_populates="shared_entries")
    negocio: "Negocio" = Relationship(back_populates="shares")


# ============================================================
# CÓDIGOS DE CONVITE (INVITE CODE)
# ============================================================

class InviteCode(SQLModel, table=True):
    """
    Códigos de convite para compartilhamento de carteiras.
    
    Permite que o dono de uma carteira gere um código temporário
    para convidar novos membros. O código expira após 24 horas.
    
    Attributes:
        id: Identificador único
        code: Código de 6 caracteres alfanuméricos (ex: 'A3B5K9')
        negocio_id: ID da carteira que o código dá acesso
        expires_at: Data/hora de expiração do código
        active: Se o código ainda pode ser usado
        
    Fluxo de uso:
        1. Dono gera código via POST /negocios/{id}/invite
        2. Código é enviado ao convidado (WhatsApp, etc)
        3. Convidado usa POST /negocios/join?code=XXXXXX
        4. Sistema cria NegocioShare para o novo membro
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    expires_at: datetime
    active: bool = True


# ============================================================
# CARTEIRA / NEGÓCIO (NEGOCIO)
# ============================================================

class NegocioBase(SQLModel):
    """
    Classe base com campos compartilhados de carteira.
    
    Attributes:
        nome: Nome da carteira (ex: 'Uber', 'Casa', 'Poupança')
        categoria: Tipo da carteira ('PADRAO' ou 'MOTORISTA')
        cor: Cor hexadecimal para identificação visual (ex: '#0d6efd')
    """
    nome: str
    categoria: str = "PADRAO"  # 'PADRAO' ou 'MOTORISTA'
    cor: str = "#0d6efd"  # Azul padrão


class Negocio(NegocioBase, table=True):
    """
    Carteira financeira (o 'Bolso' do TwoBolsos).
    
    Representa uma carteira que pode conter transações.
    Pode ser do tipo PADRÃO (uso geral) ou MOTORISTA (com
    controle de KM e combustível).
    
    Attributes:
        id: Identificador único
        owner_id: ID do usuário dono da carteira
        owner: Relacionamento com o usuário dono
        shares: Lista de compartilhamentos
        transacoes: Lista de transações da carteira
        fixas: Lista de despesas fixas
        
    Categorias:
        - 'PADRAO': Carteira comum sem controle de KM
        - 'MOTORISTA': Inclui painel de KM, litros e autonomia
        
    Notas:
        - Transações e fixas são deletadas em cascata
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    
    # Relacionamentos
    owner: User = Relationship(back_populates="owned_negocios")
    shares: List[NegocioShare] = Relationship(back_populates="negocio")
    
    # Transações e despesas fixas (cascade delete)
    transacoes: List["Transacao"] = Relationship(
        back_populates="negocio", 
        sa_relationship_kwargs={"cascade": "all, delete"}
    )
    fixas: List["DespesaFixa"] = Relationship(
        back_populates="negocio", 
        sa_relationship_kwargs={"cascade": "all, delete"}
    )


# ============================================================
# DESPESAS FIXAS (DESPESA FIXA)
# ============================================================

class DespesaFixaBase(SQLModel):
    """
    Classe base com campos compartilhados de despesa fixa.
    
    Attributes:
        nome: Nome da despesa (ex: 'Aluguel', 'Internet')
        valor: Valor mensal da despesa
        tag: Categoria para agrupamento (ex: 'Moradia', 'Lazer')
        dia_vencimento: Dia do mês em que vence (1-31)
    """
    nome: str
    valor: float
    tag: str = "Fixas"
    dia_vencimento: int = 1


class DespesaFixaCreate(DespesaFixaBase):
    """
    Schema para criação de despesa fixa (input da API).
    
    Adiciona o negocio_id que é obrigatório na criação.
    """
    negocio_id: int


class DespesaFixa(DespesaFixaBase, table=True):
    """
    Despesa fixa mensal.
    
    Representa uma conta que se repete todo mês (aluguel, internet, etc).
    O sistema controla se já foi paga no mês atual.
    
    Attributes:
        id: Identificador único
        negocio_id: ID da carteira a qual pertence
        negocio: Relacionamento com a carteira
        
    Fluxo de pagamento:
        1. Usuário visualiza lista de fixas com status de pagamento
        2. Clica em 'Pagar' para uma despesa não paga
        3. Sistema cria Transacao com fixa_id preenchido
        4. Na próxima visualização, aparece como 'Pago neste mês'
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    
    negocio: Optional[Negocio] = Relationship(back_populates="fixas")


# ============================================================
# TRANSAÇÕES (TRANSACAO)
# ============================================================

class TransacaoBase(SQLModel):
    """
    Classe base com campos compartilhados de transação.
    
    Attributes:
        tag: Categoria da transação (ex: 'Alimentação', 'Transporte')
        descricao: Descrição do que foi a transação
        valor: Valor da transação (sempre positivo)
        tipo: 'receita' ou 'despesa'
        data: Data no formato ISO (YYYY-MM-DD)
        km: Quilômetros rodados (para motoristas)
        litros: Litros abastecidos (para motoristas)
        fixa_id: ID da despesa fixa relacionada (se for pagamento de fixa)
    """
    tag: str = "Geral"
    descricao: str
    valor: float
    tipo: str  # 'receita' ou 'despesa'
    data: str  # Formato: 'YYYY-MM-DD'
    km: Optional[float] = 0.0
    litros: Optional[float] = 0.0
    fixa_id: Optional[int] = None


class TransacaoCreate(TransacaoBase):
    """
    Schema para criação de transação (input da API).
    
    Adiciona o negocio_id que é obrigatório na criação.
    """
    negocio_id: int


class Transacao(TransacaoBase, table=True):
    """
    Transação financeira (receita ou despesa).
    
    Representa uma movimentação de dinheiro em uma carteira.
    Para carteiras do tipo MOTORISTA, pode incluir dados de
    quilometragem e abastecimento.
    
    Attributes:
        id: Identificador único
        negocio_id: ID da carteira
        negocio: Relacionamento com a carteira
        created_by_id: ID do usuário que criou a transação
        created_by: Relacionamento com o criador
        
    Tipos de transação:
        - 'receita': Entrada de dinheiro (salário, venda, gorjeta)
        - 'despesa': Saída de dinheiro (compra, conta, abastecimento)
        
    Campos de motorista:
        - km: Quilometragem do veículo no momento
        - litros: Quantidade de combustível abastecido
        
    Notas:
        - created_by permite identificar quem fez cada transação
          em carteiras compartilhadas
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    negocio_id: int = Field(foreign_key="negocio.id")
    
    negocio: Optional[Negocio] = Relationship(back_populates="transacoes")
    
    # Quem criou a transação (útil em carteiras compartilhadas)
    created_by_id: Optional[int] = Field(foreign_key="user.id", default=None)
    created_by: Optional["User"] = Relationship()
