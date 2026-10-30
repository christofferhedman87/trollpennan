#!/usr/bin/env python3
"""Skär ut ängens tre bakgrundslager (berg, kullar, trädrad) ur Firefly-bilderna med magenta bakgrund.

Kör från repots rot:  python3 scripts/parallax-lager.py [--granska MAPP]

Källor:  kallfiler/parallax/{berg,kullar,tradrad}.png   (originalen, 3840×1632, magenta #FF00FF)
Ut:      public/parallax/{namn}.webp                    (WebP med alfa, högst 2048 px bred, helst < 300 kB)
         src/spel/ang/parallaxLager.json                (bildernas mått, läses av Parallax.tsx)

Så här går det till:
1. Nyckelfärgen mäts i bildens översta rader (Firefly ger inte exakt #FF00FF, och bruset varierar).
2. "Kärnan" är pixlar nära nyckelfärgen. Den blir helt genomskinlig, även fickor mellan stammarna.
3. Kantbandet är pixlar några px från kärnan. Där räknas alfa ut ur hur mycket magenta som läckt in
   (min(R, B) − G), magentans andel räknas bort ur färgen och resten av den rosa tonen trycks ner (despill).
   Lila och röda blommor ligger inte vid kärnan och lämnas orörda; de är heller aldrig nära nyckelfärgen.
4. Små öar av brus i himlen tas bort, och tomrummet ovanför motivet beskärs bort.
5. Genomskinliga pixlar får färgen från närmaste motivpixel, så att ingen magenta blöder in när bilden
   skalas om eller mipmappas i spelet.
"""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROT = Path(__file__).resolve().parent.parent
KALLA = ROT / "kallfiler" / "parallax"
UT = ROT / "public" / "parallax"
MATT = ROT / "src" / "spel" / "ang" / "parallaxLager.json"
LAGER = ["berg", "kullar", "tradrad"]
MAX_BREDD = 2048
MAL_BYTE = 300_000

KARNA_AVSTAND = 0.10  # normerat RGB-avstånd till nyckelfärgen som räknas som ren bakgrund (himlens brus < 0.05;
# blommornas klaraste magentapartier ligger på 0.12–0.2 och får inte räknas hit)
BAND_PX = 4  # så långt från kärnan kantbandet räcker
NARA_PX = 32  # så nära himlen (px i originalet) räknas rosa toner som läckage
NARA_SPILL = 40 / 255  # minsta magenta (min(R, B) − G) som räknas som läckage där
MIN_O = 400  # mindre öar än så (px i originalet) som inte rör marken är brus


