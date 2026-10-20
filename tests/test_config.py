import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from environment import AppEnvironment, ConfigurationError, load_settings  # noqa: E402


@pytest.mark.parametrize("environment", ["development", "preview", "production"])
def test_load_settings_accepts_each_environment(monkeypatch, environment):
    monkeypatch.setenv("APP_ENV", environment)
    monkeypatch.setenv("GROQ_API_KEY", "test-secret")

    settings = load_settings(load_environment_file=False)

    assert settings.app_environment is AppEnvironment(environment)
    assert settings.groq_api_key == "test-secret"


@pytest.mark.parametrize("missing_variable", ["APP_ENV", "GROQ_API_KEY"])
def test_load_settings_reports_missing_required_variable(monkeypatch, missing_variable):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("GROQ_API_KEY", "test-secret")
    monkeypatch.delenv(missing_variable)

    with pytest.raises(ConfigurationError, match=missing_variable):
        load_settings(load_environment_file=False)


def test_load_settings_rejects_unknown_environment(monkeypatch):
    monkeypatch.setenv("APP_ENV", "staging")
    monkeypatch.setenv("GROQ_API_KEY", "test-secret")

    with pytest.raises(ConfigurationError, match="development, preview, production"):
        load_settings(load_environment_file=False)
