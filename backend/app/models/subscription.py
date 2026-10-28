from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    __table_args__ = (CheckConstraint("price_minor >= 0", name="ck_subscription_plan_price_nonnegative"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    price_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), default="NGN", server_default="NGN", nullable=False
    )
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'active', 'expired', 'cancelled', 'revoked')",
            name="ck_subscription_status",
        ),
        CheckConstraint("ends_at > starts_at", name="ck_subscription_dates"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    plan_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscription_plans.id"), nullable=True, index=True
    )
    package_id: Mapped[int | None] = mapped_column(
        ForeignKey("access_packages.id"), nullable=True, index=True
    )
    semester_id: Mapped[int | None] = mapped_column(ForeignKey("semesters.id"), nullable=True, index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", server_default="pending", nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )
