export function fyll(mall: string, v: Record<string, string | number>): string {
  return mall.replace(/\{(\w+)\}/g, (_, k: string) => (v[k] == null ? "" : String(v[k])));
}
