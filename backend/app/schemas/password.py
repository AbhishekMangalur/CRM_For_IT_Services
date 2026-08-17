import re


PASSWORD_REQUIREMENTS_MESSAGE = (
    "Password must contain at least one uppercase letter, "
    "one number, and one special character"
)


def validate_password_strength(password: str) -> str:
    if (
        re.search(r"[A-Z]", password) is None
        or re.search(r"\d", password) is None
        or re.search(r"[^\w\s]", password) is None
    ):
        raise ValueError(PASSWORD_REQUIREMENTS_MESSAGE)

    return password
