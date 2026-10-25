import { useEffect } from "react";
import { DYGN, fasAv, framDygn, kvallStyrka, synkaVisning, tickLiv, visningsTid } from "../liv.ts";
import { useMinne } from "../minne.ts";
import type { SpelKarna } from "./typer.ts";

export function useKlocka(k: Pick<SpelKarna, "t" | "b">) {
  const { setNatt } = k.t;
  const { visaBanner } = k.b;

  useEffect(() => {
    let sen = performance.now();
    let senFas = fasAv(visningsTid());
    const id = window.setInterval(() => {
      const nu = performance.now();
      const dt = document.hidden ? 0 : Math.min(1500, nu - sen);
      sen = nu;
      if (dt > 0) framDygn(dt);
      const sparad = useMinne.getState().dygnMs;
      const vis = visningsTid();
      if (vis - sparad >= 3000) {
        const del = tickLiv(useMinne.getState(), vis - sparad);
        useMinne.setState(del);
        if (typeof del.dygnMs === "number") synkaVisning(del.dygnMs);
      }
      setNatt(kvallStyrka(visningsTid()));
      const fas = fasAv(visningsTid());
      if (dt > 0 && fas !== senFas) {
        senFas = fas;
        const rader = fas === "kvall" ? DYGN.texter.kvall_borjar : DYGN.texter.morgon;
        for (const rad of rader) visaBanner(rad, "ovr", "dygn");
      }
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- B6.1: dygnsklockan monteras en gång; visaBanner köar via rostKo och set-funktioner
  }, []);
}
