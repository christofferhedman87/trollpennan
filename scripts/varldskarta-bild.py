#!/usr/bin/env python3
"""Världskartans bilder ur Christoffers Firefly-bild (2026-10-30).

Kör från repots rot:  python3 scripts/varldskarta-bild.py [--granska MAPP]

Källa:  kallfiler/varldskarta/varldskarta.png (3840×2160: pergament runt en målad karta med trasig kant)
Ut:     public/karta/karta-{1024,1600,2400}.{avif,webp}  kartbladet frilagt längs sin trasiga kant (alfa)
        public/karta/pergament.webp                     sömlös pergamentruta (512×512) att upprepa runt kartan
        public/karta/penna.webp                         Trollpennans ansikte till "Du är här" (ur introts bild 1)
        public/karta/moln.webp                          ett målat moln ur bilden (alfa), glider över kartan
        src/spel/ui/varldskartaBild.json                kartbladets mått (bredd/höjd), läses av KartaLager

Kartbladet hittas genom att allt som inte är bakgrundspergament räknas som karta: bakgrunden är ljus och gråbeige
(R − B under ~62), bladets kant är brunare och målningen färgstark. Hål fylls, största ytan behålls och kanten
mjukas upp en aning. Koordinaterna i data/platser.json (kartPos, varldskarta_stig) är andelar av det frilagda bladet.
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
KALLA = ROT / "kallfiler" / "varldskarta" / "varldskarta.png"
# Introts bild 1 (3840×2160 PNG, finns hos Christoffer, inte incheckad). Saknas den behålls penna.webp som den är.
INTRO1 = ROT / "kallfiler" / "varldskarta" / "intro-1.png"
UT = ROT / "public" / "karta"
MATT = ROT / "src" / "spel" / "ui" / "varldskartaBild.json"
BREDDER = (1024, 1600, 2400)


def frilagg(rgb: np.ndarray) -> tuple[np.ndarray, tuple[int, int, int, int]]:
    """Alfamask för kartbladet och dess ram (x0, y0, x1, y1).

    Bakgrundspergamentet har (utjämnat) R − B kring 45–60, bladets brända kant och målningen 72 och uppåt.
    Bladet hittas rad för rad och kolumn för kolumn utifrån och in (första sträckan på minst SAMMANHANG px över
    gränsen), och masken är unionen av de två. Då följer kanten bladets trasiga form, och mörkare fläckar i
    bakgrunden räknas aldrig in."""
    GRANS, SAMMANHANG = 70.0, 12
    rb = ndimage.gaussian_filter(rgb[..., 0] - rgb[..., 2], 5) > GRANS
    # Sammanhängande sträckor: en pixel räknas om SAMMANHANG pixlar i rad (åt något håll) är över gränsen.
    def kant(m: np.ndarray, axel: int) -> np.ndarray:
        k = ndimage.uniform_filter1d(m.astype(np.float32), SAMMANHANG, axis=axel, mode="constant") > 0.999
        fram = np.cumsum(k, axis=axel) > 0
        bak = np.flip(np.cumsum(np.flip(k, axel), axis=axel) > 0, axel)
        return fram & bak
    rad, kol = kant(rb, 1), kant(rb, 0)
    # Snittet är exakt men får smala glipor där ett moln eller himlen är målad över kanten (då missar ena
    # riktningen). Gliporna fylls med unionen, men bara inom snittets slutna form, så att mörkare fläckar i
    # bakgrunden utanför bladet aldrig kommer med.
    snitt = rad & kol
    liten = snitt[::4, ::4]
    sluten = ndimage.binary_closing(np.pad(liten, 40), structure=ndimage.generate_binary_structure(2, 1), iterations=30)[40:-40, 40:-40]
    sluten = ndimage.binary_fill_holes(sluten)
    sluten = np.kron(sluten, np.ones((4, 4), bool))[: rb.shape[0], : rb.shape[1]]
    karta = snitt | ((rad | kol) & sluten)
    karta = ndimage.binary_opening(karta, iterations=3)
    etik, n = ndimage.label(karta)
    storst = 1 + int(np.argmax(ndimage.sum(karta, etik, range(1, n + 1))))
    karta = ndimage.binary_fill_holes(etik == storst)
    alfa = ndimage.gaussian_filter(karta.astype(np.float32), 1.2)
    ys, xs = np.where(alfa > 0.02)
    return alfa, (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def pergament_ruta(rgb: np.ndarray, storlek: int = 512) -> Image.Image:
    """Sömlös ruta ur bakgrunden till vänster om bladet. Först jämnas ljusskillnader i stor skala ut (bara pergamentets
    struktur blir kvar), sedan görs rutan sömlös i en riktning i taget: den blandas med sig själv förskjuten en halv
    ruta, med vikten 1 i mitten och 0 vid kanten. Vid kanten syns då rutans mitt, som fortsätter obrutet runt."""
    bit = rgb[700:1300, 20:620] * 255  # ren bakgrund till vänster om kartbladet (som börjar vid x ≈ 650)
    los = ndimage.gaussian_filter(bit, (60, 60, 0))
    bit = bit - los + bit.reshape(-1, 3).mean(axis=0)
    ruta = np.asarray(Image.fromarray(np.clip(bit, 0, 255).astype(np.uint8)).resize((storlek, storlek), Image.LANCZOS), np.float32)
    v = 1 - np.abs(np.linspace(-1, 1, storlek))
    for axel in (1, 0):
        w = (v[None, :, None] if axel == 1 else v[:, None, None]) ** 0.7
        ruta = ruta * w + np.roll(ruta, storlek // 2, axis=axel) * (1 - w)
    return Image.fromarray(np.clip(ruta, 0, 255).astype(np.uint8))


def moln(rgb: np.ndarray) -> Image.Image:
    """Molnet till vänster om kartan (det ligger över bladets kant): ljust och blåaktigt mot gult pergament och
    grön karta. Siluetten fylls och mjukas upp, färgen är molnets egen."""
    c = rgb[540:830, 600:1110] * 255
    r, b = c[..., 0], c[..., 2]
    a = np.clip((b - r + 22) / 22, 0, 1) * np.clip((c.min(axis=2) - 165) / 45, 0, 1)
    m = ndimage.binary_fill_holes(ndimage.binary_opening(a > 0.5, iterations=2))
    etik, n = ndimage.label(m)
    m = etik == (1 + int(np.argmax(ndimage.sum(m, etik, range(1, n + 1)))))
    ys, xs = np.where(m)
    alfa = ndimage.gaussian_filter(m.astype(np.float32), 2.0)
    bild = np.dstack([c, alfa * 255]).clip(0, 255).astype(np.uint8)[ys.min() - 4 : ys.max() + 5, xs.min() - 4 : xs.max() + 5]
    ut = Image.fromarray(bild, "RGBA")
    return ut.resize((360, round(360 * ut.height / ut.width)), Image.LANCZOS)


def spara(bild: Image.Image, mal: Path, fmt: str, **kw) -> int:
    buf = io.BytesIO()
    bild.save(buf, fmt, **kw)
    mal.write_bytes(buf.getvalue())
    return buf.tell()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--granska", type=Path)
    arg = p.parse_args()
    UT.mkdir(parents=True, exist_ok=True)
    im = Image.open(KALLA).convert("RGB")
    rgb = np.asarray(im, np.float32) / 255.0
    alfa, (x0, y0, x1, y1) = frilagg(rgb * 255)
    blad = np.dstack([rgb, alfa])[y0:y1, x0:x1]
    bladbild = Image.fromarray((blad * 255 + 0.5).astype(np.uint8), "RGBA")
    print(f"kartbladet: x {x0}–{x1}, y {y0}–{y1} ({x1 - x0}×{y1 - y0})")
    for bredd in BREDDER:
        b = bladbild.resize((bredd, round(bladbild.height * bredd / bladbild.width)), Image.LANCZOS)
        s1 = spara(b, UT / f"karta-{bredd}.avif", "AVIF", quality=62, speed=4)
        s2 = spara(b, UT / f"karta-{bredd}.webp", "WEBP", quality=80, method=6, alpha_quality=80)
        print(f"karta-{bredd}: {b.width}×{b.height}, avif {s1 / 1000:.0f} kB, webp {s2 / 1000:.0f} kB")
    ruta = pergament_ruta(rgb)
    print(f"pergament: {spara(ruta, UT / 'pergament.webp', 'WEBP', quality=78, method=6) / 1000:.0f} kB")
    print(f"moln: {spara(moln(rgb), UT / 'moln.webp', 'WEBP', quality=80, method=6, alpha_quality=80) / 1000:.0f} kB")
    if INTRO1.exists():
        # Trollpennans ansikte i introts första bild (3840×2160), runt utsnitt görs i CSS.
        intro = Image.open(INTRO1).convert("RGB")
        s = 3840 / 2576
        cx, cy, r = 1440 * s, 420 * s, 240 * s
        ansikte = intro.crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r))).resize((192, 192), Image.LANCZOS)
        print(f"penna: {spara(ansikte, UT / 'penna.webp', 'WEBP', quality=82, method=6) / 1000:.0f} kB")
    MATT.write_text(json.dumps({"_om": "Skrivs av scripts/varldskarta-bild.py. Kartbladets mått i px (största bilden).", "bredd": bladbild.width, "hojd": bladbild.height, "bredder": list(BREDDER)}, ensure_ascii=False, indent=1) + "\n")
    if arg.granska:
        arg.granska.mkdir(parents=True, exist_ok=True)
        bak = Image.new("RGBA", bladbild.size, (40, 60, 90, 255))
        bak.alpha_composite(bladbild)
        bak.convert("RGB").resize((1200, round(1200 * bladbild.height / bladbild.width))).save(arg.granska / f"blad-mot-morkt-{x0}-{y0}.png")
        tile = Image.new("RGB", (1024, 1024))
        for dx in (0, 512):
            for dy in (0, 512):
                tile.paste(ruta, (dx, dy))
        tile.save(arg.granska / "pergament-2x2.png")


if __name__ == "__main__":
    main()
