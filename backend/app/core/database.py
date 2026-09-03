import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# DATABASE_URL vem do ambiente. Se não existir, usa SQLite local (arquivo statssheets.db),
# ótimo para desenvolvimento sem precisar instalar Postgres.
# Em produção (Render/Railway + Neon/Supabase), configure a variável de ambiente
# DATABASE_URL com a connection string do Postgres, ex:
# postgresql://usuario:senha@host:5432/nome_do_banco
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./statssheets.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()