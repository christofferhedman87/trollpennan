/** Isolate sibling branches and preserve the original inert state. */
export function skapaDialogIsolering() {
  const tidigare = new Map<HTMLElement, boolean>();
  const aterstall = () => {
    for (const [element, inert] of tidigare) element.inert = inert;
    tidigare.clear();
  };
  const isolera = (dialog: HTMLElement | null) => {
    if (!dialog) return;
    let gren: HTMLElement = dialog;
    while (gren.parentElement) {
      const parent = gren.parentElement;
      for (const syskon of Array.from(parent.children)) {
        if (syskon === gren || !(syskon instanceof HTMLElement)) continue;
        if (!tidigare.has(syskon)) tidigare.set(syskon, syskon.inert);
        syskon.inert = true;
      }
      if (parent === document.body) break;
      gren = parent;
    }
  };
  return { aterstall, isolera };
}
