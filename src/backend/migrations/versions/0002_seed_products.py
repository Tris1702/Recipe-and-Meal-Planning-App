"""seed products catalogue

Revision ID: 0002
Revises: 0001
"""

from pathlib import Path

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

SQL = Path(__file__).resolve().parents[1] / "sql" / "0002_products.sql"


def upgrade() -> None:
    op.execute(SQL.read_text(encoding="utf-8"))


def downgrade() -> None:
    # DELETE (không TRUNCATE) để báo lỗi thay vì xoá ngầm nếu công thức của user còn dùng nguyên liệu.
    op.execute("""
        DELETE FROM product_nutritions;
        DELETE FROM products;
        ALTER TABLE product_nutritions ALTER COLUMN id RESTART WITH 1;
        ALTER TABLE products ALTER COLUMN id RESTART WITH 1;
    """)
