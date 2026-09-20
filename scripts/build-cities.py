#!/usr/bin/env python3
"""Build extension/data/cities.tsv from GeoNames cities5000.txt (places over 5,000 people).

Usage: python3 scripts/build-cities.py cities5000.txt admin1CodesASCII.txt
Data: GeoNames (https://www.geonames.org), CC BY 4.0.
Output: one place per line, most populous first: label<TAB>lat<TAB>lon[<TAB>plain-ASCII name].
"""
import sys
from collections import Counter

cities_path, admin_path = sys.argv[1], sys.argv[2]
admin1 = {}
for line in open(admin_path, encoding="utf-8"):
    code, name, *_ = line.rstrip("\n").split("\t")
    admin1[code] = name

rows = []
for line in open(cities_path, encoding="utf-8"):
    c = line.rstrip("\n").split("\t")
    name, ascii_name, lat, lon, cc, a1, pop = c[1], c[2], float(c[4]), float(c[5]), c[8], c[10], int(c[14] or 0)
    rows.append([pop, name, ascii_name, lat, lon, cc, a1])
rows.sort(key=lambda r: -r[0])

base = Counter(f"{r[1]}, {r[5]}" for r in rows)
out = []
for pop, name, ascii_name, lat, lon, cc, a1 in rows:
    if cc == "US" and a1:
        label = f"{name}, {a1}, {cc}"
    elif base[f"{name}, {cc}"] > 1 and admin1.get(f"{cc}.{a1}"):
        label = f"{name}, {admin1[f'{cc}.{a1}']}, {cc}"
    else:
        label = f"{name}, {cc}"
    fields = [label, f"{lat:.2f}", f"{lon:.2f}"]
    if ascii_name != name:
        fields.append(ascii_name)
    out.append("\t".join(fields))

open("extension/data/cities.tsv", "w", encoding="utf-8").write("\n".join(out) + "\n")
print(len(out), "places")
