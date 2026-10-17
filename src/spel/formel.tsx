import { useEffect, useRef } from "react";
import type { Varelse } from "@/tolk/typer.ts";
import { hamtaKit, ritplan, type Ritdel } from "./kit.ts";

function ladda(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function tonad(img: HTMLImageElement, tint: string | null): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = Math.max(1, img.naturalWidth);
  off.height = Math.max(1, img.naturalHeight);
  const g = off.getContext("2d");
  if (!g) return off;
  g.drawImage(img, 0, 0);
  if (tint) {
    g.globalCompositeOperation = "multiply";
    g.fillStyle = tint;
    g.fillRect(0, 0, off.width, off.height);
    g.globalCompositeOperation = "destination-in";
    g.drawImage(img, 0, 0);
  }
  return off;
}

function ritaDel(
  ctx: CanvasRenderingContext2D,
  bild: HTMLCanvasElement,
  cx: number,
  cy: number,
  s: number,
  dukB: number,
  dukH: number,
  del: Ritdel,
) {
  ctx.save();
  ctx.globalAlpha = del.alpha;
  ctx.globalCompositeOperation =
    del.blend === "multiply" ? "multiply" : del.blend === "add" ? "lighter" : "source-over";
  if (!del.ankare || !del.pivot) {
    ctx.translate(cx, cy);
    ctx.rotate((del.rot * Math.PI) / 180);
    ctx.scale(s * del.skala, s * del.skala);
    ctx.drawImage(bild, -bild.width / 2 + del.dx, -bild.height / 2 + del.dy);
  } else {
    const px = cx + (del.ankare[0] - dukB / 2 + del.dx) * s;
    const py = cy + (del.ankare[1] - dukH / 2 + del.dy) * s;
    ctx.translate(px, py);
    ctx.rotate((del.rot * Math.PI) / 180);
    ctx.scale(s * del.skala, s * del.skala);
    ctx.drawImage(bild, -del.pivot[0], -del.pivot[1]);
  }
  ctx.restore();
}

export function FormelBild({ v }: { v: Varelse }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let dead = false;
    void (async () => {
      const { kit, rot } = await hamtaKit();
      const plan = ritplan(v, kit).filter((d) => d.pose === "idle" && (d.ansikte == null || d.ansikte === "normal"));
      const bilder = await Promise.all(plan.map((d) => ladda(`${rot}/${d.url}`)));
      const canvas = ref.current;
      if (dead || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = 440;
      const H = 440;
      canvas.width = W;
      canvas.height = H;
      ctx.clearRect(0, 0, W, H);
      if (v.glans) {
        const glow = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 180);
        glow.addColorStop(0, "rgba(224, 161, 6, 0.55)");
        glow.addColorStop(1, "rgba(224, 161, 6, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      }
      const dukB = kit.duk?.b || 512;
      const dukH = kit.duk?.h || dukB;
      const s = ((Math.min(W, H) * 0.78) / dukB) * Math.min(v.skala, 1.35);
      const cx = W / 2;
      const cy = H / 2;
      for (let i = 0; i < plan.length; i++) {
        const del = plan[i]!;
        const img = bilder[i];
        if (!img) continue;
        ritaDel(ctx, tonad(img, del.tint), cx, cy, s, dukB, dukH, del);
      }
    })();
    return () => {
      dead = true;
    };
  }, [v]);

  return <canvas ref={ref} className="formel-bild" aria-hidden />;
}
