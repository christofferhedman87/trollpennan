// felsökning: vilka maskor utan trollUid (räknas som dekor/skymning i id-passet) ligger i ett djurs låda
import fs from "node:fs"; import http from "node:http"; import path from "node:path"; import { chromium } from "playwright";
const dist = path.resolve("dist-pages");
const ord = (process.argv[2] ?? "en katt,en giraff").split(",");
const server = http.createServer((req, res) => { let f = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html"); const e = path.extname(f); res.setHeader("Content-Type", { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".json": "application/json" }[e] ?? "application/octet-stream"); res.end(fs.readFileSync(f)); });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem("s")) { localStorage.setItem("trollpennan-v2", JSON.stringify({ version: 2, introSedd: true, dragit: true, ang: [], garden: [], stjarnor: 12 })); sessionStorage.setItem("s", "1"); } });
const p = await ctx.newPage();
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => !!window.__troll && !!window.__tredScen, null, { timeout: 90000 });
for (const o of ord) { await p.evaluate((x) => window.__troll.vakna(x), o); await p.waitForTimeout(6000); }
await p.waitForTimeout(4000);
const ut = await p.evaluate(() => {
  const { scene } = window.__tredScen;
  scene.updateMatrixWorld(true);
  const V = scene.position.constructor;
  const box = (o) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; o.traverse((m) => { if (!m.isMesh || !m.geometry || !m.visible) return; m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) { const v = new V(x, y, z).applyMatrix4(m.matrixWorld); [v.x, v.y, v.z].forEach((c, i) => { mn[i] = Math.min(mn[i], c); mx[i] = Math.max(mx[i], c); }); } }); return { mn, mx }; };
  const uid = (o) => { for (let q = o; q; q = q.parent) if (q.userData?.trollUid) return q.userData.trollUid; return null; };
  const del = (o) => { for (let q = o; q; q = q.parent) if (q.userData?.trollDel) return true; return false; };
  const synlig = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  const djur = []; scene.traverse((o) => { if (o.userData?.trollUid) djur.push(o); });
  const res = [];
  for (const d of djur) {
    const B = box(d);
    const nara = [];
    scene.traverse((m) => {
      if (!m.isMesh || uid(m) || del(m) || !synlig(m)) return;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      if (mat?.transparent && (mat.opacity ?? 1) < 0.5) return;
      const b2 = box(m);
      const over = [0, 1, 2].every((i) => b2.mn[i] < B.mx[i] && b2.mx[i] > B.mn[i]);
      if (!over) return;
      const kedja = []; for (let q = m; q && kedja.length < 6; q = q.parent) kedja.push(q.name || q.type);
      nara.push({ kedja: kedja.join("<"), geo: m.geometry?.type, mat: mat?.type, transp: !!mat?.transparent, op: mat?.opacity, bb: b2.mn.map((v, i) => `${v.toFixed(2)}..${b2.mx[i].toFixed(2)}`).join(" ") });
    });
    res.push({ uid: d.userData.trollUid, bb: B.mn.map((v, i) => `${v.toFixed(2)}..${B.mx[i].toFixed(2)}`).join(" "), nara: nara.slice(0, 15) });
  }
  return res;
});
console.log(JSON.stringify(ut, null, 1));
await b.close(); server.close();
