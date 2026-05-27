"""SQLite engine + session factory."""
from __future__ import annotations

from contextlib import contextmanager

from sqlmodel import Session, SQLModel, create_engine

from config import settings

engine = create_engine(
    settings.db_url,
    echo=False,
    connect_args={"check_same_thread": False} if settings.db_url.startswith("sqlite") else {},
)


def init_db() -> None:
    # Importing models registers tables on SQLModel.metadata
    import models  # noqa: F401
    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session():
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()
