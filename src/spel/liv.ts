import byggJson from "../../data/bygg.json" with { type: "json" };
import dygnJson from "../../data/dygn.json" with { type: "json" };
import gavorJson from "../../data/gavor.json" with { type: "json" };
import humorJson from "../../data/humor.json" with { type: "json" };
import mossaJson from "../../data/mossa.json" with { type: "json" };
import albumJson from "../../data/album.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import skatterJson from "../../data/skatter.json" with { type: "json" };
import vildaJson from "../../data/vilda-djur.json" with { type: "json" };
import type { ByggeTolk } from "../tolk/byggtolk.ts";
import { arSparrat } from "../tolk/sparr.ts";
import { GAVOR } from "../tolk/gavotolk.ts";
import type { Sparad } from "./brygga.ts";
import type { Varelse } from "../tolk/typer.ts";
import { djurIds } from "./entiteter.ts";
import { taggarAv } from "./taggar.ts";
import { useMinne, type Data } from "./minne.ts";

export const DYGN = dygnJson;
export const HUMOR = humorJson;
export const MOSSA = mossaJson;
export const ALBUM = albumJson;

export const KROPPAR = djurIds();
export const VILDA_ID = (vildaJson as unknown as { djur: { id: string; namn: string; omrade: string }[] }).djur;
export const SKATTER = (skatterJson as { skatter: { id: string; namn: string; text: string }[] }).skatter;
const BYGG_LISTA = (byggJson as { bygg_ord: { id: string; typ: string; sida?: string }[] }).bygg_ord;
const MATERIAL = (byggJson as { material?: { id: string; sida?: string }[] }).material ?? [];

export const BYGG_ORD = BYGG_LISTA;
const DAG_MS = DYGN.langd_minuter.dag * 60 * 1000;
const KVALL_MS = DYGN.langd_minuter.kvall * 60 * 1000;
export const CYKEL_MS = DAG_MS + KVALL_MS;
const OVERGANG_MS = DYGN.overgang_sekunder * 1000;

const GAVA_TAGGAR = [...new Set((gavorJson as { gavor: { taggar: string[] }[] }).gavor.flatMap((g) => g.taggar))];
const FORLED = Object.keys((ordJson as { sammansattningar: { forled: Record<string, unknown> } }).sammansattningar.forled);

/** R9K: ikonen per humör står i data/humor.json (`ikon`). Ett humör utan ikon visar ingen. */
export const HUMOR_IKON: Record<string, string> = Object.fromEntries(
  (HUMOR.humor as { id: string; ikon?: string }[]).filter((h) => h.ikon).map((h) => [h.id, h.ikon!]),
);

export type Liv = {
  humor: string;
  humorMs: number;
  humorLangd: number;
  favorit: string;
  favoritHittad: boolean;
  hjartan: number;
};

export type Foto = { id: string; formel: string; kropp: string; niva: string; poang: number };
export type MossaPost = { id: string; klar: boolean };
export type KroppMinn = { formel: string; poang: number; niva: string; favorit?: string; hjartan: number };

export type Handelse = {
  taggar?: Set<string>;
  antal?: number;
  sammansatt?: boolean;
  byggen?: ByggeTolk[];
  gavaTaggar?: string[];
  favorit?: boolean;
  onskan?: number;
  hemligt?: number;
  guld?: number;
  aventyr?: boolean;
  foto?: boolean;
  poang?: number;
};

type Mal = {
  tagg?: string;
  antal_min?: number;
  sammansattning?: boolean;
  bygg?: string[];
  del_min?: Record<string, number>;
  material?: string[];
  typ?: string[];
  gava?: boolean;
  gava_tagg?: string;
  favorit?: boolean;
  onskan?: number;
  hemligt_ord?: number;
  guldord?: number;
  aventyr?: boolean;
  foto?: boolean;
  sallsynthet_min?: string;
};

const NIVA_ORD = ["vanlig", "ovanlig", "sallsynt", "legendarisk"];

export function nyttLiv(nu: number): Liv {
  const humor = HUMOR.humor[Math.floor(Math.random() * HUMOR.humor.length)]!.id;
  return {
    humor,
    humorMs: nu,
    humorLangd: 60_000 + Math.floor(Math.random() * 120_000),
    favorit: GAVA_TAGGAR[Math.floor(Math.random() * GAVA_TAGGAR.length)] ?? "sott",
    favoritHittad: false,
    hjartan: 0,
  };
}

