import csv
import io
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.db.database import get_db
from app.models.academic import (
    AcademicLevel,
    AcademicSession,
    Course,
    CourseOffering,
    CurriculumVersion,
    Department,
    Faculty,
    Institution,
    Programme,
    Semester,
)
from app.models.user import User
from app.models.resource import Resource
from app.models.identity import VerificationSubmission
from app.models.commerce import AccessPackage, Payment
from sqlalchemy import func
from app.schemas.academic import (
    CourseCreate,
    CourseOfferingImportResponse,
    CourseOfferingResponse,
    CourseOfferingUpdate,
    CourseResponse,
    CourseUpdate,
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    FacultyCreate,
    FacultyResponse,
    FacultyUpdate,
    InstitutionCreate,
    InstitutionResponse,
    InstitutionUpdate,
    ProgrammeCreate,
    ProgrammeResponse,
    ProgrammeUpdate,
)


router = APIRouter(prefix="/admin/academic", tags=["academic directory administration"])
MAX_CSV_BYTES = 2 * 1024 * 1024
MAX_CSV_ROWS = 2_000
CSV_COLUMNS = {
    "programme_code",
    "course_code",
    "course_title",
    "level_code",
    "academic_session",
    "semester",
    "credit_units",
}
OPTIONAL_CSV_COLUMNS = {
    "department_code",
    "curriculum_version",
    "course_type",
    "verification_status",
    "source_note",
}
ALLOWED_VERIFICATION_STATUSES = {"verified", "user_supplied", "pending_confirmation"}


def _validate_course_references(
    db: Session,
    programme_id: int,
    department_id: int | None,
    academic_level_id: int | None,
) -> None:
    programme = db.get(Programme, programme_id)
    if programme is None:
        raise HTTPException(status_code=422, detail="The selected programme does not exist.")
    if department_id is not None:
        department = db.get(Department, department_id)
        if department is None:
            raise HTTPException(status_code=422, detail="The selected department does not exist.")
        if department.programme_id not in (None, programme.id):
            raise HTTPException(
                status_code=422,
                detail="The selected department is assigned to a different programme.",
            )
        if (
            department.faculty_id is not None
            and programme.faculty_id is not None
            and department.faculty_id != programme.faculty_id
        ):
            raise HTTPException(
                status_code=422,
                detail="The selected department and programme belong to different faculties.",
            )
    if academic_level_id is not None and db.get(AcademicLevel, academic_level_id) is None:
        raise HTTPException(status_code=422, detail="The selected academic level does not exist.")


def _commit_or_conflict(db: Session, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=detail) from exc


