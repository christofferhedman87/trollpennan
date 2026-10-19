#!/usr/bin/env python3
"""Arkitekten: Copilots platsdata -> spelets format (data-utkast/) + kontroll.json. Läser repots data/ (main).
Körs: python3 rundor/BLOCK-platser/verktyg/konvertera.py <mapp med Copilots uppackade filer>"""
import json, sys, os, re, collections
SRC = sys.argv[1] if len(sys.argv) > 1 else "/workspace/copilot-platser"
ROT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
UT = os.path.join(ROT, "rundor/BLOCK-platser/data-utkast")
def las(p): return json.load(open(p, encoding="utf-8"))
def rd(f): return las(os.path.join(ROT, "data", f))
X = os.path.join(SRC, "extrakt")
OMR = {"skog": "skogen", "sjo": "sjon", "grotta": "grottan", "ang": "ang"}
ent = rd("entiteter.json")["entiteter"]; till = rd("tillgangar.json")["tillgangar"]
ordj = rd("ord.json")["ord"]; led = rd("ledtradar.json")["ledtradar"]
beng = rd("bengtsson.json")["uppdrag"]; upp = rd("uppdrag.json")["uppdrag"]
npc = rd("npc.json")
ent_pa_ord = {}
for k, v in ent.items():
    for o in v.get("ord", [k]): ent_pa_ord[o] = k
def har_modell(o):
    k = ent_pa_ord.get(o) or (ord_rad.get(o, {}).get("del") or {}).get("kropp")
    if not k: return False
    m = ent[k].get("modell"); f = till.get(m, {}).get("fil") if m else None
    return bool(f) and os.path.exists(os.path.join(ROT, "public", f.lstrip("/")))
ord_rad = {}
for r in ordj:
    for f in [r["id"], r.get("visa", "")] + r.get("former", []): ord_rad.setdefault(f, r)
djurord = {f for r in ordj if r["klass"] == "djur" for f in r.get("former", [])} | {o for o, k in ent_pa_ord.items() if ent[k].get("typ") == "djur"}
K = collections.defaultdict(list)  # kontroll
def fel(typ, msg): K[typ].append(msg)

# ---- uppdrag ----
inn = las(os.path.join(X, "Trollpennan_innehallsdata_Grok_v1.json"))
kv = {k["uppdrag_id"]: k for k in inn["kontrollvillkor"]}
ratt = {(r["id"], r["falt"]): r for r in inn["dokumenterade_rattelser"]}
finaler = {}
for o in inn["omraden"]:
    finaler[o.get("final_id") or ""] = o["id"]
befintliga = {u["id"] for u in beng} | {u["id"] for u in upp}
def konv(u, omr):
    t = dict(text=u["text"], tb=u["text_bengtsson"])
    if (u["id"], "text") in ratt: t["text"] = ratt[(u["id"], "text")]["rekommenderad"]
    if (u["id"], "text_bengtsson") in ratt: t["tb"] = ratt[(u["id"], "text_bengtsson")]["rekommenderad"]
    kord = [w for w in u["krav"]["ord"] if w != "korg"]
    grupper = u["val"]["grupper"] if isinstance(u["val"], dict) else u["val"]
    rad = {"id": u["id"], "omrade": OMR[omr], "givare": "bengtsson", "typ": "skriv", "text": t["text"], "mal": {},
           "klart": u["klart_bengtsson"], "stjarnor": u["stjarnor"], "skatt": None,
           "text_bengtsson": t["tb"], "klart_bengtsson": u["klart_bengtsson"],
           "krav": {"ord": kord, "min": u["krav"].get("min", 1)}, "granskad": False,
           "val": {"rubrik": "Idéer:", "grupper": [{"etikett": g["etikett"], "forslag": g["forslag"]} for g in grupper]}}
    k = kv.get(u["id"])
    if k:
        if k.get("djur_kravs"): rad["krav"]["djur"] = True
        rad["_villkor"] = k["villkor"]
    if "final" in u["id"]: rad["final"] = True
    # kontroller
    if not re.fullmatch(r"[a-z0-9-]+", u["id"]): fel("id", f"{u['id']}: otillåtna tecken")
    if u["id"] in befintliga: fel("id", f"{u['id']}: krockar med befintligt uppdrag")
    for f in [t["tb"], u["klart_bengtsson"]]:
        if len(f) > 120: fel("langd", f"{u['id']}: replik {len(f)} tecken")
    if not grupper: fel("val", f"{u['id']}: inga förslag")
    for g in grupper:
        for fs in g["forslag"]:
            if not har_modell(fs["ord"]): fel("forslag_utan_modell", f"{u['id']}: {fs['ord']} ({fs['fras']})")
            toks = re.findall(r"[a-zåäöéü]+", fs["fras"].lower())
            if not any(x in djurord for x in toks): fel("fras_utan_djur", f"{u['id']}: {fs['fras']}")
            for w in rad["krav"]["ord"]:
                pass
            if not any(x == w or (len(w) >= 4 and (x.startswith(w) or x.endswith(w))) for x in toks for w in kord):
                fel("fras_loser_inte_med_dagens_motor", f"{u['id']}: '{fs['fras']}' (krav {kord[:4]}…) – behöver böjning via ord.json (B1.2)")
            # en/ett: artikel framför förslagsordet
            m = re.search(r"\b(en|ett)\s+(?:\w+\s+)?" + re.escape(fs["ord"]) + r"\b", fs["fras"])
            r = ord_rad.get(fs["ord"])
            if m and r and r.get("genus") in ("u", "n") and {"u": "en", "n": "ett"}[r["genus"]] != m.group(1):
                fel("en_ett", f"{u['id']}: '{fs['fras']}' men ord.json säger {r['genus']}")
        for w in kord: pass
    for w in kord:
        if w.lower() in t["tb"].lower().split() and len(kord) > 2: fel("svar_i_replik", f"{u['id']}: '{w}' står i repliken")
    return rad
