#!/usr/bin/env python3
"""Build frontend-ready summaries from the public data-center meter sample."""

from __future__ import annotations

import csv
import gzip
import json
import math
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from statistics import fmean


ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "raw" / "power_test.csv.gz"
PUBLIC_DATA_DIR = ROOT / "public" / "data"
RAW_SOURCE_URL = (
    "https://raw.githubusercontent.com/cchantra/energydata/master/power_test.csv.gz"
)
SAMPLE_TARIFF_PER_KWH = 0.18
TIMESTAMP_FORMAT = "%d/%m/%Y %H:%M:%S"


def meter_role(device_name: str) -> str | None:
    upper_name = device_name.upper()
    if "_ULC_" in upper_name:
        return "it_load"
    if "_CRAC" in upper_name:
        return "cooling"
    if upper_name.startswith("DB"):
        return "facility_total"
    return None


def as_number(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def ensure_raw_file() -> None:
    if RAW_PATH.exists():
        return
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading public source sample to {RAW_PATH.relative_to(ROOT)}")
    urllib.request.urlretrieve(RAW_SOURCE_URL, RAW_PATH)


def rounded(value: float, digits: int = 2) -> float:
    return round(value, digits)


def build_dashboard_data() -> dict[str, object]:
    ensure_raw_file()
    hourly_samples: dict[datetime, dict[str, dict[str, list[float]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    raw_rows = 0
    recognized_rows = 0
    invalid_rows = 0
    zero_power_rows = 0
    observed_devices: set[str] = set()
    first_timestamp: datetime | None = None
    last_timestamp: datetime | None = None

    with gzip.open(RAW_PATH, mode="rt", newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source)
        for row in reader:
            raw_rows += 1
            device = (row.get("dev_name") or "").strip()
            role = meter_role(device)
            if not device or role not in {"it_load", "cooling"}:
                continue
            try:
                timestamp = datetime.strptime(row["Timestamp"], TIMESTAMP_FORMAT)
            except (KeyError, TypeError, ValueError):
                invalid_rows += 1
                continue
            power_kw = as_number(row.get("Active_Threephase_Power"))
            if power_kw is None or power_kw < 0:
                invalid_rows += 1
                continue
            if power_kw == 0:
                zero_power_rows += 1

            hour = timestamp.replace(minute=0, second=0, microsecond=0)
            hourly_samples[hour][role][device].append(power_kw)
            recognized_rows += 1
            observed_devices.add(device)
            first_timestamp = min(first_timestamp, timestamp) if first_timestamp else timestamp
            last_timestamp = max(last_timestamp, timestamp) if last_timestamp else timestamp

    if not hourly_samples or not first_timestamp or not last_timestamp:
        raise RuntimeError("No usable ULC and CRAC rows were found in the source sample.")

    device_hourly_values: dict[str, list[float]] = defaultdict(list)
    device_roles: dict[str, str] = {}
    time_series: list[dict[str, object]] = []
    daily_energy: dict[str, dict[str, float]] = defaultdict(
        lambda: {"it": 0.0, "cooling": 0.0, "total": 0.0, "cost": 0.0}
    )

    for hour in sorted(hourly_samples):
        grouped = hourly_samples[hour]
        it_devices = grouped.get("it_load", {})
        cooling_devices = grouped.get("cooling", {})
        if not it_devices or not cooling_devices:
            continue

        it_kw = sum(fmean(values) for values in it_devices.values())
        cooling_kw = sum(fmean(values) for values in cooling_devices.values())
        total_kw = it_kw + cooling_kw
        pue_proxy = total_kw / it_kw if it_kw else 0.0
        cost = total_kw * SAMPLE_TARIFF_PER_KWH
        day = hour.date().isoformat()

        time_series.append(
            {
                "timestamp": hour.isoformat(),
                "itKw": rounded(it_kw),
                "coolingKw": rounded(cooling_kw),
                "totalKw": rounded(total_kw),
                "pueProxy": rounded(pue_proxy, 3),
                "coolingRatio": rounded(cooling_kw / it_kw, 3) if it_kw else 0,
                "costIndex": rounded(cost),
            }
        )
        daily_energy[day]["it"] += it_kw
        daily_energy[day]["cooling"] += cooling_kw
        daily_energy[day]["total"] += total_kw
        daily_energy[day]["cost"] += cost

        for role, devices in (("it_load", it_devices), ("cooling", cooling_devices)):
            for device, values in devices.items():
                device_hourly_values[device].append(fmean(values))
                device_roles[device] = role

    if not time_series:
        raise RuntimeError("The source sample did not contain complete hourly IT and cooling readings.")

    daily = [
        {
            "date": day,
            "itEnergyKwh": rounded(values["it"]),
            "coolingEnergyKwh": rounded(values["cooling"]),
            "totalEnergyKwh": rounded(values["total"]),
            "costIndex": rounded(values["cost"]),
        }
        for day, values in sorted(daily_energy.items())
    ]

    total_it_energy = sum(point["itKw"] for point in time_series)
    total_cooling_energy = sum(point["coolingKw"] for point in time_series)
    total_energy = total_it_energy + total_cooling_energy
    average_it_kw = fmean(float(point["itKw"]) for point in time_series)
    average_cooling_kw = fmean(float(point["coolingKw"]) for point in time_series)
    average_pue_proxy = (average_it_kw + average_cooling_kw) / average_it_kw
    peak_point = max(time_series, key=lambda point: float(point["totalKw"]))

    devices = []
    for device, readings in sorted(device_hourly_values.items()):
        devices.append(
            {
                "device": device,
                "role": device_roles[device],
                "averageKw": rounded(fmean(readings)),
                "peakKw": rounded(max(readings)),
                "estimatedEnergyKwh": rounded(sum(readings)),
                "observedHours": len(readings),
            }
        )

    return {
        "metadata": {
            "facilityName": "Kasetsart University sample data center",
            "sourceDataset": "Energy Meter Data of Data Center in a University",
            "sourceUrl": "https://github.com/cchantra/energydata",
            "doiUrl": "https://doi.org/10.57760/sciencedb.10792",
            "sourceFile": "power_test.csv.gz",
            "generatedAt": datetime.now().isoformat(timespec="seconds"),
            "sampleTariffPerKwh": SAMPLE_TARIFF_PER_KWH,
            "costUnit": "cost units",
            "powerUnit": "kW",
            "timeZoneNote": "The source CSV does not document a timezone. Timestamps are displayed as recorded.",
            "pueNote": "PUE proxy uses IT and cooling meter readings only. It is not a facility-level true PUE.",
        },
        "kpis": {
            "averageItKw": rounded(average_it_kw),
            "averageCoolingKw": rounded(average_cooling_kw),
            "averagePueProxy": rounded(average_pue_proxy, 3),
            "totalEnergyKwh": rounded(total_energy),
            "costIndex": rounded(total_energy * SAMPLE_TARIFF_PER_KWH),
            "peakTotalKw": rounded(float(peak_point["totalKw"])),
            "peakTimestamp": peak_point["timestamp"],
            "coolingShare": rounded(total_cooling_energy / total_energy, 3),
        },
        "timeSeries": time_series,
        "daily": daily,
        "devices": devices,
        "dataQuality": {
            "rawRows": raw_rows,
            "recognizedRows": recognized_rows,
            "invalidRows": invalid_rows,
            "zeroPowerRows": zero_power_rows,
            "deviceCount": len(observed_devices),
            "hourlyPoints": len(time_series),
            "coverageStart": first_timestamp.isoformat(),
            "coverageEnd": last_timestamp.isoformat(),
            "completeness": rounded(recognized_rows / raw_rows * 100, 1),
        },
    }


def write_outputs(data: dict[str, object]) -> None:
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    dashboard_path = PUBLIC_DATA_DIR / "dashboard.json"
    dashboard_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    device_path = PUBLIC_DATA_DIR / "device_summary.csv"
    devices = data["devices"]
    with device_path.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(
            output,
            fieldnames=list(devices[0].keys()),
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(devices)

    print(f"Wrote {dashboard_path.relative_to(ROOT)}")
    print(f"Wrote {device_path.relative_to(ROOT)}")


def main() -> int:
    try:
        write_outputs(build_dashboard_data())
    except Exception as error:  # A clear CLI error is friendlier than a traceback for normal use.
        print(f"Pipeline failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
