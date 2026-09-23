#!/usr/bin/env python3
"""Read EXIF for private review; never write metadata into the public site."""

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def capture_date(raw_date):
    if not raw_date:
        return ""
    try:
        return datetime.strptime(raw_date[:19], "%Y:%m:%d %H:%M:%S").date().isoformat()
    except ValueError:
        return ""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path, help="Image files to inspect")
    args = parser.parse_args()

    if not shutil.which("exiftool"):
        parser.error("ExifTool is required; no files were changed")
    if any(not path.is_file() for path in args.files):
        parser.error("Every input must be an existing file")

    command = [
        "exiftool", "-json", "-DateTimeOriginal", "-Make", "-Model",
        "-LensModel", "-FNumber", "-ExposureTime", "-ISO", "-FocalLength",
        "-GPSLatitude", "-GPSLongitude", *map(str, args.files)
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode:
        print(result.stderr.strip(), file=sys.stderr)
        return result.returncode

    records = []
    for row in json.loads(result.stdout):
        records.append({
            "file": row.get("SourceFile", ""),
            "captureDate": capture_date(row.get("DateTimeOriginal", "")),
            "cameraMake": row.get("Make", ""),
            "cameraModel": row.get("Model", ""),
            "lens": row.get("LensModel", ""),
            "aperture": row.get("FNumber", ""),
            "shutterSpeed": row.get("ExposureTime", ""),
            "iso": row.get("ISO", ""),
            "focalLength": row.get("FocalLength", ""),
            "gpsPresent": bool(row.get("GPSLatitude") or row.get("GPSLongitude"))
        })

    json.dump(records, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
