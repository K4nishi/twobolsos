"""
TwoBolsos Backend - Routers Package
====================================

Este pacote contém todos os routers (endpoints) da API.

Routers:
    - auth: Autenticação (login, registro)
    - negocios: Carteiras financeiras e compartilhamento
    - transacoes: Transações (receitas e despesas)
    - fixas: Despesas fixas mensais

Uso:
    >>> from app.routers import auth, negocios, transacoes, fixas
    >>> app.include_router(auth.router)
"""

from app.routers import auth, negocios, transacoes, fixas

__all__ = ["auth", "negocios", "transacoes", "fixas"]
