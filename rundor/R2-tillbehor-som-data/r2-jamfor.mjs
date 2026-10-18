// Jämför NYA fästsystemet (src/spel/tillbehor/) mot GAMLA tillbehorFaste.ts för alla 14 kroppar × 8 tillbehör (× färgvarianter).
// Gamla filen hämtas ur git (--bas <commit>, standard 0add6b2) och läggs tillfälligt som src/spel/_gammal.ts; allt städas efteråt.
// Förväntan: 0 oavsiktliga avvikelser. Kanin, katt, hund och fisk jämförs speglade i z (djuret vänds mot kameran); de avsiktliga
// ändringarna står i AVSIKT i mat/jamfor.html. Användning: node rundor/R2-tillbehor-som-data/r2-jamfor.mjs [--bas 0add6b2] [--ut /tmp/jamfor.json]
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const bas = arg("bas", "0add6b2");
const ut = arg("ut", "/tmp/r2-jamfor.json");
const hit = path.dirname(new URL(import.meta.url).pathname);
const gammal = path.join(repo, "src/spel/_gammal.ts");
const sida = path.join(repo, "_r2-jamfor.html");
const konfig = path.join(repo, "_r2-vite.config.mjs");
const port = 5400 + Math.floor(Math.random() * 400);
let vite;
try {
  fs.writeFileSync(gammal, execFileSync("git", ["show", `${bas}:src/spel/tillbehorFaste.ts`], { cwd: repo, encoding: "utf8" }));
  fs.copyFileSync(path.join(hit, "mat/jamfor.html"), sida);
  fs.writeFileSync(konfig, `export default { root: ".", server: { port: ${port}, host: "127.0.0.1", fs: { strict: false } }, publicDir: "public", logLevel: "error", optimizeDeps: { noDiscovery: true } };`);
  vite = spawn("node", ["node_modules/vite/bin/vite.js", "--config", "_r2-vite.config.mjs"], { cwd: repo, stdio: ["ignore", "ignore", "inherit"] });
  await new Promise((r) => setTimeout(r, 4000));
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await b.newPage();
  p.on("pageerror", (e) => console.log("SIDFEL", e.message));
  await p.goto(`http://127.0.0.1:${port}/_r2-jamfor.html`);
  await p.waitForFunction(() => window.klar, null, { timeout: 240000 });
  const res = await p.evaluate(() => window.RES);
  await b.close();
  fs.writeFileSync(ut, JSON.stringify(res, null, 1));
  const oavsiktliga = res.filter((x) => (x.fel || x.maxd > 1e-3) && !x.avsikt);
  const avsiktliga = res.filter((x) => x.avsikt && x.maxd > 1e-3);
  console.log(`fall ${res.length}, oavsiktliga avvikelser ${oavsiktliga.length}, avsiktliga ändringar ${avsiktliga.length}, störst oavsiktligt ${Math.max(0, ...res.filter((x) => !x.avsikt).map((x) => x.maxd)).toExponential(2)}`);
  for (const x of oavsiktliga.slice(0, 20)) console.log("  AVVIKER", x.k, x.id, x.farg, x.fel || x.maxd);
  process.exitCode = oavsiktliga.length ? 1 : 0;
} finally {
  vite?.kill();
  for (const f of [gammal, sida, konfig]) fs.rmSync(f, { force: true });
}
