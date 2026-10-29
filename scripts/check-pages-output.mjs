import { existsSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, extname } from "node:path";
const root = "dist-pages";
if (!existsSync(join(root, "index.html"))) throw new Error("Kör build:pages först.");
let count = 0; let bytes = 0;
function visit(dir) {
 for (const name of readdirSync(dir)) {
  const file = join(dir, name); const s = statSync(file);
  if (s.isDirectory()) { if (["node_modules", ".git"].includes(name)) throw new Error("Otillåten katalog: " + file); visit(file); continue; }
  if (extname(file) === ".md") { rmSync(file); continue; }
  if ([".ts", ".tsx", ".map", ".env", ".pem"].includes(extname(file))) throw new Error("Otillåten fil: " + file);
  if (s.size > 25 * 1024 * 1024) throw new Error("För stor fil: " + file);
  count++; bytes += s.size;
 }
}
visit(root);
// Spelet publiceras som Cloudflare Worker med statiska tillgångar (wrangler.jsonc). Gränsen där är 20 000 filer per
// version på gratisplanen (25 MiB per fil, kontrolleras ovan). Den gamla gränsen 1 000 gällde drag-and-drop och fick bygget att alltid falla.
const MAX_FILER = 20000;
if (count > MAX_FILER) throw new Error(`För många filer för Cloudflare (${count} > ${MAX_FILER}).`);
console.log(JSON.stringify({ status: "BUILD_OUTPUT_CHECKED", files: count, bytes }));
