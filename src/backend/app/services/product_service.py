from psycopg2.extras import RealDictCursor

from app.schemas.product import Product


def get_all_products(cursor: RealDictCursor) -> list[Product]:
    cursor.execute("SELECT id, name FROM products ORDER BY id")
    return [Product.model_validate(row) for row in cursor.fetchall()]
