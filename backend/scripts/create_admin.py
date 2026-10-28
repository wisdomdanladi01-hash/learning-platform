from getpass import getpass

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.user import Role, User


def main() -> None:
    email = input("Administrator email: ").strip()
    full_name = input("Administrator full name: ").strip()
    try:
        email = validate_email(email, check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise SystemExit(f"Invalid email address: {exc}") from exc
    password = getpass("Password (minimum 12 characters): ")
    confirmation = getpass("Confirm password: ")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters.")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")
    if not email or not full_name:
        raise SystemExit("Email and full name are required.")

    db = SessionLocal()
    try:
        if db.scalar(select(User.id).where(User.email == email)) is not None:
            raise SystemExit("An account with that email already exists; no changes were made.")

        admin_role = db.scalar(select(Role).where(Role.name == "admin"))
        if admin_role is None:
            admin_role = Role(name="admin", description="Platform administrator")
            db.add(admin_role)
            db.flush()

        db.add(
            User(
                email=email,
                full_name=full_name,
                password_hash=hash_password(password),
                role_id=admin_role.id,
                is_active=True,
            )
        )
        db.commit()
        print("Administrator account created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
