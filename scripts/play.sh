#!/usr/bin/env bash
# Rust Playground でスニペットを実行する。
# 使い方: scripts/play.sh <file.rs> [mode=release] [channel=stable]
set -euo pipefail

file="$1"
mode="${2:-release}"
channel="${3:-stable}"

code=$(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$file")

curl -s -X POST https://play.rust-lang.org/execute \
  -H 'Content-Type: application/json' \
  --max-time 90 \
  -d "{\"channel\":\"$channel\",\"mode\":\"$mode\",\"edition\":\"2024\",\"crateType\":\"bin\",\"tests\":false,\"backtrace\":false,\"code\":$code}" |
  python3 -c '
import json, sys
d = json.load(sys.stdin)
import re
cargo_line = re.compile(r"^\s*(Compiling playground v|Finished `(dev|release)` profile|Running `target/)")
stderr = "\n".join(
    l for l in d.get("stderr", "").splitlines()
    if not cargo_line.match(l)
).strip()
if stderr:
    print("--- stderr ---", stderr, sep="\n")
print(d.get("stdout", ""), end="")
if not d.get("success", False):
    sys.exit(1)
'
