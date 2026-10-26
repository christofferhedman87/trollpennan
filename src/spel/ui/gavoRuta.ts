// R9K: rubriken i gåvorutan, "Vad vill du ge kaninen?", på ängen, gården och alla platser.
// Eget djur: djurets bestämda form ur data/ord.json (former[1]), hittat på ängen, gården eller vilken plats som helst.
// Vilt djur: dess namn i data/vilda-djur.json. Inget mellanslag före frågetecknet om namnet saknas.
import { VILDA } from "../aventyr.ts";
import type { Sparad } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { djurMedUid } from "../liv.ts";
import { useMinne } from "../minne.ts";
import ordJson from "../../../data/ord.json" with { type: "json" };

/** Bestämd form (former[1]) per kropp ur data/ord.json, byggd en gång: ordets id först, annars ordet vars `del.kropp` det är
 *  ("räv" har kroppen "rav"). Samma uppslag som bestamdAv i hjalp.ts. */
type OrdRad = { id?: string; former?: string[]; del?: { kropp?: string } };
const ORDEN = (ordJson as { ord: OrdRad[] }).ord;
const BESTAMD = new Map<string, string>();
for (const o of ORDEN) if (o.id && o.former?.[1] && !BESTAMD.has(o.id)) BESTAMD.set(o.id, o.former[1]);
for (const o of ORDEN) if (o.del?.kropp && o.former?.[1] && !BESTAMD.has(o.del.kropp)) BESTAMD.set(o.del.kropp, o.former[1]);

/** Namnet på den som får gåvan (`gavaTill` = "egen:<uid>" eller ett vilt djurs id). "" om det inte går att hitta. */
export function gavoNamn(gavaTill: string, s: Parameters<typeof djurMedUid>[0] = useMinne.getState()): string {
  if (gavaTill.startsWith("egen:")) {
    const d = djurMedUid(s, gavaTill.slice(5));
    if (d?.smeknamn?.trim()) return d.smeknamn.trim();
    return d ? (BESTAMD.get(d.kropp) ?? d.formel) : "";
  }
  return VILDA.djur.find((d) => d.id === gavaTill)?.namn ?? "";
}

const DOP_RE = /^(?:döp\s+(?:([a-zåäö]+)\s+)?till|kalla\s+(?:([a-zåäö]+)\s+)?för|([a-zåäö]+)\s+heter|heter)\s+([a-zåäöA-ZÅÄÖ]{2,20})[.!?]*$/i;
const BORJAR_MED_DJUR = /^(?:en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio)\s/i;

function kroppForOrd(ord: string): string | undefined {
  const w = ord.toLocaleLowerCase("sv");
  if (BESTAMD.has(w)) return w;
  for (const [kropp, best] of BESTAMD) if (best.toLocaleLowerCase("sv") === w) return kropp;
  return undefined;
}

function hittaPaKropp(ord: string): Sparad | undefined {
  const s = useMinne.getState();
  const kropp = kroppForOrd(ord);
  const w = ord.toLocaleLowerCase("sv");
  const passar = (d: Sparad) => d.kropp === kropp || d.kropp === w || (BESTAMD.get(d.kropp) ?? "").toLocaleLowerCase("sv") === w;
  const plats = !s.plats || s.plats === "ang" ? s.ang : (s.platsSkapelser[s.plats] ?? []);
  return [...plats].reverse().find(passar) ?? [...s.ang].reverse().find(passar) ?? Object.values(s.platsSkapelser).flat().reverse().find(passar) ?? [...s.hemma.map((h) => h.spec)].reverse().find(passar) ?? [...s.sovande].reverse().find(passar) ?? [...s.stall].reverse().find(passar);
}

function senasteDjur(): Sparad | undefined {
  const s = useMinne.getState();
  const plats = !s.plats || s.plats === "ang" ? s.ang : (s.platsSkapelser[s.plats] ?? []);
  return plats.at(-1) ?? s.ang.at(-1) ?? s.hemma.at(-1)?.spec;
}

/** "döp katten till Misse", "kalla för Rufus" eller "heter Misse" — inte en skapelsemening. */
export function forsokDopaText(trim: string, gavaRefUid?: string | null): { djur: Sparad; namn: string } | null {
  const text = trim.trim();
  if (!text || BORJAR_MED_DJUR.test(text)) return null;
  const m = DOP_RE.exec(text);
  const namnRaw = m?.[4];
  if (!m || !namnRaw) return null;
  const ord = m[1] || m[2] || m[3];
  const s = useMinne.getState();
  const viaUid = gavaRefUid ? (djurMedUid(s, gavaRefUid) ?? s.sovande.find((d) => d.uid === gavaRefUid) ?? s.stall.find((d) => d.uid === gavaRefUid)) : undefined;
  const mal = viaUid ?? (ord ? hittaPaKropp(ord) : undefined) ?? (ord ? undefined : senasteDjur());
  if (!mal) return null;
  const upp = useMinne.getState().bytSmeknamn(mal.uid, namnRaw);
  if (!upp?.smeknamn) return null;
  return { djur: upp, namn: upp.smeknamn };
}

/** Gåvorutans fråga med namnet ifyllt; tomt namn ger "Vad vill du ge?" utan mellanslag före tecknet. */
export function gavoRuta(gavaTill: string, s?: Parameters<typeof djurMedUid>[0]): string {
  return fyll(VILDA.regler.ruta, { namn: gavoNamn(gavaTill, s) })
    .replace(/\s+([?!.,])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
