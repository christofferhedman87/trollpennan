// TTS-2: hur en visad text läses upp. Delas av scripts/rost-generera.mjs och testerna (ren, utan DOM).

/** Texten utan signaturen i slutet (" /Doktor Bengtsson", " /Ekorren"): skyltar visar den men den läses inte upp. */
export function utanSignatur(t: string): string {
  return t.replace(/\s+\/\p{Lu}[^/]*$/u, "").trim();
}
