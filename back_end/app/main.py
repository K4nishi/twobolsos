"""
TwoBolsos Backend - Main Application Entry Point
=================================================

Este é o ponto de entrada principal da API TwoBolsos.
Configura o FastAPI, middlewares, rotas e WebSocket.

Endpoints principais:
    - /auth/*: Autenticação (login, registro)
    - /negocios/*: Carteiras (CRUD, compartilhamento)
    - /transacoes/*: Transações financeiras
    - /negocios/{id}/fixas/*: Despesas fixas
    - /ws/{user_id}: WebSocket para tempo real

Arquitetura:
    A aplicação segue o padrão de separação por camadas:
    - main.py: Configuração e inicialização
    - routers/: Endpoints da API
    - models.py: Modelos de dados
    - database.py: Conexão com banco
    - auth.py: Autenticação
    - realtime/: WebSocket manager

Execução:
    Development:
        $ uvicorn app.main:app --reload
    
    Production:
        $ uvicorn app.main:app --host 0.0.0.0 --port 8000

Documentação automática:
    - Swagger UI: http://localhost:8000/docs
    - ReDoc: http://localhost:8000/redoc

Autor: K4nishi
Versão: 3.0.0
"""

import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import negocios, transacoes, fixas, auth
from app.realtime.manager import manager


# ============================================================
# CONFIGURAÇÃO DA APLICAÇÃO FASTAPI
# ============================================================

app = FastAPI(
    title="TwoBolsos API",
    description="""
    ## 🎒 API de Gestão Financeira Pessoal
    
    Sistema completo para controle de finanças com suporte a:
    
    - **Multi-carteiras**: Crie quantos "bolsos" precisar
    - **Compartilhamento**: Convide familiares e parceiros
    - **Tempo Real**: Atualizações instantâneas via WebSocket
    - **Modo Motorista**: Controle de KM e combustível
    
    ### Autenticação
    Use o endpoint `/auth/token` para obter um JWT.
    Inclua o token no header: `Authorization: Bearer <token>`
    
    ### WebSocket
    Conecte-se a `/ws/{user_id}` para receber atualizações em tempo real.
    """,
    version="3.0.0",
    contact={
        "name": "K4nishi",
        "url": "https://github.com/K4nishi/TwoBolsos"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
)


# ============================================================
# CONFIGURAÇÃO DE CORS (Cross-Origin Resource Sharing)
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos HTTP
    allow_headers=["*"],  # Permite todos os headers
)
"""
CORS permite que o frontend (React) em um domínio diferente
acesse a API. Em produção, configure allow_origins com os
domínios específicos do seu frontend por segurança.
"""


# ============================================================
# EVENTOS DE CICLO DE VIDA
# ============================================================

@app.on_event("startup")
def on_startup():
    """
    Inicializa recursos quando a aplicação inicia.
    
    Executado uma única vez quando o servidor é iniciado.
    Cria as tabelas do banco de dados se não existirem.
    """
    init_db()


# ============================================================
# REGISTRO DE ROTAS
# ============================================================

# Rota de autenticação (login, registro)
app.include_router(auth.router)

# Rota de carteiras (negocios)
app.include_router(negocios.router)

# Rota de transações
app.include_router(transacoes.router)

# Rota de despesas fixas
app.include_router(fixas.router)


# ============================================================
# WEBSOCKET PARA ATUALIZAÇÕES EM TEMPO REAL
# ============================================================

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """
    Endpoint WebSocket para atualizações em tempo real.
    
    Clientes conectam-se passando seu user_id na URL.
    Quando dados são alterados (transações, membros, etc),
    todos os membros da carteira afetada recebem uma notificação.
    
    Mensagens enviadas:
        - 'UPDATE_DASHBOARD': Dados da carteira mudaram
        - 'UPDATE_LIST': Lista de carteiras mudou
        
    Uso no Frontend:
        ```javascript
        const ws = new WebSocket(`ws://api.exemplo.com/ws/${userId}`);
        ws.onmessage = (event) => {
            if (event.data === 'UPDATE_DASHBOARD') {
                // Recarregar dados do dashboard
                fetchDashboard();
            }
        };
        ```
    
    Args:
        websocket: Conexão WebSocket do cliente
        user_id: ID do usuário que está conectando
    """
    # Registra a conexão
    await manager.connect(user_id, websocket)
    
    try:
        # Mantém a conexão aberta, aguardando mensagens
        while True:
            # Recebe mensagens (não usamos, mas mantém a conexão viva)
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        # Remove a conexão quando o cliente desconecta
        manager.disconnect(user_id, websocket)
