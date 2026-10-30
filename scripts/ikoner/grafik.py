"""Större UI-grafik: Pennan (Trolla-knappens maskot i tre lägen), trollringen, arkets stjärnmönster och gnistor."""
import math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from bas import P, INK, stjarna5, gnista

UT = sys.argv[1] if len(sys.argv) > 1 else "/root/skapa/ut"
os.makedirs(os.path.join(UT, "grafik"), exist_ok=True)


def spara(namn, innehall):
    open(os.path.join(UT, "grafik", namn), "w").write(innehall)


def penna(lage):
    if lage == "vilar":
        ansikte = (f'<path d="M38.5 47q3 3 6 0M51.5 47q3 3 6 0" stroke-width="3"/>'
                   f'<path d="M45 56q3 1.5 6 0" stroke-width="2.6"/>')
        extra = (f'<g><text x="72" y="40" font-family="Fredoka, sans-serif" font-weight="700" '
                 f'font-size="13" fill="{P["lila_l"]}" stroke="none">z</text><text x="82" y="28" font-family="Fredoka, sans-serif" '
                 f'font-weight="700" font-size="10" fill="{P["lila_l"]}" stroke="none">z</text></g>')
        kropp, lock = "#8E84D8", "#E58AB0"
    else:
        ansikte = (f'<circle cx="41.5" cy="46" r="3.6" fill="{INK}" stroke="none"/><circle cx="54.5" cy="46" r="3.6" fill="{INK}" stroke="none"/>'
                   f'<circle cx="42.6" cy="44.8" r="1.2" fill="#fff" stroke="none"/><circle cx="55.6" cy="44.8" r="1.2" fill="#fff" stroke="none"/>'
                   + (f'<path d="M43 54q5 6 10 0z" fill="{P["rod_m"]}" stroke-width="2.4"/>' if lage == "trollar"
                      else f'<path d="M44 54q4 4 8 0" stroke-width="2.6"/>'))
        extra = ""
        kropp, lock = P["pennlila"], P["pennrosa"]
    kinder = (f'<ellipse cx="37" cy="52" rx="3.2" ry="2" fill="{P["rosa"]}" stroke="none" opacity=".75"/>'
              f'<ellipse cx="59" cy="52" rx="3.2" ry="2" fill="{P["rosa"]}" stroke="none" opacity=".75"/>')
    gnistor = ""
    if lage == "redo":
        gnistor = gnista(16, 22, 6) + gnista(80, 70, 5, P["vit"]) + gnista(78, 18, 4, P["vit"])
    if lage == "trollar":
        gnistor = (gnista(14, 80, 9) + gnista(30, 88, 5, P["vit"]) + gnista(8, 62, 5, P["pennrosa"]) +
                   f'<path d="M20 76q-8-2-12 4" stroke="{P["guld"]}" stroke-width="3"/>')
    vrid = {"vilar": 18, "redo": 28, "trollar": 40}[lage]
    pen = (f'<g transform="translate(4 6) scale(.9)"><g transform="rotate({vrid} 48 50)">'
           f'<path d="M34 32V20a14 14 0 0 1 28 0v12z" fill="{lock}"/>'
           f'<rect x="34" y="30" width="28" height="7" fill="{P["guld"]}"/>'
           f'<rect x="34" y="37" width="28" height="33" fill="{kropp}"/>'
           f'<path d="M34 70h28L48 91z" fill="{P["guld"]}"/><path d="M48 78v11" stroke-width="2.4"/>'
           f'<path d="M38.5 40v24" stroke="#fff" stroke-width="3" opacity=".45"/>'
           + ansikte + kinder +
           stjarna5(48, 6, 7.5, 3.6, P["guld"], 2.6) + "</g></g>")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"><title>Pennan {lage}</title>'
            f'<g fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">{gnistor}{pen}{extra}</g></svg>')


for l in ("vilar", "redo", "trollar"):
    spara(f"penna-{l}.svg", penna(l))

# Trollringen: markdekal i världen där skapelsen förhandsvisas (rastreras till PNG, 512 px)
bokstaver = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ"
bokst = "".join(
    f'<text x="256" y="46" transform="rotate({i*360/len(bokstaver):.2f} 256 256)" text-anchor="middle" dominant-baseline="middle" '
    f'font-family="Fredoka, sans-serif" font-weight="700" font-size="32" fill="#fff" stroke="{P["guld_m"]}" stroke-width="2.5" paint-order="stroke">{b}</text>'
    for i, b in enumerate(bokstaver))
gn = "".join(gnista(256 + 150*math.cos(a), 256 + 150*math.sin(a), 14, P["vit"]).replace('stroke-width="2.5"', 'stroke="none" opacity=".9"')
             for a in [i*math.pi/4 + math.pi/8 for i in range(8)])
ring = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><title>Trollringen</title>
<defs>
<radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6C9" stop-opacity=".95"/><stop offset=".55" stop-color="{P["guld"]}" stop-opacity=".35"/><stop offset="1" stop-color="{P["pennlila"]}" stop-opacity="0"/></radialGradient>
</defs>
<circle cx="256" cy="256" r="250" fill="url(#g)"/>
<circle cx="256" cy="256" r="236" fill="none" stroke="#fff" stroke-width="16" opacity=".7"/>
<circle cx="256" cy="256" r="236" fill="none" stroke="{P["guld"]}" stroke-width="8"/>
<circle cx="256" cy="256" r="184" fill="none" stroke="#fff" stroke-width="12" opacity=".7"/>
<circle cx="256" cy="256" r="184" fill="none" stroke="{P["guld"]}" stroke-width="6"/>
{bokst}
{gn}
<circle cx="256" cy="256" r="110" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round" opacity=".9"/>
</svg>'''
spara("trollring.svg", ring)

# Arkets stjärnmönster (tilebart 160×160, används som bakgrundsbild på Skapa-arket)
st = [(18, 22, 2.2), (70, 12, 1.4), (120, 34, 2.6), (148, 90, 1.6), (96, 70, 1.2), (36, 96, 1.8), (62, 136, 2.4), (130, 140, 1.4), (8, 150, 1.2), (100, 112, 1.0)]
mon = "".join(f'<circle cx="{x}" cy="{y}" r="{rr}" fill="#fff" opacity="{0.10 + rr*0.05:.2f}"/>' for x, y, rr in st)
mon += gnista(44, 54, 5, "#fff").replace('stroke-width="2.5"', 'stroke="none" opacity=".16"') + gnista(132, 64, 4, "#fff").replace('stroke-width="2.5"', 'stroke="none" opacity=".12"')
spara("ark-stjarnor.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">{mon}</svg>')

# Gnistor för flygande ord (en per ordklassfärg + guld)
for namn, f in {"guld": P["guld"], "vad": "#FFD23F", "hurdan": "#7CC8FF", "har": "#6EE0A8", "gor": "#FF8C7A", "vit": "#FFFFFF"}.items():
    spara(f"gnista-{namn}.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><g stroke="{INK}" stroke-width="2" stroke-linejoin="round">{gnista(16, 16, 13, f).replace("stroke-width=\"2.5\"", "")}</g></svg>')
print(sorted(os.listdir(os.path.join(UT, "grafik"))))
