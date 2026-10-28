from datetime import datetime, time, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.academic import Semester, StudentAcademicProfile
from app.models.audit import AuditEvent
from app.models.commerce import AccessPackage, Entitlement, Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.payments import SubscriptionStatus
from app.services.errors import ConflictError, NotFoundError, PolicyError
from app.services.paystack import (
    PaystackError,
    VerifiedTransaction,
    initialize_transaction,
    verify_transaction,
)


class PaymentRejected(Exception):
    """The provider verified transaction details that must not grant access."""


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _package_available(package: AccessPackage, now: datetime) -> bool:
    return (
        package.is_active
        and package.package_type == "subscription"
        and (package.available_from is None or _utc(package.available_from) <= now)
        and (package.available_until is None or _utc(package.available_until) > now)
    )


def list_subscription_packages(
    db: Session, *, include_inactive: bool = False
) -> list[tuple[AccessPackage, Semester]]:
    now = datetime.now(timezone.utc)
    query = (
        select(AccessPackage, Semester)
        .join(Semester, Semester.id == AccessPackage.semester_id)
        .where(AccessPackage.package_type == "subscription")
        .where(Semester.ends_on >= now.date())
        .order_by(Semester.starts_on.desc(), AccessPackage.name.asc())
    )
    if not include_inactive:
        query = query.where(
            AccessPackage.is_active.is_(True),
            (AccessPackage.available_from.is_(None))
            | (AccessPackage.available_from <= now),
            (AccessPackage.available_until.is_(None))
            | (AccessPackage.available_until > now),
        )
    return list(db.execute(query))


def create_subscription_package(
    db: Session,
    admin: User,
    *,
    name: str,
    description: str | None,
    price_minor: int,
    currency: str,
    semester_id: int,
    available_from: datetime | None,
    available_until: datetime | None,
    is_active: bool,
) -> AccessPackage:
    semester = db.get(Semester, semester_id)
    if semester is None:
        raise PolicyError("The selected semester does not exist.")
    if currency != "NGN":
        raise PolicyError("Paystack subscriptions currently support NGN packages only.")
    package = AccessPackage(
        name=name.strip(),
        description=description,
        package_type="subscription",
        price_minor=price_minor,
        currency=currency,
        semester_id=semester_id,
        available_from=available_from,
        available_until=available_until,
        is_active=is_active,
    )
    try:
        db.add(package)
        db.flush()
        db.add(
            AuditEvent(
                actor_user_id=admin.id,
                action="admin.subscription_package_created",
                target_type="access_package",
                target_id=str(package.id),
            )
        )
        db.commit()
        db.refresh(package)
        return package
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("A package with this name already exists.") from exc


def update_subscription_package(
    db: Session, admin: User, package: AccessPackage, changes: dict
) -> AccessPackage:
    effective_semester_id = changes.get("semester_id", package.semester_id)
    if effective_semester_id is None or db.get(Semester, effective_semester_id) is None:
        raise PolicyError("The selected semester does not exist.")
    if changes.get("currency", package.currency) != "NGN":
        raise PolicyError("Paystack subscriptions currently support NGN packages only.")
    available_from = changes.get("available_from", package.available_from)
    available_until = changes.get("available_until", package.available_until)
    if (
        available_from is not None
        and available_until is not None
        and _utc(available_until) <= _utc(available_from)
    ):
        raise PolicyError("available_until must be later than available_from.")
    for field_name, value in changes.items():
        if field_name == "name":
            value = value.strip()
        setattr(package, field_name, value)
    try:
        db.add(
            AuditEvent(
                actor_user_id=admin.id,
                action="admin.subscription_package_updated",
                target_type="access_package",
                target_id=str(package.id),
            )
        )
        db.commit()
        db.refresh(package)
        return package
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("A package with this name already exists.") from exc


def get_subscription_package(db: Session, package_id: int) -> AccessPackage:
    package = db.get(AccessPackage, package_id)
    if package is None or package.package_type != "subscription":
        raise NotFoundError("Subscription package not found.")
    return package


def _user_is_verified(db: Session, user_id: int) -> bool:
    return (
        db.scalar(
            select(StudentAcademicProfile.id).where(
                StudentAcademicProfile.user_id == user_id,
                StudentAcademicProfile.verified_level_id.is_not(None),
            )
        )
        is not None
    )


def _has_active_subscription(
    db: Session, user_id: int, semester_id: int, now: datetime
) -> bool:
    return (
        db.scalar(
            select(Subscription.id)
            .where(
                Subscription.user_id == user_id,
                Subscription.semester_id == semester_id,
                Subscription.status == "active",
                Subscription.is_active.is_(True),
                Subscription.starts_at <= now,
                Subscription.ends_at > now,
            )
            .limit(1)
        )
        is not None
    )


