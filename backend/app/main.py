import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.database import Base, engine, DATABASE_URL
from app.models import models  # noqa: F401
from app.api import teams_players, matches, teams_pages, save_match

app = FastAPI(title="Statssheets API", version="0.1.0")

ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://lpz-statsheets.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ORIGINS or origin.endswith(".vercel.app"):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Vary"] = "Origin"

    detail = f"{type(exc).__name__}: {exc}"
    print("UNHANDLED ERROR:", detail)
    traceback.print_exc()

    return JSONResponse(
        status_code=500,
        content={"detail": detail},
        headers=headers,
    )


try:
    Base.metadata.create_all(bind=engine)
    from app.core.migrate import run_migrations
    run_migrations()
    print("DB OK — URL scheme:", DATABASE_URL.split("://", 1)[0])
except Exception as e:
    print("FALHA ao conectar/criar tabelas:", e)
    traceback.print_exc()

app.include_router(teams_players.router)
app.include_router(matches.router)
app.include_router(teams_pages.router)
app.include_router(save_match.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Statssheets API rodando 🚀"}


@app.get("/health/db")
def health_db():
    from sqlalchemy import text
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "db": "connected",
            "scheme": DATABASE_URL.split("://", 1)[0],
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": f"{type(e).__name__}: {e}"},
        )
    finally:
        db.close()