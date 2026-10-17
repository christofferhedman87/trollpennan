from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json
root=Path('/tmp/deploy3');results=[]
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',4173),partial(Handler,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/opt/pw-browsers/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(375,812),(320,640),(812,375),(1280,800)]:
  context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce');page=context.new_page();page.set_default_timeout(10000)
  page.add_init_script("localStorage.setItem('trollpennan-v2',JSON.stringify({version:2,introSedd:true}))")
  page.goto('http://127.0.0.1:4173',wait_until='domcontentloaded');page.wait_for_function('!!window.__troll');page.get_by_test_id('pennans-bok').focus();page.keyboard.press('Enter');page.get_by_test_id('bok-skarm').wait_for(state='visible')
  def metrics():return page.evaluate('''() => {const b=document.querySelector('.bok').getBoundingClientRect();const v=document.querySelector('[data-testid="vakna"]').getBoundingClientRect();const h=document.querySelector('.bok-huvud').getBoundingClientRect();return {bookTop:b.top,bookHeight:b.height,vaknaHeight:v.height,vaknaBottom:v.bottom,headerHeight:h.height,overflow:document.documentElement.scrollWidth>innerWidth}}''')
  page.wait_for_timeout(150);after=metrics();page.locator('link[href="/mobile-b03.css"]').evaluate('(e)=>e.media="not all"');page.wait_for_timeout(150);before=metrics();page.locator('link[href="/mobile-b03.css"]').evaluate('(e)=>e.media="all"');page.wait_for_timeout(150)
  results.append({'viewport':[width,height],'before':before,'after':after,'checks':{'no_horizontal_overflow':not after['overflow'],'vakna_44px':after['vaknaHeight']>=44,'vakna_in_view':after['vaknaBottom']<=height,'header_44px':after['headerHeight']>=44}})
  page.get_by_text('Prova en idé',exact=True).click();page.get_by_role('button',name='rosa drake med krona',exact=True).click();page.get_by_test_id('vakna').click();page.wait_for_timeout(300)
  results[-1]['checks']['creates_dragon']=page.evaluate("window.__troll.state().ang.some(a=>a.kropp==='drake')")
  if width==375:page.screenshot(path='/mnt/data/Trollpennan-B03-verifierad-mobil.png',animations='disabled');
  Path('/tmp/current3/verification/mobile-B03.json').write_text(json.dumps(results,indent=2));print('checked',width,height,results[-1]['checks'],flush=True);context.close()
 browser.close()
server.shutdown()
Path('/tmp/current3/verification/mobile-B03.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
