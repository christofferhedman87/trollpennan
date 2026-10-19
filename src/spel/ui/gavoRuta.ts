// R9K: rubriken i gåvorutan, "Vad vill du ge kaninen?", på ängen, gården och alla platser.
// Eget djur: djurets bestämda form ur data/ord.json (former[1]), hittat på ängen, gården eller vilken plats som helst.
// Vilt djur: dess namn i data/vilda-djur.json. Inget mellanslag före frågetecknet om namnet saknas.
import { VILDA } from "../aventyr.ts";
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
    return d ? (BESTAMD.get(d.kropp) ?? d.formel) : "";
  }
  return VILDA.djur.find((d) => d.id === gavaTill)?.namn ?? "";
}

/** Gåvorutans fråga med namnet ifyllt; tomt namn ger "Vad vill du ge?" utan mellanslag före tecknet. */
export function gavoRuta(gavaTill: string, s?: Parameters<typeof djurMedUid>[0]): string {
  return fyll(VILDA.regler.ruta, { namn: gavoNamn(gavaTill, s) })
    .replace(/\s+([?!.,])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
