class AuthException(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message: str = message


class InvalidAuthenticationException(AuthException):
    def __init__(self, message: str = "Invalid username or password"):
        super().__init__(message)


class MissingCredentialsException(AuthException):
    def __init__(self, message: str = "Username and password are required"):
        super().__init__(message)


class TokenExpiredException(AuthException):
    def __init__(self, message: str = "Token has expired"):
        super().__init__(message)


class UnmatchedConfirmPasswordException(AuthException):
    def __init__(self, message: str = "Confirm password does not match"):
        super().__init__(message)


class AlreadyExistsException(AuthException):
    def __init__(self, message: str = "Username already exists"):
        super().__init__(message)
