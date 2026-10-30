"""Kortkonst 96×96: färgklickar (färger ur data/ord.json), mönster och storlekar."""
import json, os
from bas import *

ORD = os.environ.get("ORD_JSON", "data/ord.json" if os.path.exists("data/ord.json") else "/root/tp/data/ord.json")
FARGER = {}
if os.path.exists(ORD):
    for o in json.load(open(ORD))["ord"]:
        if o["klass"] == "farg":
            FARGER[o["id"]] = (o["del"]["farg"], o["del"].get("glans", False))

KLICK = "M48 14c14 0 30 8 32 24 2 12-4 18-2 26 2 10-6 18-18 18-6 0-8-4-14-4s-10 6-18 4c-10-2-16-10-14-20 1-6 6-8 4-16-2-8-2-16 6-24 6-6 14-8 24-8z"


def morkare(hexf, f=0.75):
    h = hexf.lstrip("#")
    r_, g_, b_ = (int(h[i:i+2], 16) for i in (0, 2, 4))
    return "#%02X%02X%02X" % (int(r_*f), int(g_*f), int(b_*f))


def gor_farg(fid, hexf, glanset):
    @ikon("farg", fid)
    def _():
        extra = (gnista(70, 26, 7, P["vit"]) + gnista(26, 70, 4.5, P["vit"])) if glanset else ""
        return (skugga(48, 88, 28, 4) + p(KLICK, hexf) +
                p("M30 78c4 2 8 4 8 8", "none", f'stroke="{morkare(hexf)}" stroke-width="0"') +
                glansfylld("M30 26c6-6 16-6 20-2-6 0-14 4-18 10-2 2-4-4-2-8z", .55) + extra)


for fid, (hexf, gl) in FARGER.items():
    gor_farg(fid, hexf, gl)


# ---------------------------------------------------------------- Mönster
BLOB = "M48 12c20 0 36 14 36 36S68 84 48 84 12 70 12 48 28 12 48 12z"


def monster(namn, bas, innehall):
    @ikon("monster", namn)
    def _():
        return (skugga(48, 88, 28, 4) + '<clipPath id="k"><path d="' + BLOB + '"/></clipPath>' +
                p(BLOB, bas, 'stroke="none"') + '<g clip-path="url(#k)" stroke="none">' + innehall + "</g>" + p(BLOB, "none"))


monster("prickig", P["bla"], "".join(c(x, y, 6, P["vit"]) for x, y in [(30, 30), (54, 24), (70, 44), (46, 48), (26, 58), (52, 72), (72, 68)]))
monster("randig", P["gul"], "".join(f'<path d="M{x} 0l-30 96h10l30-96z" fill="{P["orange"]}"/>' for x in (20, 42, 64, 86, 108)))
monster("glittrig", P["lila"], "".join(gnista(x, y, s, P["vit"]).replace('stroke-width="2.5"', 'stroke="none"') for x, y, s in [(32, 32, 7), (62, 28, 5), (52, 54, 9), (28, 64, 5), (70, 66, 6)]))
monster("spräcklig", P["gradde"], "".join(e(x, y, rx, ry, P["brun"]) for x, y, rx, ry in [(30, 28, 8, 5), (60, 26, 5, 4), (46, 46, 10, 6), (72, 52, 6, 8), (26, 60, 6, 5), (54, 72, 9, 5)]))
monster("tigerrandig", P["orange"], "".join(f'<path d="M{x} 6c-6 14 4 22-2 34s4 20-2 34 2 16 0 22h6c2-6-6-10 0-22s-4-22 2-34-4-22 2-34z" fill="{P["svart"]}"/>' for x in (28, 46, 64, 82)))
monster("regnbågsfärgad", P["rod"], "".join(f'<rect x="0" y="{y}" width="96" height="12" fill="{f}"/>' for y, f in zip((24, 36, 48, 60, 72), (P["orange"], P["gul"], P["gron"], P["bla"], P["lila"]))))


# ---------------------------------------------------------------- Storlek (en liten "trollboll" mot en streckad ram)
def boll(cx, cy, rr):
    o = rr * 0.28
    return (c(cx, cy, rr, P["pennlila"]) + glans(f"M{cx-rr*0.55} {cy-rr*0.2}q{rr*0.15} -{rr*0.4} {rr*0.5} -{rr*0.5}", max(2, rr*0.12), .7) +
            c(cx - o, cy - rr*0.05, max(1.4, rr*0.1), INK, 'stroke="none"') + c(cx + o, cy - rr*0.05, max(1.4, rr*0.1), INK, 'stroke="none"'))


def storlek(namn, rr, cy=None, extra=""):
    @ikon("storlek", namn)
    def _():
        y = cy if cy is not None else 84 - rr
        return (r(12, 12, 72, 72, 10, "none", f'stroke="{P["sten_m"]}" stroke-width="2.5" stroke-dasharray="5 6"') +
                skugga(48, 85, max(6, rr*0.8), 3) + boll(48, y, rr) + extra)


storlek("pytteliten", 5, extra=linje("M56 72l10-10M62 62h4v4", w=2.6))
storlek("jätteliten", 6.5)
storlek("liten", 12)
storlek("stor", 30)
storlek("jättestor", 42, cy=50, extra="")
storlek("enorm", 48, cy=52, extra="")
