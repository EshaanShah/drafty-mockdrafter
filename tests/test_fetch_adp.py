import importlib
import json

import pytest
import requests


def _payload(adp_type: str, player_name: str = "Test Player"):
    return {
        "statusCode": 200,
        "body": {
            "adpDate": "20261007",
            "adpType": adp_type,
            "adpList": [{"longName": player_name}],
        },
    }


def test_import_does_not_make_a_network_request(monkeypatch):
    def fail_if_called(*args, **kwargs):
        pytest.fail("network request occurred during module import")

    monkeypatch.setattr(requests, "get", fail_if_called)
    module = importlib.import_module("scripts.fetch_adp")
    importlib.reload(module)


def test_missing_api_key_returns_nonzero_without_writing(monkeypatch, tmp_path):
    from scripts import fetch_adp

    destination = tmp_path / "adp_halfPPR.json"
    destination.write_text("last good snapshot\n", encoding="utf-8")
    monkeypatch.delenv("RAPIDAPI_KEY", raising=False)
    monkeypatch.setattr(fetch_adp, "load_dotenv", lambda *args, **kwargs: False)

    result = fetch_adp.main(["--format", "half-ppr", "--output-dir", str(tmp_path)])

    assert result == 1
    assert destination.read_text(encoding="utf-8") == "last good snapshot\n"


def test_fetch_failure_preserves_every_existing_snapshot(monkeypatch, tmp_path):
    from scripts import fetch_adp

    half_snapshot = tmp_path / "adp_halfPPR.json"
    full_snapshot = tmp_path / "adp_fullPPR.json"
    half_snapshot.write_text("old half\n", encoding="utf-8")
    full_snapshot.write_text("old full\n", encoding="utf-8")
    monkeypatch.setenv("RAPIDAPI_KEY", "test-key")

    calls = 0

    def fail_second_fetch(api_key, api_format, timeout_seconds):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise fetch_adp.FetchAdpError("provider unavailable")
        return _payload(api_format)

    monkeypatch.setattr(fetch_adp, "fetch_snapshot", fail_second_fetch)

    result = fetch_adp.main(["--output-dir", str(tmp_path)])

    assert result == 1
    assert half_snapshot.read_text(encoding="utf-8") == "old half\n"
    assert full_snapshot.read_text(encoding="utf-8") == "old full\n"


def test_success_replaces_selected_snapshot(monkeypatch, tmp_path):
    from scripts import fetch_adp

    destination = tmp_path / "adp_halfPPR.json"
    destination.write_text("old half\n", encoding="utf-8")
    monkeypatch.setenv("RAPIDAPI_KEY", "test-key")
    monkeypatch.setattr(
        fetch_adp,
        "fetch_snapshot",
        lambda api_key, api_format, timeout_seconds: _payload(api_format),
    )

    result = fetch_adp.main(["--format", "half-ppr", "--output-dir", str(tmp_path)])

    assert result == 0
    assert json.loads(destination.read_text(encoding="utf-8")) == _payload("halfPPR")
    assert list(tmp_path.iterdir()) == [destination]


def test_fetch_snapshot_rejects_invalid_payload():
    from scripts import fetch_adp

    class InvalidResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"statusCode": 200, "body": {"adpType": "halfPPR", "adpList": []}}

    with pytest.raises(fetch_adp.FetchAdpError, match="non-empty ADP list"):
        fetch_adp.fetch_snapshot(
            "test-key",
            "halfPPR",
            1,
            request_get=lambda *args, **kwargs: InvalidResponse(),
        )
