"""
TwoBolsos Backend - Authentication Module
==========================================

Este módulo gerencia toda a autenticação e autorização da aplicação.

Funcionalidades:
    - Hash seguro de senhas com bcrypt
    - Geração e validação de tokens JWT
    - Decorator para proteção de rotas
    - Extração de usuário atual do token

Segurança:
    - Tokens JWT com expiração de 7 dias
    - Senhas nunca são armazenadas em texto puro
    - Algoritmo HS256 para assinatura de tokens

Uso:
    >>> from app.auth import get_current_user
    >>> @router.get("/protected")
    >>> def rota_protegida(user: User = Depends(get_current_user)):
    ...     return {"user": user.username}

Autor: K4nishi
Versão: 3.0.0
"""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.database import get_session
from app.models import User


# ============================================================
# CONFIGURAÇÕES DE SEGURANÇA
# ============================================================
# IMPORTANTE: Em produção, use variáveis de ambiente!
# Exemplo: SECRET_KEY = os.environ.get("SECRET_KEY")

SECRET_KEY = "CHANGE_THIS_TO_A_SUPER_SECRET_KEY_IN_PROD"
"""
Chave secreta para assinatura dos tokens JWT.
NUNCA commite uma chave real no código!
Use variáveis de ambiente em produção.
"""

ALGORITHM = "HS256"
"""Algoritmo de criptografia para JWT."""

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days
"""Tempo de expiração do token em minutos (7 dias)."""


# ============================================================
# CONTEXTO DE CRIPTOGRAFIA DE SENHAS
# ============================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
"""
Contexto do Passlib para hash de senhas.
Usa bcrypt, considerado o padrão de segurança atual.
"""

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
"""
Esquema OAuth2 que extrai o token do header Authorization.
Formato esperado: "Bearer <token>"
"""


# ============================================================
# FUNÇÕES DE HASH DE SENHA
# ============================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha em texto puro corresponde ao hash armazenado.
    
    Args:
        plain_password: Senha digitada pelo usuário
        hashed_password: Hash armazenado no banco de dados
        
    Returns:
        True se as senhas correspondem, False caso contrário
        
    Exemplo:
        >>> verify_password("minha_senha_123", hash_do_banco)
        True
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Gera um hash seguro de uma senha usando bcrypt.
    
    O hash gerado inclui salt automaticamente, então a mesma
    senha gerará hashes diferentes a cada chamada (comportamento correto).
    
    Args:
        password: Senha em texto puro a ser hasheada
        
    Returns:
        String com o hash bcrypt da senha
        
    Exemplo:
        >>> hash = get_password_hash("minha_senha_123")
        >>> len(hash)  # Hash bcrypt sempre tem ~60 caracteres
        60
    """
    return pwd_context.hash(password)


# ============================================================
# FUNÇÕES DE TOKEN JWT
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT com os dados fornecidos.
    
    O token inclui automaticamente o campo 'exp' com a data
    de expiração baseada em expires_delta ou no padrão de 15 minutos.
    
    Args:
        data: Dicionário com os dados a incluir no token.
              Geralmente {"sub": username}
        expires_delta: Tempo opcional até expiração
        
    Returns:
        Token JWT codificado como string
        
    Exemplo:
        >>> token = create_access_token({"sub": "joao123"})
        >>> len(token.split('.'))  # JWT tem 3 partes separadas por ponto
        3
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


# ============================================================
# DEPENDÊNCIAS DE AUTENTICAÇÃO (para uso com Depends())
# ============================================================

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    session: Session = Depends(get_session)
) -> User:
    """
    Dependência FastAPI que valida o token e retorna o usuário atual.
    
    Esta função é usada como dependência em rotas protegidas.
    Ela extrai o token do header Authorization, valida o JWT,
    e busca o usuário correspondente no banco de dados.
    
    Args:
        token: Token JWT extraído automaticamente pelo oauth2_scheme
        session: Sessão do banco de dados
        
    Returns:
        Objeto User do usuário autenticado
        
    Raises:
        HTTPException 401: Se o token for inválido ou usuário não existir
        
    Uso em rotas:
        >>> @router.get("/me")
        >>> async def get_me(user: User = Depends(get_current_user)):
        ...     return {"username": user.username}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica e valida o token JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Busca o usuário no banco de dados
    user = session.query(User).filter(User.username == username).first()
    
    if user is None:
        raise credentials_exception
        
    return user


def get_user_from_token(token: str, session: Session) -> Optional[User]:
    """
    Extrai o usuário de um token JWT sem lançar exceções.
    
    Função utilitária usada em contextos onde não queremos
    que a falha de autenticação resulte em exceção (ex: WebSocket).
    
    Args:
        token: Token JWT a validar
        session: Sessão do banco de dados
        
    Returns:
        Objeto User se o token for válido, None caso contrário
        
    Exemplo:
        >>> user = get_user_from_token(token, session)
        >>> if user:
        ...     print(f"Usuário: {user.username}")
        ... else:
        ...     print("Token inválido")
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            return None
            
        return session.query(User).filter(User.username == username).first()
        
    except Exception:
        return None
