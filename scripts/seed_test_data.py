#!/usr/bin/env python3
"""Seed deterministic QA data for GamataFitness."""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from seed_data.config import (
    BACKEND_DIR,
    SeedScriptError,
    ensure_required_env,
    load_env_file,
    normalize_local_profile_hosts,
    parse_args,
    resolve_env_file,
)
from seed_data.ops import run_seed
from seed_data.support import write_payload


def print_summary(*, env_path: Path, output_path: Path, payload: dict) -> None:
    print(f"Seed completed using env file: {env_path}")
    print(f"Credentials JSON written to: {output_path}")
    print("")
    print("Shared password for all seeded accounts:")
    print(f"  {payload['shared_password']}")
    print("")
    print("Seeded accounts:")
    for role in ("admin", "coach", "user"):
        role_accounts = [row for row in payload["accounts"] if row["role"] == role]
        if not role_accounts:
            continue
        print(f"  {role.upper()}:")
        for account in role_accounts:
            print(f"    - {account['email']} ({account['name']})")
    print("")
    print("Seeded dataset counts:")
    for key, value in payload["counts"].items():
        print(f"  {key}: {value}")


def main() -> int:
    args = parse_args()
    env_path = resolve_env_file(args.env_file)
    load_env_file(env_path)
    normalize_local_profile_hosts()
    ensure_required_env()

    output_path = Path(args.output).expanduser().resolve()
    payload = run_seed(args, backend_dir=BACKEND_DIR)
    write_payload(output_path, payload)
    print_summary(env_path=env_path, output_path=output_path, payload=payload)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SeedScriptError as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