plats_upp = [konv(u, u["omrade"]) for u in inn["uppdrag"]]
ids = collections.Counter(u["id"] for u in plats_upp); [fel("id", f"{i}: dubblett") for i, n in ids.items() if n > 1]
ang_raw = las(os.path.join(SRC, "Copilot/trollpennan_copilot.uppdrag1.json"))
ang_upp = [konv(u, "ang") for u in ang_raw]
ids2 = collections.Counter(u["id"] for u in ang_upp + plats_upp); [fel("id", f"{i}: dubblett ängen/platser") for i, n in ids2.items() if n > 1]
# upprepade uppdrag (samma kravord) mellan platser
sig = collections.defaultdict(list)
for u in plats_upp: sig[tuple(sorted(u["krav"]["ord"]))].append(u["id"])
for s, l in sig.items():
    if len(l) > 1: fel("upprepning", f"{', '.join(l)} har samma krav {list(s)[:4]}")

# ---- hemliga djur (platser + ängen) ----
def gatkoll(g, kalla):
    o = g["ord"]; r = ord_rad.get(o)
    if g.get("langd") != len(o): fel("gata_langd", f"{kalla} {o}: langd {g.get('langd')} ≠ {len(o)}")
    if g.get("forsta") != o[0].upper(): fel("gata_forsta", f"{kalla} {o}: forsta {g.get('forsta')}")
    for f in ("gata", "gata_latt"):
        if o in g.get(f, "").lower(): fel("svar_i_gata", f"{kalla} {o}: ordet står i {f}")
        if len(g.get(f, "")) > 110: fel("gata_langd_tecken", f"{kalla} {o}: {f} {len(g[f])} tecken")
    kropp = ent_pa_ord.get(o) or ((r or {}).get("del") or {}).get("kropp")
    if not kropp or kropp not in ent: fel("hemligt_blir_agg", f"{kalla} {o}: ingen entitet, blir ägg (aktivera inte gåtan)")
    elif not har_modell(o): fel("hemligt_kodritat", f"{kalla} {o}: kodritad kropp, ingen GLB (syns, men fulare)")
    if r is None: fel("hemligt_saknar_ordrad", f"{kalla} {o}: ingen rad i ord.json (behöver niva 'fritt')")
    elif r.get("niva") != "fritt": fel("hemligt_ar_kort", f"{kalla} {o}: niva {r.get('niva')} i ord.json (syns som förslag)")
    return {"gata": g["gata"], "gata_latt": g.get("gata_latt"), "forsta": o[0].upper(), "langd": len(o),
            "bengtsson_fore": g.get("bengtsson_fore"), "bengtsson_klart": g.get("bengtsson_klart"), "granskad": False}
