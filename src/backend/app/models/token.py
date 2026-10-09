from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenClaims(BaseModel):
    sub: str
    exp: int
    iat: int
