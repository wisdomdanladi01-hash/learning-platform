from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

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


def test_academic_catalogue_endpoint_returns_hierarchy(client: TestClient):
    response = client.get("/api/v1/academic/catalogue")
    assert response.status_code == 200
    payload = response.json()
    assert "programmes" in payload
    assert isinstance(payload["programmes"], list)


def test_academic_catalogue_includes_course_offerings(client: TestClient, db_session: Session):
    institution = Institution(code="SAZU", name="Sa'adu Zungur University")
    db_session.add(institution)
    db_session.flush()
    faculty = Faculty(institution_id=institution.id, code="science", name="Faculty of Science")
    db_session.add(faculty)
    db_session.flush()
    programme = Programme(
        code="BSC-CS",
        name="Computer Science",
        faculty_id=faculty.id,
        status="pending_confirmation",
    )
    department = Department(
        code="MATH-SCI",
        name="Mathematical Sciences",
        faculty_id=faculty.id,
        status="pending_confirmation",
    )
    session = AcademicSession(
        name="2025/2026",
        starts_on=date(2025, 8, 1),
        ends_on=date(2026, 7, 31),
    )
    level = AcademicLevel(code="300", name="300 Level", sort_order=300)
    db_session.add_all([programme, department, session, level])
    db_session.flush()
    semester = Semester(
        academic_session_id=session.id,
        number=1,
        starts_on=date(2025, 8, 1),
        ends_on=date(2025, 12, 31),
    )
    course = Course(
        programme_id=programme.id,
        department_id=department.id,
        academic_level_id=level.id,
        code="CSC3305",
        title="Design and Analysis of Algorithms",
        verification_status="user_supplied",
        source_note="Transcribed from the supplied course sheet.",
    )
    db_session.add_all([semester, course])
    db_session.flush()
    curriculum = CurriculumVersion(
        programme_id=programme.id,
        academic_session_id=session.id,
        version="User-supplied 2025/2026",
        source_note="Awaiting official verification.",
    )
    db_session.add(curriculum)
    db_session.flush()
    db_session.add(
        CourseOffering(
            course_id=course.id,
            curriculum_version_id=curriculum.id,
            academic_level_id=level.id,
            semester_id=semester.id,
            credit_units=3,
            verification_status="user_supplied",
        )
    )
    db_session.commit()

    response = client.get("/api/v1/academic/catalogue")

    assert response.status_code == 200
    payload = response.json()
    assert payload["institutions"][0]["name"] == institution.name
    assert payload["faculties"][0]["name"] == faculty.name
    assert payload["programmes"][0]["faculty_id"] == faculty.id
    assert payload["departments"][0]["faculty_id"] == faculty.id
    offering = payload["courses"][0]["offerings"][0]
    assert offering["academic_session"] == "2025/2026"
    assert offering["level"] == "300"
    assert offering["semester"] == 1
    assert offering["credit_units"] == 3
    assert offering["verification_status"] == "user_supplied"


def test_resource_catalogue_endpoint_supports_filters(client: TestClient):
    response = client.get("/api/v1/resources?search=handout&resource_type=notes")
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert isinstance(payload["items"], list)


def test_subscription_plans_and_payment_init_endpoints_exist(client: TestClient):
    plans = client.get("/api/v1/subscriptions/plans")
    assert plans.status_code == 200
    plan_payload = plans.json()
    assert "items" in plan_payload

    response = client.post(
        "/api/v1/payments/initiate",
        json={"package_id": 1},
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code in {401, 403, 503}


def test_student_dashboard_endpoint_requires_auth(client: TestClient):
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 401
