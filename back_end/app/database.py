import os
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# Database configuration - supports environment variable for Docker
DATABASE_PATH = os.environ.get("DATABASE_PATH", "twobolsos_v2.db")
SQLITE_URL = f"sqlite:///{DATABASE_PATH}"

connect_args = {"check_same_thread": False}
engine = create_engine(SQLITE_URL, connect_args=connect_args, echo=False)

def init_db():
    from app import models  # Ensure models are registered
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
