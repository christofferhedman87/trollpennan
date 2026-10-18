// R3C: ETT kontaktark över modeller (stillbild, utan spelet). Används som bevis i R3C och för att granska framriktning.
// Användning (från repots rot, Playwright + three finns i repots node_modules):
//   node rundor/R3C-bulkrutin/kontaktark.mjs --lista lista.json --ut docs/skarmbilder/r3c/kontaktark.png [--kolumner 8] [--cell 150] [--utan-fram]
// lista.json: [{ "fil": "/abs/sokvag.glb", "etikett": "elefant", "axel": "+z" }, …]  (axel = entitetens framAxel; --utan-fram ignorerar den)
// Modellerna ritas i sin naturliga storlek anpassad till rutan, kameran står på +z och tittar mot −z: en modell vars framsida är +z syns framifrån.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const lista = JSON.parse(fs.readFileSync(arg("lista"), "utf8"));

const rot = path.resolve(arg("rot", "."));
const kol = Number(arg("kolumner", 8));
const cell = Number(arg("cell", 150));
const utanFram = process.argv.includes("--utan-fram");
const rader = Math.ceil(lista.length / kol);
const W = kol * cell;
const H = rader * (cell + 18);
const tillatna = new Map(lista.map((x, i) => [`/m/${i}.glb`, path.resolve(x.fil)]));

const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#fff;font:11px system-ui}#c{position:absolute;left:0;top:0}
.e{position:absolute;width:${cell}px;text-align:center;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<canvas id="c" width="${W}" height="${H}"></canvas><div id="t"></div>
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
const lista = ${JSON.stringify(lista.map((x) => ({ etikett: x.etikett, axel: utanFram ? "+z" : (x.axel ?? "+z") })))};
const vink = { "+z": 0, "-z": Math.PI, "+x": -Math.PI / 2, "-x": Math.PI / 2 };
const r = new THREE.WebGLRenderer({ canvas: document.getElementById("c"), antialias: true, preserveDrawingBuffer: true });
r.setSize(${W}, ${H}, false); r.setScissorTest(true); r.setClearColor(0xffffff, 1); r.clear();
r.outputColorSpace = THREE.SRGBColorSpace;
const l = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const fel = [];
for (let i = 0; i < lista.length; i++) {
  const cx = (i % ${kol}) * ${cell}, cy = Math.floor(i / ${kol}) * (${cell} + 18);
  const s = new THREE.Scene(); s.background = new THREE.Color(i % 2 ? 0xeef3f7 : 0xf6f1ea);
  s.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 1.8); d.position.set(2, 4, 3); s.add(d);
  try {
    const g = await l.loadAsync("/m/" + i + ".glb");
    const o = g.scene; const hold = new THREE.Group(); hold.rotation.y = vink[lista[i].axel] ?? 0; hold.add(o); s.add(hold);
    o.traverse((m) => { if (m.isMesh) m.frustumCulled = false; if (m.isMesh && m.material) { const a = Array.isArray(m.material) ? m.material : [m.material]; a.forEach((x) => { if ("metalness" in x) { x.metalness = 0; x.roughness = Math.max(x.roughness ?? 1, 0.75); } }); } });
    hold.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(hold); const sz = b.getSize(new THREE.Vector3()); const c = b.getCenter(new THREE.Vector3());
    const k = 1.5 / Math.max(sz.x, sz.y, sz.z, 1e-6); if (location.search.includes("dbg")) console.log(lista[i].etikett, JSON.stringify(sz), JSON.stringify(c)); hold.scale.setScalar(k); hold.position.set(-c.x * k, -c.y * k, -c.z * k);
  } catch (e) { fel.push(lista[i].etikett + ": " + e.message); }
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0.7, 4.2); cam.lookAt(0, 0, 0);
  r.setViewport(cx, ${H} - cy - ${cell}, ${cell}, ${cell}); r.setScissor(cx, ${H} - cy - ${cell}, ${cell}, ${cell}); r.render(s, cam);
  const e = document.createElement("div"); e.className = "e"; e.style.left = cx + "px"; e.style.top = (cy + ${cell}) + "px"; e.textContent = lista[i].etikett; document.getElementById("t").appendChild(e);
}
window.__klar = { fel };
</script>`;

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x").pathname;
  if (u === "/") {
    res.setHeader("Content-Type", "text/html");
    return res.end(html);
  }
  let f = tillatna.get(u);
  if (!f && u.startsWith("/node_modules/three/")) f = path.join(rot, u);
  if (!f || !fs.existsSync(f)) {
    res.statusCode = 404;
    return res.end("nej");
  }
  res.setHeader("Content-Type", f.endsWith(".js") ? "text/javascript" : "application/octet-stream");
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const sida = await browser.newPage({ viewport: { width: W, height: H } });
sida.on("console", (m) => process.argv.includes("--debug") && console.log("sida:", m.text()));
sida.on("pageerror", (e) => console.log("sidfel:", e.message));
await sida.goto(`http://127.0.0.1:${server.address().port}/${process.argv.includes("--debug") ? "?dbg" : ""}`);
await sida.waitForFunction(() => window.__klar, null, { timeout: 180000 });
const fel = await sida.evaluate(() => window.__klar.fel);
const utfil = path.resolve(arg("ut", "kontaktark.png"));
fs.mkdirSync(path.dirname(utfil), { recursive: true });
await sida.screenshot({ path: utfil, fullPage: false });
await browser.close();
server.close();
console.log(`Kontaktark: ${utfil} (${lista.length} modeller, ${kol} kolumner, ${W}x${H}px)${fel.length ? "\nLaddningsfel: " + fel.join("; ") : ""}`);
process.exitCode = fel.length ? 1 : 0;
