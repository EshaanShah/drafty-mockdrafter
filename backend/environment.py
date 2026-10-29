from dataclasses import dataclass
from enum import StrEnum
import os

from dotenv import load_dotenv


class AppEnvironment(StrEnum):
    DEVELOPMENT = "development"
    PREVIEW = "preview"
    PRODUCTION = "production"


class ConfigurationError(RuntimeError):
    """Raised when required server configuration is missing or invalid."""


@dataclass(frozen=True)
class Settings:
    app_environment: AppEnvironment
    groq_api_key: str


def _required_environment_value(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ConfigurationError(
            f"{name} is required. Copy backend/.env.example to backend/.env for "
            "local development or configure it in the deployment environment."
        )
    return value


def load_settings(*, load_environment_file: bool = True) -> Settings:
    if load_environment_file:
        load_dotenv()

    raw_environment = _required_environment_value("APP_ENV")
    try:
        app_environment = AppEnvironment(raw_environment)
    except ValueError as exc:
        allowed = ", ".join(environment.value for environment in AppEnvironment)
        raise ConfigurationError(
            f"APP_ENV must be one of {allowed}; received {raw_environment!r}."
        ) from exc

    return Settings(
        app_environment=app_environment,
        groq_api_key=_required_environment_value("GROQ_API_KEY"),
    )
