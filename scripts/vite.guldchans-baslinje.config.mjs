// Kör bara lokalt för ett rött regressionsprov. Ändrar inga repositoryfiler.
import original from "../vite.pages.config.ts";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
const root = fileURLToPath(new URL("../", import.meta.url));
const fil = fileURLToPath(new URL("../src/spel/styr/useSkriv.ts", import.meta.url));
const kod = execFileSync("git", ["show", "7d8393729291d2e9fd31eabc448a2899204b21a8:src/spel/styr/useSkriv.ts"], { cwd: root, encoding: "utf8" });
export default {
  ...original, root, cacheDir: join(tmpdir(), "trollpennan-guldchans-baslinje-vite"),
  plugins: [{ name: "guldchans-baslinje", enforce: "pre", load(id) { if (id.split("?")[0] === fil) return kod; } }, ...original.plugins],
  server: { host: "127.0.0.1", port: 4183, strictPort: true },
};
