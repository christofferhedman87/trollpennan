"""Referenstolk för byggmeningar (runda 4). Spec för Build; används för att validera exempel och test-fraser."""
import json, re, sys
O = json.load(open('data/ord.json'))
BY = json.load(open('data/bygg.json'))
ANTAL = dict(O['funktionsord']['antal']); ANTAL.update({"en": 1, "ett": 1})
ODEKL = {"lila", "rosa", "orange", "ljusrosa", "gyllene"}
T_ODEKL = ODEKL
adj = {}  # form -> (klass,id)
for e in O['ord']:
    if e['klass'] in ('farg', 'storlek') or (e['klass'] == 'monster' and e['id'] in ('prickig', 'randig', 'glittrig', 'spräcklig', 'tigerrandig', 'regnbågsfärgad', 'skimrande', 'gnistrande')):
        if e['id'] in ('guld', 'silver'): continue
        for f in e['former']: adj[f] = (e['klass'], e['id'])
bord = {}; delar = {}; mat = {m['id']: m for m in BY['material']}
for b in BY['bygg_ord']:
    for k, f in enumerate(b['former']): bord.setdefault(f, (b, k))
for d in BY['delar']:
    for k, f in enumerate(d['former']): delar.setdefault(f, (d, k))
def bojadj(aid, genus, plural):
    e = next(x for x in O['ord'] if x['id'] == aid)
    if aid in ODEKL: return aid
    fs = e['former']
    if aid == 'liten': return 'små' if plural else ('litet' if genus == 'ett' else 'liten')
    if aid in ('pytteliten', 'jätteliten'): return {'pytteliten': ('pyttesmå', 'pyttelitet'), 'jätteliten': ('jättesmå', 'jättelitet')}[aid][0 if plural else 1] if (plural or genus == 'ett') else aid
    if plural: return next(f for f in fs if f.endswith('a') and f != aid) if any(f.endswith('a') and f != aid for f in fs) else aid
    if genus == 'ett': return next((f for f in fs if f.endswith('t') and f != aid), aid)
    return aid
def split_comp(w):
    if w in bord: return None
    for f, (b, k) in sorted(bord.items(), key=lambda x: -len(x[0])):
        if w.endswith(f) and len(w) > len(f):
            pre = w[:-len(f)]
            if pre in mat: return (b, k, pre)
    return None
def tolka(fras):
    t = re.findall(r"[a-zåäö]+", fras.lower())
    byggen = []; i = 0; cur = None; okanda = []
    def ny():
        return {"bygg": None, "ord": None, "antal": 1, "antal_ord": None, "adj": [], "material": None, "delar": []}
    cur = ny(); pend_antal = None; pend_adj = []; pend_pl = []
    mode = 'bygg'
    while i < len(t):
        w = t[i]
        if w in ('och',):
            # nytt bygge om nästa (efter ev. antal/adj) är ett byggord som inte är en del
            j = i + 1
            while j < len(t) and (t[j] in ANTAL or t[j] in adj): j += 1
            if j < len(t) and (t[j] in bord or split_comp(t[j])) and t[j] not in delar:
                byggen.append(cur); cur = ny(); mode = 'bygg'
            i += 1; continue
        if w == 'med': mode = 'del'; i += 1; continue
        if w == 'av':
            if i + 1 < len(t) and t[i + 1] in mat:
                tgt = cur['delar'][-1] if (mode == 'del' and cur['delar']) else cur
                tgt['material'] = t[i + 1]; i += 2; continue
        if w in ANTAL and not (w in ('en', 'ett') and False): pend_antal = (ANTAL[w], w); i += 1; continue
        if w in adj:
            pend_adj.append(adj[w]); pend_pl.append(w.endswith('a') and w not in T_ODEKL and w != adj[w][1]); i += 1; continue
        if mode == 'del' and w in delar:
            d, k = delar[w]
            n = pend_antal[0] if pend_antal else (2 if (k >= 2 or any(pend_pl) or (d['former'][0] == d['former'][2])) else 1)
            cur['delar'].append({"del": d['id'], "antal": min(n, d['max']), "antal_ord": pend_antal[1] if pend_antal else None, "ord": w, "adj": pend_adj, "material": None})
            pend_antal = None; pend_adj = []; pend_pl = []; i += 1; continue
        hit = (bord[w][0], bord[w][1], None) if w in bord else split_comp(w)
        if hit and mode == 'bygg' and cur['bygg'] is None:
            b, k, pre = hit
            cur.update({"bygg": b['id'], "ord": w, "adj": pend_adj, "material": pre or b.get('material')})
            if pend_antal: cur['antal'] = min(pend_antal[0], 3); cur['antal_ord'] = pend_antal[1]
            pend_antal = None; pend_adj = []; pend_pl = []; i += 1; continue
        okanda.append(w); i += 1
    byggen.append(cur)
    byggen = [b for b in byggen if b['bygg']]
    return byggen, okanda
def formel(b):
    bo = next(x for x in BY['bygg_ord'] if x['id'] == b['bygg'])
    g = bo['genus']; pl = b['antal'] > 1 or (b['antal_ord'] and b['antal_ord'] not in ('en', 'ett'))
    # barnets ord, i rätt numerus
    ordet = b['ord']
    base = bo['former']
    if ordet not in base:  # sammansättning
        pre = ordet[:len(ordet) - next(len(f) for f in sorted(base, key=len, reverse=True) if ordet.endswith(f))]
        base = [pre + f for f in base]
    ordet = base[2] if pl else base[0]
    adjs = " ".join(bojadj(a[1], g, pl) for a in b['adj'])
    art = b['antal_ord'] if pl else g
    s = " ".join(x for x in [art, adjs, ordet] if x)
    if b['material'] and b['material'] not in (b['ord'] or '') : s += " av " + b['material']
    if b['delar']:
        parts = []
        for d in b['delar']:
            do = next(x for x in BY['delar'] if x['id'] == d['del'])
            dpl = d['antal'] > 1
            a = " ".join(bojadj(x[1], do['genus'], dpl) for x in d['adj'])
            num = (d['antal_ord'] or "") if dpl else ("" if d['del'] == 'tak' else do['genus'])
            parts.append(" ".join(x for x in [num, a, do['former'][2] if dpl else do['former'][0]] if x) + (" av " + d['material'] if d['material'] else ""))
        s += " med " + (", ".join(parts[:-1]) + " och " + parts[-1] if len(parts) > 1 else parts[0])
    return s
if __name__ == '__main__':
    for f in sys.argv[1:]:
        bs, ok = tolka(f)
        print(f, "=>", " och ".join(formel(b) for b in bs) if bs else "INGET", "| okända:", ok)