export function fasAv(ms: number): "dag" | "kvall" {
  return ms % CYKEL_MS < DAG_MS ? "dag" : "kvall";
}

export function dagIndex(ms: number): number {
  return Math.floor(ms / CYKEL_MS);
}

/** 0 = dag, 1 = kväll. Mjuk övergång de första och sista sekunderna. */
export function kvallStyrka(ms: number): number {
  const t = ms % CYKEL_MS;
  if (t < DAG_MS - OVERGANG_MS) return 0;
  if (t < DAG_MS) return (t - (DAG_MS - OVERGANG_MS)) / OVERGANG_MS;
  if (t < DAG_MS + KVALL_MS - OVERGANG_MS) return 1;
  return 1 - (t - (DAG_MS + KVALL_MS - OVERGANG_MS)) / OVERGANG_MS;
}

export function poangAv(v: Varelse): number {
  let p = 0;
  if (v.farg) p += 1;
  if (v.monster) p += 1;
  p += v.formagor.length;
  p += v.tillbehor.length;
  if (v.skala >= 1.3 || v.skala <= 0.75) p += 1;
  if (v.glans) p += 1;
  if (v.alpha <= 0.6) p += 1;
  return p;
}

export function nivaAv(poang: number): { id: string; namn: string; form: string; stjarnor: number } {
  let vald = ALBUM.sallsynthet.nivaer[0]!;
  for (const n of ALBUM.sallsynthet.nivaer) if (poang >= n.min) vald = n;
  return vald;
}

export function arSammansatt(formel: string): boolean {
  const ord = formel.toLocaleLowerCase("sv").split(/\s+/);
  return ord.some((w) => FORLED.some((l) => w.startsWith(l) && w.length > l.length + 1));
}

function byggTyp(id: string): string {
  return BYGG_ORD.find((b) => b.id === id)?.typ ?? "";
}

export function mossaTraff(id: string, h: Handelse): boolean {
  const upp = MOSSA.uppdrag.find((u) => u.id === id);
  if (!upp) return false;
  const m = upp.mal as Mal;
  if (m.tagg) {
    if (!h.taggar?.has(m.tagg)) return false;
  }
  if (m.antal_min != null && (h.antal ?? 0) < m.antal_min && !byggAntal(h, m)) return false;
  if (m.antal_min != null && m.bygg && !byggAntal(h, m)) return false;
  if (m.sammansattning && !h.sammansatt) return false;
  if (m.bygg && !m.antal_min) {
    if (!h.byggen?.some((b) => m.bygg!.includes(b.bygg))) return false;
  }
  if (m.del_min) {
    const ok = h.byggen?.some((b) => {
      if (m.bygg && !m.bygg.includes(b.bygg)) return false;
      return Object.entries(m.del_min!).every(([del, n]) => (b.delar.find((d) => d.del === del)?.antal ?? 0) >= n);
    });
    if (!ok) return false;
  }
  if (m.material) {
    if (!h.byggen?.some((b) => b.material && m.material!.includes(b.material))) return false;
  }
  if (m.typ) {
    if (!h.byggen?.some((b) => m.typ!.includes(byggTyp(b.bygg)))) return false;
  }
  if (m.gava && !(h.gavaTaggar && h.gavaTaggar.length)) return false;
  if (m.gava_tagg && !h.gavaTaggar?.includes(m.gava_tagg)) return false;
  if (m.favorit && !h.favorit) return false;
  if (m.onskan != null && (h.onskan ?? 0) < m.onskan) return false;
  if (m.hemligt_ord != null && (h.hemligt ?? 0) < m.hemligt_ord) return false;
  if (m.guldord != null && (h.guld ?? 0) < m.guldord) return false;
  if (m.aventyr && !h.aventyr) return false;
  if (m.foto && !h.foto) return false;
  if (m.sallsynthet_min) {
    const behov = NIVA_ORD.indexOf(m.sallsynthet_min);
    const har = nivaAv(h.poang ?? 0).id;
    if (NIVA_ORD.indexOf(har) < behov) return false;
  }
  return true;
}

function byggAntal(h: Handelse, m: Mal): boolean {
  if (!m.bygg || m.antal_min == null) return false;
  const sum = (h.byggen ?? []).filter((b) => m.bygg!.includes(b.bygg)).reduce((s, b) => s + b.antal, 0);
  return sum >= m.antal_min;
}

