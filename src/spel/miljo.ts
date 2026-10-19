// R8: utseendet på ängen läses ur data/miljo.json (ljus, himmel, dis, färggrad, mark, kvalitet). Ingen färg eller siffra ska hårdkodas i scenen.
import miljoJson from "../../data/miljo.json" with { type: "json" };

export type Miljo = typeof miljoJson;

function slaIhop<T>(bas: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over) || !bas || typeof bas !== "object" || Array.isArray(bas)) return (over === undefined ? bas : (over as T)) ?? bas;
  const ut: Record<string, unknown> = { ...(bas as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) ut[k] = slaIhop((bas as Record<string, unknown>)[k], v);
  return ut as T;
}

function lasOver(): unknown {
  try {
    return typeof localStorage === "undefined" ? undefined : JSON.parse(localStorage.getItem("trollpennan-miljo") ?? "null");
  } catch {
    return undefined;
  }
}

export const MILJO: Miljo = slaIhop(miljoJson, lasOver());

export function kvalitetsniva(): "hog" | "lag" {
  if (typeof location !== "undefined") {
    const q = new URLSearchParams(location.search).get("kvalitet");
    if (q === "lag" || q === "hog") return q;
  }
  if (typeof navigator === "undefined") return "hog";
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 3 ? "lag" : "hog";
}

export const KV = MILJO.kvalitet[kvalitetsniva()];

/** Marktexturen ritas en gång på en liten canvas (fläckar och gräsprickar) och upprepas över marken. */
export function markTextur(THREE: typeof import("three")): import("three").Texture | null {
  if (typeof document === "undefined") return null;
  const m = MILJO.mark;
  const n = m.storlek;
  const c = document.createElement("canvas");
  c.width = n;
  c.height = n;
  const x = c.getContext("2d");
  if (!x) return null;
  let frö = 7;
  const slump = () => ((frö = (frö * 16807) % 2147483647) - 1) / 2147483646;
  x.fillStyle = m.farger[0] ?? "#ffffff";
  x.fillRect(0, 0, n, n);
  for (let i = 0; i < m.flackar; i++) {
    x.fillStyle = m.farger[Math.floor(slump() * m.farger.length)] ?? "#ffffff";
    const r = n * (0.03 + slump() * 0.06);
    // ritas även vid kanterna så att texturen går att upprepa utan skarvar
    const cx = slump() * n;
    const cy = slump() * n;
    for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) x.fillRect(cx + dx, cy + dy, r, r);
  }
  x.fillStyle = m.tuvfarg;
  for (let i = 0; i < m.tuvor; i++) {
    const cx = slump() * n;
    const cy = slump() * n;
    for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) x.fillRect(cx + dx, cy + dy, Math.max(1, n / 64), Math.max(2, n / 32));
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(m.upprepa, m.upprepa);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (m.filter === "pixel") {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapLinearFilter;
  }
  return t;
}

/** B1.3b: miljön för en plats = data/miljo.json överlagrad med platsens `miljo` (data/platser.json).
 * `ljus.skala` multiplicerar alla ljusstyrkor; `mark.grundfarg` är markens färg (saknas = vit, som ängen). */
export function miljoFor(over: Record<string, unknown> | undefined): { miljo: Miljo; ljusSkala: number; mark: string } {
  const miljo = slaIhop(MILJO, over ?? {});
  const l = (over?.ljus ?? {}) as { skala?: unknown };
  const m = (over?.mark ?? {}) as { grundfarg?: unknown };
  return {
    miljo,
    ljusSkala: typeof l.skala === "number" && l.skala > 0 ? l.skala : 1,
    mark: typeof m.grundfarg === "string" ? m.grundfarg : "#ffffff",
  };
}
