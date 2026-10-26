import { useEffect } from "react";
import { avBro } from "../avbro.ts";
import { lasSkylt, plockaSkatt } from "../avflode.ts";
import type { SpelKarna } from "./typer.ts";

export function useAvBro(k: Pick<SpelKarna, "t" | "b" | "v" | "a">) {
  const { setLage, setHand, setForslag, setGavaTill, setSkylt, handRef, omradeRef, gavaRef, avHand } = k.t;
  const { visaBanner } = k.b;
  const { synkaAv } = k.v;
  const { belonaFlode, tryckOn, oppnaSkicka } = k.a;

  avHand.current = (h) => {
    if (h.typ === "skylt") {
      const r = lasSkylt(h.id);
      setSkylt(r);
      if (r.nytt) visaBanner(r.nytt, "ovr", "tapp");
      if (omradeRef.current) synkaAv(omradeRef.current);
      return;
    }
    if (h.typ === "vild") {
      setGavaTill(h.id);
      gavaRef.current = h.id;
      setLage("kort");
      setHand(true);
      handRef.current = true;
      setForslag(null);
      return;
    }
    if (h.typ === "skatt") {
      belonaFlode(plockaSkatt(h.id));
      return;
    }
    if (h.typ === "plats" && h.id === "on" && omradeRef.current === "on") {
      oppnaSkicka("fyren");
      return;
    }
    if (h.typ === "plats" && h.id === "on") {
      tryckOn();
      return;
    }
    if (h.typ === "plats" && h.id === "svampringen") oppnaSkicka("svampring");
  };

  useEffect(() => {
    const stop = avBro.lyssna((h) => avHand.current(h));
    return () => {
      stop();
    };
  }, []);
}
