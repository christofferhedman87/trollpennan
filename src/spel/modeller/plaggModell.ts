import { arPlagg, modellUrl as modellUrlAv } from "../entiteter.ts";

/** `"mössa"` och `"tröja"` pekar på samma GLB-rader som `alvmossa` och `troja`. */
export function normaliseraPlaggId(id: string): string {
  if (id === "mössa") return "alvmossa";
  if (id === "tröja") return "troja";
  return id;
}

/** Värmeplagg från blockserie F, annars den vanliga plaggmodellen. */
export function plaggModellUrl(id: string): string | null {
  if (id === "mossa" || id === "mössa" || id === "alvmossa") return "/models/bulk/f-mossa-vinter-cc0.glb";
  if (id === "luva") return "/models/bulk/f-mossa-toppluva-cc0.glb";
  if (id === "halsduk") return "/models/bulk/f-halsduk-cc0.glb";
  if (id === "filt") return "/models/bulk/f-filt-draperad-cc0.glb";
  if (id === "troja" || id === "tröja") return modellUrlAv("troja");
  return arPlagg(id) ? modellUrlAv(id) : null;
}

