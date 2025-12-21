from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# Switched to v2 database
SQLITE_FILE_NAME = "twobolsos_v2.db"
SQLITE_URL = f"sqlite:///{SQLITE_FILE_NAME}"

connect_args = {"check_same_thread": False}
engine = create_engine(SQLITE_URL, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
