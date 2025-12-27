"""
TwoBolsos Backend - Authentication Router
==========================================

Router responsável por autenticação de usuários.

Endpoints:
    POST /auth/register: Criar nova conta
    POST /auth/token: Login (obter token JWT)

Fluxo de autenticação:
    1. Usuário se registra com username, email e senha
    2. Usuário faz login recebendo token JWT
    3. Token é incluído em requests: Authorization: Bearer <token>
    4. Token expira em 7 dias

Autor: K4nishi
Versão: 3.0.0
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.database import get_session
from app.models import User, UserBase
from app.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)


router = APIRouter(prefix="/auth", tags=["Auth"])
"""Router de autenticação com prefixo /auth"""


# ============================================================
# SCHEMAS DE ENTRADA
# ============================================================

class UserCreate(UserBase):
    """
    Schema para criação de usuário.
    
    Extends UserBase adicionando a senha em texto puro.
    A senha será hasheada antes de salvar no banco.
    
    Attributes:
        username: Nome de usuário único
        email: Email opcional
        password: Senha em texto puro (será hasheada)
    """
    password: str


# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/register")
def register(
    user_data: UserCreate, 
    session: Session = Depends(get_session)
):
    """
    Registra um novo usuário no sistema.
    
    Cria uma nova conta de usuário com as credenciais fornecidas.
    A senha é automaticamente hasheada com bcrypt antes de salvar.
    
    Args:
        user_data: Dados do novo usuário (username, email, password)
        session: Sessão do banco de dados
        
    Returns:
        dict: Mensagem de sucesso
        
    Raises:
        HTTPException 400: Se o username já estiver em uso
        
    Exemplo de request:
        ```json
        POST /auth/register
        {
            "username": "joao123",
            "email": "joao@email.com",
            "password": "senha_segura_123"
        }
        ```
    
    Exemplo de resposta:
        ```json
        {
            "msg": "User created successfully"
        }
        ```
    """
    # Verifica se username já existe
    existing = session.query(User).filter(
        User.username == user_data.username
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Username already registered"
        )
    
    # Cria novo usuário com senha hasheada
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    
    session.add(new_user)
    session.commit()
    
    return {"msg": "User created successfully"}


@router.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    session: Session = Depends(get_session)
):
    """
    Autentica um usuário e retorna um token JWT.
    
    Este endpoint segue o padrão OAuth2 Password Flow.
    O token retornado deve ser incluído em requests subsequentes
    no header Authorization: Bearer <token>
    
    Args:
        form_data: Formulário OAuth2 com username e password
        session: Sessão do banco de dados
        
    Returns:
        dict: Token de acesso e informações do usuário
            - access_token: Token JWT
            - token_type: "bearer"
            - user_id: ID do usuário
            - username: Nome do usuário
            
    Raises:
        HTTPException 401: Se credenciais forem inválidas
        
    Exemplo de request (form-data):
        ```
        POST /auth/token
        Content-Type: application/x-www-form-urlencoded
        
        username=joao123&password=senha_segura_123
        ```
    
    Exemplo de resposta:
        ```json
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "user_id": 1,
            "username": "joao123"
        }
        ```
    """
    # Busca usuário pelo username
    user = session.query(User).filter(
        User.username == form_data.username
    ).first()
    
    # Verifica credenciais
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Gera token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_id": user.id, 
        "username": user.username
    }
