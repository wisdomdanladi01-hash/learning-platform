# Learning Resource Platform Backend

This is the backend API for the Learning Resource Platform project.

## Prerequisites
- Python 3.14+
- Virtual environment

## Setup

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

## Database setup

This project uses SQLAlchemy models and Alembic migrations. The schema covers academic programmes, departments, levels, sessions, semesters, courses, student academic verification records, resource metadata, payment records, package scopes, entitlements, and audit events. Prices are stored in integer minor currency units with an explicit currency code.

Configure your local PostgreSQL connection in `.env` using the example in `.env.example`:

```powershell
copy .env.example .env
```

Then update the `DATABASE_URL` value for your local PostgreSQL instance before running migrations.

```powershell
alembic upgrade head
```

## Academic directory and course catalogue

`GET /api/v1/academic/catalogue` provides institution, faculty, department, programme, level, session, semester, resource-type, and course-offering listings for the student frontend. The `20261028_academic_directory` migration adds the directory metadata and seeds the supplied SAZU directory and Computer Science course sheets. Course and programme records transcribed from user-provided material are explicitly marked as pending or user-supplied and must not be presented as officially verified. Student names and matriculation numbers from the supplied forms are not stored in the catalogue.

Administrators can manage institutions, faculties, departments, programmes, courses, and course-offering verification through the authenticated `/api/v1/admin/academic` routes. `POST /api/v1/admin/academic/course-offerings/import` accepts UTF-8 CSV files up to 2 MB and 2,000 rows, validates all references, and rolls back the complete import if a row is invalid. Required CSV columns are `programme_code,course_code,course_title,level_code,academic_session,semester,credit_units`; optional columns are `department_code,curriculum_version,course_type,verification_status,source_note`. Imported rows default to `user_supplied`, and the default curriculum version is `Imported <academic_session>`.

Assessment questions and practice-test APIs are not included. Do not publish invented questions; add these only after the project team supplies and approves the question bank and test rules.

## Authentication and student verification

The API supports student registration, password login, JWT authentication, verification submissions, supporting-document uploads, and an administrator review queue. Registration accepts first name and surname, with an optional middle name, plus either a matriculation number or a JAMB registration number. Programme and admission-session information can be collected later during verification. Neither identifier alone proves identity. New submissions are reviewed manually; the supplied university website is not treated as authorization to connect to student records. An official-record integration must not be added until the project team confirms an authorized source and access method.

Set a unique JWT secret of at least 32 bytes in `.env` before using authentication. Generate one locally in PowerShell:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the result into `JWT_SECRET_KEY`. Keep `.env` private and do not commit the secret. Authentication is intentionally unavailable when the key is missing or too short.

Supporting documents are stored outside the public web root in the configured `PRIVATE_STORAGE_DIR`; only metadata and opaque storage keys are stored in PostgreSQL. The default retention period is three days after an approval or rejection. Until a final decision, the document remains available to its owner and authorized administrators. The cleanup command must be scheduled to enforce deletion:

```powershell
python -m scripts.purge_expired_verification_documents
```

For Windows Task Scheduler, run the backend virtual environment's `python.exe` with `-m scripts.purge_expired_verification_documents`, and set **Start in** to the `backend` directory. Schedule it regularly (for example, daily). The command reports how many expired files it deleted.

Create the initial administrator interactively, from the `backend` directory after configuring the database and JWT secret:

```powershell
python -m scripts.create_admin
```

The command prompts for an email, name, and password, creates the `admin` role if needed, and refuses to reuse an existing account. Do not grant administrator status through public registration or student-controlled APIs.

The authentication rate limiter is process-local. It helps local development but is not a distributed production control; deploy behind a shared rate-limiting service or gateway before running multiple API workers.

No university records integration is configured. Paystack sandbox payment and subscription workflows are implemented; live transactions remain disabled until the production account and webhook configuration are explicitly set up.

## Semester subscriptions and payments

Subscription packages are administrator-managed records in `access_packages`; the amount is configured as an integer in minor units, so the initial ₦1,000 price is `100000` NGN. A package is associated with a `Semester`; access expires at 00:00 UTC on the day after that semester's configured `ends_on` date. Package prices are snapshotted to each payment at initialization. A user must have an administrator-verified academic profile before purchase. Active subscriptions are not extended by duplicate purchases; a separate successful payment that cannot safely activate access is flagged for refund review.

After creating the active academic session and its current/upcoming semester, run `python -m scripts.create_default_subscription_package` from the `backend` directory to create the initial package. Its configurable default price is `DEFAULT_SEMESTER_SUBSCRIPTION_PRICE_MINOR=100000` (₦1,000); the script is idempotent and leaves an existing package's price unchanged.

Apply the forward migration after configuring the database:

```powershell
alembic upgrade head
```