led_plats = {}
for g in inn["hemliga_djur"]:
    led_plats[g["ord"]] = dict(gatkoll(g, "plats/" + g["omrade"]), omrade=OMR[g["omrade"]])
    if g["ord"] in led: fel("hemligt_finns_redan", f"{g['ord']}: har redan gåta i ledtradar.json (Copilots version läggs som ny text)")
txt = open(os.path.join(SRC, "Copilot/Del2.gator.hemligadjur.txt"), encoding="utf-8").read()
_k = txt[txt.index("["): txt.rindex("}") + 1]
try: ang_gator = json.loads(_k + "]")
except json.JSONDecodeError:  # Copilots svar är avklippt mitt i ett objekt: behåll de hela
    _k = _k[: _k.rindex("},") + 1]; ang_gator = json.loads(_k + "]"); fel("avklippt", f"Del2.gator: svaret är avklippt efter {len(ang_gator)} djur ({_k[-60:].strip()!r})")
led_ang = {g["ord"]: gatkoll(g, "ängen") for g in ang_gator}
saknas_i_led = [o for o in led_ang if o not in led]
if saknas_i_led: fel("gata_nytt_ord", f"{len(saknas_i_led)} ängsgåtor för ord som inte har gåta idag: {saknas_i_led[:15]}")

# ---- ordregister ----
reg = las(os.path.join(X, "Trollpennan_ordregister_platser_v1.json"))
ordrader, behov = [], []
for r in reg:
    o = r["ord"]; m = har_modell(o); i_ord = o in ord_rad
    if r["genus"] not in ("en", "ett"): fel("genus", f"{o}: genus {r['genus']}")
    rr = ord_rad.get(o)
    if rr and rr.get("genus") in ("u", "n") and {"u": "en", "n": "ett"}[rr["genus"]] != r["genus"]:
        fel("en_ett", f"ordregister {o}: Copilot '{r['genus']}', ord.json '{rr['genus']}' (Copilot har rätt: ord.json rättas i B2)")
    if not m: behov.append(r)
    elif r["kategori"] == "djur" and not i_ord:
        ordrader.append({"id": o, "klass": "djur", "niva": "fritt" if r.get("hemlig_i_platsmanus") else "kort", "visa": o,
                         "genus": {"en": "u", "ett": "n"}[r["genus"]],
                         "former": sorted({o, r["bestamd"], r["plural"], r["bestamd_plural"]} - {None, ""}),
                         "sammansattningsled": [o], "kalla": "Copilot", "granskad": False, "del": {"kropp": ent_pa_ord[o]}})
for o in ["koi", "golem", "yeti"]:
    for r in ordrader:
        if r["id"] == o: r["former"] = [o]; r["_sparrade_bojningar"] = True

# ---- platser ----
def plats(f):
    p = las(os.path.join(X, f)); om = OMR[{"skogen": "skog"}.get(p["id"], p["id"])]
    def villk(v): return [dict(typ={"egna_skapelser": "skapelser", "losta_unika_ordinarie_uppdrag": "uppdrag_klara"}.get(x["typ"], x["typ"]), omrade=OMR[x["omrade"]], min=x["min"]) for x in v]
    mf = p["miljo"]["farger"]; lj = p["miljo"]["ljus"]
    start = []
    for s in p["startobjekt"]:
        o = s["ord"]
        if not har_modell(o): fel("start_utan_modell", f"{om}: {o} ({s['representation']})")
        start.append({"ord": o, "x": s["placering"]["x"], "y": s["placering"]["y"], "skala": s.get("skala_relativ", 1), "zon": s["placering"]["zon"]})
    return {"id": om, "namn": p["namn"], "ordning": p["ordning"], "tema": p.get("tema"),
            "upplasning": {"nagon": villk(p["upplasning"]["nagon"])},
            "milstolpe": {"nagon": villk(p["milstoppe"]["villkor"]["nagon"]), "final": p["milstoppe"]["erbjud_final"],
                          "las_upp": OMR.get(p["milstoppe"].get("las_upp_nasta") or "", None)},
            "miljo": {"himmel": {"bakgrund": mf["bakgrund"]}, "dis": {"farg": mf["bakgrund"]}, "mark": {"grundfarg": mf["mark"]},
                      "ljus": {"skala": lj["grundniva"], "farg": lj["farg"]},
                      "ljuskalla_skapad": lj.get("skapad_ljuskalla")},
            "zoner": [{"id": z["id"], "typ": z["typ"], "rekt": z["rektangel"]} for z in p["miljo"]["zoner"]],
            "start": start, "ljud": [{"typ": s["typ"], "volym": s["volym_relativ"]} for s in p["ljud"]["spar"]],
            "intro": p["bengtsson"]["intro"], "final_fore": p["bengtsson"]["final_fore"],
            "hemliga": p["hemliga_djur"]["ord"], "uppdrag": p["uppdrag"]["ordinarie_id"] + [p["uppdrag"]["final_id"]], "granskad": False}
