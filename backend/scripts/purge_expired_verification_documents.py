from app.db.database import SessionLocal
from app.services.verification import purge_expired_verification_documents


def main() -> None:
    db = SessionLocal()
    try:
        deleted_count = purge_expired_verification_documents(db)
    finally:
        db.close()
    print(f"Deleted {deleted_count} expired verification document(s).")


if __name__ == "__main__":
    main()
