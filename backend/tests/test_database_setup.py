from sqlalchemy import create_engine

from app.db.database import Base
import app.models  # noqa: F401


def test_database_metadata_contains_core_tables() -> None:
    table_names = set(Base.metadata.tables)
    expected = {
        "roles",
        "users",
        "programmes",
        "departments",
        "academic_levels",
        "academic_sessions",
        "semesters",
        "courses",
        "resource_types",
        "student_academic_profiles",
        "verification_submissions",
        "verification_documents",
        "resource_categories",
        "resources",
        "access_packages",
        "package_courses",
        "package_resources",
        "subscription_plans",
        "subscriptions",
        "payments",
        "entitlements",
        "audit_events",
    }
    assert expected.issubset(table_names)


def test_metadata_can_create_schema_with_foreign_keys() -> None:
    engine = create_engine("sqlite:///:memory:")
    try:
        Base.metadata.create_all(engine)
    finally:
        engine.dispose()


def test_subscription_and_package_prices_use_minor_units() -> None:
    assert str(Base.metadata.tables["subscription_plans"].c.price_minor.type) == "INTEGER"
    assert str(Base.metadata.tables["access_packages"].c.price_minor.type) == "INTEGER"
    assert "currency" in Base.metadata.tables["subscription_plans"].c


def test_verified_level_is_a_separate_admin_managed_profile_field() -> None:
    profile = Base.metadata.tables["student_academic_profiles"]
    level_fk = next(iter(profile.c.verified_level_id.foreign_keys))
    assert level_fk.target_fullname == "academic_levels.id"
    assert "jamb_registration_number" in profile.c
    assert "matriculation_number" in profile.c
