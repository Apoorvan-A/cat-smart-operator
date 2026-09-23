"""Synthetic data generator. Owner: Claude 2.

Generate CORRELATED telemetry (not independent random numbers): rain -> lower
visibility -> slower cycle time -> longer task; high load -> higher fuel/cycle;
degradation -> higher temp -> lower productivity -> anomaly; excessive idle ->
higher fuel; repeated proximity -> training recommendation. See ../docs/ML.md.

Run: python -m src.generate  (writes labeled SIMULATED data into /data).
"""


def main() -> None:
    raise NotImplementedError("Claude 2: implement correlated synthetic generator")


if __name__ == "__main__":
    main()
