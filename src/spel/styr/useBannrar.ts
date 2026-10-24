import { brygga } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { geHjarta, HUMOR, inbjudanAv, MOSSA, mossaHand } from "../liv.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { platsText } from "../platsText.ts";
import * as rostKo from "../rostKo.ts";
import { nyId } from "../ui/hjalp.ts";
import type { Banner } from "../ui/typer.ts";
import { useStallBanner } from "../ui/useStallBanner.ts";
import type { SpelKarna } from "./typer.ts";

export function useBannrar(k: Pick<SpelKarna, "t">) {
  const { bannerTimer, setBanners, varldRef, setBubblor } = k.t;
  /** B6.3 (H): tryck stänger bannern och tystar kön. Tiden stänger bara bannern. */
  function stangBanner(tryckt?: string) {
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = null;
    setBanners([]);
    if (tryckt !== undefined) rostKo.tryck();
  }
  function slackBanner(texten: string) { const t = platsText(texten, varldRef.current); rostKo.stryk(t); setBanners((l) => l.filter((b) => b.text !== t)); }
  useStallBanner(slackBanner);
  function visaBanner(texten: string, slag: Banner["slag"], kalla: rostKo.Kalla, ms?: number) {
    rostKo.anmal({ text: platsText(texten, varldRef.current), kalla, banner: { slag, ms } });
  }
  function visaBubbla(rad: string, x: number, y: number, hjarta: boolean, ovan = false, ensam = false, kalla: rostKo.Kalla | null = "tapp") {
    const texten = platsText(rad, varldRef.current); // R9K: {platsen} → platsen barnet är på
    const id = nyId();
    if (kalla) rostKo.anmal({ text: texten, kalla, nyckel: `bubbla:${id}` });
    setBubblor((prev) => {
      const start = ensam ? [] : prev;
      if (ovan) {
        const i3d = typeof document !== "undefined" && !!document.querySelector("[data-testid='angen-3d']");
        const xx = i3d ? Math.min(0.82, Math.max(0.18, x)) : Math.min(0.64, Math.max(0.36, x));
        const yy = i3d ? Math.min(0.78, Math.max(0.58, y)) : Math.max(0.48, Math.min(0.72, y));
        return [...start, { id, text: texten, x: xx, y: yy, hjarta, ovan: true }].slice(-2);
      }
      const hoger = start.some((a) => a.x > 0.5);
      const vanster = start.some((a) => a.x <= 0.5);
      let sida = x < 0.5 ? "h" : "v";
      if (sida === "h" && hoger && !vanster) sida = "v";
      if (sida === "v" && vanster && !hoger) sida = "h";
      const xx = sida === "h" ? 0.74 : 0.26;
      const yy = hoger && vanster ? 0.3 : 0.03;
      return [...start, { id, text: texten, x: xx, y: yy, hjarta, ovan: false }].slice(-2);
    });
    window.setTimeout(() => { setBubblor((b) => b.filter((x) => x.id !== id)); if (kalla === "tryck") rostKo.stryk(texten); }, 4200);
  }
  function visaMossa(h: Parameters<typeof mossaHand>[0]) {
    const r = mossaHand(h);
    for (const t of r.texter) if (t) visaBanner(t, "ovr", "mossa_text");
    if (r.stj > 0) {
      useMinne.getState().geStjarnor(r.stj);
      ljud.stjarna();
      visaBanner(fyll(MOSSA.beloning.text, { n: r.stj }), "ovr", "mossa_beloning");
    }
  }
  function bjud(slag: string, uid?: string) {
    const s = useMinne.getState();
    const djur = [...s.ang, ...s.hemma.map((x) => x.spec)];
    for (const d of djur) {
      if (uid && d.uid !== uid) continue;
      if (inbjudanAv(d.uid) !== slag) continue;
      geHjarta(d.uid);
      const tack = HUMOR.tack_text[Math.floor(Math.random() * HUMOR.tack_text.length)] ?? HUMOR.tack_text[0]!;
      const p = brygga.platser().find((x) => x.uid === d.uid);
      visaBubbla(tack, p?.x ?? 0.5, p?.topp ?? p?.y ?? 0.3, true, true, false, "bjud");
    }
  }
  return { stangBanner, slackBanner, visaBanner, visaBubbla, visaMossa, bjud };
}

export type Bannrar = ReturnType<typeof useBannrar>;
