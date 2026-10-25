import ljudJson from "../../data/ljud.json" with { type: "json" };

type Ton = { typ?: OscillatorType; hz: number; till_hz?: number; start: number; langd: number };
type LjudSpec = {
  toner?: Ton[];
  brus?: { langd: number; filter?: BiquadFilterType; hz_fran?: number; hz_till?: number };
  volym: number;
};
type LjudFil = { ljud: Record<string, LjudSpec> };

const DATA = ljudJson as LjudFil;
const MASTER = 0.25;

let av = false;
let ctx: AudioContext | null = null;

function kontext(): AudioContext | null {
  if (av || typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function ton(ac: AudioContext, t: Ton, volym: number, nar: number) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = t.typ ?? "sine";
  const start = nar + t.start;
  o.frequency.setValueAtTime(Math.max(40, t.hz), start);
  if (t.till_hz) o.frequency.exponentialRampToValueAtTime(Math.max(40, t.till_hz), start + t.langd);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(Math.min(MASTER, volym), start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.02, t.langd));
  o.connect(g);
  g.connect(ac.destination);
  o.start(start);
  o.stop(start + t.langd + 0.02);
}

function brus(ac: AudioContext, spec: NonNullable<LjudSpec["brus"]>, volym: number, nar: number) {
  const n = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * spec.langd)), ac.sampleRate);
  const data = n.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = n;
  const filter = ac.createBiquadFilter();
  filter.type = spec.filter ?? "lowpass";
  filter.frequency.setValueAtTime(spec.hz_fran ?? 800, nar);
  if (spec.hz_till) filter.frequency.exponentialRampToValueAtTime(Math.max(40, spec.hz_till), nar + spec.langd);
  const g = ac.createGain();
  g.gain.setValueAtTime(Math.min(MASTER, volym), nar);
  g.gain.exponentialRampToValueAtTime(0.0001, nar + spec.langd);
  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start(nar);
  src.stop(nar + spec.langd + 0.02);
}

export const ljud = {
  logg: [] as string[],
  satt(v: boolean) {
    av = !v;
  },
  effektPa(): boolean {
    return !av;
  },
  lasOpp() {
    if (typeof window === "undefined") return;
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  },
  spel(namn: string) {
    this.logg.push(namn);
    if (this.logg.length > 40) this.logg.shift();
    const spec = DATA.ljud[namn];
    const ac = kontext();
    if (!ac || !spec) return;
    const nar = ac.currentTime;
    if (spec.brus) brus(ac, spec.brus, spec.volym, nar);
    for (const t of spec.toner ?? []) ton(ac, t, spec.volym, nar);
  },
  pling() {
    this.spel("pling");
  },
  boing() {
    this.spel("boing");
  },
  puff() {
    this.spel("puff");
  },
  stjarna() {
    this.spel("stjarna");
  },
  onskan() {
    this.spel("onskan");
  },
  uppfylld() {
    this.spel("uppfylld");
  },
  guld() {
    this.spel("guld");
  },
  sida() {
    this.spel("sida");
  },
  nastan() {
    this.spel("nastan");
  },
  fil(namn: "pop" | "vakna" | "klick" | "landa" | "glitter") {
    this.logg.push(namn);
    if (this.logg.length > 40) this.logg.shift();
    if (av || typeof window === "undefined") return;
    const a = new Audio(`/ljud-ui/${namn}.mp3`);
    a.volume = 0.45;
    void a.play().catch(() => undefined);
  },
};
