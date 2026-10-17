/** En kö per spel: Phaser-scener delar TextureManager men har egna loaders. */
const koer = new WeakMap<object, Promise<void>>();
export function delaLaddning(spel: object, nycklar: string[], finns: (k: string) => boolean, ladda: (k: string[]) => Promise<void>): Promise<void> {
  const fore = koer.get(spel) ?? Promise.resolve();
  const jobb = fore.catch(() => undefined).then(async () => {
    // Kontrollera igen efter föregående scen, inte bara när jobbet köades.
    const saknas = [...new Set(nycklar)].filter(k => k && !finns(k));
    if (saknas.length) await ladda(saknas);
  });
  koer.set(spel, jobb.catch(() => undefined));
  return jobb;
}