def initialize_payment(
    db: Session, user: User, package_id: int
) -> Payment:
    package = get_subscription_package(db, package_id)
    now = datetime.now(timezone.utc)
    if not _package_available(package, now):
        raise PolicyError("This subscription package is not currently available.")
    if not _user_is_verified(db, user.id):
        raise PolicyError("Student verification is required before purchasing a subscription.")
    if _has_active_subscription(db, user.id, package.semester_id, now):
        raise ConflictError("You already have an active subscription for this semester.")
    semester = db.get(Semester, package.semester_id)
    if semester is None:
        raise PolicyError("The package semester no longer exists.")
    semester_end = datetime.combine(
        semester.ends_on + timedelta(days=1), time.min, tzinfo=timezone.utc
    )
    if semester_end <= now:
        raise PolicyError("This semester has already ended.")

    reference = f"LRP-{uuid4().hex}"
    payment = Payment(
        user_id=user.id,
        package_id=package.id,
        semester_id=package.semester_id,
        provider="paystack",
        provider_reference=reference,
        idempotency_key=reference,
        status="pending",
        amount_minor=package.price_minor,
        currency=package.currency,
    )
    try:
        db.add(payment)
        db.flush()
        db.add(
            AuditEvent(
                actor_user_id=user.id,
                action="student.subscription_payment_initialized",
                target_type="payment",
                target_id=str(payment.id),
            )
        )
        db.commit()
        db.refresh(payment)
    except SQLAlchemyError:
        db.rollback()
        raise

    try:
        checkout_url = initialize_transaction(
            email=user.email,
            amount_minor=payment.amount_minor,
            currency=payment.currency,
            reference=reference,
        )
    except PaystackError:
        payment.failure_reason = "Payment initialization did not receive a confirmed provider response."
        payment.provider_status = "initialization_unconfirmed"
        db.commit()
        raise

    payment.checkout_url = checkout_url
    payment.failure_reason = None
    db.commit()
    db.refresh(payment)
    return payment


def _record_provider_failure(
    db: Session, payment: Payment, transaction: VerifiedTransaction, reason: str
) -> None:
    if payment.status == "succeeded":
        return
    payment.status = "failed"
    payment.provider_status = transaction.status
    payment.failure_reason = reason[:500]
    payment.verified_at = datetime.now(timezone.utc)
    if transaction.status == "success":
        payment.refund_review_status = "pending"
    db.commit()


