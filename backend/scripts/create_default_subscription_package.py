from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.academic import AcademicSession, Semester
from app.models.commerce import AccessPackage


def main() -> None:
    today = datetime.now(timezone.utc).date()
    with SessionLocal() as db:
        semester = db.scalar(
            select(Semester)
            .join(AcademicSession, AcademicSession.id == Semester.academic_session_id)
            .where(
                AcademicSession.is_active.is_(True),
                Semester.ends_on >= today,
            )
            .order_by(Semester.starts_on.asc(), Semester.number.asc())
            .limit(1)
        )
        if semester is None:
            raise RuntimeError(
                "No current or upcoming semester exists in the active academic session. "
                "Create the academic session and semester first."
            )
        session = db.get(AcademicSession, semester.academic_session_id)
        if session is None:
            raise RuntimeError("The selected semester has no academic session.")

        name = f"{session.name} semester {semester.number} subscription"
        package = db.scalar(
            select(AccessPackage).where(AccessPackage.name == name)
        )
        if package is None:
            package = AccessPackage(
                name=name,
                description=f"Academic resource access for semester {semester.number} of {session.name}.",
                package_type="subscription",
                price_minor=settings.default_semester_subscription_price_minor,
                currency="NGN",
                semester_id=semester.id,
                is_active=True,
            )
            db.add(package)
            db.commit()
            db.refresh(package)
            print(
                f"Created package {package.id}: {package.name} "
                f"at {package.price_minor} {package.currency} minor units."
            )
            return

        print(
            f"Package {package.id} already exists: {package.name} "
            f"at {package.price_minor} {package.currency} minor units. "
            "Use the administrator package API to change its price."
        )


if __name__ == "__main__":
    main()
