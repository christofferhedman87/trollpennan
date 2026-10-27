export type ResMal = "ang" | "skogen" | "sjon" | "grottan" | "garden";

export type ResBeroenden = {
  varld: "ang" | "gard" | "byggbok";
  nuvarandePlats: string;
  valjVarld: (id: "ang" | "gard") => void;
  resTill: (id: string) => void;
  hem: () => void;
};

/** Byter värld och plats när resövergången släpper fram destinationen. */
export function utforPlatsResaV09(mal: ResMal, b: ResBeroenden): void {
  if (mal === "garden") {
    b.valjVarld("gard");
    return;
  }
  if (mal === "ang") {
    if (b.varld === "gard") b.valjVarld("ang");
    if (b.nuvarandePlats !== "ang") b.hem();
    return;
  }
  if (b.varld === "gard") b.valjVarld("ang");
  b.resTill(mal);
}
