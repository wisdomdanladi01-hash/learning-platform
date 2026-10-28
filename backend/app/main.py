from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.academic_admin import router as academic_admin_router
from app.api.routes.payments import admin_router as payments_admin_router
from app.api.routes.payments import router as payments_router
from app.api.routes.payments import webhook_router as paystack_webhook_router
from app.api.routes.resources import admin_router as resources_admin_router
from app.api.routes.resources import router as resources_router
from app.api.routes.student_portal import router as student_portal_router
from app.api.routes.verification import admin_router as verification_admin_router
from app.api.routes.verification import router as verification_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for the Learning Resource Platform.",
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_v1_str)
app.include_router(auth_router, prefix=settings.api_v1_str)
app.include_router(student_portal_router, prefix=settings.api_v1_str)
app.include_router(academic_admin_router, prefix=settings.api_v1_str)
app.include_router(verification_router, prefix=settings.api_v1_str)
app.include_router(verification_admin_router, prefix=settings.api_v1_str)
app.include_router(resources_router, prefix=settings.api_v1_str)
app.include_router(resources_admin_router, prefix=settings.api_v1_str)
app.include_router(payments_router, prefix=settings.api_v1_str)
app.include_router(payments_admin_router, prefix=settings.api_v1_str)
app.include_router(paystack_webhook_router, prefix=settings.api_v1_str)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": f"{settings.app_name} is running"}
