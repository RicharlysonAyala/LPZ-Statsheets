import os
from fastapi import Header, HTTPException

STAFF_SECRET = os.getenv("STAFF_SECRET", "").strip()


def require_staff(x_staff_key: str | None = Header(default=None, alias="X-Staff-Key")):
    if not STAFF_SECRET:
        raise HTTPException(
            status_code=503,
            detail="STAFF_SECRET não configurado no servidor.",
        )
    if not x_staff_key or x_staff_key.strip() != STAFF_SECRET:
        raise HTTPException(status_code=403, detail="Acesso staff negado.")
    return True