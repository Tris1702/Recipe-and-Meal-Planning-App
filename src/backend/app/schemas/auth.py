from pydantic import BaseModel


class Auth(BaseModel):
    id: int
    username: str
    password_hash: str
    user_id: int
