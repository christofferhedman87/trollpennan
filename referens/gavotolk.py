"""Referenstolk för gåvomeningar (runda 5)."""
import json, re, sys
sys.path.insert(0, 'referens')
import byggtolk as BT
G = json.load(open('data/gavor.json'))
gf = {}
for g in G['gavor']:
    for k, f in enumerate(g['former']): gf.setdefault(f, (g, k))
def tolka(fras):
    t = re.findall(r"[a-zåäö]+", fras.lower()); out = []; ok = []; pa = None; adj = []
    for w in t:
        if w == 'och': continue
        if w == 'lite': pa = ('lite', 'lite'); continue
        if w in BT.ANTAL: pa = (BT.ANTAL[w], w); continue
        if w in BT.adj: adj.append(BT.adj[w]); continue
        if w in gf:
            g, k = gf[w]
            n = 1 if pa and pa[0] == 'lite' else (min(pa[0], 5) if pa else (2 if (k >= 2 or g['former'][0] == g['former'][2]) else 1))
            out.append({"gava": g['id'], "antal": n, "antal_ord": pa[1] if pa else None, "farg": next((a[1] for a in adj if a[0] == 'farg'), g['farg']), "adj": adj, "ord": w, "taggar": g['taggar']})
            pa = None; adj = []; continue
        ok.append(w)
    return out, ok
def formel(x):
    g = next(y for y in G['gavor'] if y['id'] == x['gava'])
    if x['antal_ord'] == 'lite': return "lite " + g['former'][0]
    pl = x['antal'] > 1
    a = " ".join(BT.bojadj(z[1], g['genus'], pl) for z in x['adj'])
    art = (x['antal_ord'] or '') if pl else g['genus']
    return " ".join(v for v in [art, a, g['former'][2] if pl else g['former'][0]] if v)
if __name__ == '__main__':
    for f in sys.argv[1:]:
        o, ok = tolka(f); print(f, "=>", " och ".join(formel(x) for x in o), ok)
