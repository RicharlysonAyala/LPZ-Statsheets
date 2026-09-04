import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# DATABASE_URL vem do ambiente (Render → Neon).
# Fallback SQLite só para dev local sem Postgres.
raw_url = os.getenv("DATABASE_URL", "sqlite:///./statssheets.db")

# Neon/Heroku às vezes entregam "postgres://..." — SQLAlchemy 2 exige "postgresql://"
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql://", 1)

# Neon exige SSL. Se a URL ainda não tiver sslmode, adiciona.
if raw_url.startswith("postgresql://") and "sslmode=" not in raw_url:
    sep = "&" if "?" in raw_url else "?"
    raw_url = f"{raw_url}{sep}sslmode=require"

DATABASE_URL = raw_url

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # evita conexão morta após o free tier dormir
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()