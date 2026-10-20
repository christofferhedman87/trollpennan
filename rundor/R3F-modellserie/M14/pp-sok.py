# Sök Poly Pizza (publik sida) och lista CC0-träffar: python3 pp-sok.py term1 term2 ...
import sys,re,json,urllib.request,urllib.parse
def sok(t):
    h=urllib.request.urlopen(urllib.request.Request('https://poly.pizza/search/'+urllib.parse.quote(t),headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode()
    m=re.search(r'window.__SERVER_APP_STATE__ =\s*(\{.*?\})</script>',h,re.S)
    d=json.loads(m.group(1))['initialData']['result']
    return [x for x in d if x.get('licence','').startswith('CC0')]
for t in sys.argv[1:]:
    try: r=sok(t)
    except Exception as e: print(t,'FEL',e); continue
    print('##',t,':',' | '.join(f"{x['publicID']} {x['title']} ({x['creator']['username']}) {x['previewUrl'].rsplit('/',1)[1][:-5]}" for x in r[:6]))
