"""
TwoBolsos Backend - Database Configuration
===========================================

Este módulo configura a conexão com o banco de dados SQLite
e fornece funções utilitárias para sessões.

Componentes:
    - engine: Motor SQLAlchemy para conexão com SQLite
    - init_db(): Inicializa o banco e cria as tabelas
    - get_session(): Gerador de sessões para injeção de dependência

Persistência:
    O banco de dados SQLite é armazenado em arquivo, persistindo
    os dados entre reinicializações. O caminho pode ser configurado
    via variável de ambiente DATABASE_PATH.

Uso com FastAPI:
    >>> from app.database import get_session
    >>> @router.get("/items")
    >>> def get_items(session: Session = Depends(get_session)):
    ...     return session.query(Item).all()

Autor: K4nishi
Versão: 3.0.0
"""

import os
from typing import Generator

from sqlmodel import SQLModel, create_engine, Session


# ============================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ============================================================

DATABASE_PATH = os.environ.get("DATABASE_PATH", "twobolsos_v2.db")
"""
Caminho para o arquivo do banco de dados SQLite.
Pode ser configurado via variável de ambiente para Docker/produção.
Padrão: 'twobolsos_v2.db' (diretório atual)
"""

SQLITE_URL = f"sqlite:///{DATABASE_PATH}"
"""URL de conexão SQLite no formato SQLAlchemy."""


# ============================================================
# ENGINE E CONFIGURAÇÕES DE CONEXÃO
# ============================================================

# Configuração específica para SQLite
# check_same_thread=False permite uso em múltiplas threads (necessário para FastAPI)
connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLITE_URL, 
    connect_args=connect_args, 
    echo=False  # True para debug SQL, False em produção
)
"""
Engine SQLAlchemy para conexão com o banco.

Notas:
    - echo=False: Não loga queries SQL (mais limpo em produção)
    - check_same_thread=False: Permite threads múltiplas
"""


# ============================================================
# FUNÇÕES DE INICIALIZAÇÃO E SESSÃO
# ============================================================

def init_db() -> None:
    """
    Inicializa o banco de dados criando todas as tabelas definidas nos models.
    
    Esta função deve ser chamada na inicialização da aplicação
    (evento startup do FastAPI). Ela usa create_all() que é
    idempotente - não recria tabelas que já existem.
    
    Exemplo:
        >>> # No main.py:
        >>> @app.on_event("startup")
        >>> def on_startup():
        ...     init_db()
    
    Notas:
        - Importa models dentro da função para evitar imports circulares
        - Todas as classes SQLModel com table=True serão criadas
    """
    # Import aqui para garantir que todos os models são registrados
    # antes de criar as tabelas (evita imports circulares)
    from app import models  # noqa: F401
    
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Fornece uma sessão do banco de dados para injeção de dependência.
    
    Esta é uma função geradora que:
    1. Cria uma nova sessão
    2. Fornece a sessão para a rota
    3. Fecha a sessão automaticamente após o uso
    
    Uso com FastAPI Depends:
        >>> @router.get("/users")
        >>> def list_users(session: Session = Depends(get_session)):
        ...     return session.query(User).all()
    
    Yields:
        Session: Sessão SQLModel/SQLAlchemy pronta para uso
        
    Notas:
        - O 'with' garante que a sessão é fechada mesmo se houver exceção
        - Cada request recebe sua própria sessão (thread-safe)
    """
    with Session(engine) as session:
        yield session
