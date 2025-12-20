from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# Define the database file path relative to the project root or backend folder
SQLITE_FILE_NAME = "twobolsos.db"
SQLITE_URL = f"sqlite:///{SQLITE_FILE_NAME}"

connect_args = {"check_same_thread": False}
engine = create_engine(SQLITE_URL, connect_args=connect_args)

def init_db():
    """Initializes the database tables."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency to provide a database session."""
    with Session(engine) as session:
        yield session
