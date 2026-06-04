#!/bin/bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.." && pwd)"
CWEBP="${CWEBP:-cwebp}"
Q="${Q:-82}"
Q_THUMB="${Q_THUMB:-78}"

opt_image() {
  local src="$1" max_w="$2" quality="$3"
  local dir base ext out_webp tmp
  src="$(cd "$(dirname "$src")" && pwd)/$(basename "$src")"
  [[ -f "$src" ]] || return 0
  dir="$(dirname "$src")"
  base="$(basename "$src")"
  ext="${base##*.}"
  base="${base%.*}"
  out_webp="$dir/${base}.webp"
  tmp="$dir/.opt-${base}.jpg"

  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
  case "$ext_lower" in
    gif)
      ffmpeg -y -loglevel error -i "$src" -frames:v 1 -q:v 2 "$tmp"
      ;;
    png|jpg|jpeg|webp)
      cp "$src" "$tmp" 2>/dev/null || sips -s format jpeg "$src" --out "$tmp" >/dev/null
      ;;
    *) return 0 ;;
  esac

  sips -Z "$max_w" "$tmp" --out "$tmp" >/dev/null 2>&1 || true
  $CWEBP -quiet -q "$quality" "$tmp" -o "$out_webp"
  rm -f "$tmp"
  echo "  ✓ ${out_webp#$BASE/} ($(du -h "$out_webp" | awk '{print $1}'))"
}

echo "Optimizing landing page images..."
opt_image "$BASE/about-header.png" 1600 "$Q"
opt_image "$BASE/assets/resume-portfolio/portfolio-highlight-1.gif" 1200 "$Q"
opt_image "$BASE/assets/resume-portfolio/portfolio-highlight-2.png" 1000 "$Q"
opt_image "$BASE/assets/kuts-by-lee/barber-bg3.png" 900 "$Q"
opt_image "$BASE/assets/kuts-by-lee/logo.png" 400 "$Q"
opt_image "$BASE/assets/creator-collective/Landing-Banner.jpeg" 1000 "$Q"
opt_image "$BASE/assets/course-creator-academy/hero-banner.png" 1000 "$Q"
opt_image "$BASE/assets/doodle.png" 700 "$Q_THUMB"
opt_image "$BASE/assets/iHeartRadio_SemiStacked_Logo_color_white.png" 400 "$Q"

for logo in Creator-Collective-Logo.png Bizzi-Cloud-Logo.png Course-Creator-Academy-Logo.png Logo.png; do
  opt_image "$BASE/$logo" 600 "$Q"
done

for img in "$BASE/assets/scrolling-banner"/*.{png,jpg,jpeg}; do
  [[ -f "$img" ]] && opt_image "$img" 400 "$Q"
done

for img in "$BASE/assets/real-estate"/*.{jpg,jpeg,png}; do
  [[ -f "$img" ]] && opt_image "$img" 1200 "$Q_THUMB"
done

echo "Done."
