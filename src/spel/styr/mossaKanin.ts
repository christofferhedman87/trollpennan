// Värmeplagg på djuret som redan står på ängen, i stället för en dubblett.
import type { TillbehorSpec, Varelse } from "../../tolk/typer.ts";
import type { Sparad } from "../brygga.ts";
import { useMinne } from "../minne.ts";

const VARME_PLAGG_LISTA = ["alvmossa", "mossa", "mössa", "luva", "halsduk", "filt", "troja", "tröja"] as const;
const VARME_PLAGG = new Set<string>(VARME_PLAGG_LISTA);

/** Sant för mössa, luva, halsduk, filt och tröja, inklusive stavningsvarianterna. */
export function arVarmePlagg(id: string): boolean {
  return VARME_PLAGG.has(id);
}

/** `"mössa"` sitter som älvmössa och `"tröja"` som tröja-modellen. */
function normPlagg(id: string): string {
  if (id === "mössa") return "alvmossa";
  if (id === "tröja") return "troja";
  return id;
}

function harPlagg(d: { tillbehor: TillbehorSpec[] }, id: string): boolean {
  const ny = normPlagg(id);
  return d.tillbehor.some((t) => normPlagg(t.id) === ny);
}

/**
 * Fristående värmeplagg (`en mössa`, `en filt`, `en luva`, `en tröja`, `en halsduk`)
 * eller `en <djur> med <plagg>`: klä djuret som redan står på ängen.
 * null betyder att meningen ska skapa något nytt.
 */
export function mossaPaFrysKanin(v: Varelse): { uid: string; spec: Varelse } | null {
  const s = useMinne.getState();
  if (s.plats !== "ang") return null;
  const fristaende = arVarmePlagg(v.kropp);
  const plaggen = fristaende
    ? [normPlagg(v.kropp)]
    : [...new Set(v.tillbehor.filter((t) => arVarmePlagg(t.id)).map((t) => normPlagg(t.id)))];
  if (plaggen.length === 0) return null;
  const art = fristaende ? null : v.kropp;
  const saknar = (d: Sparad) => plaggen.some((id) => !harPlagg(d, id));
  const pool = s.ang.filter((d) => (art === null || d.kropp === art) && saknar(d));
  const fryser = s.uppdrag["kanin-fryser"] === "pagar" || s.ang.some((d) => s.liv[d.uid]?.humor === "fryser");
  if (fristaende && !fryser) return null;
  if (pool.length === 0) return null;
  const mal =
    pool.find((d) => s.liv[d.uid]?.humor === "fryser") ??
    (fristaende ? (pool.find((d) => d.kropp === "kanin") ?? pool[0]) : pool[0]);
  if (!mal) return null;
  const tillbehor = [...mal.tillbehor];
  for (const id of plaggen) {
    if (harPlagg({ tillbehor }, id)) continue;
    const kalla = fristaende ? null : v.tillbehor.find((t) => normPlagg(t.id) === id);
    tillbehor.push({ id, farg: fristaende ? v.farg : (kalla?.farg ?? null), glans: kalla?.glans ?? false });
  }
  if (!fristaende) {
    for (const t of v.tillbehor) {
      if (arVarmePlagg(t.id) || tillbehor.some((e) => e.id === t.id)) continue;
      tillbehor.push(t);
    }
  }
  const spec: Varelse = { ...mal, tillbehor };
  return { uid: mal.uid, spec };
}

/** Samma klädsel som `mossaPaFrysKanin`, för anrop som fortfarande säger kanin. */
export function mossaPaKanin(v: Varelse): { uid: string; spec: Varelse } | null {
  return mossaPaFrysKanin(v);
}

