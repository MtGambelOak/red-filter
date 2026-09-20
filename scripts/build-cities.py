#!/usr/bin/env python3
"""Build extension/data/cities.json from GeoNames cities15000.txt (top N by population).

Usage: python3 scripts/build-cities.py path/to/cities15000.txt [N]
Data: GeoNames (https://www.geonames.org), CC BY 4.0.
"""
import json, sys

src = sys.argv[1]
n = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
rows = []
for line in open(src, encoding="utf-8"):
    c = line.rstrip("\n").split("\t")
    name, lat, lon, cc, admin1, pop = c[1], float(c[4]), float(c[5]), c[8], c[10], int(c[14] or 0)
    label = f"{name}, {admin1}, {cc}" if cc == "US" and admin1 else f"{name}, {cc}"
    rows.append((pop, [label, round(lat, 2), round(lon, 2)]))
rows.sort(key=lambda r: -r[0])
json.dump([r[1] for r in rows[:n]], open("extension/data/cities.json", "w"), ensure_ascii=False, separators=(",", ":"))
