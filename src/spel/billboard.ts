import { hamtaKit, ritplan, type Ritdel } from "./kit.ts";
import type { Varelse } from "../tolk/typer.ts";

const bilder = new Map<string, Promise<HTMLImageElement>>();
const tintar = new Map<string, HTMLCanvasElement>();

function ladda(url: string): Promise<HTMLImageElement> {
  const har = bilder.get(url);
  if (har) return har;
  const lov = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(url));
    img.src = url;
  });
  bilder.set(url, lov);
  return lov;
}

function tinta(img: HTMLImageElement, tint: string): HTMLCanvasElement {
  const nyckel = `${img.src}|${tint}`;
  const har = tintar.get(nyckel);
  if (har) return har;
  const c = document.createElement("canvas");
  c.width = img.width || 1;
  c.height = img.height || 1;
  const g = c.getContext("2d");
  if (!g) return c;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = tint;
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(img, 0, 0);
  tintar.set(nyckel, c);
  return c;
}

function ritaDel(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  del: Ritdel,
  cx: number,
  cy: number,
) {
  const w = img.width || 1;
  const h = img.height || 1;
  const kalla = del.tint ? tinta(img, del.tint) : img;
  let px = del.dx;
  let py = del.dy;
  let ox = w / 2;
  let oy = h / 2;
  if (del.ankare) {
    const piv = del.pivot ?? [w / 2, h / 2];
    ox = piv[0];
    oy = piv[1];
    px = del.ankare[0] - cx + del.dx;
    py = del.ankare[1] - cy + del.dy;
  }
  ctx.save();
  ctx.translate(cx + px, cy + py);
  ctx.rotate((del.rot * Math.PI) / 180);
  ctx.scale(del.skala, del.skala);
  ctx.globalAlpha = Math.max(0, Math.min(1, del.alpha));
  ctx.globalCompositeOperation = del.blend === "multiply" ? "multiply" : del.blend === "add" ? "lighter" : "source-over";
  ctx.drawImage(kalla, -ox, -oy);
  ctx.restore();
}

function beskär(src: HTMLCanvasElement): HTMLCanvasElement | null {
  const ctx = src.getContext("2d");
  if (!ctx) return null;
  const { data, width, height } = ctx.getImageData(0, 0, src.width, src.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let träff = false;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) < 16) continue;
      träff = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (!träff) return null;
  const pad = 10;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width, maxX + pad);
  maxY = Math.min(height, maxY + pad);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const ut = document.createElement("canvas");
  ut.width = w;
  ut.height = h;
  ut.getContext("2d")?.drawImage(src, minX, minY, w, h, 0, 0, w, h);
  return ut;
}

/** Ritar djurets kit-lager till en genomskinlig bild för en 3D-billboard. */
export async function ritaDjur(v: Varelse): Promise<HTMLCanvasElement | null> {
  let kit;
  let rot: string;
  try {
    const hämtat = await hamtaKit();
    kit = hämtat.kit;
    rot = hämtat.rot;
  } catch {
    return null;
  }
  const plan = ritplan(v, kit).filter(
    (d) => d.pose === "idle" && (d.ansikte == null || d.ansikte === "normal") && d.alpha > 0.02 && !!d.url,
  );
  if (!plan.length) return null;
  const cx = (kit.duk?.b || 600) / 2;
  const cy = (kit.duk?.h || 600) / 2;
  const duk = document.createElement("canvas");
  duk.width = kit.duk?.b || 600;
  duk.height = kit.duk?.h || 600;
  const ctx = duk.getContext("2d");
  if (!ctx) return null;
  let ritade = 0;
  for (const del of plan) {
    try {
      const img = await ladda(`${rot}/${del.url}`);
      ritaDel(ctx, img, del, cx, cy);
      ritade += 1;
    } catch {
      /* en saknad del får inte stoppa djuret */
    }
  }
  if (!ritade) return null;
  return beskär(duk);
}
