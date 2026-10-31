// T-07/T-08: oförändrad tolklogik, uppdelad före språkändringarna.
import { KANNETECKEN, ORD } from "./data.ts";
import { lasToken } from "./lexikon.ts";
import type { Kannetecken, Ord } from "./typer.ts";
import { ART, type Bygg, laggFormaga, laggRecept, tokensAv } from "./tolktillstand.ts";

export function tomKannetecken(k: Kannetecken | undefined): boolean {
  if (!k) return true;
  return !k.farg && !k.monster && k.tillbehor.length === 0 && k.formagor.length === 0;
}

export function genitiv(o: Ord): string {
  return `${o.former[1] ?? o.visa}s`;
}

export type Lan = {
  farg: string | null;
  monster: string | null;
  monsterfarg: string | null;
  tillbehor: string[];
  formagor: string[];
  text: string;
};

/** Kännetecken att lägga på A. Tom rad faller tillbaka på artfärgen (bara blandning, inte sammansättning). */
export function lanAv(o: Ord): Lan {
  const k = KANNETECKEN.djur[o.id];
  if (k && !tomKannetecken(k)) {
    return {
      farg: k.farg,
      monster: k.monster,
      monsterfarg: k.monsterfarg,
      tillbehor: k.tillbehor,
      formagor: k.formagor,
      text: k.beskrivning ?? `${genitiv(o)} färg`,
    };
  }
  const kropp = o.del?.kropp ?? o.id;
  return {
    farg: ART[kropp]?.art ?? null,
    monster: null,
    monsterfarg: null,
    tillbehor: [],
    formagor: [],
    text: `${genitiv(o)} färg`,
  };
}

export function appliceraLan(b: Bygg, lan: Lan, dolj: boolean) {
  if (lan.farg && !b.fargOrd) b.fargHex = lan.farg;
  if (lan.monster) {
    b.monster = lan.monster;
    b.monsterfarg = lan.monsterfarg;
    if (dolj) b.monsterDolj = true;
  }
  for (const tb of lan.tillbehor) laggRecept(b, tb);
  for (const fm of lan.formagor) laggFormaga(b, fm, null, "dolj");
}

/** Förledsdjur i en sammansättning. Tom rad gör inget, så mullvad inte färgar ett sammansatt ord. */
export function laggKannetecken(b: Bygg, o: Ord, dolj: boolean) {
  const k = KANNETECKEN.djur[o.id];
  if (!k || tomKannetecken(k)) return;
  appliceraLan(
    b,
    {
      farg: k.farg,
      monster: k.monster,
      monsterfarg: k.monsterfarg,
      tillbehor: k.tillbehor,
      formagor: k.formagor,
      text: k.beskrivning ?? "",
    },
    dolj,
  );
}

export function djurAvToken(token: string): Ord | null {
  const en = lasToken(token);
  if (en?.t === "ord" && en.o.klass === "djur") return en.o;
  return null;
}

export type BlandTraff = { a: Ord; aForm: string; b: Ord | null; bRaw: string };

export function hoppaArtikel(tokens: string[], i: number): number {
  const t = tokens[i] ?? "";
  return t === "en" || t === "ett" ? i + 1 : i;
}

/** B ska vara sista ordet: ett djur, eller ett okänt ord. Ett känt icke-djur är inte en blandning. */
export function lasB(tokens: string[], i: number): { b: Ord | null; bRaw: string } | null {
  const bRaw = tokens[i];
  if (!bRaw || i + 1 !== tokens.length) return null;
  const b = djurAvToken(bRaw);
  if (!b && lasToken(bRaw)) return null;
  return { b, bRaw };
}

export function matchBlandning(tokens: string[]): BlandTraff | null {
  const bl = ORD.funktionsord.blanda;
  if (!bl || tokens.length < 3) return null;
  const efter = new Set(bl.efter_a);
  const fore = new Set(bl.fore);
  const koppla = new Set(bl.koppla);
  const halften = new Set(bl.halften);

  {
    const i = hoppaArtikel(tokens, 0);
    const aForm = tokens[i] ?? "";
    const a = djurAvToken(aForm);
    if (a && efter.has(tokens[i + 1] ?? "") && (tokens[i + 2] ?? "") === "med") {
      const b = lasB(tokens, hoppaArtikel(tokens, i + 3));
      if (b) return { a, aForm, b: b.b, bRaw: b.bRaw };
    }
  }
  {
    let i = hoppaArtikel(tokens, 0);
    if (fore.has(tokens[i] ?? "") && koppla.has(tokens[i + 1] ?? "")) {
      i = hoppaArtikel(tokens, i + 2);
      const aForm = tokens[i] ?? "";
      const a = djurAvToken(aForm);
      if (a && (tokens[i + 1] ?? "") === "och") {
        const b = lasB(tokens, hoppaArtikel(tokens, i + 2));
        if (b) return { a, aForm, b: b.b, bRaw: b.bRaw };
      }
    }
  }
  if (halften.has(tokens[0] ?? "")) {
    const i = hoppaArtikel(tokens, 1);
    const aForm = tokens[i] ?? "";
    const a = djurAvToken(aForm);
    if (a && halften.has(tokens[i + 1] ?? "")) {
      const b = lasB(tokens, hoppaArtikel(tokens, i + 2));
      if (b) return { a, aForm, b: b.b, bRaw: b.bRaw };
    }
  }
  return null;
}

/** Två kända djur i en blandningsfras. null när mönstret saknas eller B är okänt. */
export function blandPar(raw: string): { a: Ord; b: Ord } | null {
  const m = matchBlandning(tokensAv(raw));
  if (!m?.b) return null;
  return { a: m.a, b: m.b };
}
