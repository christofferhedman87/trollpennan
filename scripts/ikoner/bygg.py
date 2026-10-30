"""Skriver alla registrerade ikoner till ut/<mapp>/<namn>.svg och gör ett granskningsark."""
import importlib, os, sys, html
sys.path.insert(0, os.path.dirname(__file__))
from bas import REGISTER, svg

MODULER = [m for m in ["ui", "byggnader", "natur", "saker", "rutor"] if os.path.exists(os.path.join(os.path.dirname(__file__), m + ".py"))]
for m in MODULER:
    importlib.import_module(m)

UT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "ut")
rader = {}
for (mapp, namn), (fn, storlek) in REGISTER.items():
    d = os.path.join(UT, mapp)
    os.makedirs(d, exist_ok=True)
    innehall = svg(fn(), storlek, namn)
    open(os.path.join(d, namn + ".svg"), "w").write(innehall)
    rader.setdefault(mapp, []).append((namn, innehall))

delar = []
for mapp, lista in rader.items():
    celler = "".join(f'<figure><div class="ik">{s}</div><figcaption>{html.escape(n)}</figcaption></figure>' for n, s in lista)
    delar.append(f"<h2>{mapp} ({len(lista)})</h2><div class=g>{celler}</div>")
sida = f"""<!doctype html><meta charset=utf-8><style>
body{{font-family:sans-serif;background:#3A2A78;color:#fff;margin:12px}}
.g{{display:flex;flex-wrap:wrap;gap:8px}} figure{{margin:0;width:104px;background:#FFFDF7;border-radius:14px;padding:6px;text-align:center;color:#2A1A3A}}
.ik svg{{width:var(--ik,72px);height:var(--ik,72px)}} figcaption{{font-size:12px}} h2{{margin:10px 0 6px;font-size:16px}}
</style>{''.join(delar)}"""
open(os.path.join(UT, "granskning.html"), "w").write(sida)
print({k: len(v) for k, v in rader.items()})
