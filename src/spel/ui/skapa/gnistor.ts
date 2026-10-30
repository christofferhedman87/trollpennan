// Nya Skapa 6.11: trolla-ögonblicket i DOM:en. Varje innehållsord lyfter som en gnista i sin ordklassfärg
// (guldord: guldgnista) och flyger i en båge in i ringen, 70 ms förskjutning per ord, 700 ms per gnista.
// Sedan sprutar 12 stjärnor ut. Allt hoppas över vid prefers-reduced-motion.
import { ikon } from "../../skapa/ikoner.ts";

const lugn = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Startar gnistorna och returnerar hur länge (ms) innan skapelsen ska bli verklig. */
export function flygGnistor(rot: HTMLElement, mal: { x: number; y: number } | null): number {
  if (lugn()) return 0;
  const m = mal ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.3 };
  const ord = [...rot.querySelectorAll<HTMLElement>(".sk-remsa .sk-ord:not(.smaord)")];
  ord.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const fran = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const klass = el.dataset.guld === "ja" ? "guld" : ["vad", "hurdan", "har", "gor"].includes(el.dataset.klass ?? "") ? el.dataset.klass! : "vit";
    const g = document.createElement("img");
    g.className = "sk-flyg";
    g.alt = "";
    g.src = ikon("grafik", `gnista-${klass}`);
    g.style.left = `${fran.x - 15}px`;
    g.style.top = `${fran.y - 15}px`;
    document.body.appendChild(g);
    const dx = m.x - fran.x;
    const dy = m.y - fran.y;
    el.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0.25, transform: "scale(.85)" }], { duration: 300, delay: i * 70, fill: "forwards" });
    g.animate(
      [
        { transform: "translate(0,0) scale(.6) rotate(0)", opacity: 0 },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(1.4) rotate(180deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(.5) rotate(360deg)`, opacity: 0.9 },
      ],
      { duration: 700, delay: i * 70, easing: "cubic-bezier(.5,0,.4,1)", fill: "forwards" },
    ).finished.then(() => g.remove(), () => g.remove());
  });
  return 700 + ord.length * 70;
}

export function stjarnregn(mal: { x: number; y: number } | null): void {
  if (lugn()) return;
  const m = mal ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.3 };
  for (let i = 0; i < 12; i++) {
    const s = document.createElement("img");
    s.className = "sk-stjarnregn";
    s.alt = "";
    s.src = ikon("grafik", i % 3 === 0 ? "gnista-vit" : "gnista-guld");
    s.style.left = `${m.x - 13}px`;
    s.style.top = `${m.y - 13}px`;
    document.body.appendChild(s);
    const v = (i / 12) * Math.PI * 2;
    const rr = 70 + Math.random() * 50;
    s.animate(
      [{ transform: "translate(0,0) scale(.3)", opacity: 1 }, { transform: `translate(${Math.cos(v) * rr}px, ${Math.sin(v) * rr - 30}px) scale(1.1) rotate(200deg)`, opacity: 0 }],
      { duration: 800 + Math.random() * 300, easing: "cubic-bezier(.2,.8,.3,1)" },
    ).finished.then(() => s.remove(), () => s.remove());
  }
}