@router.get("/institutions", response_model=list[InstitutionResponse])
def admin_list_institutions(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[Institution]:
    return db.scalars(select(Institution).order_by(Institution.name.asc())).all()


@router.post(
    "/institutions",
    response_model=InstitutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_institution(
    data: InstitutionCreate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Institution:
    institution = Institution(**data.model_dump())
    db.add(institution)
    _commit_or_conflict(db, "An institution with that code or name already exists.")
    db.refresh(institution)
    return institution


@router.patch("/institutions/{institution_id}", response_model=InstitutionResponse)
def admin_update_institution(
    institution_id: int,
    data: InstitutionUpdate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Institution:
    institution = db.get(Institution, institution_id)
    if institution is None:
        raise HTTPException(status_code=404, detail="Institution not found.")
    changes = data.model_dump(exclude_unset=True)
    for field in ("code", "name", "is_active"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=422, detail=f"{field} cannot be null.")
    for field, value in changes.items():
        setattr(institution, field, value)
    _commit_or_conflict(db, "The updated institution conflicts with an existing record.")
    db.refresh(institution)
    return institution


@router.get("/faculties", response_model=list[FacultyResponse])
def admin_list_faculties(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[Faculty]:
    return db.scalars(select(Faculty).order_by(Faculty.name.asc())).all()


@router.post("/faculties", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def admin_create_faculty(
    data: FacultyCreate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Faculty:
    if db.get(Institution, data.institution_id) is None:
        raise HTTPException(status_code=422, detail="The selected institution does not exist.")
    faculty = Faculty(**data.model_dump())
    db.add(faculty)
    _commit_or_conflict(db, "A faculty with that code or institution/name already exists.")
    db.refresh(faculty)
    return faculty


@router.patch("/faculties/{faculty_id}", response_model=FacultyResponse)
def admin_update_faculty(
    faculty_id: int,
    data: FacultyUpdate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Faculty:
    faculty = db.get(Faculty, faculty_id)
    if faculty is None:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    changes = data.model_dump(exclude_unset=True)
    if "institution_id" in changes:
        if changes["institution_id"] is None:
            raise HTTPException(status_code=422, detail="institution_id cannot be null.")
        if db.get(Institution, changes["institution_id"]) is None:
            raise HTTPException(status_code=422, detail="The selected institution does not exist.")
    for field in ("code", "name", "is_active"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=422, detail=f"{field} cannot be null.")
    for field, value in changes.items():
        setattr(faculty, field, value)
    _commit_or_conflict(db, "The updated faculty conflicts with an existing record.")
    db.refresh(faculty)
    return faculty


@router.get("/departments", response_model=list[DepartmentResponse])
def admin_list_departments(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[Department]:
    return db.scalars(select(Department).order_by(Department.name.asc())).all()


def _validate_department_references(
    db: Session,
    programme_id: int | None,
    faculty_id: int | None,
) -> None:
    programme = db.get(Programme, programme_id) if programme_id is not None else None
    faculty = db.get(Faculty, faculty_id) if faculty_id is not None else None
    if programme_id is not None and programme is None:
        raise HTTPException(status_code=422, detail="The selected programme does not exist.")
    if faculty_id is not None and faculty is None:
        raise HTTPException(status_code=422, detail="The selected faculty does not exist.")
    if (
        programme is not None
        and faculty_id is not None
        and programme.faculty_id is not None
        and programme.faculty_id != faculty_id
    ):
        raise HTTPException(
            status_code=422,
            detail="The selected department and programme belong to different faculties.",
        )


@router.post(
    "/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_department(
    data: DepartmentCreate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Department:
    _validate_department_references(db, data.programme_id, data.faculty_id)
    department = Department(**data.model_dump())
    db.add(department)
    _commit_or_conflict(db, "A department with that code or programme/name already exists.")
    db.refresh(department)
    return department


@router.patch("/departments/{department_id}", response_model=DepartmentResponse)
def admin_update_department(
    department_id: int,
    data: DepartmentUpdate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Department:
    department = db.get(Department, department_id)
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found.")
    changes = data.model_dump(exclude_unset=True)
    _validate_department_references(
        db,
        changes.get("programme_id", department.programme_id),
        changes.get("faculty_id", department.faculty_id),
    )
    for field in ("code", "name", "status", "is_active"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=422, detail=f"{field} cannot be null.")
    for field, value in changes.items():
        setattr(department, field, value)
    _commit_or_conflict(db, "The updated department conflicts with an existing record.")
    db.refresh(department)
    return department


@router.get("/programmes", response_model=list[ProgrammeResponse])
def admin_list_programmes(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[Programme]:
    return db.scalars(select(Programme).order_by(Programme.name.asc())).all()


def _validate_programme_references(
    db: Session,
    faculty_id: int | None,
    commencement_session_id: int | None,
) -> None:
    if faculty_id is not None and db.get(Faculty, faculty_id) is None:
        raise HTTPException(status_code=422, detail="The selected faculty does not exist.")
    if (
        commencement_session_id is not None
        and db.get(AcademicSession, commencement_session_id) is None
    ):
        raise HTTPException(
            status_code=422,
            detail="The selected commencement session does not exist.",
        )


@router.post("/programmes", response_model=ProgrammeResponse, status_code=status.HTTP_201_CREATED)
def admin_create_programme(
    data: ProgrammeCreate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Programme:
    _validate_programme_references(
        db, data.faculty_id, data.commencement_session_id
    )
    programme = Programme(**data.model_dump())
    db.add(programme)
    _commit_or_conflict(db, "A programme with that code or name already exists.")
    db.refresh(programme)
    return programme


@router.patch("/programmes/{programme_id}", response_model=ProgrammeResponse)
def admin_update_programme(
    programme_id: int,
    data: ProgrammeUpdate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Programme:
    programme = db.get(Programme, programme_id)
    if programme is None:
        raise HTTPException(status_code=404, detail="Programme not found.")
    changes = data.model_dump(exclude_unset=True)
    _validate_programme_references(
        db,
        changes.get("faculty_id", programme.faculty_id),
        changes.get("commencement_session_id", programme.commencement_session_id),
    )
    for field in ("code", "name", "study_level", "status", "is_active"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=422, detail=f"{field} cannot be null.")
    for field, value in changes.items():
        setattr(programme, field, value)
    _commit_or_conflict(db, "The updated programme conflicts with an existing record.")
    db.refresh(programme)
    return programme


@router.get("/courses", response_model=list[CourseResponse])
def admin_list_courses(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[Course]:
    return db.scalars(select(Course).order_by(Course.code.asc(), Course.id.asc())).all()


@router.post(
    "/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_course(
    data: CourseCreate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Course:
    _validate_course_references(
        db, data.programme_id, data.department_id, data.academic_level_id
    )
    course = Course(**data.model_dump())
    db.add(course)
    _commit_or_conflict(db, "A course with that code already exists for the selected programme.")
    db.refresh(course)
    return course


@router.patch("/courses/{course_id}", response_model=CourseResponse)
def admin_update_course(
    course_id: int,
    data: CourseUpdate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    changes = data.model_dump(exclude_unset=True)
    _validate_course_references(
        db,
        changes.get("programme_id", course.programme_id),
        changes.get("department_id", course.department_id),
        changes.get("academic_level_id", course.academic_level_id),
    )
    for field, value in changes.items():
        setattr(course, field, value)
    course.last_verified_at = (
        datetime.now(timezone.utc)
        if changes.get("verification_status") == "verified"
        else course.last_verified_at
    )
    _commit_or_conflict(db, "The updated course conflicts with an existing course.")
    db.refresh(course)
    return course


@router.get("/course-offerings", response_model=list[CourseOfferingResponse])
def admin_list_course_offerings(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[CourseOffering]:
    return db.scalars(select(CourseOffering).order_by(CourseOffering.id.asc())).all()


@router.patch(
    "/course-offerings/{offering_id}",
    response_model=CourseOfferingResponse,
)
def admin_update_course_offering(
    offering_id: int,
    data: CourseOfferingUpdate,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> CourseOffering:
    offering = db.get(CourseOffering, offering_id)
    if offering is None:
        raise HTTPException(status_code=404, detail="Course offering not found.")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(offering, field, value)
    _commit_or_conflict(db, "The updated course offering violates a catalogue constraint.")
    db.refresh(offering)
    return offering


@router.post(
    "/course-offerings/import",
    response_model=CourseOfferingImportResponse,
)
def admin_import_course_offerings(
    upload: Annotated[UploadFile, File()],
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> CourseOfferingImportResponse:
    content = upload.file.read(MAX_CSV_BYTES + 1)
    upload.file.close()
    if len(content) > MAX_CSV_BYTES:
        raise HTTPException(status_code=413, detail="CSV file exceeds the 2 MB limit.")
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=422, detail="CSV must be encoded as UTF-8.") from exc

    reader = csv.DictReader(io.StringIO(decoded, newline=""))
    if reader.fieldnames is None:
        raise HTTPException(status_code=422, detail="CSV must include a header row.")
    normalized_headers = [(name or "").strip() for name in reader.fieldnames]
    if len(normalized_headers) != len(set(normalized_headers)):
        raise HTTPException(status_code=422, detail="CSV contains duplicate column names.")
    unknown_headers = set(normalized_headers) - CSV_COLUMNS - OPTIONAL_CSV_COLUMNS
    if unknown_headers:
        raise HTTPException(
            status_code=422,
            detail=f"CSV contains unsupported columns: {', '.join(sorted(unknown_headers))}.",
        )
    reader.fieldnames = normalized_headers
    if not CSV_COLUMNS.issubset(set(normalized_headers)):
        required = ", ".join(sorted(CSV_COLUMNS))
        raise HTTPException(
            status_code=422,
            detail=f"CSV is missing required columns. Required headers: {required}.",
        )

    stats = {
        "imported_rows": 0,
        "created_courses": 0,
        "updated_courses": 0,
        "created_offerings": 0,
        "updated_offerings": 0,
    }

    try:
        for line_number, raw_row in enumerate(reader, start=2):
            if line_number - 1 > MAX_CSV_ROWS:
                raise HTTPException(
                    status_code=413,
                    detail=f"CSV exceeds the {MAX_CSV_ROWS}-row limit.",
                )
            if raw_row is None:
                continue
            if None in raw_row:
                raise HTTPException(
                    status_code=422,
                    detail=f"CSV row {line_number}: more fields than declared in the header.",
                )
            if not any(value and value.strip() for value in raw_row.values()):
                continue
            row = {
                (key or "").strip(): (value or "").strip()
                for key, value in raw_row.items()
            }

            def required(name: str) -> str:
                value = row.get(name, "")
                if not value:
                    raise HTTPException(
                        status_code=422,
                        detail=f"CSV row {line_number}: {name} is required.",
                    )
                return value

            programme_code = required("programme_code")
            course_code = required("course_code").upper()
            course_title = required("course_title")
            level_code = required("level_code")
            session_name = required("academic_session")
            try:
                semester_number = int(required("semester"))
                credits = int(required("credit_units"))
            except ValueError as exc:
                raise HTTPException(
                    status_code=422,
                    detail=f"CSV row {line_number}: semester and credit_units must be integers.",
                ) from exc
            if semester_number not in (1, 2) or credits <= 0:
                raise HTTPException(
                    status_code=422,
                    detail=f"CSV row {line_number}: semester must be 1 or 2 and credit_units must be positive.",
                )
            verification_status = row.get("verification_status") or "user_supplied"
            if verification_status not in ALLOWED_VERIFICATION_STATUSES:
                raise HTTPException(
                    status_code=422,
                    detail=f"CSV row {line_number}: verification_status is invalid.",
                )

            programme = db.scalar(select(Programme).where(Programme.code == programme_code))
            level = db.scalar(select(AcademicLevel).where(AcademicLevel.code == level_code))
            academic_session = db.scalar(
                select(AcademicSession).where(AcademicSession.name == session_name)
            )
            if programme is None or level is None or academic_session is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"CSV row {line_number}: programme, level, or academic session was not found.",
                )
            semester = db.scalar(
                select(Semester).where(
                    Semester.academic_session_id == academic_session.id,
                    Semester.number == semester_number,
                )
            )
            if semester is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"CSV row {line_number}: semester {semester_number} is not configured for {session_name}.",
                )

            department = None
            department_code = row.get("department_code", "")
            if department_code:
                department = db.scalar(
                    select(Department).where(Department.code == department_code)
                )
                if department is None:
                    raise HTTPException(
                        status_code=422,
                        detail=f"CSV row {line_number}: department_code was not found.",
                    )
                _validate_course_references(db, programme.id, department.id, level.id)

            curriculum_version = row.get("curriculum_version") or f"Imported {session_name}"
            curriculum = db.scalar(
                select(CurriculumVersion).where(
                    CurriculumVersion.programme_id == programme.id,
                    CurriculumVersion.academic_session_id == academic_session.id,
                    CurriculumVersion.version == curriculum_version,
                )
            )
            if curriculum is None:
                curriculum = CurriculumVersion(
                    programme_id=programme.id,
                    academic_session_id=academic_session.id,
                    version=curriculum_version,
                    source_note=row.get("source_note") or "Imported from an administrator-provided CSV.",
                    is_active=False,
                )
                db.add(curriculum)
                db.flush()

            course = db.scalar(
                select(Course).where(
                    Course.programme_id == programme.id,
                    Course.code == course_code,
                )
            )
            if course is None:
                course = Course(
                    programme_id=programme.id,
                    department_id=department.id if department else None,
                    academic_level_id=level.id,
                    code=course_code,
                    title=course_title,
                    is_active=True,
                    verification_status=verification_status,
                    source_note=row.get("source_note") or "Imported from an administrator-provided CSV.",
                )
                db.add(course)
                db.flush()
                stats["created_courses"] += 1
            else:
                course.title = course_title
                course.department_id = department.id if department else course.department_id
                course.academic_level_id = level.id
                course.verification_status = verification_status
                if row.get("source_note"):
                    course.source_note = row["source_note"]
                stats["updated_courses"] += 1

            offering = db.scalar(
                select(CourseOffering).where(
                    CourseOffering.course_id == course.id,
                    CourseOffering.curriculum_version_id == curriculum.id,
                    CourseOffering.semester_id == semester.id,
                )
            )
            offering_values = {
                "academic_level_id": level.id,
                "credit_units": credits,
                "course_type": row.get("course_type") or None,
                "verification_status": verification_status,
                "source_note": row.get("source_note") or None,
                "is_active": True,
            }
            if offering is None:
                db.add(
                    CourseOffering(
                        course_id=course.id,
                        curriculum_version_id=curriculum.id,
                        semester_id=semester.id,
                        **offering_values,
                    )
                )
                stats["created_offerings"] += 1
            else:
                for field, value in offering_values.items():
                    setattr(offering, field, value)
                stats["updated_offerings"] += 1
            stats["imported_rows"] += 1

        if stats["imported_rows"] == 0:
            raise HTTPException(status_code=422, detail="CSV contains no importable data rows.")
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="CSV import conflicts with existing catalogue records.",
        ) from exc
    except csv.Error as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=f"Invalid CSV: {exc}") from exc

    return CourseOfferingImportResponse(**stats)

@router.get("/overview")
def admin_overview(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    total_resources = db.scalar(select(func.count(Resource.id))) or 0
    published_resources = db.scalar(select(func.count(Resource.id)).where(Resource.is_published.is_(True))) or 0
    total_faculties = db.scalar(select(func.count(Faculty.id))) or 0
    total_departments = db.scalar(select(func.count(Department.id))) or 0
    total_programmes = db.scalar(select(func.count(Programme.id))) or 0
    total_courses = db.scalar(select(func.count(Course.id))) or 0
    total_offerings = db.scalar(select(func.count(CourseOffering.id))) or 0
    verified_offerings = db.scalar(
        select(func.count(CourseOffering.id)).where(CourseOffering.verification_status == "verified")
    ) or 0
    unverified_offerings = total_offerings - verified_offerings
    pending_verifications = db.scalar(
        select(func.count(VerificationSubmission.id)).where(VerificationSubmission.status == "pending")
    ) or 0
    total_packages = db.scalar(select(func.count(AccessPackage.id))) or 0
    total_payments = db.scalar(select(func.count(Payment.id))) or 0
    succeeded_payments = db.scalar(
        select(func.count(Payment.id)).where(Payment.status == "succeeded")
    ) or 0

    recent_resources = db.scalars(
        select(Resource).order_by(Resource.created_at.desc(), Resource.id.desc()).limit(5)
    ).all()

    recent_submissions = db.scalars(
        select(VerificationSubmission).order_by(VerificationSubmission.created_at.desc(), VerificationSubmission.id.desc()).limit(5)
    ).all()

    return {
        "metrics": {
            "total_resources": total_resources,
            "published_resources": published_resources,
            "total_faculties": total_faculties,
            "total_departments": total_departments,
            "total_programmes": total_programmes,
            "total_courses": total_courses,
            "total_course_offerings": total_offerings,
            "verified_offerings": verified_offerings,
            "unverified_offerings": unverified_offerings,
            "pending_verifications": pending_verifications,
            "total_packages": total_packages,
            "total_payments": total_payments,
            "succeeded_payments": succeeded_payments,
        },
        "recent_resources": [
            {
                "id": r.id,
                "title": r.title,
                "file_name": r.file_name,
                "mime_type": r.mime_type,
                "is_published": r.is_published,
                "access_policy": r.access_policy,
                "preview_policy": getattr(r, "preview_policy", "none"),
                "created_at": r.created_at.isoformat(),
            }
            for r in recent_resources
        ],
        "recent_submissions": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "status": s.status,
                "matriculation_number": s.matriculation_number,
                "jamb_registration_number": s.jamb_registration_number,
                "created_at": s.created_at.isoformat(),
            }
            for s in recent_submissions
        ],
    }
