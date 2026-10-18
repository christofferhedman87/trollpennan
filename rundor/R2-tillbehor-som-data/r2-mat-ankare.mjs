// Mäter GAMLA ankare (old ankareFor/procAnkare ur git, --bas <commit>) på de nio GLB-filerna och skriver mat/gammal-ankare.json.
// Det är indata till r2-skapa-fastpunkter.mjs. Körs bara om GLB-filerna eller gamla koden ändras; filen ligger redan incheckad.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const hit = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(hit, "../..");
const bas = arg("bas", "0add6b2");
const ut = arg("ut", path.join(hit, "mat/gammal-ankare.json"));
const gammal = path.join(repo, "src/spel/_gammal.ts");
const sida = path.join(repo, "_r2-mat.html");
const konfig = path.join(repo, "_r2-vite.config.mjs");
const port = 5400 + Math.floor(Math.random() * 400);
let vite;
try {
  fs.writeFileSync(gammal, execFileSync("git", ["show", `${bas}:src/spel/tillbehorFaste.ts`], { cwd: repo, encoding: "utf8" }));
  fs.copyFileSync(path.join(hit, "mat/harled.html"), sida);
  fs.writeFileSync(konfig, `export default { root: ".", server: { port: ${port}, host: "127.0.0.1", fs: { strict: false } }, publicDir: "public", logLevel: "error", optimizeDeps: { noDiscovery: true } };`);
  vite = spawn("node", ["node_modules/vite/bin/vite.js", "--config", "_r2-vite.config.mjs"], { cwd: repo, stdio: ["ignore", "ignore", "inherit"] });
  await new Promise((r) => setTimeout(r, 4000));
  const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${port}/_r2-mat.html`);
  await p.waitForFunction(() => window.klar, null, { timeout: 120000 });
  fs.writeFileSync(ut, JSON.stringify(await p.evaluate(() => window.RES), null, 1));
  await b.close();
  console.log("skrev", ut);
} finally {
  vite?.kill();
  for (const f of [gammal, sida, konfig]) fs.rmSync(f, { force: true });
}
