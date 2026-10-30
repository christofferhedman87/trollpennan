"""Trollpennan – gemensam stil för alla Skapa-ikoner.

Stilen kommer från konstkitet (public/kit): klistermärken med tjock plommonfärgad
kontur, platta färger, en ljus glansfläck och en mjuk skugga under föremål.

  * Bläck (kontur):   #2A1A3A
  * Kortkonst:        viewBox 96×96, kontur 4
  * UI-ikoner:        viewBox 48×48, kontur 3

Varje ikon registreras med @ikon(mapp, namn, storlek). Kör bygg.py för att skriva
alla filer till ut/.
"""

INK = "#2A1A3A"

# Palett för illustrationer (samma familj som pennan och logon)
P = {
    "rod": "#F2545B", "rod_m": "#C93545",
    "orange": "#FF9F43", "orange_m": "#E07B1F",
    "gul": "#FFD23F", "gul_m": "#E9AE14",
    "gron": "#5FD068", "gron_m": "#2FA05A", "gron_l": "#A7EBA0",
    "bla": "#4DA3FF", "bla_m": "#2F78D6", "bla_l": "#A9DBFF",
    "lila": "#8E6CF5", "lila_m": "#5B4BD6", "lila_l": "#CFC3FF",
    "rosa": "#FF7AB6", "rosa_m": "#E04A8E", "rosa_l": "#FFC4DD",
    "brun": "#B9774A", "brun_m": "#8A5230", "brun_l": "#E3A86B",
    "tra": "#D99A5B", "tra_m": "#B0723A",
    "sten": "#B8B4C8", "sten_m": "#8E89A3", "sten_l": "#DAD7E6",
    "vit": "#FFFDF7", "gradde": "#FFF1D6",
    "gra": "#9C97B0",
    "guld": "#F8C838", "guld_m": "#D99A12",
    "turkos": "#3CCFC0",
    "svart": "#3A3048",
    "himmel": "#BDE6FF",
    "pennlila": "#6A5AF9", "pennrosa": "#F8589A",
}

REGISTER = {}


def ikon(mapp, namn, storlek=96):
    def dek(fn):
        REGISTER[(mapp, namn)] = (fn, storlek)
        return fn
    return dek


def svg(inre, storlek=96, titel=""):
    sw = 4 if storlek == 96 else 3
    t = f"<title>{titel}</title>" if titel else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {storlek} {storlek}" '
        f'width="{storlek}" height="{storlek}">{t}'
        f'<g fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round" '
        f'stroke-linejoin="round">{inre}</g></svg>'
    )


# ---------- små byggstenar ----------

def skugga(cx=48, cy=86, rx=32, ry=5):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{INK}" opacity=".13" stroke="none"/>'


def glans(d, w=3.5, op=0.55):
    """Ljus glansstrimma (öppen bana, ingen kontur)."""
    return f'<path d="{d}" stroke="#fff" stroke-width="{w}" opacity="{op}"/>'


def glansfylld(d, op=0.45):
    return f'<path d="{d}" fill="#fff" stroke="none" opacity="{op}"/>'


def p(d, fill="none", extra=""):
    return f'<path d="{d}" fill="{fill}" {extra}/>'


def c(cx, cy, r, fill="none", extra=""):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" {extra}/>'


def r(x, y, w, h, rx=0, fill="none", extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {extra}/>'


def e(cx, cy, rx, ry, fill="none", extra=""):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'


def linje(d, w=None, farg=None, extra=""):
    sw = f' stroke-width="{w}"' if w else ""
    st = f' stroke="{farg}"' if farg else ""
    return f'<path d="{d}"{sw}{st} {extra}/>'


def gnista(cx, cy, s=6, fill=None):
    """Fyrudds stjärngnista."""
    f = fill or P["guld"]
    d = (f"M{cx} {cy-s} Q{cx+s*0.22} {cy-s*0.22} {cx+s} {cy} "
         f"Q{cx+s*0.22} {cy+s*0.22} {cx} {cy+s} Q{cx-s*0.22} {cy+s*0.22} {cx-s} {cy} "
         f"Q{cx-s*0.22} {cy-s*0.22} {cx} {cy-s}Z")
    return f'<path d="{d}" fill="{f}" stroke-width="2.5"/>'


def stjarna5(cx, cy, R, rr=None, fill=None, sw=None):
    import math
    rr = rr or R * 0.5
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else rr
        pts.append(f"{cx + rad*math.cos(a):.1f} {cy + rad*math.sin(a):.1f}")
    s = f' stroke-width="{sw}"' if sw else ""
    return f'<path d="M{" L".join(pts)}Z" fill="{fill or P["guld"]}"{s}/>'


def fonster(x, y, w=12, h=12, glas=None):
    g = glas or P["bla_l"]
    return (r(x, y, w, h, 2.5, g, 'stroke-width="3"') +
            linje(f"M{x+w/2} {y+2}v{h-4}M{x+2} {y+h/2}h{w-4}", w=2))


def dorr(x, y_botten, w=14, h=20, fill=None):
    f = fill or P["gul"]
    rad = w / 2
    return p(f"M{x} {y_botten}V{y_botten-h+rad}a{rad} {rad} 0 0 1 {w} 0V{y_botten}Z", f) + \
        c(x + w - 4, y_botten - h / 2 + 2, 1.2, INK, 'stroke="none"')
