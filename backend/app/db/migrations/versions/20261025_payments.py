"""Add provider-backed semester subscription payments.

Revision ID: 20261025_payments
Revises: 7994004d519b
Create Date: 2026-10-25 06:15:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261025_payments"
down_revision: Union[str, None] = "7994004d519b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("access_packages") as batch_op:
        batch_op.drop_constraint("ck_access_package_type", type_="check")
        batch_op.create_check_constraint(
            "ck_access_package_type",
            "package_type IN ('course', 'resource_package', 'subscription')",
        )

    with op.batch_alter_table("subscriptions") as batch_op:
        batch_op.alter_column(
            "plan_id",
            existing_type=sa.Integer(),
            nullable=True,
        )
        batch_op.add_column(sa.Column("package_id", sa.Integer(), nullable=True))
        batch_op.create_index("ix_subscriptions_package_id", ["package_id"])
        batch_op.create_foreign_key(
            "fk_subscriptions_package_id_access_packages",
            "access_packages",
            ["package_id"],
            ["id"],
        )

    with op.batch_alter_table("payments") as batch_op:
        batch_op.drop_constraint("ck_payment_has_single_product", type_="check")
        batch_op.create_check_constraint(
            "ck_payment_has_single_product",
            "subscription_id IS NOT NULL OR package_id IS NOT NULL",
        )
        batch_op.add_column(sa.Column("semester_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("checkout_url", sa.String(length=1000), nullable=True))
        batch_op.add_column(sa.Column("provider_status", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("failure_reason", sa.String(length=500), nullable=True))
        batch_op.create_index("ix_payments_semester_id", ["semester_id"])
        batch_op.create_foreign_key(
            "fk_payments_semester_id_semesters", "semesters", ["semester_id"], ["id"]
        )

    with op.batch_alter_table("entitlements") as batch_op:
        batch_op.add_column(sa.Column("subscription_id", sa.Integer(), nullable=True))
        batch_op.create_unique_constraint(
            "uq_entitlement_subscription", ["subscription_id"]
        )
        batch_op.create_foreign_key(
            "fk_entitlements_subscription_id_subscriptions",
            "subscriptions",
            ["subscription_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("entitlements") as batch_op:
        batch_op.drop_constraint(
            "fk_entitlements_subscription_id_subscriptions", type_="foreignkey"
        )
        batch_op.drop_constraint("uq_entitlement_subscription", type_="unique")
        batch_op.drop_column("subscription_id")

    with op.batch_alter_table("payments") as batch_op:
        batch_op.drop_constraint("fk_payments_semester_id_semesters", type_="foreignkey")
        batch_op.drop_index("ix_payments_semester_id")
        batch_op.drop_column("failure_reason")
        batch_op.drop_column("provider_status")
        batch_op.drop_column("checkout_url")
        batch_op.drop_column("semester_id")
        batch_op.drop_constraint("ck_payment_has_single_product", type_="check")
        batch_op.create_check_constraint(
            "ck_payment_has_single_product",
            "(subscription_id IS NULL) != (package_id IS NULL)",
        )

    with op.batch_alter_table("subscriptions") as batch_op:
        batch_op.drop_constraint(
            "fk_subscriptions_package_id_access_packages", type_="foreignkey"
        )
        batch_op.drop_index("ix_subscriptions_package_id")
        batch_op.drop_column("package_id")
        batch_op.alter_column(
            "plan_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

    with op.batch_alter_table("access_packages") as batch_op:
        batch_op.drop_constraint("ck_access_package_type", type_="check")
        batch_op.create_check_constraint(
            "ck_access_package_type",
            "package_type IN ('course', 'resource_package')",
        )