def verify_payment(
    db: Session,
    reference: str,
    *,
    owner_user_id: int | None = None,
) -> tuple[Payment, Subscription | None]:
    query = select(Payment).where(
        Payment.provider == "paystack",
        Payment.provider_reference == reference,
    )
    if owner_user_id is not None:
        query = query.where(Payment.user_id == owner_user_id)
    payment = db.scalar(query)
    if payment is None:
        raise NotFoundError("Payment transaction not found.")
    if payment.status == "succeeded":
        subscription = (
            db.get(Subscription, payment.subscription_id)
            if payment.subscription_id is not None
            else None
        )
        return payment, subscription

    try:
        transaction = verify_transaction(reference)
    except PaystackError as exc:
        payment.failure_reason = str(exc)[:500]
        payment.provider_status = payment.provider_status or "verification_unavailable"
        db.commit()
        raise

    payment = db.scalar(
        select(Payment)
        .where(Payment.id == payment.id)
        .with_for_update()
    )
    if payment is None:
        raise NotFoundError("Payment transaction not found.")
    if payment.status == "succeeded":
        subscription = (
            db.get(Subscription, payment.subscription_id)
            if payment.subscription_id is not None
            else None
        )
        return payment, subscription

    mismatch = None
    owner = db.scalar(
        select(User).where(User.id == payment.user_id).with_for_update()
    )
    if transaction.reference != payment.provider_reference:
        mismatch = "Provider transaction reference did not match."
    elif transaction.amount_minor != payment.amount_minor:
        mismatch = "Provider transaction amount did not match the configured package price."
    elif transaction.currency != payment.currency:
        mismatch = "Provider transaction currency did not match the configured package currency."
    else:
        if owner is None or transaction.customer_email != owner.email.lower():
            mismatch = "Provider transaction customer did not match the purchasing account."
    if mismatch is not None:
        _record_provider_failure(db, payment, transaction, mismatch)
        raise PaymentRejected(mismatch)

    now = datetime.now(timezone.utc)
    payment.provider_status = transaction.status
    if transaction.status in {"failed", "abandoned", "reversed"}:
        _record_provider_failure(
            db, payment, transaction, f"Provider transaction status was {transaction.status}."
        )
        return payment, None
    if transaction.status != "success":
        payment.status = "pending"
        payment.failure_reason = f"Provider transaction is {transaction.status}."
        db.commit()
        db.refresh(payment)
        return payment, None

    semester = db.get(Semester, payment.semester_id) if payment.semester_id else None
    if semester is None:
        payment.status = "succeeded"
        payment.verified_at = now
        payment.refund_review_status = "pending"
        payment.failure_reason = "Verified payment has no valid semester; manual reconciliation is required."
        db.commit()
        return payment, None

    ends_at = datetime.combine(
        semester.ends_on + timedelta(days=1), time.min, tzinfo=timezone.utc
    )
    starts_at = max(
        now,
        datetime.combine(semester.starts_on, time.min, tzinfo=timezone.utc),
    )
    if ends_at <= starts_at:
        payment.status = "succeeded"
        payment.verified_at = now
        payment.refund_review_status = "pending"
        payment.failure_reason = "Verified payment arrived after semester access ended; manual reconciliation is required."
        db.commit()
        return payment, None

    package = db.get(AccessPackage, payment.package_id) if payment.package_id else None
    if package is None or package.package_type != "subscription":
        payment.status = "succeeded"
        payment.verified_at = now
        payment.refund_review_status = "pending"
        payment.failure_reason = "Verified payment has no valid subscription package; manual reconciliation is required."
        db.commit()
        return payment, None

    if _has_active_subscription(db, payment.user_id, payment.semester_id, now):
        payment.status = "succeeded"
        payment.verified_at = now
        payment.refund_review_status = "pending"
        payment.failure_reason = (
            "Payment succeeded while another semester subscription was active; "
            "no duplicate access was granted and manual refund review is required."
        )
        db.commit()
        return payment, None

    subscription = Subscription(
        user_id=payment.user_id,
        plan_id=None,
        package_id=package.id,
        semester_id=payment.semester_id,
        starts_at=starts_at,
        ends_at=ends_at,
        is_active=True,
        status="active",
    )
    try:
        db.add(subscription)
        db.flush()
        payment.subscription_id = subscription.id
        payment.status = "succeeded"
        payment.verified_at = now
        payment.provider_status = transaction.status
        payment.failure_reason = None
        db.add(
            Entitlement(
                user_id=payment.user_id,
                payment_id=payment.id,
                subscription_id=subscription.id,
                package_id=package.id,
                scope_key=f"subscription:{subscription.id}",
                expires_at=ends_at,
                status="active",
            )
        )
        db.add(
            AuditEvent(
                actor_user_id=payment.user_id,
                action="student.subscription_activated",
                target_type="subscription",
                target_id=str(subscription.id),
                event_metadata={
                    "payment_id": payment.id,
                    "package_id": package.id,
                    "semester_id": payment.semester_id,
                },
            )
        )
        db.commit()
        db.refresh(payment)
        db.refresh(subscription)
        return payment, subscription
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(
            "The subscription could not be activated because an equivalent record already exists."
        ) from exc


def get_user_subscriptions(db: Session, user_id: int) -> list[Subscription]:
    now = datetime.now(timezone.utc)
    subscriptions = list(
        db.scalars(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .order_by(Subscription.created_at.desc(), Subscription.id.desc())
        )
    )
    changed = False
    for subscription in subscriptions:
        if subscription.status == "active" and _utc(subscription.ends_at) <= now:
            subscription.status = "expired"
            subscription.is_active = False
            entitlement = db.scalar(
                select(Entitlement).where(
                    Entitlement.subscription_id == subscription.id
                )
            )
            if entitlement is not None:
                entitlement.status = "expired"
            changed = True
    if changed:
        db.commit()
    return subscriptions


def get_payment_history(
    db: Session, *, owner_user_id: int | None, limit: int, offset: int
) -> list[Payment]:
    query = select(Payment)
    if owner_user_id is not None:
        query = query.where(Payment.user_id == owner_user_id)
    return list(
        db.scalars(
            query.order_by(Payment.created_at.desc(), Payment.id.desc())
            .limit(limit)
            .offset(offset)
        )
    )


def subscription_status_for_payment(
    payment: Payment, subscription: Subscription | None
) -> SubscriptionStatus | None:
    if subscription is not None:
        if subscription.status == "active" and _utc(subscription.ends_at) <= datetime.now(timezone.utc):
            return "expired"
        return subscription.status
    if payment.status == "pending":
        return "pending"
    return None