platser = [plats(f"Trollpennan_plats_{n}_v1.json") for n in ("skog", "sjo", "grotta")]
alla_upp_id = {u["id"] for u in plats_upp}
for p in platser:
    for i in p["uppdrag"]:
        if i not in alla_upp_id: fel("plats_uppdrag", f"{p['id']}: {i} finns inte bland uppdragen")
bel = las(os.path.join(X, "Trollpennan_platsbeloningar_v1.json"))
beloningar = [{"id": b["id"], "namn": b["namn"], "final": b["utlosande_final_id"], "omrade": "ang", "stjarnor": b["stjarnor"],
               "objekt": [{"ord": o["ord"], **o["placering"]} for o in b["objekt"]]} for b in bel["beloningar"]]
for b in beloningar:
    for o in b["objekt"]:
        if not har_modell(o["ord"]): fel("belonings_utan_modell", f"{b['id']}: {o['ord']}")

# ---- repliker ----
rep = las(os.path.join(X, "Trollpennan_bengtsson_repliker_v1.json"))
MIN_NAMN = {"besegrad": "besegrat"}
for r in rep: r["min"] = MIN_NAMN.get(r["min"], r["min"])
miner = set(npc.get("npc", {}).get("bengtsson", {}).get("bilder", {}).keys()) if isinstance(npc.get("npc", {}).get("bengtsson"), dict) else set()
REP = collections.defaultdict(lambda: collections.defaultdict(list))
for r in rep:
    if len(r["text"]) > 120: fel("langd", f"replik {r['id']} {len(r['text'])} tecken")
    REP[OMR[r["omrade"]]][r["min"]].append(r["text"])
if miner:
    for m in {r["min"] for r in rep} - miner: fel("min_saknas", f"min '{m}' finns inte i npc.json bilder ({sorted(miner)})")
besegrad = sum(1 for r in rep if r["min"] == "besegrad")

# ---- stavfel ----
stav = las(os.path.join(X, "Trollpennan_stavfelslista_v1.json"))
stavfel, stav_hemlig = {}, 0
for s in stav:
    if s["fel"] in ord_rad or s["fel"] in ent_pa_ord: fel("stavfel_ar_riktigt_ord", f"{s['fel']}→{s['ratt']}"); continue
    if s.get("hemlig_i_platsmanus"): stav_hemlig += 1
    stavfel[s["fel"]] = {"ratt": s["ratt"], "hemlig": bool(s.get("hemlig_i_platsmanus"))}

# ---- testfraser ----
tf = []
for n in ("skog", "sjo", "grotta"): tf += las(os.path.join(X, f"Trollpennan_testfraser_{n}_v1.json"))
testfraser = [{"id": t["id"], "omrade": OMR[t["omrade"]], "text": t["text"], "uppdrag": t.get("aktivt_uppdrag_id"),
               "utfall": t["forvantat"].get("utfall"), "lost": t["forvantat"].get("uppdrag_lost")} for t in tf]

