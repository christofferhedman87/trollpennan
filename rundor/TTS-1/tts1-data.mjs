// TTS-1: lägger src/spel/rost.test.ts i package.json test:product (idempotent, oberoende av andra rundor) och skriver om
//   LICENSES.md med avsnittet "Röster och tal" (scripts/modell-inlagg.mjs licenser läser data/rost.json `licens`).
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
const t = p.scripts["test:product"];
if (!t.includes("src/spel/rost.test.ts")) {
  p.scripts["test:product"] = `${t} src/spel/rost.test.ts`;
  fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
  console.log("package.json: rost.test.ts tillagd i test:product");
}
execFileSync(process.execPath, ["scripts/modell-inlagg.mjs", "licenser"], { stdio: "inherit" });
if (!fs.readFileSync("LICENSES.md", "utf8").includes("## Röster och tal")) {
  console.error("VARNING: LICENSES.md saknar Röster och tal");
  process.exit(1);
}
console.log("LICENSES.md: Röster och tal ok");
