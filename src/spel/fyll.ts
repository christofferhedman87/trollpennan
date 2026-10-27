/** Stor bokstav efter meningsstart och efter . ! ? */
export function storMeningsStart(text: string): string {
  return text.replace(/(^\s*|[.!?]\s+)([a-zåäö])/gu, (_, pre: string, ch: string) => pre + ch.toUpperCase());
}

export function fyll(mall: string, v: Record<string, string | number>): string {
  let ut = mall.replace(/\{(\w+)\}/g, (_, k: string) => (v[k] == null ? "" : String(v[k])));
  ut = ut.replace(/\+1 stjärnor\b/g, "+1 stjärna");
  ut = ut.replace(/\b1 stjärnor\b/g, "1 stjärna");
  return storMeningsStart(ut);
}
