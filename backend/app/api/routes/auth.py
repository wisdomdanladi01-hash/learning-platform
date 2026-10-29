import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import (
    burn_password_check,
    create_access_token,
    require_jwt_secret,
    verify_password,
)
from app.core.rate_limit import enforce_auth_rate_limit
from app.db.database import get_db
from app.models.user import Role, User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    StudentRegistration,
    UserProfileUpdate,
    UserResponse,
)
from app.services.errors import ConflictError, PolicyError
from app.services.verification import register_student

router = APIRouter(prefix="/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


def _auth_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Authentication is not configured. Set a secure JWT_SECRET_KEY.",
    )


def _user_response(user: User, db: Session) -> UserResponse:
    role_name = db.scalar(select(Role.name).where(Role.id == user.role_id)) if user.role_id else None
    is_admin = bool(user.is_superuser or role_name == "admin")
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=is_admin,
        role=role_name or ("admin" if is_admin else "student"),
    )


@router.post(
    "/register",
    response_model=AccessTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: StudentRegistration,
    _request: Request,
    db: Session = Depends(get_db),
) -> AccessTokenResponse:
    enforce_auth_rate_limit(_request)
    try:
        require_jwt_secret()
    except ValueError as exc:
        raise _auth_unavailable() from exc

    try:
        user, _submission = register_student(db, data)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except PolicyError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error while registering a student.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Registration is temporarily unavailable because the database could not be reached. Check DATABASE_URL and PostgreSQL.",
        ) from exc
    return AccessTokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=AccessTokenResponse)
def login(
    data: LoginRequest,
    _request: Request,
    db: Session = Depends(get_db),
) -> AccessTokenResponse:
    enforce_auth_rate_limit(_request)
    try:
        require_jwt_secret()
    except ValueError as exc:
        raise _auth_unavailable() from exc

    email = str(data.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        burn_password_check(data.password)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(data.password, user.password_hash) or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return AccessTokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def read_current_user(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    return _user_response(user, db)


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    email = str(data.email).strip().lower()
    full_name = " ".join(data.full_name.split())
    existing = db.scalar(select(User.id).where(User.email == email, User.id != user.id))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for this email address.",
        )
    user.email = email
    user.full_name = full_name
    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error while updating a student profile.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Profile update is temporarily unavailable.",
        ) from exc
    return _user_response(user, db)
