"""Add preview_policy and preview_content to resources.

Revision ID: 20261029_resource_previews
Revises: 20261028_academic_directory
Create Date: 2026-10-29 02:45:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261029_resource_previews"
down_revision: Union[str, None] = "20261028_academic_directory"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("resources") as batch_op:
        batch_op.add_column(
            sa.Column(
                "preview_policy",
                sa.String(30),
                nullable=False,
                server_default="none",
            )
        )
        batch_op.add_column(
            sa.Column("preview_content", sa.Text(), nullable=True)
        )
        batch_op.create_check_constraint(
            "ck_resource_preview_policy",
            "preview_policy IN ('none', 'public_sample', 'authenticated_only')",
        )


def downgrade() -> None:
    with op.batch_alter_table("resources") as batch_op:
        batch_op.drop_constraint("ck_resource_preview_policy", type_="check")
        batch_op.drop_column("preview_content")
        batch_op.drop_column("preview_policy")

