import type { Material } from "three";
/** Opaka material utan alfaklippning ritas helt täckande även om GLB:n har opacity=0. */
export function materialAlpha(m: Pick<Material, "transparent" | "opacity" | "alphaTest">): number {
  return !m.transparent && m.alphaTest === 0 ? 1 : m.opacity;
}
