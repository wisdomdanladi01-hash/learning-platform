from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Faculty(Base):
    __tablename__ = "faculties"
    __table_args__ = (
        UniqueConstraint("institution_id", "name", name="uq_faculty_institution_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    institution_id: Mapped[int] = mapped_column(
        ForeignKey("institutions.id"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Programme(Base):
    __tablename__ = "programmes"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'approved_not_commenced', 'pending_confirmation', 'inactive')",
            name="ck_programme_status",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    faculty_id: Mapped[int | None] = mapped_column(
        ForeignKey("faculties.id"), nullable=True, index=True
    )
    award: Mapped[str | None] = mapped_column(String(100), nullable=True)
    study_level: Mapped[str] = mapped_column(
        String(30), default="undergraduate", server_default="undergraduate", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending_confirmation",
        server_default="pending_confirmation",
        nullable=False,
        index=True,
    )
    commencement_session_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_sessions.id"), nullable=True
    )
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class Department(Base):
    __tablename__ = "departments"
    __table_args__ = (UniqueConstraint("programme_id", "name", name="uq_department_programme_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    programme_id: Mapped[int | None] = mapped_column(ForeignKey("programmes.id"), nullable=True, index=True)
    faculty_id: Mapped[int | None] = mapped_column(ForeignKey("faculties.id"), nullable=True, index=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="pending_confirmation", server_default="pending_confirmation", nullable=False
    )
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)


class AcademicLevel(Base):
    __tablename__ = "academic_levels"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)


class AcademicSession(Base):
    __tablename__ = "academic_sessions"
    __table_args__ = (CheckConstraint("ends_on > starts_on", name="ck_academic_session_dates"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    starts_on: Mapped[date] = mapped_column(Date, nullable=False)
    ends_on: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Semester(Base):
    __tablename__ = "semesters"
    __table_args__ = (
        UniqueConstraint("academic_session_id", "number", name="uq_semester_session_number"),
        CheckConstraint("ends_on > starts_on", name="ck_semester_dates"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    academic_session_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sessions.id"), nullable=False, index=True
    )
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    starts_on: Mapped[date] = mapped_column(Date, nullable=False)
    ends_on: Mapped[date] = mapped_column(Date, nullable=False)


class CurriculumVersion(Base):
    __tablename__ = "curriculum_versions"
    __table_args__ = (
        UniqueConstraint(
            "programme_id", "academic_session_id", "version", name="uq_curriculum_programme_session_version"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    programme_id: Mapped[int] = mapped_column(ForeignKey("programmes.id"), nullable=False, index=True)
    academic_session_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sessions.id"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint("programme_id", "code", name="uq_course_programme_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    programme_id: Mapped[int | None] = mapped_column(ForeignKey("programmes.id"), nullable=True, index=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True, index=True)
    academic_level_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_levels.id"), nullable=True, index=True
    )
    code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    verification_status: Mapped[str] = mapped_column(
        String(30), default="pending_confirmation", server_default="pending_confirmation", nullable=False
    )
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class CourseOffering(Base):
    __tablename__ = "course_offerings"
    __table_args__ = (
        UniqueConstraint(
            "course_id", "curriculum_version_id", "semester_id", name="uq_course_offering_curriculum_semester"
        ),
        CheckConstraint(
            "verification_status IN ('verified', 'user_supplied', 'pending_confirmation')",
            name="ck_course_offering_verification_status",
        ),
        CheckConstraint("credit_units IS NULL OR credit_units > 0", name="ck_course_offering_credit_units"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False, index=True)
    curriculum_version_id: Mapped[int] = mapped_column(
        ForeignKey("curriculum_versions.id"), nullable=False, index=True
    )
    academic_level_id: Mapped[int] = mapped_column(
        ForeignKey("academic_levels.id"), nullable=False, index=True
    )
    semester_id: Mapped[int] = mapped_column(ForeignKey("semesters.id"), nullable=False, index=True)
    credit_units: Mapped[int | None] = mapped_column(Integer, nullable=True)
    course_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    verification_status: Mapped[str] = mapped_column(
        String(30), default="pending_confirmation", server_default="pending_confirmation", nullable=False
    )
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ResourceType(Base):
    __tablename__ = "resource_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class StudentAcademicProfile(Base):
    __tablename__ = "student_academic_profiles"
    __table_args__ = (
        CheckConstraint(
            "jamb_registration_number IS NOT NULL OR matriculation_number IS NOT NULL",
            name="ck_student_profile_has_identifier",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)
    jamb_registration_number: Mapped[str | None] = mapped_column(
        String(40), unique=True, nullable=True
    )
    matriculation_number: Mapped[str | None] = mapped_column(
        String(40), unique=True, nullable=True
    )
    programme_id: Mapped[int | None] = mapped_column(ForeignKey("programmes.id"), nullable=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    admission_session_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_sessions.id"), nullable=True
    )
    verified_level_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_levels.id"), nullable=True, index=True
    )
    verified_session_id: Mapped[int | None] = mapped_column(
        ForeignKey("academic_sessions.id"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
