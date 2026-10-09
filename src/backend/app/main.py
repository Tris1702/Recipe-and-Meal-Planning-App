from dotenv import load_dotenv

_ = load_dotenv()

from fastapi import FastAPI

from app.db.database import connect_to_database
from app.routers import auth, product

app = FastAPI()

_ = connect_to_database()

app.include_router(auth.router)
app.include_router(product.router)
