import os
import time
from collections.abc import Iterator
from typing import Annotated

import psycopg2
from fastapi import Depends
from psycopg2.extensions import connection
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel


def connect() -> connection:
    """Open a connection; a missing DB_* variable raises KeyError instead of falling back to libpq defaults."""
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", "5432"),
        database=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )


def connect_to_database() -> connection:
    while True:
        try:
            conn = connect()
            print("Database connection successful!!!")
            return conn
        except psycopg2.OperationalError as e:
            print(f"Database connection failed: {e}")
            time.sleep(2)


def get_db() -> Iterator[RealDictCursor]:
    conn = connect()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# scope="function": commit/rollback runs before the response is sent, so a failed commit becomes a 500
# instead of a 2xx the client already received.
DbCursor = Annotated[RealDictCursor, Depends(get_db, scope="function")]


class _ReturnedId(BaseModel):
    id: int


def fetch_returned_id(cursor: RealDictCursor) -> int:
    """Read the id produced by the `INSERT ... RETURNING id` just executed."""
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("INSERT ... RETURNING id returned no row")
    return _ReturnedId.model_validate(row).id
