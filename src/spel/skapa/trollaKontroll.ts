// Boken äger den synliga Trolla-handlingen. Enter använder samma handling och animation som knapparna.
let tryck: (() => void) | null = null;
export function kopplaTrollaKnapp(fn: () => void): () => void {
  tryck = fn;
  return () => { if (tryck === fn) tryck = null; };
}
export function trollaMedKnapp(reserv: () => unknown): void {
  if (tryck) tryck(); else reserv();
}
