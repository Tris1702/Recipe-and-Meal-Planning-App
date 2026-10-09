"""init schema

Revision ID: 0001
Revises:
"""

from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

SQL = Path(__file__).resolve().parents[1] / "sql" / "0001_init.sql"


def upgrade() -> None:
    op.execute(SQL.read_text(encoding="utf-8"))


def downgrade() -> None:
    op.execute("""
        DROP TABLE meal_items, meals, recipe_items, recipes, product_nutritions, products,
                   user_health_records, auths, users;
        DROP FUNCTION set_updated_at();
        DROP TYPE meal_type, measure_unit, gender;
    """)