Configure Paystack using the `.env.example` placeholders. For local/test use, provide the test secret key from your Paystack dashboard as `PAYSTACK_SECRET_KEY`; test keys must begin with `sk_test_`. The key is used only by the backend. Do not expose it in frontend configuration or commit real keys. The student flow is:

1. `GET /api/v1/subscriptions/packages` lists currently purchasable semester packages.
2. `POST /api/v1/payments/initialize` with `{"package_id": 1}` creates a pending internal transaction and asks Paystack to initialize checkout using the server-calculated price. It returns the checkout URL and internal reference.
3. The student completes checkout on Paystack. The configured callback should point to the frontend's `/payment/return` route (the local default is `http://localhost:5173/payment/return`).
4. The frontend returns to `PAYSTACK_CALLBACK_URL` and calls `POST /api/v1/payments/{reference}/verify`. Only a server-side Paystack verification with matching reference, amount, currency, and customer email can activate access.
5. `GET /api/v1/subscriptions/me` and `GET /api/v1/payments` return the signed-in student's subscriptions and payment history.

Configure the Paystack webhook URL as `https://<your-api-host>/api/v1/payments/paystack/webhook`. Paystack's `x-paystack-signature` HMAC-SHA512 signature is checked against the raw request body before parsing; the webhook event only triggers an independent server-to-server verification. Duplicate deliveries are idempotent. Provider timeouts and unverifiable states stay pending and do not grant access.

Administrators manage packages through `POST /api/v1/admin/subscriptions/packages`, `PATCH /api/v1/admin/subscriptions/packages/{package_id}`, and `GET /api/v1/admin/subscriptions/packages`. An admin can review `GET /api/v1/admin/payments` and `GET /api/v1/admin/subscriptions`. Payment records retain the configured amount/currency, Paystack reference, provider state, checkout URL, verification time, and manual refund-review reason.

Before live payments, deploy HTTPS, configure the live Paystack webhook URL in the dashboard, set a production-only `sk_live_` key in the secret manager, set `APP_ENV=production` and `PAYSTACK_LIVE_ENABLED=true`, restrict/validate the callback URL, apply the migrations, and perform a controlled end-to-end transaction/refund test. Live payments are deliberately rejected outside production with the explicit live-enable flag. Automated tests mock both checkout initialization and Paystack verification; no live-provider transaction has been performed.

Provider-verified successful payments that cannot be activated safely (for example, a second purchase while the student already has an active subscription or a payment verified after the semester ended) are recorded as successful but do not grant a second entitlement; they are flagged for manual refund review. An administrator refund/dispute processing workflow and automatic Paystack refund integration are not included. Subscription grant activation and entitlement creation occur in one database transaction. PostgreSQL row locks serialize activation for the same student; SQLite tests exercise the state transitions but not PostgreSQL concurrency semantics. The provider API still needs a configured Paystack account and network access at runtime.

## Learning resource API

Administrators can create resource categories and upload, update, replace, publish, and delete learning resources. Authenticated students can browse published resources by title/description, category, course, and academic level, and can download files only when the resource's access rules permit it.

Resource files are stored privately under `PRIVATE_STORAGE_DIR`, not in a public web directory. Uploads are limited by `RESOURCE_MAX_BYTES` (50 MiB by default) and accept PDF, DOCX, PPTX, XLSX, JPEG, PNG, and UTF-8 plain-text files. The API checks file extensions and basic file signatures; this is not malware scanning. Configure private storage with suitable filesystem permissions and add malware scanning before accepting untrusted files in production.

Available endpoints are:

- `GET /api/v1/resources` and `GET /api/v1/resources/{resource_id}` to browse and inspect published resources.
- `GET /api/v1/resources/categories` to list categories.
- `GET /api/v1/resources/{resource_id}/download` to download a resource when authorized.
- `GET /api/v1/admin/resources` to list all resources, including drafts.
- `POST /api/v1/admin/resources` to upload a resource as multipart form data.
- `PATCH /api/v1/admin/resources/{resource_id}` to update its metadata and publication/access settings.
- `POST /api/v1/admin/resources/{resource_id}/file` to replace its file.
- `DELETE /api/v1/admin/resources/{resource_id}` to delete it when it is not referenced by a package or entitlement.
- `GET /api/v1/admin/resources/categories` and `POST /api/v1/admin/resources/categories` to manage the category list.

Downloads honor publication dates, optional verified-student requirements, and the resource access policy. `public` bypasses subscription or entitlement checks but not a configured student-verification requirement. `entitlement_only` requires a succeeded payment with a matching active entitlement; `subscription_or_entitlement` permits that entitlement or an active subscription covering the resource semester. Payment creation and provider verification are not implemented, so paid downloads require valid payment/entitlement records from an authorized existing process.

## Run locally

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open the API docs at:
- http://localhost:8000/docs
- http://localhost:8000/redoc
