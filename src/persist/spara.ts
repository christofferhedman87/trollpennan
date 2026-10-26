import { useMinne } from "../spel/minne.ts";

export type SparaData = {
  vaktardjur?: Record<string, number>;
  albumNiva?: Record<string, number>;
  solstjarnor?: number;
  stjarnor?: number;
  byggSidor?: string[];
};

function tal(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function matadAv(val: unknown): number {
  const n = tal(val);
  if (n !== null) return Math.max(0, n);
  if (val && typeof val === "object" && "matad" in val) {
    const m = tal(val.matad);
    if (m !== null) return Math.max(0, m);
  }
  return 0;
}

function vaktarKarta(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const ut: Record<string, number> = {};
  for (const [k, val] of Object.entries(raw)) ut[k] = matadAv(val);
  return ut;
}

type KroppPost = { niva?: string; favorit?: string };

/** 1 vid mött djur, 2 vid ovanlig eller favorit, 3 vid legendarisk. */
export function nivaAvKropp(post?: KroppPost | null): number {
  if (!post) return 0;
  if (post.niva === "legendarisk") return 3;
  if (post.niva === "ovanlig" || post.niva === "favorit" || Boolean(post.favorit)) return 2;
  return 1;
}

function albumKarta(): Record<string, number> {
  const s = useMinne.getState();
  const ut: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.albumNiva ?? {})) {
    if (typeof v === "number" && Number.isFinite(v)) ut[k] = Math.max(0, Math.min(3, Math.floor(v)));
  }
  for (const [id, post] of Object.entries(s.albumKropp ?? {})) {
    const n = Math.max(ut[id] ?? 0, nivaAvKropp(post));
    if (n > 0) ut[id] = Math.min(3, n);
  }
  return ut;
}

export function lasSparat(): SparaData {
  const s = useMinne.getState();
  return {
    vaktardjur: vaktarKarta(s.vaktardjur),
    albumNiva: albumKarta(),
    solstjarnor: s.solstjarnor ?? 0,
    stjarnor: s.stjarnor,
    byggSidor: s.byggSidor,
  };
}

export function lasAlbumNiva(djurTyp: string): number {
  return lasSparat().albumNiva?.[djurTyp] ?? 0;
}

export function sparaAlbumNiva(djurTyp: string, niva: number): number {
  const n = Math.max(1, Math.min(3, Math.floor(niva)));
  const nu = lasSparat().albumNiva ?? {};
  const max = Math.max(nu[djurTyp] ?? 0, n);
  useMinne.setState({ albumNiva: { ...nu, [djurTyp]: max } });
  return max;
}

export function lasVaktarSteg(id: string): number {
  return matadAv(useMinne.getState().vaktardjur?.[id]);
}

export function sparaVaktarSteg(id: string, steg: number): number {
  const n = Math.max(0, Math.floor(steg));
  const forra = useMinne.getState().vaktardjur ?? {};
  useMinne.setState({
    vaktardjur: { ...forra, [id]: { matad: n, vackt: n >= 3 } },
  });
  return n;
}

export function sparaStjarnor(delta: number): void {
  useMinne.getState().geStjarnor(delta);
  const nu = useMinne.getState();
  useMinne.setState({ solstjarnor: (nu.solstjarnor ?? 0) + delta });
}

export function lyssnaVaktar(fn: () => void): () => void {
  return useMinne.subscribe(fn);
}
