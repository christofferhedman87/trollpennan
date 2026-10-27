/** Isolate sibling branches. Only elements this hook itself sets inert are restored. */
export function skapaDialogIsolering() {
  const satta = new Set<HTMLElement>();
  const aterstall = () => {
    for (const element of satta) element.inert = false;
    satta.clear();
  };
  const isolera = (dialog: HTMLElement | null) => {
    if (!dialog) return;
    let gren: HTMLElement = dialog;
    while (gren.parentElement) {
      const parent = gren.parentElement;
      for (const syskon of Array.from(parent.children)) {
        if (syskon === gren || !(syskon instanceof HTMLElement)) continue;
        // Vägvisaren och resan ligger ovanpå Pennans bok och ska gå att trycka på.
        if (syskon.matches?.(".tp-vagvisare-hud, .tp-resa-anim, .tp-flyg-hud")) continue;
        if (syskon.inert) continue;
        satta.add(syskon);
        syskon.inert = true;
      }
      if (parent === document.body) break;
      gren = parent;
    }
  };
  return { aterstall, isolera };
}
