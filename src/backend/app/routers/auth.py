from fastapi import APIRouter, Response, status

from app.core.exception.auth_exception import AuthException
from app.db.database import DbCursor
from app.models.token import Token
from app.routers.request.login_request import LoginRequest
from app.routers.request.register_request import RegisterRequest
from app.services import auth_service

router = APIRouter(tags=["auth"])


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, cursor: DbCursor) -> Token | Response:
    try:
        return auth_service.login(login_data.username, login_data.password, cursor)
    except AuthException as e:
        print(f"Authentication error: {e.message}")
        return Response(status_code=status.HTTP_401_UNAUTHORIZED, content=e.message)


@router.post("/sign-up")
async def sign_up(register_request: RegisterRequest, cursor: DbCursor) -> Response:
    try:
        _ = auth_service.register(
            register_request.username,
            register_request.password,
            register_request.confirm_password,
            cursor,
        )
        return Response(
            status_code=status.HTTP_201_CREATED, content="User registered successfully"
        )
    except AuthException as e:
        print(f"Authentication error: {e.message}")
        return Response(status_code=status.HTTP_400_BAD_REQUEST, content=e.message)
