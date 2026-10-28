from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class VerificationSubmissionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    jamb_registration_number: str | None = Field(default=None, max_length=40)
    matriculation_number: str | None = Field(default=None, max_length=40)
    programme_id: int = Field(gt=0)
    department_id: int | None = Field(default=None, gt=0)
    admission_session_id: int = Field(gt=0)
    claimed_level_id: int | None = Field(default=None, gt=0)


class VerificationSubmissionResponse(BaseModel):
    id: int
    status: Literal["pending", "verified", "rejected", "needs_review"]
    verification_method: Literal["manual", "official_record"]


class VerificationDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision: Literal["verified", "rejected", "needs_review"]
    verified_level_id: int | None = Field(default=None, gt=0)
    verified_session_id: int | None = Field(default=None, gt=0)
    reason: str | None = Field(default=None, min_length=3, max_length=1000)


class VerificationStateResponse(BaseModel):
    status: Literal["pending", "verified", "rejected", "needs_review", "not_submitted"]
    verified_level_id: int | None
    verified_session_id: int | None


class VerificationQueueItem(BaseModel):
    id: int
    user_id: int
    status: Literal["pending", "verified", "rejected", "needs_review"]
    jamb_registration_number: str | None
    matriculation_number: str | None
    programme_id: int | None
    department_id: int | None
    admission_session_id: int | None
    claimed_level_id: int | None


class VerificationDocumentResponse(BaseModel):
    id: int
    original_filename: str
    mime_type: str
    size_bytes: int
