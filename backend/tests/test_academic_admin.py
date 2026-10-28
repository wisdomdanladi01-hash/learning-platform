from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.academic import (
    AcademicLevel,
    AcademicSession,
    Course,
    CourseOffering,
    Department,
    Programme,
    Semester,
)
from app.models.user import Role, User


def create_admin(db: Session) -> str:
    role = Role(name="admin", description="Academic catalogue administrator")
    db.add(role)
    db.flush()
    user = User(
        email="catalogue-admin@example.com",
        full_name="Catalogue Administrator",
        password_hash="unused-password-hash",
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    return create_access_token(user.id)


def create_catalogue_dependencies(db: Session) -> tuple[Programme, AcademicLevel, AcademicSession]:
    programme = Programme(
        code="BSC-CS",
        name="Computer Science",
        status="pending_confirmation",
    )
    level = AcademicLevel(code="300", name="300 Level", sort_order=300)
    session = AcademicSession(
        name="2025/2026",
        starts_on=date(2025, 8, 1),
        ends_on=date(2026, 7, 31),
    )
    db.add_all([programme, level, session])
    db.flush()
    db.add(
        Semester(
            academic_session_id=session.id,
            number=1,
            starts_on=date(2025, 8, 1),
            ends_on=date(2025, 12, 31),
        )
    )
    db.commit()
    return programme, level, session


def test_academic_admin_routes_require_admin(client, db_session: Session):
    response = client.get("/api/v1/admin/academic/courses")
    assert response.status_code == 401

    role = Role(name="student", description="Student")
    db_session.add(role)
    db_session.flush()
    student = User(
        email="catalogue-student@example.com",
        full_name="Catalogue Student",
        password_hash="unused-password-hash",
        role_id=role.id,
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    response = client.get(
        "/api/v1/admin/academic/courses",
        headers={"Authorization": f"Bearer {create_access_token(student.id)}"},
    )
    assert response.status_code == 403


def test_admin_can_manage_directory_hierarchy(client, db_session: Session):
    token = create_admin(db_session)
    headers = {"Authorization": f"Bearer {token}"}
    institution_response = client.post(
        "/api/v1/admin/academic/institutions",
        headers=headers,
        json={"code": "SAZU", "name": "Sa'adu Zungur University", "location": "Bauchi"},
    )
    assert institution_response.status_code == 201, institution_response.text
    institution_id = institution_response.json()["id"]

    faculty_response = client.post(
        "/api/v1/admin/academic/faculties",
        headers=headers,
        json={
            "institution_id": institution_id,
            "code": "SCI",
            "name": "Faculty of Science",
        },
    )
    assert faculty_response.status_code == 201, faculty_response.text
    faculty_id = faculty_response.json()["id"]

    session = AcademicSession(
        name="2026/2027",
        starts_on=date(2026, 8, 1),
        ends_on=date(2027, 7, 31),
    )
    db_session.add(session)
    db_session.commit()

    programme_response = client.post(
        "/api/v1/admin/academic/programmes",
        headers=headers,
        json={
            "faculty_id": faculty_id,
            "code": "BSC-CS",
            "name": "Computer Science",
            "status": "active",
        },
    )
    assert programme_response.status_code == 201, programme_response.text
    programme_id = programme_response.json()["id"]

    department_response = client.post(
        "/api/v1/admin/academic/departments",
        headers=headers,
        json={
            "faculty_id": faculty_id,
            "programme_id": programme_id,
            "code": "MATH-SCI",
            "name": "Mathematical Sciences",
            "status": "active",
        },
    )
    assert department_response.status_code == 201, department_response.text

    updated = client.patch(
        f"/api/v1/admin/academic/programmes/{programme_id}",
        headers=headers,
        json={"commencement_session_id": session.id},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["commencement_session_id"] == session.id


def test_admin_can_create_update_and_list_course(client, db_session: Session):
    token = create_admin(db_session)
    programme, level, _session = create_catalogue_dependencies(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/admin/academic/courses",
        headers=headers,
        json={
            "programme_id": programme.id,
            "academic_level_id": level.id,
            "code": " CSC3305 ",
            "title": " Design and Analysis of Algorithms ",
            "verification_status": "user_supplied",
            "source_note": "User-supplied course sheet.",
        },
    )
    assert response.status_code == 201, response.text
    course = response.json()
    assert course["code"] == "CSC3305"
    assert course["title"] == "Design and Analysis of Algorithms"

    updated = client.patch(
        f"/api/v1/admin/academic/courses/{course['id']}",
        headers=headers,
        json={"verification_status": "verified", "is_active": False},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["verification_status"] == "verified"
    assert updated.json()["is_active"] is False

    listed = client.get("/api/v1/admin/academic/courses", headers=headers)
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == course["id"]


def test_csv_import_creates_and_updates_offerings(client, db_session: Session):
    token = create_admin(db_session)
    create_catalogue_dependencies(db_session)
    headers = {"Authorization": f"Bearer {token}"}
    csv_content = (
        "programme_code,course_code,course_title,level_code,academic_session,semester,credit_units,source_note\n"
        "BSC-CS,CSC3305,Design and Analysis of Algorithms,300,2025/2026,1,3,User-provided course sheet\n"
    )

    first = client.post(
        "/api/v1/admin/academic/course-offerings/import",
        headers=headers,
        files={"upload": ("courses.csv", csv_content.encode(), "text/csv")},
    )
    assert first.status_code == 200, first.text
    assert first.json() == {
        "imported_rows": 1,
        "created_courses": 1,
        "updated_courses": 0,
        "created_offerings": 1,
        "updated_offerings": 0,
    }

    second = client.post(
        "/api/v1/admin/academic/course-offerings/import",
        headers=headers,
        files={"upload": ("courses.csv", csv_content.encode(), "text/csv")},
    )
    assert second.status_code == 200, second.text
    assert second.json()["created_courses"] == 0
    assert second.json()["updated_courses"] == 1
    assert second.json()["created_offerings"] == 0
    assert second.json()["updated_offerings"] == 1
    assert len(db_session.scalars(select(Course)).all()) == 1
    assert len(db_session.scalars(select(CourseOffering)).all()) == 1


def test_csv_import_rolls_back_all_rows_on_invalid_reference(client, db_session: Session):
    token = create_admin(db_session)
    create_catalogue_dependencies(db_session)
    csv_content = (
        "programme_code,course_code,course_title,level_code,academic_session,semester,credit_units\n"
        "BSC-CS,CSC3305,Algorithms,300,2025/2026,1,3\n"
        "BSC-CS,CSC3307,Compilers,300,2099/2100,1,3\n"
    )

    response = client.post(
        "/api/v1/admin/academic/course-offerings/import",
        headers={"Authorization": f"Bearer {token}"},
        files={"upload": ("courses.csv", csv_content.encode(), "text/csv")},
    )

    assert response.status_code == 422
    assert "row 3" in response.json()["detail"]
    assert db_session.scalars(select(Course)).all() == []
    assert db_session.scalars(select(CourseOffering)).all() == []


def test_course_create_rejects_department_from_another_faculty(client, db_session: Session):
    from app.models.academic import Faculty, Institution

    token = create_admin(db_session)
    institution = Institution(code="SAZU", name="Sa'adu Zungur University")
    db_session.add(institution)
    db_session.flush()
    faculty_a = Faculty(institution_id=institution.id, code="science", name="Science")
    faculty_b = Faculty(institution_id=institution.id, code="arts", name="Arts")
    db_session.add_all([faculty_a, faculty_b])
    db_session.flush()
    programme = Programme(code="BSC-CS", name="Computer Science", faculty_id=faculty_a.id)
    department = Department(code="ENGLISH", name="English", faculty_id=faculty_b.id)
    db_session.add_all([programme, department])
    db_session.commit()

    response = client.post(
        "/api/v1/admin/academic/courses",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "programme_id": programme.id,
            "department_id": department.id,
            "code": "CSC101",
            "title": "Introduction to Computing",
        },
    )

    assert response.status_code == 422
