/** Samma prioritering som svarsraden: en pågående guldfras använder hjälpraden i stället. */
export function harBoksvar(sk: { spok: unknown; erbjud: unknown; remsa: { brickor: readonly { boj?: string }[] } }, t: { forslag: { forslag: readonly unknown[] } | null; behover: unknown }): boolean {
  return !sk.spok && (!!t.forslag?.forslag.length || sk.remsa.brickor.some((b) => !!b.boj) || !!t.behover || !!sk.erbjud);
}
