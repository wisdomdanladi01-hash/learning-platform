from datetime import datetime, timedelta, timezone
import hashlib
import hmac

import httpx
import pytest
from sqlalchemy import select

from app.core.private_storage import store_resource_file
from app.core.security import create_access_token
from app.core.config import settings
from app.models.academic import AcademicLevel, AcademicSession, Semester, StudentAcademicProfile
from app.models.commerce import AccessPackage, Entitlement, Payment
from app.models.resource import Resource
from app.models.subscription import Subscription
from app.models.user import Role, User
from app.services.paystack import PaystackError, VerifiedTransaction
from app.services.resources import can_download_resource


def setup_subscription_data(db_session, *, email: str = "payer@example.com"):
    role = Role(name="admin", description="Administrator")
    db_session.add(role)
    db_session.flush()
    admin = User(
        email="payments-admin@example.com",
        full_name="Payment Administrator",
        password_hash="unused",
        role_id=role.id,
    )
    student = User(email=email, full_name="Student", password_hash="unused")
    level = AcademicLevel(code="300", name="300 Level", sort_order=300)
    db_session.add_all([admin, student, level])
    db_session.flush()
    db_session.add(
        StudentAcademicProfile(
            user_id=student.id,
            jamb_registration_number=f"JAMB-{student.id}",
            verified_level_id=level.id,
        )
    )
    today = datetime.now(timezone.utc).date()
    session = AcademicSession(
        name="2026/2027",
        starts_on=today - timedelta(days=30),
        ends_on=today + timedelta(days=90),
        is_active=True,
    )
    db_session.add(session)
    db_session.flush()
    semester = Semester(
        academic_session_id=session.id,
        number=1,
        starts_on=today - timedelta(days=15),
        ends_on=today + timedelta(days=60),
    )
    db_session.add(semester)
    db_session.flush()
    package = AccessPackage(
        name=f"Semester access {student.id}",
        package_type="subscription",
        price_minor=100_000,
        currency="NGN",
        semester_id=semester.id,
        is_active=True,
        available_from=datetime.now(timezone.utc) - timedelta(days=1),
        available_until=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db_session.add(package)
    db_session.commit()
    return admin, student, semester, package


def initialize_as_student(client, student, package):
    return client.post(
        "/api/v1/payments/initialize",
        headers={"Authorization": f"Bearer {create_access_token(student.id)}"},
        json={"package_id": package.id},
    )


def successful_transaction(
    expected_reference: str, *, email: str = "payer@example.com", **changes
):
    values = {
        "reference": expected_reference,
        "status": "success",
        "amount_minor": 100_000,
        "currency": "NGN",
        "customer_email": email,
    }
    values.update(changes)
    return VerifiedTransaction(**values)


def test_admin_can_configure_semester_price_and_student_initializes_payment(
    client, db_session, monkeypatch
):
    from app.services import payments

    admin, student, semester, _package = setup_subscription_data(db_session)
    admin_headers = {"Authorization": f"Bearer {create_access_token(admin.id)}"}
    response = client.post(
        "/api/v1/admin/subscriptions/packages",
        headers=admin_headers,
        json={
            "name": "Spring semester",
            "description": "Semester access",
            "price_minor": 100_000,
            "currency": "NGN",
            "semester_id": semester.id,
            "is_active": True,
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["price_minor"] == 100_000

    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    package_id = response.json()["id"]
    initialized = initialize_as_student(
        client, student, db_session.get(AccessPackage, package_id)
    )
    assert initialized.status_code == 201, initialized.text
    assert initialized.json()["checkout_url"] == "https://checkout.paystack.com/test"

    payment = db_session.get(Payment, initialized.json()["id"])
    assert payment is not None
    assert payment.amount_minor == 100_000
    assert payment.currency == "NGN"
    assert payment.provider_reference == initialized.json()["reference"]


def test_verified_payment_activates_one_semester_subscription_and_entitlement(
    client, db_session, monkeypatch
):
    from app.services import payments

    _admin, student, semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    assert initialized.status_code == 201
    reference = initialized.json()["reference"]
    calls = []

    def verify(reference_value):
        calls.append(reference_value)
        return successful_transaction(reference_value)

    monkeypatch.setattr(payments, "verify_transaction", verify)
    headers = {"Authorization": f"Bearer {create_access_token(student.id)}"}
    response = client.post(
        f"/api/v1/payments/{reference}/verify", headers=headers
    )
    assert response.status_code == 200, response.text
    assert response.json()["payment"]["status"] == "succeeded"
    assert response.json()["subscription_status"] == "active"

    subscription = db_session.scalar(select(Subscription))
    assert subscription is not None
    assert subscription.user_id == student.id
    assert subscription.semester_id == semester.id
    assert subscription.package_id == package.id
    assert subscription.is_active is True
    assert subscription.ends_at.date() == semester.ends_on + timedelta(days=1)
    entitlement = db_session.scalar(select(Entitlement))
    assert entitlement is not None
    assert entitlement.subscription_id == subscription.id
    assert entitlement.payment_id == db_session.scalar(select(Payment)).id

    repeated = client.post(
        f"/api/v1/payments/{reference}/verify", headers=headers
    )
    assert repeated.status_code == 200
    assert calls == [reference]
    assert len(list(db_session.scalars(select(Subscription)))) == 1
    assert len(list(db_session.scalars(select(Entitlement)))) == 1


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        ({"amount_minor": 99_999}, "amount"),
        ({"currency": "USD"}, "currency"),
        ({"reference": "other-reference"}, "reference"),
        ({"customer_email": "attacker@example.com"}, "customer"),
    ],
)
def test_mismatched_provider_transaction_never_grants_access(
    client, db_session, monkeypatch, changes, message
):
    from app.services import payments

    _admin, student, _semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    reference = initialized.json()["reference"]
    monkeypatch.setattr(
        payments,
        "verify_transaction",
        lambda value: successful_transaction(value, **changes),
    )
    response = client.post(
        f"/api/v1/payments/{reference}/verify",
        headers={"Authorization": f"Bearer {create_access_token(student.id)}"},
    )
    assert response.status_code == 409
    assert message in response.json()["detail"]
    payment = db_session.scalar(select(Payment))
    assert payment.status == "failed"
    assert payment.refund_review_status == "pending"
    assert db_session.scalar(select(Subscription)) is None
    assert db_session.scalar(select(Entitlement)) is None


@pytest.mark.parametrize(
    ("provider_status", "expected_status"),
    [("failed", "failed"), ("abandoned", "failed"), ("ongoing", "pending")],
)
def test_failed_and_pending_provider_states_do_not_grant_access(
    client, db_session, monkeypatch, provider_status, expected_status
):
    from app.services import payments

    _admin, student, _semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    reference = initialized.json()["reference"]
    monkeypatch.setattr(
        payments,
        "verify_transaction",
        lambda value: successful_transaction(value, status=provider_status),
    )
    response = client.post(
        f"/api/v1/payments/{reference}/verify",
        headers={"Authorization": f"Bearer {create_access_token(student.id)}"},
    )
    assert response.status_code == (202 if expected_status == "pending" else 200)
    assert response.json()["payment"]["status"] == expected_status
    assert db_session.scalar(select(Subscription)) is None
    assert db_session.scalar(select(Entitlement)) is None


def test_transaction_is_private_to_purchasing_student(client, db_session, monkeypatch):
    from app.services import payments

    _admin, student, _semester, package = setup_subscription_data(db_session)
    other = User(
        email="other@example.com", full_name="Other", password_hash="unused"
    )
    db_session.add(other)
    db_session.commit()
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    response = client.post(
        f"/api/v1/payments/{initialized.json()['reference']}/verify",
        headers={"Authorization": f"Bearer {create_access_token(other.id)}"},
    )
    assert response.status_code == 404
    assert db_session.scalar(select(Subscription)) is None

    history = client.get(
        "/api/v1/payments",
        headers={"Authorization": f"Bearer {create_access_token(other.id)}"},
    )
    assert history.status_code == 200
    assert history.json() == []


def test_webhook_signature_and_duplicate_event_are_idempotent(
    client, db_session, monkeypatch
):
    from app.api.routes import payments as routes
    from app.services import payments

    _admin, student, _semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    reference = initialized.json()["reference"]
    monkeypatch.setattr(routes, "verify_webhook_signature", lambda body, signature: True)
    calls = []

    def verify(value):
        calls.append(value)
        return successful_transaction(value)

    monkeypatch.setattr(payments, "verify_transaction", verify)
    event = {"event": "charge.success", "data": {"reference": reference}}
    first = client.post(
        "/api/v1/payments/paystack/webhook",
        json=event,
        headers={"x-paystack-signature": "test"},
    )
    second = client.post(
        "/api/v1/payments/paystack/webhook",
        json=event,
        headers={"x-paystack-signature": "test"},
    )
    assert first.status_code == second.status_code == 200
    assert len(calls) == 1
    assert len(list(db_session.scalars(select(Subscription)))) == 1
    assert len(list(db_session.scalars(select(Entitlement)))) == 1

    monkeypatch.setattr(routes, "verify_webhook_signature", lambda body, signature: False)
    rejected = client.post(
        "/api/v1/payments/paystack/webhook",
        json=event,
        headers={"x-paystack-signature": "invalid"},
    )
    assert rejected.status_code == 401


def test_paystack_timeout_keeps_transaction_unconfirmed_and_grants_no_access(
    client, db_session, monkeypatch
):
    from app.services import payments

    _admin, student, _semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    reference = initialized.json()["reference"]

    def timeout(_reference):
        raise PaystackError("Paystack could not be reached.")

    monkeypatch.setattr(payments, "verify_transaction", timeout)
    response = client.post(
        f"/api/v1/payments/{reference}/verify",
        headers={"Authorization": f"Bearer {create_access_token(student.id)}"},
    )
    assert response.status_code == 502
    payment = db_session.scalar(select(Payment))
    assert payment.status == "pending"
    assert payment.failure_reason is not None
    assert db_session.scalar(select(Subscription)) is None


def test_duplicate_successful_purchases_do_not_extend_or_duplicate_access(
    client, db_session, monkeypatch
):
    from app.services import payments

    _admin, student, _semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    first = initialize_as_student(client, student, package)
    second = initialize_as_student(client, student, package)
    assert first.status_code == second.status_code == 201
    monkeypatch.setattr(
        payments,
        "verify_transaction",
        lambda value: successful_transaction(value),
    )
    headers = {"Authorization": f"Bearer {create_access_token(student.id)}"}
    for initialized in (first, second):
        response = client.post(
            f"/api/v1/payments/{initialized.json()['reference']}/verify",
            headers=headers,
        )
        assert response.status_code == 200

    subscriptions = list(db_session.scalars(select(Subscription)))
    entitlements = list(db_session.scalars(select(Entitlement)))
    payments_by_status = list(db_session.scalars(select(Payment)))
    assert len(subscriptions) == len(entitlements) == 1
    assert sum(payment.status == "succeeded" for payment in payments_by_status) == 2
    second_payment = next(
        payment for payment in payments_by_status if payment.subscription_id is None
    )
    assert second_payment.refund_review_status == "pending"
    assert "another semester subscription was active" in second_payment.failure_reason


def test_paystack_adapter_initializes_and_verifies_using_server_credentials(monkeypatch):
    from app.services import paystack

    monkeypatch.setattr(settings, "paystack_secret_key", "sk_test_unit-test")
    monkeypatch.setattr(settings, "app_env", "development")
    monkeypatch.setattr(settings, "paystack_live_enabled", False)
    requests = []

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def raise_for_status(self):
            return None

        def json(self):
            return self.payload

    def fake_request(method, url, **kwargs):
        requests.append((method, url, kwargs))
        if method == "POST":
            return FakeResponse(
                {
                    "status": True,
                    "data": {
                        "reference": "LRP-test",
                        "authorization_url": "https://checkout.paystack.com/LRP-test",
                    },
                }
            )
        return FakeResponse(
            {
                "status": True,
                "data": {
                    "reference": "LRP-test",
                    "status": "success",
                    "amount": 100_000,
                    "currency": "NGN",
                    "customer": {"email": "payer@example.com"},
                },
            }
        )

    monkeypatch.setattr(paystack.httpx, "request", fake_request)
    checkout = paystack.initialize_transaction(
        email="payer@example.com",
        amount_minor=100_000,
        currency="NGN",
        reference="LRP-test",
    )
    verified = paystack.verify_transaction("LRP-test")

    assert checkout == "https://checkout.paystack.com/LRP-test"
    assert verified == VerifiedTransaction(
        reference="LRP-test",
        status="success",
        amount_minor=100_000,
        currency="NGN",
        customer_email="payer@example.com",
    )
    assert requests[0][2]["json"]["amount"] == 100_000
    assert requests[0][2]["headers"]["Authorization"] == "Bearer sk_test_unit-test"
    assert requests[1][1].endswith("/transaction/verify/LRP-test")


def test_paystack_adapter_rejects_unconfigured_keys_and_times_out(monkeypatch):
    from app.services import paystack

    monkeypatch.setattr(settings, "paystack_secret_key", "")
    with pytest.raises(paystack.PaystackNotConfigured):
        paystack.verify_transaction("LRP-test")

    monkeypatch.setattr(settings, "paystack_secret_key", "sk_test_unit-test")

    def raise_timeout(*args, **kwargs):
        raise httpx.ReadTimeout("provider timeout")

    monkeypatch.setattr(paystack.httpx, "request", raise_timeout)
    with pytest.raises(PaystackError, match="remains pending"):
        paystack.verify_transaction("LRP-test")


def test_paystack_webhook_hmac_uses_raw_body(monkeypatch):
    from app.services import paystack

    secret = "sk_test_unit-test"
    body = b'{"event":"charge.success"}'
    signature = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()
    monkeypatch.setattr(settings, "paystack_secret_key", secret)
    monkeypatch.setattr(settings, "app_env", "development")
    monkeypatch.setattr(settings, "paystack_live_enabled", False)
    assert paystack.verify_webhook_signature(body, signature)
    assert not paystack.verify_webhook_signature(body, "invalid")


def test_subscription_expiry_revokes_its_entitlement(
    client, db_session, monkeypatch
):
    from app.services import payments

    _admin, student, _semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    reference = initialized.json()["reference"]
    monkeypatch.setattr(
        payments, "verify_transaction", lambda value: successful_transaction(value)
    )
    headers = {"Authorization": f"Bearer {create_access_token(student.id)}"}
    activated = client.post(f"/api/v1/payments/{reference}/verify", headers=headers)
    assert activated.status_code == 200

    subscription = db_session.scalar(select(Subscription))
    entitlement = db_session.scalar(select(Entitlement))
    assert subscription is not None and entitlement is not None
    subscription.starts_at = datetime.now(timezone.utc) - timedelta(days=2)
    subscription.ends_at = datetime.now(timezone.utc) - timedelta(days=1)
    db_session.commit()
    response = client.get("/api/v1/subscriptions/me", headers=headers)
    assert response.status_code == 200
    assert response.json()[0]["status"] == "expired"
    db_session.refresh(entitlement)
    assert entitlement.status == "expired"


def test_subscription_payment_grants_resource_download_until_semester_end(
    client, db_session, monkeypatch
):
    from app.services import payments

    _admin, student, semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    reference = initialized.json()["reference"]
    monkeypatch.setattr(
        payments, "verify_transaction", lambda value: successful_transaction(value)
    )
    activated = client.post(
        f"/api/v1/payments/{reference}/verify",
        headers={"Authorization": f"Bearer {create_access_token(student.id)}"},
    )
    assert activated.status_code == 200

    storage_key, mime_type, file_name = store_resource_file(
        b"%PDF-1.7 subscription resource",
        "semester.pdf",
        "application/pdf",
    )
    resource = Resource(
        title="Semester notes",
        file_name=file_name,
        storage_path=storage_key,
        mime_type=mime_type,
        file_size_bytes=len(b"%PDF-1.7 subscription resource"),
        semester_id=semester.id,
        is_published=True,
        access_policy="subscription_or_entitlement",
        requires_verification=True,
    )
    db_session.add(resource)
    db_session.commit()
    assert can_download_resource(db_session, student, resource)
    headers = {"Authorization": f"Bearer {create_access_token(student.id)}"}
    downloaded = client.get(
        f"/api/v1/resources/{resource.id}/download", headers=headers
    )
    assert downloaded.status_code == 200
    assert downloaded.content == b"%PDF-1.7 subscription resource"

    subscription = db_session.scalar(select(Subscription))
    assert subscription is not None
    subscription.status = "expired"
    subscription.is_active = False
    db_session.commit()
    assert not can_download_resource(db_session, student, resource)
    denied = client.get(
        f"/api/v1/resources/{resource.id}/download", headers=headers
    )
    assert denied.status_code == 403


def test_revoked_subscription_entitlement_denies_access(
    client, db_session, monkeypatch
):
    from app.services import payments

    _admin, student, semester, package = setup_subscription_data(db_session)
    monkeypatch.setattr(
        payments,
        "initialize_transaction",
        lambda **kwargs: "https://checkout.paystack.com/test",
    )
    initialized = initialize_as_student(client, student, package)
    monkeypatch.setattr(
        payments,
        "verify_transaction",
        lambda value: successful_transaction(value),
    )
    client.post(
        f"/api/v1/payments/{initialized.json()['reference']}/verify",
        headers={"Authorization": f"Bearer {create_access_token(student.id)}"},
    )
    storage_key, mime_type, file_name = store_resource_file(
        b"%PDF-1.7 subscription resource",
        "semester.pdf",
        "application/pdf",
    )
    resource = Resource(
        title="Semester notes",
        file_name=file_name,
        storage_path=storage_key,
        mime_type=mime_type,
        file_size_bytes=len(b"%PDF-1.7 subscription resource"),
        semester_id=semester.id,
        is_published=True,
        access_policy="subscription_or_entitlement",
        requires_verification=True,
    )
    db_session.add(resource)
    entitlement = db_session.scalar(select(Entitlement))
    assert entitlement is not None
    entitlement.status = "revoked"
    db_session.commit()
    assert not can_download_resource(db_session, student, resource)
