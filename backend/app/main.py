from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.models import models  # noqa: F401
from app.api import teams_players, matches, teams_pages, save_match

app = FastAPI(title="Statssheets API", version="0.1.0")

# IMPORTANTE:
# - NÃO use allow_origins=["*"] junto com allow_credentials=True.
#   O browser bloqueia e o fetch vira "erro de rede".
# - Coloque aqui a URL real do front na Vercel (e localhost pro dev).
ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # >>> TROQUE pela URL real do seu front na Vercel <<<
    "https://lpz-statsheets.vercel.app",
    # se tiver domínio custom, adicione também:
    # "https://seu-dominio.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=False,  # não precisamos de cookie/sessão no front
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(teams_players.router)
app.include_router(matches.router)
app.include_router(teams_pages.router)
app.include_router(save_match.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Statssheets API rodando 🚀"}