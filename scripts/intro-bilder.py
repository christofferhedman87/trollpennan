#!/usr/bin/env python3
"""Introts bilder och delningsbilderna (2026-10-30, Christoffers Firefly-bilder).

Introt:  python3 scripts/intro-bilder.py intro 1.png 2.png 3.png 4.png 5.png 6.png
         Ordningen är scenernas fas 0–5 i data/intro.json. Varje 3840×2160-bild blir två WebP i public/intro/:
         {n}-liggande.webp (1920×1080) och {n}-staende.webp (1080×1920, utsnitt kring bildens fokus, FOKUS nedan).
Delning: python3 scripts/intro-bilder.py dela
         public/og.jpg (1200×630) och public/x-banner.jpg (1200×264) av försidans bakgrund och logga, utan annan text.

Originalen (PNG, ~9 MB styck) checkas inte in; de finns hos Christoffer. Skriptet gör om exporten från dem.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image

ROT = Path(__file__).resolve().parent.parent
INTRO = ROT / "public" / "intro"
FORSIDA = ROT / "public" / "forsida"
MAL_BYTE = 200_000

# Bildens fokus i sidled (andel av bredden) för det stående utsnittet: Trollpennan och djuren, i bild 3 spiralens mitt.
# Måste stämma med --fokus-x i intro.css (där samma tal styr Ken Burns-zoomens mittpunkt i liggande läge).
FOKUS = [0.55, 0.44, 0.48, 0.50, 0.48, 0.50]


def spara_webp(bild: Image.Image, mal: Path) -> tuple[int, int]:
    for q in (82, 78, 74, 70, 66, 62, 58):
        buf = io.BytesIO()
        bild.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= MAL_BYTE or q == 58:
            mal.write_bytes(buf.getvalue())
            return q, buf.tell()
    raise AssertionError


def intro(filer: list[str]) -> None:
    assert len(filer) == 6, "sex bilder, i scenernas ordning"
    INTRO.mkdir(parents=True, exist_ok=True)
    for n, (fil, fx) in enumerate(zip(filer, FOKUS), start=1):
        im = Image.open(fil).convert("RGB")
        w, h = im.size
        ligg = im.resize((1920, round(1920 * h / w)), Image.LANCZOS)
        q1, s1 = spara_webp(ligg, INTRO / f"{n}-liggande.webp")
        bw = round(h * 9 / 16)
        x0 = min(max(0, round(fx * w - bw / 2)), w - bw)
        stå = im.crop((x0, 0, x0 + bw, h)).resize((1080, 1920), Image.LANCZOS)
        q2, s2 = spara_webp(stå, INTRO / f"{n}-staende.webp")
        print(f"{n}: liggande q{q1} {s1 / 1000:.0f} kB, stående q{q2} {s2 / 1000:.0f} kB (utsnitt x {x0}–{x0 + bw})")


def dela() -> None:
    bakgrund = Image.open(FORSIDA / "bakgrund-liggande.webp").convert("RGB")
    logga = Image.open(FORSIDA / "logga.webp").convert("RGBA")
    for namn, (w, h), logga_andel, y_andel in (("og.jpg", (1200, 630), 0.62, 0.30), ("x-banner.jpg", (1200, 264), 0.46, 0.5)):
        # Bakgrunden fyller ytan (cover), lite förskjuten uppåt så att djuren och spiralen syns under loggan.
        s = max(w / bakgrund.width, h / bakgrund.height)
        b = bakgrund.resize((round(bakgrund.width * s), round(bakgrund.height * s)), Image.LANCZOS)
        y0 = round((b.height - h) * (0.55 if h > 400 else 0.62))
        x0 = (b.width - w) // 2
        ut = b.crop((x0, y0, x0 + w, y0 + h)).convert("RGBA")
        lw = round(w * logga_andel)
        lh = round(logga.height * lw / logga.width)
        if lh > h * 0.8:
            lh = round(h * 0.8)
            lw = round(logga.width * lh / logga.height)
        lg = logga.resize((lw, lh), Image.LANCZOS)
        ut.alpha_composite(lg, ((w - lw) // 2, round(h * y_andel - lh / 2)))
        ut.convert("RGB").save(ROT / "public" / namn, "JPEG", quality=86, optimize=True, progressive=True)
        print(f"{namn}: {w}×{h}, {(ROT / 'public' / namn).stat().st_size / 1000:.0f} kB")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "intro":
        intro(sys.argv[2:])
    elif len(sys.argv) == 2 and sys.argv[1] == "dela":
        dela()
    else:
        print(__doc__)
        sys.exit(2)
