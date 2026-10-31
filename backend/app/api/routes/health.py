import re
from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "message": "Backend is healthy"}


@router.get("/health/db")
def health_db() -> dict[str, str]:
    # Obfuscate password in URL for security
    safe_target = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", settings.database_url)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "target": safe_target,
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error_type": type(e).__name__,
            "detail": str(e),
            "target": safe_target,
        }
