from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# TODO: Create engine
engine = None

# TODO: Create SessionLocal
SessionLocal = None

# TODO: Create Base
Base = declarative_base()


def get_db():
    # TODO: Yield a database session and close it in the finally block
    pass
