import os
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from psycopg2.extras import RealDictCursor

from app.core.exception.auth_exception import (
    AlreadyExistsException,
    InvalidAuthenticationException,
    MissingCredentialsException,
    UnmatchedConfirmPasswordException,
)
from app.db.database import fetch_returned_id
from app.models.token import Token, TokenClaims
from app.schemas.auth import Auth

ph = PasswordHasher()
JWT_SECRET = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = os.environ["JWT_ALGORITHM"]
ACCESS_TOKEN_TTL = timedelta(minutes=int(os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"]))
_DUMMY_HASH = ph.hash("dummy-password")


def _find_auth(username: str, cursor: RealDictCursor) -> Auth | None:
    cursor.execute("SELECT * FROM auths WHERE username = %s", (username,))
    row = cursor.fetchone()
    return Auth.model_validate(row) if row else None


def _hash_password(password: str) -> str:
    return ph.hash(password)


def _authenticate(auth: Auth | None, password: str) -> bool:
    # Always run verify (against a dummy hash for unknown users) so response time doesn't reveal which usernames exist.
    stored = auth.password_hash if auth else _DUMMY_HASH
    try:
        return ph.verify(stored, password) and auth is not None
    except (VerificationError, InvalidHashError):
        # VerificationError covers a wrong password; InvalidHashError a corrupted stored hash.
        return False


def _create_access_token(auth_id: int) -> str:
    now = datetime.now(UTC)
    payload = {"sub": str(auth_id), "exp": now + ACCESS_TOKEN_TTL, "iat": now}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> TokenClaims:
    claims = jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["exp", "iat", "sub"]},
    )
    return TokenClaims.model_validate(claims)


def _create_user(username: str, cursor: RealDictCursor) -> int:
    cursor.execute("INSERT INTO users (name) VALUES (%s) RETURNING id", (username,))
    return fetch_returned_id(cursor)


def login(username: str, password: str, cursor: RealDictCursor) -> Token:
    if not username or not password:
        raise MissingCredentialsException()
    auth = _find_auth(username, cursor)
    authenticated = _authenticate(auth, password)
    if auth is None or not authenticated:
        raise InvalidAuthenticationException()
    return Token(access_token=_create_access_token(auth.id), token_type="bearer")


def register(
    username: str, password: str, confirm_password: str, cursor: RealDictCursor
) -> int:
    if not username or not password or not confirm_password:
        raise MissingCredentialsException()
    if password != confirm_password:
        raise UnmatchedConfirmPasswordException()

    password_hash = _hash_password(password)

    with cursor.connection:
        if _find_auth(username, cursor):
            raise AlreadyExistsException()
        new_user_id = _create_user(username, cursor)
        cursor.execute(
            "INSERT INTO auths (username, password_hash, user_id) VALUES (%s, %s, %s) RETURNING id",
            (username, password_hash, new_user_id),
        )
        return fetch_returned_id(cursor)
