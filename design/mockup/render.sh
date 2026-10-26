#!/usr/bin/env bash
# Renders the mockup images into out/ with headless Microsoft Edge (Windows, Git Bash).
#
#   out/teaser.png          3840 × 2160 teaser to share
#   out/teaser.jpg          1920 × 1080 lighter copy for messaging apps
#   out/mockup-desktop.png  full page at 1440 px
#   out/mockup-mobile.png   full page at 390 px (2x)
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p out

EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
ROOT="file:///$(pwd -W | sed 's#\\#/#g')"
OUT="$(pwd -W)\\out"

shot() {
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --virtual-time-budget=15000 --window-size="$2" --force-device-scale-factor="$3" \
    --screenshot="$OUT\\$4" "$ROOT/$1" >/dev/null 2>&1
}

shot teaser.html 1920,1080 2 teaser.png
shot index.html 1440,5600 1 raw-desktop.png
shot preview-mobile.html 500,7800 2 raw-mobile.png

python - "$OUT" <<'PY'
import sys
from pathlib import Path
from PIL import Image

out = Path(sys.argv[1])
background = (5, 4, 4)


def trim_bottom(image: Image.Image) -> Image.Image:
    """Cuts the empty page background below the footer."""
    width, height = image.size
    last = height - 1

    while last > 0 and all(image.getpixel((x, last)) == background for x in range(0, width, 13)):
        last -= 1

    return image.crop((0, 0, width, last + 1))


teaser = Image.open(out / "teaser.png").convert("RGB")
teaser.resize((1920, 1080), Image.LANCZOS).save(out / "teaser.jpg", quality=90)

desktop = trim_bottom(Image.open(out / "raw-desktop.png").convert("RGB"))
desktop.save(out / "mockup-desktop.png", optimize=True)

mobile = Image.open(out / "raw-mobile.png").convert("RGB").crop((0, 0, 780, 15600))
trim_bottom(mobile).save(out / "mockup-mobile.png", optimize=True)

for raw in out.glob("raw-*.png"):
    raw.unlink()
PY

echo "Rendered into out/"
