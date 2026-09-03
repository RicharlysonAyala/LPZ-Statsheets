from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.models import models  # noqa: F401 (garante que os modelos são registrados)
from app.api import teams_players, matches, teams_pages, save_match

app = FastAPI(title="Statssheets API", version="0.1.0")

# CORS: em desenvolvimento libera o Vite (5173). Em produção, troque pela URL
# do seu front-end publicado (ex: https://seu-site.vercel.app).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",  # troque por domínios específicos antes de ir pra produção "de verdade"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria as tabelas automaticamente se não existirem (bom para começar;
# depois, migre para Alembic quando o schema começar a mudar com frequência).
Base.metadata.create_all(bind=engine)

app.include_router(teams_players.router)
app.include_router(matches.router)
app.include_router(teams_pages.router)
app.include_router(save_match.router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Statssheets API rodando 🚀"}
