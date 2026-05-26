#!/usr/bin/env bash
# Resize JPGs used on resume.html real-estate section (proportional, in-place).
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)/public/assets/real-estate}"

if [[ ! -d "$ROOT" ]]; then
  echo "Asset directory not found: $ROOT" >&2
  exit 1
fi

PHOTO_MAX=1280
BLUEPRINT_MAX=720
JPEG_QUALITY=78

PHOTOS=(
  exterior-01.jpg exterior-02.jpg exterior-03.jpg exterior-04.jpg
  interior-01.jpg interior-02.jpg interior-03.jpg interior-04.jpg interior-05.jpg
  detail-01.jpg detail-02.jpg detail-03.jpg
  gallery-01.jpg gallery-02.jpg gallery-03.jpg
)

BLUEPRINTS=(
  blueprint-01.jpg blueprint-02.jpg blueprint-03.jpg
)

resize_image() {
  local file="$1"
  local max_edge="$2"
  local path="$ROOT/$file"

  if [[ ! -f "$path" ]]; then
    echo "skip missing: $file"
    return 0
  fi

  local before after w h
  before=$(stat -f%z "$path" 2>/dev/null || stat -c%s "$path")
  w=$(sips -g pixelWidth "$path" | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$path" | awk '/pixelHeight/ {print $2}')

  if [[ "$w" -le "$max_edge" && "$h" -le "$max_edge" ]]; then
    sips -s format jpeg -s formatOptions "$JPEG_QUALITY" "$path" --out "$path" >/dev/null
  else
    sips -Z "$max_edge" -s format jpeg -s formatOptions "$JPEG_QUALITY" "$path" --out "$path" >/dev/null
  fi

  after=$(stat -f%z "$path" 2>/dev/null || stat -c%s "$path")
  w=$(sips -g pixelWidth "$path" | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$path" | awk '/pixelHeight/ {print $2}')
  printf '%s: %sx%s, %s -> %s bytes\n' "$file" "$w" "$h" "$before" "$after"
}

echo "Optimizing real-estate photos in: $ROOT"
for file in "${PHOTOS[@]}"; do
  resize_image "$file" "$PHOTO_MAX"
done

for file in "${BLUEPRINTS[@]}"; do
  resize_image "$file" "$BLUEPRINT_MAX"
done

echo "Done."