export const HJALP_UPPDRAG_IDS = new Set<string>([
  "kanin-fryser", "regn-skydd", "sol-skugga", "magen-kurrar", "regn-pa-nosen",
  "kalla-tassar", "trakig-eftermiddag", "ljus-i-kvallen", "redo-for-fest",
  "leriga-tassar", "dags-att-vila", "badlangtan", "over-backen", "skugga-at-djuret",
  "present-till-en-van", "hitta-till-picknicken", "skog-magen-kurrar", "skog-vila-benen",
  "skog-regnpaus", "skog-varm-van", "skog-kvallsljus", "skog-over-backen",
  "sjo-fruktpaus", "sjo-skugga-pa-stranden", "sjo-torr-overfart", "sjo-regn-vid-stranden",
  "sjo-lys-vid-vattnet", "grotta-forsta-skenet", "grotta-varma-oron", "grotta-mjuk-vila",
]);

const HJALP_SAKER = new Set<string>([
  ...VARME_PLAGG,
  "sol", "eld", "brasa", "kamin", "paraply", "parasoll", "tält", "hus", "koja", "grotta", "skjul", "paraplyhatt",
  "morot", "banan", "äpple", "bröd", "broccoli", "ost", "kaka", "bulle", "tårta", "jordgubbe", "päron", "apelsin", "druvor", "vattenmelon", "gräs",
  "basketboll", "boll", "fotboll", "bok", "trollbok", "sagobok", "skateboard", "nallebjörn", "tv", "gunga", "studsmatta", "cykel",
  "lykta", "golvlampa", "lampa", "ficklampa", "nattlampa", "ljus", "stjärna",
  "cylinderhatt", "klänning", "keps", "häxhatt", "krona", "glasögon", "solglasögon", "rosett", "slips",
  "badkar", "dusch", "tvål", "vatten", "balja", "handduk", "pool", "bassäng", "sjö", "strand",
  "säng", "soffa", "fåtölj", "kudde", "madrass", "hängmatta", "stubbe", "stock", "sten", "stol", "bänk",
  "träbro", "bro", "båt", "roddbåt", "kanot", "flotte", "färja", "träd", "palm", "blomma", "julklapp", "present", "paket", "karta", "kompass", "skylt", "vägvisare", "vägskylt",
]);

export function hjalpDjurPaAngen(
  v: Varelse,
  aktivtUppdragId?: string | null,
): { uid: string; spec: Varelse } | null {
  const varm = mossaPaFrysKanin(v);
  if (varm) return varm;
  const s = useMinne.getState();
  if (s.ang.length === 0) return null;
  const arHjalpUppdrag = Boolean(aktivtUppdragId && HJALP_UPPDRAG_IDS.has(aktivtUppdragId));
  if (!arHjalpUppdrag) return null;

  const ex = s.ang.find((d) => d.kropp === v.kropp) ?? s.ang[0];
  if (!ex) return null;

  if (s.ang.some((d) => d.kropp === v.kropp)) {
    const { uid: _u, skapad: _s, ...exSpec } = ex;
    const nyaTillbehor = [...(ex.tillbehor ?? [])];
    for (const t of v.tillbehor ?? []) {
      if (!nyaTillbehor.some((x) => x.id === t.id)) nyaTillbehor.push(t);
    }
    return {
      uid: ex.uid,
      spec: {
        ...exSpec,
        farg: v.farg ?? ex.farg,
        tillbehor: nyaTillbehor,
        formel: v.formel || ex.formel,
      },
    };
  }

  if (HJALP_SAKER.has(v.kropp) || (v.tillbehor ?? []).some((t) => HJALP_SAKER.has(t.id))) {
    const { uid: _u, skapad: _s, ...exSpec } = ex;
    const extraTillbehor: TillbehorSpec[] = [...(ex.tillbehor ?? [])];
    if (VARME_PLAGG.has(v.kropp) && !extraTillbehor.some((x) => x.id === v.kropp)) {
      extraTillbehor.push({ id: v.kropp, farg: v.farg, glans: false });
    }
    for (const t of v.tillbehor ?? []) {
      if (!extraTillbehor.some((x) => x.id === t.id)) extraTillbehor.push(t);
    }
    return {
      uid: ex.uid,
      spec: {
        ...exSpec,
        tillbehor: extraTillbehor,
        formel: `${ex.formel} med ${v.formel || v.kropp}`,
      },
    };
  }

  return null;
}