def nyckelfarg(rgb: np.ndarray) -> np.ndarray:
    topp = rgb[: max(8, rgb.shape[0] // 20)].reshape(-1, 3)
    mag = topp[(topp[:, 0] > 0.7) & (topp[:, 2] > 0.7) & (topp[:, 1] < 0.3)]
    return np.median(mag if len(mag) else topp, axis=0)


def skar_ut(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    k = nyckelfarg(rgb)
    avst = np.linalg.norm(rgb - k, axis=2) / np.sqrt(3)
    karna = avst < KARNA_AVSTAND
    # Fyll små hål i kärnan (brus i himlen) men inte stora: ett "hål" är något som omges av himmel.
    karna |= ndimage.binary_closing(karna, iterations=1)  # bara lägga till (closing äter annars bildkanten)
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)
    # Nära himlen (springor mellan kvarnens vingar, gluggar mellan löven) finns blandad magenta utan ren kärna.
    # Där räknas allt med rosa inslag som läckage. Blommorna ligger längre in i grönskan än så (mätt: cirka 100 px)
    # och lämnas orörda, så lila och röda blommor och tulpaner försvinner inte.
    nara = ndimage.distance_transform_edt(~karna) <= NARA_PX
    band = ((ndimage.binary_dilation(karna, iterations=BAND_PX)) | (nara & (spill > NARA_SPILL))) & ~karna
    k_spill = max(1e-3, float(min(k[0], k[2]) - k[1]))
    alfa = np.ones(rgb.shape[:2], np.float32)
    alfa[karna] = 0.0
    a_band = np.clip(1.0 - spill / k_spill, 0.0, 1.0)
    # Mjuk övergång: ju närmare kärnan, desto mer litar vi på spill-uppskattningen.
    alfa[band] = a_band[band]

    # Räkna bort nyckelfärgens andel i bandet: C = aF + (1 − a)K  =>  F = (C − (1 − a)K) / a
    ut = rgb.copy()
    a = np.clip(alfa, 1e-3, 1.0)[..., None]
    ren = np.clip((rgb - (1.0 - a) * k) / a, 0.0, 1.0)
    ut[band] = ren[band]
    # Despill i ett lite bredare band: rosa ton (R och B över G) trycks ner mot G.
    bred = ndimage.binary_dilation(band, iterations=2) & ~karna
    rosa = np.clip(np.minimum(ut[..., 0], ut[..., 2]) - ut[..., 1], 0, None)
    for c in (0, 2):
        ut[..., c] = np.where(bred, ut[..., c] - rosa, ut[..., c])

    # Ta bort genomskinlighetens yttersta, osäkra pixelrad och mjuka upp kanten lite.
    alfa = np.minimum(alfa, ndimage.grey_erosion(alfa, size=(2, 2)) * 0.5 + alfa * 0.5)
    alfa = ndimage.gaussian_filter(alfa, 0.6) * (alfa > 0.02)

    # Brusöar i himlen: små bitar som inte hänger ihop med resten av motivet.
    etiketter, n = ndimage.label(alfa > 0.5)
    if n > 1:
        storlek = ndimage.sum(np.ones_like(alfa), etiketter, index=np.arange(1, n + 1))
        sma = np.isin(etiketter, np.where(storlek < MIN_O)[0] + 1)
        # Öar som rör bildens nederkant (blommor i gräset) behålls alltid.
        nere = np.unique(etiketter[-3:])
        sma &= ~np.isin(etiketter, nere)
        alfa[sma] = 0.0
    return np.clip(ut, 0, 1), np.clip(alfa, 0, 1)


def fyll_genomskinligt(rgb: np.ndarray, alfa: np.ndarray) -> np.ndarray:
    """Genomskinliga pixlar får närmaste motivpixels färg (ingen magenta som blöder vid skalning/mipmap)."""
    tom = alfa < 0.5
    _, (iy, ix) = ndimage.distance_transform_edt(tom, return_indices=True)
    return rgb[iy, ix]


def spara_webp(bild: Image.Image, mal: Path) -> tuple[int, int]:
    for q in (86, 82, 78, 74, 70, 66, 62):
        buf = io.BytesIO()
        bild.save(buf, "WEBP", quality=q, alpha_quality=90, method=6, exact=True)
        if buf.tell() <= MAL_BYTE or q == 62:
            mal.write_bytes(buf.getvalue())
            return q, buf.tell()
    raise AssertionError


def granska(namn: str, rgba: Image.Image, mapp: Path) -> None:
    """Bilden mot himlens färg och mot mörk bakgrund, och en förstorad kant, för ögongranskning."""
    mapp.mkdir(parents=True, exist_ok=True)
    for bakgrund, farg in (("himmel", (214, 235, 245)), ("mork", (30, 34, 48))):
        b = Image.new("RGBA", rgba.size, farg + (255,))
        b.alpha_composite(rgba)
        b.convert("RGB").save(mapp / f"{namn}-{bakgrund}.png")
    a = np.asarray(rgba)[..., 3]
    rader = np.where((a > 10).any(axis=1))[0]
    y0 = int(rader[0]) if len(rader) else 0
    x0 = rgba.width // 2 - 160
    utsnitt = rgba.crop((x0, y0, x0 + 320, y0 + 160))
    b = Image.new("RGBA", utsnitt.size, (214, 235, 245, 255))
    b.alpha_composite(utsnitt)
    b.convert("RGB").resize((1280, 640), Image.NEAREST).save(mapp / f"{namn}-kant.png")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--granska", type=Path, help="mapp för granskningsbilder (läggs inte i bygget)")
    arg = p.parse_args()
    UT.mkdir(parents=True, exist_ok=True)
    matt: dict[str, dict[str, int]] = {}
    for namn in LAGER:
        rgb = np.asarray(Image.open(KALLA / f"{namn}.png").convert("RGB"), np.float32) / 255.0
        farg, alfa = skar_ut(rgb)
        rader = np.where((alfa > 0.02).any(axis=1))[0]
        topp = max(0, int(rader[0]) - 6)
        farg, alfa = farg[topp:], alfa[topp:]
        farg = fyll_genomskinligt(farg, alfa)
        rgba = np.dstack([farg, alfa])
        bild = Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA")
        if bild.width > MAX_BREDD:
            bild = bild.resize((MAX_BREDD, round(bild.height * MAX_BREDD / bild.width)), Image.LANCZOS)
        q, storlek = spara_webp(bild, UT / f"{namn}.webp")
        matt[namn] = {"bredd": bild.width, "hojd": bild.height}
        print(f"{namn}: {bild.width}×{bild.height}, beskuren {topp} px uppifrån, kvalitet {q}, {storlek / 1000:.0f} kB")
        if arg.granska:
            granska(namn, bild, arg.granska)
    MATT.write_text(json.dumps({"_om": "Skrivs av scripts/parallax-lager.py. Bildernas mått i px efter beskärning.", **matt}, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
