import { useEffect, useRef } from "react";
import { ritaDjur } from "../billboard.ts";
import type { Sparad } from "../brygga.ts";

export function OnskaAnsikte({ djur }: { djur: Sparad }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let stopp = false;
    ritaDjur(djur).then((bild) => {
      const duk = ref.current;
      if (stopp || !bild || !duk) return;
      const ctx = duk.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, duk.width, duk.height);
      const s = Math.min(duk.width / bild.width, duk.height / bild.height);
      const w = bild.width * s;
      const h = bild.height * s;
      ctx.drawImage(bild, (duk.width - w) / 2, (duk.height - h) / 2, w, h);
    });
    return () => {
      stopp = true;
    };
  }, [djur.uid, djur.formel]);
  return <canvas ref={ref} className="onska-ansikte" width={144} height={144} data-testid="onska-ansikte" aria-hidden />;
}
