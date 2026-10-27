export type NdcPunkt = { x: number; y: number; z: number };
export type SkarmPunkt = { x: number; y: number };

/** Håller skyltknappens mitt inom porträttytan, med minst halva träffytan från kanten. */
export function begransaVagvisarePunkt(punkt: SkarmPunkt, width: number, height: number, minTraffyta = 44): SkarmPunkt {
  const halv = Math.max(22, minTraffyta / 2);
  const marginalX = halv + 8;
  const toppMarginal = Math.max(68, halv + 24);
  const bottenMarginal = Math.max(height * 0.36, halv + 16);
  return {
    x: Math.min(Math.max(punkt.x, marginalX), Math.max(marginalX, width - marginalX)),
    y: Math.min(Math.max(punkt.y, toppMarginal), Math.max(toppMarginal, height - bottenMarginal)),
  };
}

export const klammaVagvisarePunkt = begransaVagvisarePunkt;

/** NDC från kameran till CSS-pixlar. Null om punkten ligger utanför frustum. */
export function projiceraVagvisare(ndc: NdcPunkt, width: number, height: number): SkarmPunkt | null {
  if (width <= 0 || height <= 0 || ndc.z > 1 || ndc.z < -1 || Math.abs(ndc.x) > 1.02 || Math.abs(ndc.y) > 1.02) return null;
  const raX = (ndc.x * 0.5 + 0.5) * width;
  const raY = (-ndc.y * 0.5 + 0.5) * height;
  return begransaVagvisarePunkt({ x: raX, y: raY }, width, height);
}
