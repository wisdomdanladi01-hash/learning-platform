from pathlib import Path
from uuid import uuid4

from app.core.config import settings

_RESOURCE_FILE_TYPES = {
    "application/pdf": (".pdf", b"%PDF-"),
    "image/jpeg": (".jpg", b"\xff\xd8\xff"),
    "image/png": (".png", b"\x89PNG\r\n\x1a\n"),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
        ".docx",
        b"PK\x03\x04",
    ),
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": (
        ".pptx",
        b"PK\x03\x04",
    ),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (
        ".xlsx",
        b"PK\x03\x04",
    ),
    "text/plain": (".txt", None),
}

_FILE_SIGNATURES = {
    "application/pdf": b"%PDF-",
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
}


def private_storage_root() -> Path:
    root = Path(settings.private_storage_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def store_verification_document(content: bytes, content_type: str | None) -> tuple[str, str]:
    if not content or len(content) > settings.verification_document_max_bytes:
        raise ValueError("The document is empty or exceeds the configured size limit.")
    if content_type not in _FILE_SIGNATURES:
        raise ValueError("Only PDF, JPEG, and PNG documents are accepted.")
    if not content.startswith(_FILE_SIGNATURES[content_type]):
        raise ValueError("The document content does not match its declared file type.")

    storage_key = f"verification/{uuid4().hex}.private"
    path = (private_storage_root() / storage_key).resolve()
    if not path.is_relative_to(private_storage_root()):
        raise ValueError("Invalid private storage key.")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("xb") as document_file:
        document_file.write(content)
    return storage_key, content_type


def store_resource_file(
    content: bytes, original_filename: str, content_type: str | None
) -> tuple[str, str, str]:
    file_type = _RESOURCE_FILE_TYPES.get(content_type or "")
    filename = Path(original_filename.replace("\\", "/")).name
    if not filename or len(filename) > 255:
        raise ValueError("A valid filename of at most 255 characters is required.")
    if not content or len(content) > settings.resource_max_bytes:
        raise ValueError("The resource is empty or exceeds the configured size limit.")
    if file_type is None:
        raise ValueError("Only PDF, DOCX, PPTX, XLSX, JPEG, PNG, and plain-text files are accepted.")

    extension, signature = file_type
    if Path(filename).suffix.lower() != extension:
        raise ValueError("The filename extension does not match the declared file type.")
    if signature is not None and not content.startswith(signature):
        raise ValueError("The resource content does not match its declared file type.")
    if content_type == "text/plain":
        try:
            content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("Plain-text resources must be UTF-8 encoded.") from exc

    storage_key = f"resources/{uuid4().hex}.private"
    root = private_storage_root()
    path = (root / storage_key).resolve()
    if not path.is_relative_to(root):
        raise ValueError("Invalid private storage key.")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("xb") as resource_file:
        resource_file.write(content)
    return storage_key, content_type or "", filename


def resolve_private_storage_key(storage_key: str) -> Path:
    root = private_storage_root()
    path = (root / storage_key).resolve()
    if not path.is_relative_to(root):
        raise ValueError("Invalid private storage key.")
    return path


def delete_private_storage_key(storage_key: str) -> None:
    resolve_private_storage_key(storage_key).unlink()
