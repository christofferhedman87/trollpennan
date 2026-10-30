// Spökbokstäverna följer hela kortets text, även mellanrummen i till exempel "sprutar eld".
export type Spok = { ord: string; tokenI: number; buf: string; fel: number };

export function skrivGuldTecken(s: Spok, tecken: string): Spok {
  const nasta = s.ord[s.buf.length];
  if (!nasta) return s;
  return tecken.toLocaleLowerCase("sv") === nasta
    ? { ...s, buf: s.buf + nasta }
    : { ...s, fel: s.fel + 1 };
}
