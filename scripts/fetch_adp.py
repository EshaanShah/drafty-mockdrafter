#!/usr/bin/env python3
"""Fetch PPR and Half-PPR ADP snapshots without risking the last good files."""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any, Callable, Sequence

import requests
from dotenv import load_dotenv


API_URL = "https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLADP"
API_HOST = "tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com"
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TIMEOUT_SECONDS = 15.0
FORMAT_CONFIG = {
    "half-ppr": ("halfPPR", "adp_halfPPR.json"),
    "ppr": ("PPR", "adp_fullPPR.json"),
}


class FetchAdpError(RuntimeError):
    """Raised when an ADP snapshot cannot be fetched or safely written."""


def _positive_float(value: str) -> float:
    number = float(value)
    if number <= 0:
        raise argparse.ArgumentTypeError("timeout must be greater than zero")
    return number


def _validate_payload(payload: Any, expected_api_format: str) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise FetchAdpError("provider response must be a JSON object")
    if payload.get("statusCode") != 200:
        raise FetchAdpError(f"provider response has unsuccessful status {payload.get('statusCode')!r}")

    body = payload.get("body")
    if not isinstance(body, dict):
        raise FetchAdpError("provider response is missing a valid body")
    if body.get("adpType") != expected_api_format:
        raise FetchAdpError(
            f"provider returned ADP type {body.get('adpType')!r}; expected {expected_api_format!r}"
        )
    if not isinstance(body.get("adpList"), list) or not body["adpList"]:
        raise FetchAdpError("provider response is missing a non-empty ADP list")

    return payload


def fetch_snapshot(
    api_key: str,
    api_format: str,
    timeout_seconds: float,
    request_get: Callable[..., requests.Response] | None = None,
) -> dict[str, Any]:
    """Fetch and validate one snapshot without writing to disk."""
    get = request_get or requests.get
    try:
        response = get(
            API_URL,
            headers={
                "x-rapidapi-host": API_HOST,
                "x-rapidapi-key": api_key,
            },
            params={"adpType": api_format},
            timeout=timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise FetchAdpError(f"request for {api_format} failed: {exc}") from exc

    return _validate_payload(payload, api_format)


def write_snapshot_atomic(destination: Path, payload: dict[str, Any]) -> None:
    """Atomically replace a snapshot so a failed write keeps the last good file."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=destination.parent,
            prefix=f".{destination.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            json.dump(payload, temporary_file, indent=2)
            temporary_file.write("\n")
            temporary_file.flush()
            os.fsync(temporary_file.fileno())

        os.replace(temporary_path, destination)
    except OSError as exc:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
        raise FetchAdpError(f"could not safely write {destination}: {exc}") from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch validated fantasy-football ADP snapshots from RapidAPI."
    )
    parser.add_argument(
        "--format",
        choices=("all", *FORMAT_CONFIG),
        default="all",
        help="snapshot to refresh (default: all)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=REPOSITORY_ROOT,
        help="snapshot directory (default: repository root)",
    )
    parser.add_argument(
        "--timeout",
        type=_positive_float,
        default=DEFAULT_TIMEOUT_SECONDS,
        help=f"request timeout in seconds (default: {DEFAULT_TIMEOUT_SECONDS:g})",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    load_dotenv(REPOSITORY_ROOT / ".env")
    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key:
        print("error: RAPIDAPI_KEY is not set", file=sys.stderr)
        return 1

    selected_formats = FORMAT_CONFIG if args.format == "all" else {
        args.format: FORMAT_CONFIG[args.format]
    }

    try:
        # Complete every network operation before replacing any last-good snapshot.
        payloads = {
            format_name: fetch_snapshot(api_key, api_format, args.timeout)
            for format_name, (api_format, _) in selected_formats.items()
        }

        for format_name, (_, filename) in selected_formats.items():
            destination = args.output_dir / filename
            write_snapshot_atomic(destination, payloads[format_name])
            print(f"updated {destination}")
    except FetchAdpError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
