from fastapi import APIRouter

from app.db.database import DbCursor
from app.schemas.product import Product
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[Product])
def get_products(cursor: DbCursor) -> list[Product]:
    return product_service.get_all_products(cursor)