# ---- skriv ----
os.makedirs(UT, exist_ok=True)
def skriv(n, d): json.dump(d, open(os.path.join(UT, n), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
skriv("platser.json", {"version": 1, "_om": "UTKAST (B1-format): platserna Skogen, Sjön, Grottan som data. x,y 0–1 i platsens yta (x vänster→höger, y bak→fram). miljo = överlagring på data/miljo.json. Copilot, granskad false.", "platser": platser, "beloningar": beloningar})
skriv("bengtsson-platser.json", {"_om": "UTKAST: 48 uppdrag i data/bengtsson.json-format, omrade = platsens id. krav.djur = ett djur måste skapas (B1.2). _villkor = Copilots strängare villkor, inte kontrollerat av motorn.", "uppdrag": plats_upp})
skriv("bengtsson-angen.json", {"_om": "UTKAST: Copilots 40 ängsuppdrag (uppdrag 1) i bengtsson-format, omrade ang.", "uppdrag": ang_upp})
skriv("ledtradar-platser.json", {"_om": "UTKAST: 30 hemliga djur för platserna (ledtradar.json-format + omrade, gata_latt, bengtsson_fore/klart).", "ledtradar": led_plats})
skriv("ledtradar-angen.json", {"_om": "UTKAST: Copilots gåtor för ängens hemliga djur; ersätter texten i ledtradar.json och lägger till gata_latt/bengtsson_fore/klart.", "ledtradar": led_ang})
skriv("ord-platser.json", {"_om": "UTKAST: nya ordrader (ord.json-format) för djur som har modell men saknar ordrad.", "ord": ordrader})
skriv("repliker-platser.json", {"_om": "UTKAST: Bengtssons repliker per plats och mine (npc.json-format 'repliker_plats'). Visas när barnet klickar på honom, ger aldrig uppdrag.", "repliker_plats": {k: dict(v) for k, v in REP.items()}})
skriv("stavfel-platser.json", {"_om": "UTKAST: kända felstavningar → rätt ord. Hemliga ord: visa aldrig rättningen före upptäckt.", "stavfel": stavfel})
skriv("testfraser-platser.json", {"_om": "UTKAST: Copilots 150 testfraser, förväntat utfall. Används av platsprovet i B2–B4.", "fraser": testfraser})
with open(os.path.join(ROT, "rundor/BLOCK-platser/modellbehov-platser.tsv"), "w", encoding="utf-8") as f:
    f.write("prio\tord\tgenus\tkategori\tplats\tanvands_i\tkalla_forslag\n")
    anv = collections.Counter()
    for u in plats_upp + ang_upp:
        for g in u["val"]["grupper"]:
            for fs in g["forslag"]:
                if not har_modell(fs["ord"]): anv[fs["ord"]] += 1
    for p in platser:
        for s in p["start"]:
            if not har_modell(s["ord"]): anv[s["ord"]] += 1
    for g in led_plats:
        if not har_modell(g): anv[g] += 2 if g not in ord_rad else 0
    kodritade = [g for g in list(led_plats) + list(led_ang) if g in ord_rad and not har_modell(g)]
    regmap = {r["ord"]: r for r in reg}
    rows = []
    for o in set(anv) | {r["ord"] for r in behov}:
        r = regmap.get(o, {})
        prio = 1 if anv[o] >= 2 or o in led_plats else (2 if anv[o] == 1 else 3)
        rows.append((prio, -anv[o], o, r.get("genus", ""), r.get("kategori", "djur" if o in led_plats else ""), ",".join(OMR.get(x, x) for x in r.get("platser", [])), anv[o]))
    for o in sorted(set(kodritade)):
        rows.append((2, 0, o, "", "djur (kodritad idag, GLB snyggare)", "hemligt", 0))
    for pr, _, o, g, k, pl, n in sorted(rows):
        f.write(f"{pr}\t{o}\t{g}\t{k}\t{pl}\t{n}\t\n")
sammanf = {k: len(v) for k, v in K.items()}
sammanf.update({"uppdrag_platser": len(plats_upp), "uppdrag_angen": len(ang_upp), "hemliga_platser": len(led_plats), "gator_angen": len(led_ang),
                "ordregister": len(reg), "ordregister_med_modell": len(reg) - len(behov), "nya_ordrader": len(ordrader), "repliker": len(rep),
                "repliker_besegrad": besegrad, "stavfel": len(stavfel), "stavfel_hemliga": stav_hemlig, "testfraser": len(testfraser),
                "forslag_platser": sum(len(g["forslag"]) for u in plats_upp for g in u["val"]["grupper"]),
                "forslag_angen": sum(len(g["forslag"]) for u in ang_upp for g in u["val"]["grupper"])})
skriv("kontroll.json", {"sammanfattning": sammanf, "fel": K})
print(json.dumps(sammanf, ensure_ascii=False, indent=0))
