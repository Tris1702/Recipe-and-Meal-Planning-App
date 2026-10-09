import os
import time
from collections.abc import Iterator
from typing import Annotated

import psycopg2
from fastapi import Depends
from psycopg2.extensions import connection
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel


def _connect() -> connection:
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        cursor_factory=RealDictCursor,
    )


def connect_to_database() -> connection:
    while True:
        try:
            conn = _connect()
            print("Database connection successful!!!")
            return conn
        except psycopg2.OperationalError as e:
            print(f"Database connection failed: {e}")
            time.sleep(2)


def get_db() -> Iterator[RealDictCursor]:
    conn = _connect()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


DbCursor = Annotated[RealDictCursor, Depends(get_db)]


class _ReturnedId(BaseModel):
    id: int


def fetch_returned_id(cursor: RealDictCursor) -> int:
    """Read the id produced by the `INSERT ... RETURNING id` just executed."""
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("INSERT ... RETURNING id returned no row")
    return _ReturnedId.model_validate(row).id