export function garAttGora(id: string, s: Data): boolean {
  const upp = MOSSA.uppdrag.find((u) => u.id === id);
  if (!upp) return false;
  const djur = [...s.ang, ...s.hemma.map((h) => h.spec)];
  if (id === "djur-gris" && djur.some((d) => d.kropp === "gris")) return false;
  if ((upp.typ === "ge" || upp.typ === "aventyr" || (upp.typ === "album" && id === "foto")) && !djur.length) return false;
  if (id === "ge-favorit" && !djur.some((d) => s.liv[d.uid] && !s.liv[d.uid]!.favoritHittad)) return false;
  if (id === "hemligt-ord") {
    const fritt = (ordJson as { ord: { id: string; niva: string }[] }).ord.filter((o) => o.niva === "fritt");
    if (fritt.every((o) => s.funna[o.id])) return false;
  }
  if (upp.typ === "bygg") {
    const m = upp.mal as Mal;
    const oppe = (byggId: string) => {
      const b = BYGG_LISTA.find((x) => x.id === byggId);
      return !!b && s.byggSidor.includes(b.sida ?? "start");
    };
    if (m.bygg && !m.bygg.some(oppe)) return false;
    if (m.typ && !BYGG_LISTA.some((b) => m.typ!.includes(b.typ) && s.byggSidor.includes(b.sida ?? "start"))) return false;
    if (m.material && !m.material.some((mid) => s.byggSidor.includes(MATERIAL.find((x) => x.id === mid)?.sida ?? "start"))) return false;
  }
  return true;
}

export function fyllMossa(s: Data): MossaPost[] {
  const kvar = s.mossaLista.filter((p) => !p.klar);
  const använda = new Set(kvar.map((p) => p.id));
  const kandidater = MOSSA.uppdrag.map((u) => u.id).filter((id) => !använda.has(id) && garAttGora(id, s));
  const bland = [...kandidater].sort(() => Math.random() - 0.5);
  const ut = [...kvar];
  for (const id of bland) {
    if (ut.length >= 3) break;
    ut.push({ id, klar: false });
  }
  return ut.slice(0, 3);
}

/** R9J: djuret med uid på ängen, gården eller någon plats (platsSkapelser). */
export function djurMedUid(s: Pick<Data, "ang" | "hemma" | "platsSkapelser">, uid: string): Sparad | undefined {
  return (
    s.ang.find((a) => a.uid === uid) ??
    s.hemma.find((h) => h.spec.uid === uid)?.spec ??
    Object.values(s.platsSkapelser ?? {})
      .flat()
      .find((a) => a.uid === uid)
  );
}

export function tickLiv(s: Data, ms: number): Partial<Data> {
  const dygnMs = s.dygnMs + ms;
  const liv = { ...s.liv };
  // R9J: humöret lever på alla platser (ängen, gården och varje plats i platsSkapelser), inte bara ängen.
  const uids = [...s.ang.map((a) => a.uid), ...s.hemma.map((h) => h.spec.uid), ...Object.values(s.platsSkapelser ?? {}).flatMap((l) => l.map((a) => a.uid))];
  for (const uid of uids) {
    const har = liv[uid] ?? nyttLiv(dygnMs);
    if (dygnMs >= har.humorMs + har.humorLangd) {
      const nasta = HUMOR.humor[Math.floor(Math.random() * HUMOR.humor.length)]!.id;
      liv[uid] = { ...har, humor: nasta, humorMs: dygnMs, humorLangd: 60_000 + Math.floor(Math.random() * 120_000) };
    } else liv[uid] = har;
  }
  let mossaLista = s.mossaLista;
  let mossaDag = s.mossaDag;
  let mossaExtra = s.mossaExtra;
  let mossaRakn = s.mossaRakn;
  const dag = dagIndex(dygnMs);
  if (!mossaLista.length || dag !== mossaDag) {
    const bas = dag !== mossaDag ? { ...s, mossaLista: s.mossaLista.filter((p) => !p.klar), liv } : { ...s, liv };
    mossaLista = fyllMossa(bas as Data);
    if (dag !== mossaDag) {
      mossaDag = dag;
      mossaExtra = false;
      mossaRakn = { onskan: 0, hemligt: 0, guld: 0 };
    }
  }
  return { dygnMs, liv, mossaLista, mossaDag, mossaExtra, mossaRakn };
}

export function hoppaTill(s: Data, ms: number): Partial<Data> {
  return tickLiv({ ...s, dygnMs: 0, mossaDag: -1 }, ms);
}

