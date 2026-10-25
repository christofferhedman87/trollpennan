const VOKAL = new Set(["a", "e", "i", "o", "u", "y", "å", "ä", "ö"]);

const BILLIGA: [string, string][] = [
  ["a", "å"],
  ["a", "ä"],
  ["å", "ä"],
  ["o", "ö"],
  ["e", "ä"],
];

function arBillig(a: string, b: string): boolean {
  return BILLIGA.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

function arKonsonant(c: string): boolean {
  return !VOKAL.has(c);
}

/** Dubbel eller enkel konsonant kostar 0,5. */
function bortKost(ord: string, index: number): number {
  if (
    index > 0 &&
    ord[index] === ord[index - 1] &&
    arKonsonant(ord[index] ?? "")
  ) {
    return 0.5;
  }
  return 1;
}

function dl(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i]![0] = i;
  for (let j = 0; j <= m; j++) dp[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const ca = a[i - 1] ?? "";
      const cb = b[j - 1] ?? "";
      const sub = ca === cb ? 0 : arBillig(ca, cb) ? 0.5 : 1;
      let best = Math.min(
        dp[i - 1]![j]! + bortKost(a, i - 1),
        dp[i]![j - 1]! + bortKost(b, j - 1),
        dp[i - 1]![j - 1]! + sub,
      );
      if (i > 1 && j > 1 && ca === (b[j - 2] ?? "") && (a[i - 2] ?? "") === cb) {
        const par = (a[i - 2] === "n" && ca === "g") || (a[i - 2] === "g" && ca === "n");
        best = Math.min(best, dp[i - 2]![j - 2]! + (par ? 0.5 : 1));
      }
      dp[i]![j] = best;
    }
  }
  return dp[n]![m]!;
}

function mjukt(s: string): { pre: string; rest: string } | null {
  for (const p of ["hj", "lj", "j", "g"]) {
    if (s.startsWith(p)) return { pre: p, rest: s.slice(p.length) };
  }
  return null;
}

/** Svensk ljudstam: tje-/sje-/j-ljud i ordstart, ck och dubbelteckning. */
export function ljudStam(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(stj|skj|sch|sh|sj)/, "SJ")
    .replace(/^sk(?=[eiyäö])/, "SJ")
    .replace(/^(tj|kj)/, "TJ")
    .replace(/^k(?=[eiyäö])/, "TJ")
    .replace(/^(gj|dj|hj|lj)/, "j")
    .replace(/ck/g, "k")
    .replace(/(.)\1+/g, "$1")
    .replace(/å/g, "o")
    .replace(/ä/g, "e");
}

/** Damerau-Levenshtein med billiga fel från ord.json. */
export function avstand(a: string, b: string): number {
  const bas = dl(a, b);
  if (a !== b && ljudStam(a) === ljudStam(b)) return Math.min(bas, 0.5);
  const A = mjukt(a);
  const B = mjukt(b);
  if (A && B && A.pre !== B.pre) return Math.min(bas, 0.5 + dl(A.rest, B.rest));
  if (A && !B) return Math.min(bas, 0.5 + dl(A.rest, b));
  if (B && !A) return Math.min(bas, 0.5 + dl(a, B.rest));
  return bas;
}

export function felgrans(langd: number): number {
  return langd <= 5 ? 1 : 2;
}
