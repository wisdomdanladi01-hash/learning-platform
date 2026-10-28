from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class VerificationSubmission(Base):
    __tablename__ = "verification_submissions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'verified', 'rejected', 'needs_review')",
            name="ck_verification_submission_status",
        ),
        CheckConstraint(
            "verification_method IN ('manual', 'official_record')",
            name="ck_verification_method",
        ),
        CheckConstraint(
            "jamb_registration_number IS NOT NULL OR matriculation_number IS NOT NULL",
            name="ck_verification_submission_has_identifier",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    verification_method: Mapped[str] = mapped_column(String(30), default="manual", nullable=False)
    jamb_registration_number: Mapped[str | None] = mapped_column(String(40), nullable=True)
    matriculation_number: Mapped[str | None] = mapped_column(String(40), nullable=True)
    programme_id: Mapped[int | None] = mapped_column(ForeignKey("programmes.id"), nullable=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    admission_session_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_sessions.id"), nullable=True
    )
    claimed_level_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_levels.id"), nullable=True
    )
    reviewed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class VerificationDocument(Base):
    __tablename__ = "verification_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(
        ForeignKey("verification_submissions.id"), nullable=False, index=True
    )
    storage_key: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(nullable=False)
    content_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    retention_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
