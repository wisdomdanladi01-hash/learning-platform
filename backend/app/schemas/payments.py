from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


PaymentStatus = Literal["pending", "succeeded", "failed", "refunded", "disputed"]
SubscriptionStatus = Literal["pending", "active", "expired", "cancelled", "revoked"]


class SubscriptionPackageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    price_minor: int = Field(gt=0)
    currency: str = Field(default="NGN", min_length=3, max_length=3)
    semester_id: int = Field(gt=0)
    available_from: datetime | None = None
    available_until: datetime | None = None
    is_active: bool = False

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("name cannot be blank.")
        return value

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()

    @model_validator(mode="after")
    def validate_availability_window(self) -> "SubscriptionPackageCreate":
        if (
            self.available_from is not None
            and self.available_until is not None
            and self.available_until <= self.available_from
        ):
            raise ValueError("available_until must be later than available_from.")
        return self


class SubscriptionPackageUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    price_minor: int | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    semester_id: int | None = Field(default=None, gt=0)
    available_from: datetime | None = None
    available_until: datetime | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("name cannot be blank.")
        return value

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        return value.upper() if value is not None else value

    @model_validator(mode="after")
    def reject_null_required_fields_and_validate_window(self) -> "SubscriptionPackageUpdate":
        required_fields = {"name", "price_minor", "currency", "semester_id", "is_active"}
        for field_name in required_fields:
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"{field_name} cannot be null.")
        if (
            self.available_from is not None
            and self.available_until is not None
            and self.available_until <= self.available_from
        ):
            raise ValueError("available_until must be later than available_from.")
        return self


class SubscriptionPackageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    package_type: Literal["subscription"]
    price_minor: int
    currency: str
    semester_id: int
    semester_starts_on: date | None = None
    semester_ends_on: date | None = None
    available_from: datetime | None
    available_until: datetime | None
    is_active: bool


class PaymentInitializeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    package_id: int = Field(gt=0)


class PaymentInitializeResponse(BaseModel):
    id: int
    reference: str
    status: PaymentStatus
    amount_minor: int
    currency: str
    checkout_url: str


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    reference: str
    package_id: int | None
    subscription_id: int | None
    status: PaymentStatus
    provider_status: str | None
    amount_minor: int
    currency: str
    semester_id: int | None
    failure_reason: str | None
    verified_at: datetime | None
    refund_review_status: Literal["not_applicable", "pending", "approved", "rejected"]
    created_at: datetime


class PaymentVerificationResponse(BaseModel):
    payment: PaymentResponse
    subscription_status: SubscriptionStatus | None


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    package_id: int | None
    semester_id: int | None
    starts_at: datetime
    ends_at: datetime
    status: SubscriptionStatus
    is_active: bool
    created_at: datetime
