// Snabb förhandsvisning (några sekunder, utan att starta spelet): ritar djur med tillbehör i en liten three-scen med samma
// faestTillbehor som spelet. Bra för att trimma siffror i data/fastpunkter.json / data/tillbehor.json innan de riktiga arken tas.
// Användning: node rundor/R2-tillbehor-som-data/r2-yta.mjs <ut.png> "acc=krona,mantel&yaw=0.45&k=kanin,katt,hund&ts=200&cols=5"
//   acc = tillbehörsrader (använd + för flera på samma djur), yaw = djurets vridning i radianer (1.5708 = profil, 2.5 = bakifrån), k = djurlista.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [, , ut, qs = ""] = process.argv;
if (!ut) throw new Error('Ange utfil: node r2-yta.mjs ut.png "acc=krona&k=katt"');
const hit = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(hit, "../..");
const sida = path.join(repo, "_r2-yta.html");
const konfig = path.join(repo, "_r2-vite.config.mjs");
const port = 5400 + Math.floor(Math.random() * 400);
let vite;
try {
  fs.copyFileSync(path.join(hit, "mat/yta.html"), sida);
  fs.writeFileSync(konfig, `export default { root: ".", server: { port: ${port}, host: "127.0.0.1", fs: { strict: false } }, publicDir: "public", logLevel: "error", optimizeDeps: { noDiscovery: true } };`);
  vite = spawn("node", ["node_modules/vite/bin/vite.js", "--config", "_r2-vite.config.mjs"], { cwd: repo, stdio: ["ignore", "ignore", "inherit"] });
  await new Promise((r) => setTimeout(r, 3500));
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.on("pageerror", (e) => console.log("SIDFEL", e.message));
  await p.goto(`http://127.0.0.1:${port}/_r2-yta.html?${qs}`);
  await p.waitForFunction(() => window.klar, null, { timeout: 90000 });
  const d = await p.evaluate(() => document.getElementById("c").toDataURL("image/png").split(",")[1]);
  fs.writeFileSync(ut, Buffer.from(d, "base64"));
  await b.close();
  console.log("ok", ut);
} finally {
  vite?.kill();
  for (const f of [sida, konfig]) fs.rmSync(f, { force: true });
}
