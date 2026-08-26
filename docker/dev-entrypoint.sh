#!/bin/sh
set -eu

lock_hash="$(sha256sum package-lock.json | cut -d ' ' -f 1)"
marker_file="node_modules/.package-lock.sha256"
installed_hash=""

if [ -f "$marker_file" ]; then
  installed_hash="$(cat "$marker_file")"
fi

if [ "$lock_hash" != "$installed_hash" ]; then
  echo "package-lock.json changed; synchronizing development dependencies..."
  npm ci
  printf '%s' "$lock_hash" > "$marker_file"
fi

exec npm run dev -- --host 0.0.0.0
