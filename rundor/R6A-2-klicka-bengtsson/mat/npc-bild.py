#!/usr/bin/env python3
"""Bildflöde för 2D-figurer (NPC): PNG med enfärgad ljus bakgrund -> frilagd, nedskalad WebP med genomskinlighet.
Användning:
  python3 npc-bild.py IN.png UT.webp --bredd 512 [--utan-frilagg] [--trimma] [--kvalitet 82]
Krav: Pillow, numpy, scipy. Frilägget fyller från bildkanten över neutrala ljusa pixlar (bakgrunden i Christoffers bilder är
ljusgrå, nästan neutral), tar bort småfläckar, krymper kanten en pixel och mjukar upp den. Figurens svarta kontur gör att det fungerar;
bilder där figuren har stora neutrala ljusa ytor invid kanten (vit duk, vykort) ska köras med --utan-frilagg.
Alla poser av en figur ska ha SAMMA duk (ingen --trimma) så att ansiktsbyten inte hoppar; saker och fiender får --trimma.
Kontrollera alltid resultatet mot en mörk och en grön bakgrund (kontaktarket) innan bilden checkas in. Budget: högst 60 KB per bild."""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def frilagg(im):
    a = np.asarray(im.convert("RGB")).astype(int)
    mx, mn, lum = a.max(2), a.min(2), a.mean(2)
    neutral = ((mx - mn) <= 16) & (lum >= 196)
    lab, n = ndi.label(neutral)
    rand = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    storlek = ndi.sum(neutral, lab, range(n + 1))
    bg = np.zeros_like(neutral)
    for l in range(1, n + 1):
        if l in rand or storlek[l] >= 1500:
            bg |= lab == l
    fg = ndi.binary_opening(~bg, iterations=1)
    lab2, n2 = ndi.label(fg)
    s2 = ndi.sum(fg, lab2, range(n2 + 1))
    stor = np.zeros_like(fg)
    for l in range(1, n2 + 1):
        if s2[l] >= 400:
            stor |= lab2 == l
    fg = ndi.binary_erosion(stor, iterations=1)
    alfa = ndi.gaussian_filter(fg.astype(float), 0.9)
    return Image.fromarray(np.dstack([np.asarray(im.convert("RGB")), (alfa * 255).astype(np.uint8)]), "RGBA")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("inn"); p.add_argument("ut")
    p.add_argument("--bredd", type=int, default=512)
    p.add_argument("--kvalitet", type=int, default=82)
    p.add_argument("--utan-frilagg", action="store_true")
    p.add_argument("--trimma", action="store_true")
    o = p.parse_args()
    im = Image.open(o.inn)
    im = im.convert("RGB") if o.utan_frilagg else frilagg(im)
    if o.trimma and not o.utan_frilagg:
        im = im.crop(im.getchannel("A").point(lambda x: 255 if x > 8 else 0).getbbox())
    if im.width > o.bredd:
        im = im.resize((o.bredd, round(im.height * o.bredd / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(os.path.abspath(o.ut)), exist_ok=True)
    im.save(o.ut, "WEBP", quality=o.kvalitet, method=6, alpha_quality=90)
    print(o.ut, im.size, os.path.getsize(o.ut) // 1024, "KB")

main()
