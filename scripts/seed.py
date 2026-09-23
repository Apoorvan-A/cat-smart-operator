"""Seed the database with synthetic demo data. Owner: Claude 4 (+ Claude 2 data).

Loads correlated synthetic data (from ml/ generator output) into Postgres so the
demo story in docs/DEMO.md replays deterministically. `--reset` truncates first.

Usage:
    python scripts/seed.py            # seed
    python scripts/seed.py --reset    # truncate + reseed (demo-reset)
"""
from __future__ import annotations

import argparse


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="truncate before seeding")
    args = parser.parse_args()
    # Integration wires this to the backend session + ml generator output.
    raise NotImplementedError(
        f"Claude 4: implement seeding (reset={args.reset}) from ml/ synthetic data"
    )


if __name__ == "__main__":
    main()