export function replikHumor(id: string): string {
  const h = HUMOR.humor.find((x) => x.id === id) ?? HUMOR.humor[0]!;
  return h.repliker[Math.floor(Math.random() * h.repliker.length)] ?? h.repliker[0]!;
}

export function sovRad(): string {
  const l = DYGN.texter.sover;
  return l[Math.floor(Math.random() * l.length)] ?? l[0]!;
}

export function vackRad(): string {
  const l = DYGN.texter.vacks_pa_kvallen;
  return l[Math.floor(Math.random() * l.length)] ?? l[0]!;
}

export function ugglaRad(): string {
  const l = DYGN.texter.uggla_kvall;
  return l[Math.floor(Math.random() * l.length)] ?? l[0]!;
}

function raknaOrd(text: string, frek: Record<string, number>): Record<string, number> {
  const ut = { ...frek };
  for (const w of text.toLocaleLowerCase("sv").split(/[^a-zåäö0-9]+/i)) {
    if (w.length < 2 || arSparrat(w)) continue;
    ut[w] = (ut[w] ?? 0) + 1;
  }
  return ut;
}

export function noteraSkriv(text: string) {
  const s = useMinne.getState();
  useMinne.setState({ ordFrek: raknaOrd(text, s.ordFrek) });
}

export function komIhagDjur(v: Varelse & { uid: string }): string | null {
  const s = useMinne.getState();
  const poang = poangAv(v);
  const niva = nivaAv(poang);
  const liv = s.liv[v.uid] ?? nyttLiv(s.dygnMs);
  const fore = s.albumKropp[v.kropp];
  const bast =
    !fore || poang >= fore.poang
      ? { formel: v.formel, poang, niva: niva.id, favorit: fore?.favorit, hjartan: Math.max(fore?.hjartan ?? 0, liv.hjartan) }
      : fore;
  const sedda = new Set(s.seddaNiva);
  let ny: string | null = null;
  if (!sedda.has(niva.id) && niva.id !== "vanlig") {
    sedda.add(niva.id);
    ny = niva.form;
  }
  if (!s.liv[v.uid]) useMinne.setState({ liv: { ...s.liv, [v.uid]: liv } });
  if (v.kropp === "agg") return null; // ordägget har liv men är ingen albumkropp
  useMinne.setState({
    albumKropp: { ...useMinne.getState().albumKropp, [v.kropp]: bast },
    seddaNiva: [...sedda],
  });
  return ny;
}

export function geHjarta(uid: string) {
  const s = useMinne.getState();
  const liv = s.liv[uid] ?? nyttLiv(s.dygnMs);
  const hj = Math.min(5, liv.hjartan + 1);
  const nasta = { ...liv, hjartan: hj, humor: "glad", humorMs: s.dygnMs, humorLangd: 90_000 };
  const djur = s.ang.find((a) => a.uid === uid) ?? s.hemma.find((h) => h.spec.uid === uid)?.spec;
  const album = { ...s.albumKropp };
  if (djur && album[djur.kropp]) album[djur.kropp] = { ...album[djur.kropp]!, hjartan: Math.max(album[djur.kropp]!.hjartan, hj) };
  useMinne.setState({ liv: { ...s.liv, [uid]: nasta }, albumKropp: album });
}

export function oppnaMossaLista() {
  const s = useMinne.getState();
  if (s.mossaLista.length >= 1) return;
  useMinne.setState({ mossaLista: fyllMossa(s), mossaDag: dagIndex(s.dygnMs) });
}

export function mossaKlara(h: Handelse): { texter: string[]; stj: number } {
  const s = useMinne.getState();
  let lista = s.mossaLista.length ? s.mossaLista : fyllMossa(s);
  const texter: string[] = [];
  let stj = 0;
  let andra = false;
  lista = lista.map((p) => {
    if (p.klar || !mossaTraff(p.id, h)) return p;
    andra = true;
    stj += MOSSA.beloning.per_uppdrag;
    const rad = MOSSA.klart[Math.floor(Math.random() * MOSSA.klart.length)] ?? MOSSA.klart[0]!;
    texter.push(rad);
    return { ...p, klar: true };
  });
  let extra = s.mossaExtra;
  if (lista.length === 3 && lista.every((p) => p.klar) && !extra) {
    extra = true;
    stj += MOSSA.beloning.alla_tre;
    texter.push(MOSSA.alla_klara);
  }
  if (andra || !s.mossaLista.length) useMinne.setState({ mossaLista: lista, mossaExtra: extra, mossaDag: dagIndex(s.dygnMs) });
  return { texter, stj };
}

