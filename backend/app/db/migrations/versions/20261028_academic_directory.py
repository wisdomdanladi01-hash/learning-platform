"""Add the SAZU academic directory and course curriculum offerings.

Revision ID: 20261028_academic_directory
Revises: 20261025_payments
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261028_academic_directory"
down_revision: Union[str, None] = "20261025_payments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FACULTIES = (
    ("agriculture", "Faculty of Agriculture"),
    ("arts", "Faculty of Arts"),
    ("basic-medical-sciences", "Faculty of Basic Medical Sciences"),
    ("education", "Faculty of Education"),
    ("law", "Faculty of Law"),
    ("management-sciences", "Faculty of Management Sciences"),
    ("pharmaceutical-sciences", "Faculty of Pharmaceutical Sciences"),
    ("science", "Faculty of Science"),
    ("social-sciences", "Faculty of Social Sciences"),
)

DEPARTMENTS = (
    ("AGRICULTURE", "Department of Agriculture", "agriculture"),
    ("ARABIC", "Department of Arabic", "arts"),
    ("ENGLISH-LITERARY", "Department of English and Literary Studies", "arts"),
    ("ISLAMIC-STUDIES", "Department of Islamic Studies", "arts"),
    ("NIGERIAN-LANGUAGES", "Department of Nigerian Languages and Linguistics", "arts"),
    ("HUMAN-ANATOMY", "Department of Human Anatomy", "basic-medical-sciences"),
    ("NURSING", "Department of Nursing", "basic-medical-sciences"),
    ("PHARMACOLOGY", "Department of Pharmacology", "basic-medical-sciences"),
    ("PHYSIOLOGY", "Department of Physiology", "basic-medical-sciences"),
    ("PUBLIC-HEALTH", "Department of Public Health", "basic-medical-sciences"),
    ("LIBRARY-INFO-SCI", "Department of Library and Information Science", "education"),
    ("SCIENCE-EDUCATION", "Department of Science Education", "education"),
    ("ACCOUNTING", "Department of Accounting", "management-sciences"),
    ("BUSINESS-ADMIN", "Department of Business Administration", "management-sciences"),
    ("PUBLIC-ADMIN", "Department of Public Administration", "management-sciences"),
    ("BIOCHEMISTRY", "Department of Biochemistry", "science"),
    ("BIOLOGICAL-SCIENCES", "Department of Biological Sciences", "science"),
    ("CHEMISTRY", "Department of Chemistry", "science"),
    ("MATHEMATICAL-SCIENCES", "Department of Mathematical Sciences", "science"),
    ("MICROBIOLOGY", "Department of Microbiology", "science"),
    ("PHYSICS", "Department of Physics", "science"),
    ("SCIENCE-LAB-TECH", "Department of Science Laboratory Technology", "science"),
    ("ECONOMICS", "Department of Economics", "social-sciences"),
    ("POLITICAL-SCIENCE", "Department of Political Science", "social-sciences"),
    ("SOCIOLOGY", "Department of Sociology", "social-sciences"),
)

PROGRAMMES = (
    ("Agriculture", "BSC-AGRICULTURE", "agriculture", "undergraduate", "pending_confirmation", None),
    ("Animal Science", "BSC-ANIMAL-SCIENCE", "agriculture", "undergraduate", "pending_confirmation", None),
    ("Crop Science", "BSC-CROP-SCIENCE", "agriculture", "undergraduate", "pending_confirmation", None),
    ("Soil Science", "BSC-SOIL-SCIENCE", "agriculture", "undergraduate", "pending_confirmation", None),
    ("Agricultural Economics", "BSC-AGRIC-ECONOMICS", "agriculture", "undergraduate", "pending_confirmation", None),
    ("Arabic Language", "BA-ARABIC", "arts", "undergraduate", "pending_confirmation", "B.A."),
    ("English Language", "BA-ENGLISH", "arts", "undergraduate", "pending_confirmation", "B.A."),
    ("Literature in English", "BA-LITERATURE-ENGLISH", "arts", "undergraduate", "pending_confirmation", "B.A."),
    ("Islamic Studies", "BA-ISLAMIC-STUDIES", "arts", "undergraduate", "pending_confirmation", "B.A."),
    ("Languages and Linguistics (Hausa option)", "BA-HAUSA-LINGUISTICS", "arts", "undergraduate", "pending_confirmation", "B.A."),
    ("Linguistics", "BA-LINGUISTICS", "arts", "undergraduate", "pending_confirmation", "B.A."),
    ("Human Anatomy", "BSC-HUMAN-ANATOMY", "basic-medical-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Nursing", "BSC-NURSING", "basic-medical-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Pharmacology", "BSC-PHARMACOLOGY", "basic-medical-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Physiology", "BSC-PHYSIOLOGY", "basic-medical-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Public Health", "BSC-PUBLIC-HEALTH", "basic-medical-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Environmental Health Science", "BSC-ENVIRONMENTAL-HEALTH", "basic-medical-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Library and Information Science", "BSC-LIBRARY-INFO-SCI", "education", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Education and Biology", "BSC-ED-BIOLOGY", "education", "undergraduate", "pending_confirmation", "B.Sc. (Ed.)"),
    ("Education and Chemistry", "BSC-ED-CHEMISTRY", "education", "undergraduate", "pending_confirmation", "B.Sc. (Ed.)"),
    ("Education and Computer Science", "BSC-ED-COMPUTER-SCIENCE", "education", "undergraduate", "pending_confirmation", "B.Sc. (Ed.)"),
    ("Education and English Language", "BA-ED-ENGLISH", "education", "undergraduate", "pending_confirmation", "B.A. (Ed.)"),
    ("Education and Mathematics", "BSC-ED-MATHEMATICS", "education", "undergraduate", "pending_confirmation", "B.Sc. (Ed.)"),
    ("Education and Physics", "BSC-ED-PHYSICS", "education", "undergraduate", "pending_confirmation", "B.Sc. (Ed.)"),
    ("B.A. (Ed.) Arabic", "BA-ED-ARABIC", None, "undergraduate", "approved_not_commenced", "B.A. (Ed.)"),
    ("B.A. (Ed.) Hausa", "BA-ED-HAUSA", None, "undergraduate", "approved_not_commenced", "B.A. (Ed.)"),
    ("B.A. (Ed.) Islamic Studies", "BA-ED-ISLAMIC", None, "undergraduate", "approved_not_commenced", "B.A. (Ed.)"),
    ("B.Sc. (Ed.) Agricultural Science", "BSC-ED-AGRICULTURE", None, "undergraduate", "approved_not_commenced", "B.Sc. (Ed.)"),
    ("B.Sc. (Ed.) Human Kinetics", "BSC-ED-HUMAN-KINETICS", None, "undergraduate", "approved_not_commenced", "B.Sc. (Ed.)"),
    ("B.Sc. (Ed.) Health Education", "BSC-ED-HEALTH", None, "undergraduate", "approved_not_commenced", "B.Sc. (Ed.)"),
    ("Law", "LLB-LAW", None, "undergraduate", "pending_confirmation", "LL.B."),
    ("Accounting", "BSC-ACCOUNTING", "management-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Business Administration", "BSC-BUSINESS-ADMIN", "management-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Public Administration", "BSC-PUBLIC-ADMIN", "management-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Doctor of Pharmacy (Pharm.D.)", "PHARMD", None, "undergraduate", "pending_confirmation", "Pharm.D."),
    ("Biochemistry", "BSC-BIOCHEMISTRY", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Botany", "BSC-BOTANY", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Zoology", "BSC-ZOOLOGY", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Chemistry", "BSC-CHEMISTRY", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Computer Science", "BSC-COMPUTER-SCIENCE", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Mathematics", "BSC-MATHEMATICS", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Statistics", "BSC-STATISTICS", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Microbiology", "BSC-MICROBIOLOGY", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Physics", "BSC-PHYSICS", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Science Laboratory Technology (SLT)", "BSC-SLT", "science", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Economics", "BSC-ECONOMICS", "social-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Political Science", "BSC-POLITICAL-SCIENCE", "social-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("Sociology", "BSC-SOCIOLOGY", "social-sciences", "undergraduate", "pending_confirmation", "B.Sc."),
    ("B.Sc. Social Work", "BSC-SOCIAL-WORK", None, "undergraduate", "approved_not_commenced", "B.Sc."),
    ("B.A. Sharia", "BA-SHARIA", None, "undergraduate", "pending_confirmation", "B.A."),
    ("M.Ed. Educational Management", "MED-EDUCATIONAL-MANAGEMENT", None, "postgraduate", "pending_confirmation", "M.Ed."),
    ("Doctor of Business Administration (DBA)", "DBA", None, "doctoral", "pending_confirmation", "DBA"),
    ("Postgraduate Diploma in Law", "PGD-LAW", None, "postgraduate", "pending_confirmation", "Postgraduate Diploma"),
    ("LL.M.", "LLM", None, "postgraduate", "pending_confirmation", "LL.M."),
    ("Ph.D. Law", "PHD-LAW", None, "doctoral", "pending_confirmation", "Ph.D."),
    ("Postgraduate Diploma in Sociology", "PGD-SOCIOLOGY", None, "postgraduate", "pending_confirmation", "Postgraduate Diploma"),
    ("M.Sc. Sociology", "MSC-SOCIOLOGY", None, "postgraduate", "pending_confirmation", "M.Sc."),
    ("Ph.D. Sociology", "PHD-SOCIOLOGY", None, "doctoral", "pending_confirmation", "Ph.D."),
)

COURSES = (
    ("BASUG-COS120", "Introduction to Mobile Application and Development", 2, "100", 2, "2023/2024", "second"),
    ("BIO102", "General Biology II", 2, "100", 2, "2023/2024", "second"),
    ("BIO108", "General Biology Practical II", 1, "100", 2, "2023/2024", "second"),
    ("COS102", "Problem Solving", 2, "100", 2, "2023/2024", "second"),
    ("GST112", "Nigerian Peoples and Culture", 2, "100", 2, "2023/2024", "second"),
    ("MTH102", "Elementary Mathematics II", 2, "100", 2, "2023/2024", "second"),
    ("PHY102", "General Physics II", 2, "100", 2, "2023/2024", "second"),
    ("PHY108", "General Physics Practical II", 1, "100", 2, "2023/2024", "second"),
    ("BIO102", "General Biology II", 2, "200", 2, "2024/2025", "second"),
    ("CSC202", "Computer Programming II", 3, "200", 2, "2024/2025", "second"),
    ("CSC204", "Computer Architecture & Organization I", 2, "200", 2, "2024/2025", "second"),
    ("CSC206", "Fundamental of Data Structure & Algorithm", 2, "200", 2, "2024/2025", "second"),
    ("CSC208", "Foundation of Sequential Program", 2, "200", 2, "2024/2025", "second"),
    ("CSC210", "Computer Hardware", 2, "200", 2, "2024/2025", "second"),
    ("CSC220", "Operating System I", 2, "200", 2, "2024/2025", "second"),
    ("GST212", "Philosophy Logic and Human Existence", 2, "200", 2, "2024/2025", "second"),
    ("MTH202", "Elementary Differential Equations", 2, "200", 2, "2024/2025", "second"),
    ("MTH204", "Linear Algebra II", 2, "200", 2, "2024/2025", "second"),
    ("PHY202", "Introduction to Electric Circuits & Electronics", 2, "200", 2, "2024/2025", "second"),
    ("SAZU-CSC222", "Introduction to Data Science", 2, "200", 2, "2024/2025", "second"),
    ("SAZU-CSC224", "Introduction to Artificial Intelligence", 2, "200", 2, "2024/2025", "second"),
    ("CSC3111", "Computer Hardware Maintenance", 1, "300", 1, "2025/2026", "first"),
    ("CSC3201", "Advanced Programming", 2, "300", 1, "2025/2026", "first"),
    ("CSC3207", "Computer Architecture & Organization II", 2, "300", 1, "2025/2026", "first"),
    ("CSC3303", "File Processing and Data Management I", 3, "300", 1, "2025/2026", "first"),
    ("CSC3305", "Design & Analysis of Algorithm", 3, "300", 1, "2025/2026", "first"),
    ("CSC3309", "Compiler Construction I", 3, "300", 1, "2025/2026", "first"),
    ("CSC3313", "Operating System II", 3, "300", 1, "2025/2026", "first"),
    ("GSP3201", "Entrepreneur Skills I", 2, "300", 1, "2025/2026", "first"),
    ("MTH3313", "Introduction to Operations Research", 3, "300", 1, "2025/2026", "first"),
)


def _insert_id(connection, table: str, values: dict[str, object]) -> int:
    columns = ", ".join(values)
    placeholders = ", ".join(f":{column}" for column in values)
    return connection.execute(
        sa.text(f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING id"),
        values,
    ).scalar_one()


def upgrade() -> None:
    op.create_table(
        "institutions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(30), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=False, unique=True),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_institutions_code", "institutions", ["code"])
    op.create_table(
        "faculties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institution_id", sa.Integer(), sa.ForeignKey("institutions.id"), nullable=False),
        sa.Column("code", sa.String(30), nullable=False, unique=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.UniqueConstraint("institution_id", "name", name="uq_faculty_institution_name"),
    )
    op.create_index("ix_faculties_institution_id", "faculties", ["institution_id"])
    op.create_index("ix_faculties_code", "faculties", ["code"])
    with op.batch_alter_table("departments") as batch_op:
        batch_op.add_column(sa.Column("faculty_id", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column("status", sa.String(30), nullable=False, server_default="pending_confirmation")
        )
        batch_op.add_column(sa.Column("source_note", sa.Text(), nullable=True))
        batch_op.create_foreign_key(
            "fk_departments_faculty_id_faculties", "faculties", ["faculty_id"], ["id"]
        )
        batch_op.create_index("ix_departments_faculty_id", ["faculty_id"])
    with op.batch_alter_table("programmes") as batch_op:
        batch_op.add_column(sa.Column("faculty_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("award", sa.String(100), nullable=True))
        batch_op.add_column(
            sa.Column("study_level", sa.String(30), nullable=False, server_default="undergraduate")
        )
        batch_op.add_column(
            sa.Column("status", sa.String(30), nullable=False, server_default="pending_confirmation")
        )
        batch_op.add_column(sa.Column("commencement_session_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("source_note", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_foreign_key(
            "fk_programmes_faculty_id_faculties", "faculties", ["faculty_id"], ["id"]
        )
        batch_op.create_foreign_key(
            "fk_programmes_commencement_session_id_academic_sessions",
            "academic_sessions",
            ["commencement_session_id"],
            ["id"],
        )
        batch_op.create_index("ix_programmes_faculty_id", ["faculty_id"])
        batch_op.create_index("ix_programmes_status", ["status"])
        batch_op.create_check_constraint(
            "ck_programme_status",
            "status IN ('active', 'approved_not_commenced', 'pending_confirmation', 'inactive')",
        )
    with op.batch_alter_table("courses") as batch_op:
        batch_op.add_column(
            sa.Column("verification_status", sa.String(30), nullable=False, server_default="pending_confirmation")
        )
        batch_op.add_column(sa.Column("source_note", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        "curriculum_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("programme_id", sa.Integer(), sa.ForeignKey("programmes.id"), nullable=False),
        sa.Column(
            "academic_session_id", sa.Integer(), sa.ForeignKey("academic_sessions.id"), nullable=False
        ),
        sa.Column("version", sa.String(50), nullable=False),
        sa.Column("source_note", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.UniqueConstraint(
            "programme_id", "academic_session_id", "version", name="uq_curriculum_programme_session_version"
        ),
    )
    op.create_index("ix_curriculum_versions_programme_id", "curriculum_versions", ["programme_id"])
    op.create_index(
        "ix_curriculum_versions_academic_session_id", "curriculum_versions", ["academic_session_id"]
    )
    op.create_table(
        "course_offerings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column(
            "curriculum_version_id",
            sa.Integer(),
            sa.ForeignKey("curriculum_versions.id"),
            nullable=False,
        ),
        sa.Column("academic_level_id", sa.Integer(), sa.ForeignKey("academic_levels.id"), nullable=False),
        sa.Column("semester_id", sa.Integer(), sa.ForeignKey("semesters.id"), nullable=False),
        sa.Column("credit_units", sa.Integer(), nullable=True),
        sa.Column("course_type", sa.String(20), nullable=True),
        sa.Column(
            "verification_status", sa.String(30), nullable=False, server_default="pending_confirmation"
        ),
        sa.Column("source_note", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.UniqueConstraint(
            "course_id",
            "curriculum_version_id",
            "semester_id",
            name="uq_course_offering_curriculum_semester",
        ),
        sa.CheckConstraint(
            "verification_status IN ('verified', 'user_supplied', 'pending_confirmation')",
            name="ck_course_offering_verification_status",
        ),
        sa.CheckConstraint(
            "credit_units IS NULL OR credit_units > 0", name="ck_course_offering_credit_units"
        ),
    )
    for column in ("course_id", "curriculum_version_id", "academic_level_id", "semester_id"):
        op.create_index(f"ix_course_offerings_{column}", "course_offerings", [column])

    connection = op.get_bind()
    institution_id = _insert_id(
        connection,
        "institutions",
        {
            "code": "SAZU",
            "name": "Sa'adu Zungur University",
            "location": "Bauchi, Nigeria",
            "is_active": True,
        },
    )
    faculty_ids: dict[str, int] = {}
    for code, name in FACULTIES:
        faculty_ids[code] = _insert_id(
            connection,
            "faculties",
            {"institution_id": institution_id, "code": code, "name": name, "is_active": True},
        )
    department_ids: dict[str, int] = {}
    for code, name, faculty_code in DEPARTMENTS:
        department_ids[code] = _insert_id(
            connection,
            "departments",
            {
                "faculty_id": faculty_ids[faculty_code],
                "code": code,
                "name": name,
                "is_active": True,
                "status": "pending_confirmation",
                "source_note": "Directory entry supplied for this project; awaiting authoritative confirmation.",
            },
        )

    session_ids: dict[str, int] = {}
    for year in (2023, 2024, 2025, 2026):
        label = f"{year}/{year + 1}"
        session_ids[label] = _insert_id(
            connection,
            "academic_sessions",
            {
                "name": label,
                "starts_on": f"{year}-08-01",
                "ends_on": f"{year + 1}-07-31",
                "is_active": False,
            },
        )
    level_ids: dict[str, int] = {}
    for code, name, sort_order in (
        ("100", "100 Level", 100),
        ("200", "200 Level", 200),
        ("300", "300 Level", 300),
        ("400", "400 Level", 400),
        ("500", "500 Level", 500),
        ("600", "600 Level", 600),
        ("700", "700 Level", 700),
        ("PG", "Postgraduate", 800),
    ):
        level_ids[code] = _insert_id(
            connection,
            "academic_levels",
            {"code": code, "name": name, "sort_order": sort_order},
        )

    programme_ids: dict[str, int] = {}
    for name, code, faculty_code, study_level, programme_status, award in PROGRAMMES:
        faculty_id = faculty_ids.get(faculty_code) if faculty_code else None
        commencement = (
            session_ids["2026/2027"]
            if programme_status == "approved_not_commenced"
            else None
        )
        programme_ids[code] = _insert_id(
            connection,
            "programmes",
            {
                "code": code,
                "name": name,
                "is_active": True,
                "faculty_id": faculty_id,
                "award": award,
                "study_level": study_level,
                "status": programme_status,
                "commencement_session_id": commencement,
                "source_note": "Directory entry supplied for this project; not independently verified against current university records.",
            },
        )

    computer_science_id = programme_ids["BSC-COMPUTER-SCIENCE"]
    department_id = department_ids["MATHEMATICAL-SCIENCES"]
    offerings_by_session = {
        "2023/2024": ("100", 2, "100 second semester registration form supplied by the user."),
        "2024/2025": ("200", 2, "200 second semester registration form supplied by the user."),
        "2025/2026": ("300", 1, "300 first semester registration form supplied by the user."),
    }
    semesters: dict[tuple[str, int], int] = {}
    curricula: dict[str, int] = {}
    for session_name, (level_code, semester_number, source_note) in offerings_by_session.items():
        session_id = session_ids[session_name]
        year = int(session_name[:4])
        semester_starts = f"{year}-08-01" if semester_number == 1 else f"{year + 1}-01-01"
        semester_ends = f"{year}-12-31" if semester_number == 1 else f"{year + 1}-07-31"
        semester_id = _insert_id(
            connection,
            "semesters",
            {
                "academic_session_id": session_id,
                "number": semester_number,
                "starts_on": semester_starts,
                "ends_on": semester_ends,
            },
        )
        semesters[(session_name, semester_number)] = semester_id
        curriculum_id = _insert_id(
            connection,
            "curriculum_versions",
            {
                "programme_id": computer_science_id,
                "academic_session_id": session_id,
                "version": f"User-supplied {session_name}",
                "source_note": source_note + " Course list is user-supplied and not independently verified.",
                "is_active": session_name == "2025/2026",
            },
        )
        curricula[session_name] = curriculum_id

    for code, title, credits, level_code, semester_number, session_name, _semester_label in COURSES:
        course_result = connection.execute(
            sa.text("SELECT id FROM courses WHERE programme_id = :programme_id AND code = :code"),
            {"programme_id": computer_science_id, "code": code},
        ).scalar_one_or_none()
        if course_result is None:
            course_id = _insert_id(
                connection,
                "courses",
                {
                    "programme_id": computer_science_id,
                    "department_id": department_id,
                    "academic_level_id": level_ids[level_code],
                    "code": code,
                    "title": title,
                    "is_active": True,
                    "verification_status": "user_supplied",
                    "source_note": "Transcribed from the user-supplied SAZU registration form; not independently verified.",
                },
            )
        else:
            course_id = int(course_result)
        source_note = offerings_by_session[session_name][2]
        connection.execute(
            sa.text(
                "INSERT INTO course_offerings "
                "(course_id, curriculum_version_id, academic_level_id, semester_id, credit_units, "
                "verification_status, source_note, is_active) "
                "VALUES (:course_id, :curriculum_id, :level_id, :semester_id, :credits, "
                "'user_supplied', :source_note, true)"
            ),
            {
                "course_id": course_id,
                "curriculum_id": curricula[session_name],
                "level_id": level_ids[level_code],
                "semester_id": semesters[(session_name, semester_number)],
                "credits": credits,
                "source_note": source_note + " Not independently verified.",
            },
        )


def downgrade() -> None:
    op.drop_table("course_offerings")
    op.drop_table("curriculum_versions")
    with op.batch_alter_table("courses") as batch_op:
        batch_op.drop_column("last_verified_at")
        batch_op.drop_column("source_note")
        batch_op.drop_column("verification_status")
    with op.batch_alter_table("programmes") as batch_op:
        batch_op.drop_constraint("ck_programme_status", type_="check")
        batch_op.drop_index("ix_programmes_status")
        batch_op.drop_index("ix_programmes_faculty_id")
        batch_op.drop_constraint(
            "fk_programmes_commencement_session_id_academic_sessions", type_="foreignkey"
        )
        batch_op.drop_constraint("fk_programmes_faculty_id_faculties", type_="foreignkey")
        batch_op.drop_column("last_verified_at")
        batch_op.drop_column("source_note")
        batch_op.drop_column("commencement_session_id")
        batch_op.drop_column("status")
        batch_op.drop_column("study_level")
        batch_op.drop_column("award")
        batch_op.drop_column("faculty_id")
    with op.batch_alter_table("departments") as batch_op:
        batch_op.drop_index("ix_departments_faculty_id")
        batch_op.drop_constraint("fk_departments_faculty_id_faculties", type_="foreignkey")
        batch_op.drop_column("source_note")
        batch_op.drop_column("status")
        batch_op.drop_column("faculty_id")
    op.drop_index("ix_faculties_code", table_name="faculties")
    op.drop_index("ix_faculties_institution_id", table_name="faculties")
    op.drop_table("faculties")
    op.drop_index("ix_institutions_code", table_name="institutions")
    op.drop_table("institutions")
