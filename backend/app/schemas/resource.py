from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


AccessPolicy = Literal["subscription_or_entitlement", "entitlement_only", "public"]


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    file_name: str
    mime_type: str
    file_size_bytes: int
    category_id: int | None
    created_by_id: int | None
    course_id: int | None
    academic_level_id: int | None
    academic_session_id: int | None
    semester_id: int | None
    resource_type_id: int | None
    is_published: bool
    access_policy: AccessPolicy
    requires_verification: bool
    available_from: datetime | None
    available_until: datetime | None
    created_at: datetime
    updated_at: datetime


class ResourceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)
    category_id: int | None = Field(default=None, gt=0)
    course_id: int | None = Field(default=None, gt=0)
    academic_level_id: int | None = Field(default=None, gt=0)
    academic_session_id: int | None = Field(default=None, gt=0)
    semester_id: int | None = Field(default=None, gt=0)
    resource_type_id: int | None = Field(default=None, gt=0)
    is_published: bool | None = None
    access_policy: AccessPolicy | None = None
    requires_verification: bool | None = None
    available_from: datetime | None = None
    available_until: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("title cannot be blank.")
        return value

    @model_validator(mode="after")
    def reject_explicit_null_for_required_fields(self) -> "ResourceUpdate":
        for field_name in (
            "title",
            "is_published",
            "access_policy",
            "requires_verification",
        ):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"{field_name} cannot be null.")
        return self


class ResourceCategoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=10_000)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("name cannot be blank.")
        return value


class ResourceCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    created_at: datetime