export function taggarFor(v: Varelse): Set<string> {
  const t = taggarAv(v, true);
  if (v.farg) t.add("farg");
  return t;
}

let visning = 0;
let visStart = false;

export function visningsTid(): number {
  if (!visStart) {
    visning = useMinne.getState().dygnMs;
    visStart = true;
  }
  return visning;
}

export function framDygn(ms: number) {
  visning = visningsTid() + Math.max(0, ms);
}

export function synkaVisning(ms: number) {
  visning = ms;
  visStart = true;
}

export function hoppaKvall() {
  const dag = dagIndex(visningsTid());
  const ms = dag * CYKEL_MS + DAG_MS + 25_000;
  synkaVisning(ms);
  useMinne.setState({ dygnMs: ms });
}

export function hoppaDag() {
  const dag = dagIndex(visningsTid());
  const ms = dag * CYKEL_MS + 20_000;
  synkaVisning(ms);
  useMinne.setState({ dygnMs: ms });
}

export function mossaHand(h: Handelse): { texter: string[]; stj: number } {
  const s = useMinne.getState();
  const rakn = {
    onskan: s.mossaRakn.onskan + (h.onskan ?? 0),
    hemligt: s.mossaRakn.hemligt + (h.hemligt ?? 0),
    guld: s.mossaRakn.guld + (h.guld ?? 0),
  };
  useMinne.setState({ mossaRakn: rakn });
  return mossaKlara({
    ...h,
    onskan: h.onskan != null ? rakn.onskan : undefined,
    hemligt: h.hemligt != null ? rakn.hemligt : undefined,
    guld: h.guld != null ? rakn.guld : undefined,
  });
}

export function gavaOrd(tagg: string): string {
  return GAVOR.gavor.find((g) => g.taggar.includes(tagg))?.former[0] ?? tagg;
}

export function geEgenGava(uid: string, taggar: string[]): { text: string; favorit: boolean } {
  const s = useMinne.getState();
  const liv = { ...(s.liv[uid] ?? nyttLiv(s.dygnMs)) };
  const favorit = taggar.includes(liv.favorit);
  if (favorit) liv.favoritHittad = true;
  const djur = s.ang.find((a) => a.uid === uid) ?? s.hemma.find((h) => h.spec.uid === uid)?.spec;
  const album = { ...s.albumKropp };
  if (favorit && djur && album[djur.kropp]) album[djur.kropp] = { ...album[djur.kropp]!, favorit: liv.favorit };
  useMinne.setState({ liv: { ...s.liv, [uid]: liv }, albumKropp: album });
  geHjarta(uid);
  const lista = favorit ? HUMOR.favorit_text : HUMOR.tack_text;
  const text = lista[Math.floor(Math.random() * lista.length)] ?? lista[0]!;
  return { text, favorit };
}

export function inbjudanAv(uid: string): string | null {
  const id = useMinne.getState().liv[uid]?.humor;
  return HUMOR.humor.find((h) => h.id === id)?.inbjudan ?? null;
}

const gavoFragat = new Set<string>();
/** R9I (Christoffers beslut): ett djur som bjuder in till gåva ("sugen") öppnar gåvorutan bara vid FÖRSTA trycket
 *  per djur och spelomgång. Senare tryck ger vanlig djurreplik och "Till stallet". */
export function gavoInbjudanVidTryck(uid: string): boolean {
  if (inbjudanAv(uid) !== "gava" || gavoFragat.has(uid)) return false;
  gavoFragat.add(uid);
  return true;
}

export function sparaFoto(v: Sparad): string {
  const s = useMinne.getState();
  if (s.foton.length >= 60) return ALBUM.texter.full;
  const poang = poangAv(v);
  const niva = nivaAv(poang);
  useMinne.setState({
    foton: [...s.foton, { id: crypto.randomUUID(), formel: v.formel, kropp: v.kropp, niva: niva.id, poang }],
  });
  return ALBUM.texter.foto_klart;
}

export function taBortFoto(id: string) {
  const s = useMinne.getState();
  useMinne.setState({ foton: s.foton.filter((f) => f.id !== id) });
}

export function ordRader(frek: Record<string, number>): string[] {
  return Object.entries(frek)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "sv"))
    .map(([w]) => w);
}

export function sovText(): string {
  return DYGN.texter.sover[0] ?? "Zzz";
}
