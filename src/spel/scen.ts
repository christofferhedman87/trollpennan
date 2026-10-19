import { laddaDeladeBilder } from "./deladeBilder.ts";
import * as PhaserNS from "phaser";
import { paDuken } from "./pekare.ts";
import type PhaserLib from "phaser";
import { valjStil, zonLada, type Stil } from "./beteende.ts";
import { brygga, type Sparad } from "./brygga.ts";
import { filerFor, hexTal, ritplan, VERLD, type Kit } from "./kit.ts";
import { kvallStyrka, visningsTid } from "./liv.ts";
import { NattHimmel } from "./natthimmel.ts";
import { replik } from "./replik.ts";

const Phaser = PhaserNS as unknown as typeof PhaserLib;

type Bild = Phaser.GameObjects.Image;

type Lager = {
  img: Bild;
  namn: string;
  pose: "idle" | "glad";
  ansikte: "normal" | "blink" | "glad" | null;
  kropp: boolean;
  fritt: boolean;
  basSkala: number;
  basVinkel: number;
  basX: number;
  basY: number;
  basAlfa: number;
};

type Djur = {
  uid: string;
  spec: Sparad;
  nod: Phaser.GameObjects.Container;
  lager: Lager[];
  x: number;
  y: number;
  vx: number;
  stil: Stil;
  zon: string;
  malX: number;
  malY: number;
  tid: number;
  nasta: number;
  sitt: boolean;
  sov: boolean;
  fodelse: number;
  bas: number;
  tarBort: boolean;
  squash: number;
  vag: number;
  hopp: number;
  blinkSlut: number;
  nastaBlink: number;
  dubbel: number;
  gladStart: number;
  gladTill: number;
  vilar: number;
  landar: number;
  nastaLand: number;
  spegel: number;
  paus: number;
  glod: Phaser.GameObjects.Arc | null;
  studs: number;
  studsTid: number;
  foddHop: boolean;
  ring: Phaser.GameObjects.Arc | null;
};

type AnimKit = {
  states?: {
    idle?: {
      blink?: { ms?: number; every_ms?: number[]; double_blink_chance?: number };
      tweens?: { prop?: string; to?: number; ms?: number }[];
    };
    glad?: { duration_ms?: number };
  };
};

type LaddJobb = { urls: string[]; klar: () => void };

const KROPP_B = 0.42;
const KROPP_TOPP = 240;

function arKropp(namn: string) {
  return /^(skugga|bas|monster|linje|ansikte)-/.test(namn);
}

function popEase(t: number): number {
  const u = Math.min(1, Math.max(0, t / 0.78));
  if (u < 0.68) {
    const k = u / 0.68;
    return 1.22 * (1 - Math.pow(1 - k, 3));
  }
  const k = (u - 0.68) / 0.32;
  return 1.22 - 0.22 * (1 - Math.pow(1 - k, 2));
}

export class AngScen extends Phaser.Scene {
  private kit!: Kit;
  private rot = "/kit";
  private djur: Djur[] = [];
  private damm = { x: 160, y: 760 };
  private blinkMs = 0;
  private blinkVarje: [number, number] = [2200, 4800];
  private dubbelChans = 0;
  private gladMs = 900;
  private andas = false;
  private andasSx = 0.985;
  private andasSy = 1.03;
  private andasMs = 2200;
  private ko: LaddJobb[] = [];
  private laddar = false;
  private dod = false;
  private nattHimmel!: NattHimmel;

  constructor() {
    super("ang");
  }

  init() {
    this.djur = [];
    this.ko = [];
    this.laddar = false;
    this.dod = false;
  }

  preload() {
    this.kit = this.game.registry.get("kit") as Kit;
    this.rot = (this.game.registry.get("rot") as string) || "/kit";
    this.load.image(this.kit.bakgrund, `${this.rot}/${this.kit.bakgrund}`);
  }

  create() {
    const anim = this.game.registry.get("anim") as AnimKit | null;
    const blink = anim?.states?.idle?.blink;
    if (blink) {
      this.blinkMs = blink.ms ?? 120;
      const varje = blink.every_ms;
      if (varje && varje.length >= 2) this.blinkVarje = [varje[0]!, varje[1]!];
      this.dubbelChans = blink.double_blink_chance ?? 0;
      this.andas = true;
      for (const tw of anim?.states?.idle?.tweens ?? []) {
        if (tw.prop === "scaleX" && tw.to) this.andasSx = tw.to;
        if (tw.prop === "scaleY" && tw.to) this.andasSy = tw.to;
        if (tw.prop === "scaleY" && tw.ms) this.andasMs = tw.ms * 2;
      }
    }
    this.gladMs = anim?.states?.glad?.duration_ms ?? 900;

    const bg = this.add.image(VERLD.b / 2, VERLD.h / 2, this.kit.bakgrund);
    bg.setDisplaySize(VERLD.b, VERLD.h);
    this.nattHimmel = new NattHimmel(this);
    this.ritaTrad();
    const g = this.add.graphics();
    g.fillStyle(0xffe08a, 1);
    g.fillCircle(32, 32, 32);
    g.generateTexture("glans", 64, 64);
    g.clear();
    g.fillStyle(0x7b4ea3, 1);
    g.fillCircle(16, 16, 16);
    g.generateTexture("puff", 32, 32);
    g.destroy();
    const d = this.kit.damm;
    this.damm = {
      x: (d.x + d.b / 2) * VERLD.b,
      y: (d.y + d.h / 2) * VERLD.h,
    };
    this.input.topOnly = true;
    brygga.registrera("ang", {
      skapa: (v, mitt) => this.skapa(v, !!mitt),
      taBort: (uid) => this.taBort(uid),
      puff: () => this.puff(),
      platser: () => this.platser(),
      tom: () => this.tom(),
      visa: (pa) => {
        if (pa) this.scene.wake();
        else this.scene.sleep();
      },
      andra: (v) => this.andra(v),
      glad: (uid) => this.glad(uid),
      glitter: (uid) => this.glitter(uid),
    });
    this.events.once("shutdown", () => {
      this.dod = true;
      brygga.registrera("ang", null);
      this.djur = [];
    });
  }

  private ritaTrad() {
    const x = VERLD.b * 0.3;
    const y = VERLD.h * 0.5;
    const g = this.add.graphics();
    g.fillStyle(0x6d4c41, 1);
    g.fillRoundedRect(x - 16, y - 20, 32, 150, 8);
    g.fillStyle(0x2e7d32, 1);
    g.fillCircle(x, y - 70, 78);
    g.fillStyle(0x388e3c, 1);
    g.fillCircle(x - 48, y - 36, 52);
    g.fillStyle(0x43a047, 1);
    g.fillCircle(x + 50, y - 40, 50);
    g.setDepth(y - 40);
  }

  private platser() {
    return this.djur.map((d) => {
      const s = Math.abs(d.nod.scaleY) || d.bas || 0.3;
      return {
        uid: d.uid,
        x: d.nod.x / VERLD.b,
        y: d.nod.y / VERLD.h,
        topp: (d.y - KROPP_TOPP * s) / VERLD.h,
      };
    });
  }

  private tom() {
    for (const d of this.djur) d.nod.destroy();
    this.djur = [];
  }

  private puff() {
    const x = VERLD.b * 0.5;
    const y = VERLD.h * 0.42;
    for (let i = 0; i < 8; i++) {
      const c = this.add.image(x, y, "puff");
      c.setScale(0.4);
      this.tweens.add({
        targets: c,
        x: x + (Math.random() - 0.5) * 140,
        y: y - 40 - Math.random() * 90,
        alpha: 0,
        scale: 1.4,
        duration: 700,
        onComplete: () => c.destroy(),
      });
    }
  }

  private seTill(urls: string[], klar: () => void) {
    const saknas = urls.filter((u) => u && !this.textures.exists(u));
    if (!saknas.length) {
      klar();
      return;
    }
    this.ko.push({ urls: saknas, klar });
    this.pumpa();
  }

  private pumpa() {
    if (this.laddar || this.dod || !this.ko.length) return;
    const batch = this.ko.splice(0);
    const urls = [...new Set(batch.flatMap((b) => b.urls))].filter((u) => !this.textures.exists(u));
    if (!urls.length) {
      for (const b of batch) b.klar();
      this.pumpa();
      return;
    }
    this.laddar = true;
    void laddaDeladeBilder(this, urls, this.rot).then(() => {
      this.laddar = false;
      if (this.dod) return;
      for (const b of batch) b.klar();
      this.pumpa();
    });

  }

  private lada(namn: string) {
    const z = zonLada(namn);
    return { x0: z.x0 * VERLD.b, x1: z.x1 * VERLD.b, y0: z.y0 * VERLD.h, y1: z.y1 * VERLD.h };
  }

  private malSkala(vskala: number): number {
    const duk = this.kit.duk?.b || 600;
    const synlig = VERLD.b * 0.24 * vskala;
    return synlig / (duk * KROPP_B);
  }

  private punkt(zon: string, mitt: boolean): { x: number; y: number } {
    const r = this.lada(zon);
    const minAvst = VERLD.b * 0.24 * 0.6;
    const mx0 = VERLD.b / 3;
    const mx1 = (VERLD.b * 2) / 3;
    let bast = { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2, s: -1 };
    for (let i = 0; i < 28; i++) {
      let x = r.x0 + Math.random() * Math.max(1, r.x1 - r.x0);
      let y = r.y0 + Math.random() * Math.max(1, r.y1 - r.y0);
      if (mitt) {
        const a = Math.max(r.x0, mx0);
        const b = Math.min(r.x1, mx1);
        x = a < b ? a + Math.random() * (b - a) : (r.x0 + r.x1) / 2;
        y = (r.y0 + r.y1) / 2;
      }
      let nara = 9999;
      for (const d of this.djur) {
        if (d.tarBort) continue;
        nara = Math.min(nara, Math.hypot(d.x - x, d.y - y));
      }
      if (nara >= minAvst || this.djur.length === 0) return { x, y };
      if (nara > bast.s) bast = { x, y, s: nara };
    }
    return bast;
  }

  private andra(v: Sparad) {
    const d = this.djur.find((x) => x.uid === v.uid);
    const pos = d ? { x: d.x, y: d.y } : null;
    if (d) {
      d.nod.destroy();
      this.djur = this.djur.filter((x) => x.uid !== v.uid);
    }
    const plan = ritplan(v, this.kit);
    this.seTill(filerFor(v, this.kit), () => {
      if (this.dod || this.djur.some((x) => x.uid === v.uid)) return;
      this.bygg(v, false, plan);
      if (!pos) return;
      const ny = this.djur.find((x) => x.uid === v.uid);
      if (!ny) return;
      ny.x = pos.x;
      ny.y = pos.y;
      ny.malX = pos.x;
      ny.malY = pos.y;
      ny.nod.setPosition(pos.x, pos.y);
    });
  }

  private glad(uid: string) {
    const d = this.djur.find((x) => x.uid === uid);
    if (!d) return;
    d.gladStart = d.tid;
    d.gladTill = d.tid + this.gladMs / 1000 + 0.4;
    d.squash = 0.22;
  }

  private glitter(uid: string) {
    const d = this.djur.find((x) => x.uid === uid);
    const x = d?.x ?? VERLD.b * 0.5;
    const y = d?.y ?? VERLD.h * 0.45;
    for (let i = 0; i < 14; i++) {
      const c = this.add.image(x, y - 40, "glans");
      c.setBlendMode(Phaser.BlendModes.ADD);
      c.setScale(0.6);
      this.tweens.add({
        targets: c,
        x: x + (Math.random() - 0.5) * 180,
        y: y - 80 - Math.random() * 120,
        alpha: 0,
        scale: 1.6,
        duration: 700,
        onComplete: () => c.destroy(),
      });
    }
  }

  private skapa(v: Sparad, mitt: boolean) {
    if (this.dod || this.djur.some((d) => d.uid === v.uid)) return;
    const plan = ritplan(v, this.kit);
    this.seTill(filerFor(v, this.kit), () => {
      if (this.dod || this.djur.some((d) => d.uid === v.uid)) return;
      this.bygg(v, mitt, plan);
    });
  }

  private bygg(v: Sparad, mitt: boolean, plan: ReturnType<typeof ritplan>) {
    const vald = valjStil(v);
    const stil = vald.stil;
    const zon = vald.zon;
    if (mitt) {
      for (const d of this.djur) {
        if (d.tarBort) continue;
        d.paus = 0;
        const p = this.punkt(d.zon, false);
        d.x = p.x;
        d.y = p.y;
        d.malX = p.x;
        d.malY = p.y;
        d.nod.setPosition(d.x, d.y);
      }
    }
    const plats = this.punkt(zon, mitt);
    const nod = this.add.container(plats.x, plats.y);
    const cx = (this.kit.duk?.b || 512) / 2;
    const cy = (this.kit.duk?.h || 512) / 2;
    const lager: Lager[] = [];
    for (const del of plan) {
      if (!this.textures.exists(del.url)) continue;
      const img = this.add.image(0, 0, del.url);
      const tex = this.textures.get(del.url);
      const src = tex.getSourceImage() as { width?: number; height?: number };
      const w = img.width || src?.width || 1;
      const h = img.height || src?.height || 1;
      let x = del.dx;
      let y = del.dy;
      if (!del.ankare) img.setOrigin(0.5);
      else {
        const piv = del.pivot ?? [w / 2, h / 2];
        img.setOrigin(piv[0] / w, piv[1] / h);
        x = del.ankare[0] - cx + del.dx;
        y = del.ankare[1] - cy + del.dy;
      }
      img.setPosition(x, y);
      img.setScale(del.skala);
      img.setAngle(del.rot);
      if (del.tint != null) img.setTint(hexTal(del.tint));
      if (del.blend === "multiply") img.setBlendMode(Phaser.BlendModes.MULTIPLY);
      if (del.blend === "add") img.setBlendMode(Phaser.BlendModes.ADD);
      img.setAlpha(del.alpha);
      const kropp = arKropp(del.namn);
      if (stil === "sim" && kropp) img.setCrop(0, 0, w, Math.floor(h * 0.67));
      const synlig = del.pose === "idle" && (del.ansikte == null || del.ansikte === "normal");
      img.setVisible(synlig);
      nod.add(img);
      lager.push({
        img,
        namn: del.namn,
        pose: del.pose,
        ansikte: del.ansikte,
        kropp,
        fritt: del.fritt,
        basSkala: del.skala,
        basVinkel: del.rot,
        basX: x,
        basY: y,
        basAlfa: del.alpha,
      });
    }
    if (v.glans) {
      const glans = this.add.image(0, 10, "glans");
      glans.setBlendMode(Phaser.BlendModes.ADD);
      glans.setScale(3.2);
      glans.setAlpha(0.35);
      nod.add(glans);
      lager.push({
        img: glans,
        namn: "glans",
        pose: "idle",
        ansikte: null,
        kropp: false,
        fritt: false,
        basSkala: 3.2,
        basVinkel: 0,
        basX: 0,
        basY: 10,
        basAlfa: 0.35,
      });
    }
    const bas = this.malSkala(v.skala);
    const fart = VERLD.b * 0.45 * (v.kropp === "dinosaurie" ? 0.7 : 1);
    nod.setScale(0.01);
    const djur: Djur = {
      uid: v.uid,
      spec: v,
      nod,
      lager,
      x: plats.x,
      y: plats.y,
      vx: stil === "sim" ? (Math.random() < 0.5 ? -fart : fart) : plats.x > VERLD.b * 0.5 ? -fart : fart,
      stil,
      zon,
      malX: plats.x,
      malY: plats.y,
      tid: Math.random() * 4,
      nasta: 0.6,
      sitt: false,
      sov: false,
      fodelse: 0,
      bas,
      tarBort: false,
      squash: 0,
      vag: 0,
      hopp: 0,
      blinkSlut: 0,
      nastaBlink: 1.2 + Math.random() * 2,
      dubbel: 0,
      gladStart: 0,
      gladTill: 0,
      vilar: 0,
      landar: 0,
      nastaLand: 6 + Math.random() * 4,
      spegel: 1,
      paus: mitt ? 1.4 : 0,
      glod: null,
      studs: 0,
      studsTid: 0,
      foddHop: false,
      ring: null,
    };
    const ring = this.add.circle(plats.x, plats.y - 24, 56, 0xfff8e1, 0);
    ring.setStrokeStyle(6, 0xffd54f, 0.95);
    ring.setDepth(plats.y + 4);
    djur.ring = ring;
    djur.gladStart = djur.tid;
    djur.gladTill = djur.tid + 1.5;
    nod.setPosition(djur.x, djur.y);
    nod.setInteractive(new Phaser.Geom.Rectangle(-160, -240, 320, 470), Phaser.Geom.Rectangle.Contains);
    let lang = false;
    let nere = false;
    let start = new Phaser.Math.Vector2();
    let timer: Phaser.Time.TimerEvent | null = null;
    nod.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!paDuken(p)) return;
      nere = true;
      lang = false;
      start = new Phaser.Math.Vector2(p.x, p.y);
      timer?.remove();
      timer = this.time.delayedCall(560, () => {
        if (!nere) return;
        lang = true;
        const pos = this.rel(p.x, p.y);
        brygga.skicka({ typ: "lang", uid: v.uid, ...pos });
      });
    });
    nod.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!nere) return;
      if (Phaser.Math.Distance.Between(start.x, start.y, p.x, p.y) > 28) {
        nere = false;
        timer?.remove();
      }
    });
    nod.on("pointerup", (p: Phaser.Input.Pointer) => {
      const varNere = nere;
      nere = false;
      timer?.remove();
      if (!varNere || lang) return;
      this.hoppa(djur);
      const pos = this.rel(p.x, p.y);
      brygga.skicka({ typ: "tryck", uid: v.uid, text: replik(v, "tryck"), ...pos });
    });
    this.djur.push(djur);
    this.smatter(plats.x, plats.y);
  }

  private smatter(x: number, y: number) {
    if (!this.textures.exists("glans")) return;
    for (let i = 0; i < 12; i++) {
      const c = this.add.image(x, y - 40, "glans");
      c.setBlendMode(Phaser.BlendModes.ADD);
      c.setScale(0.4);
      c.setDepth(y + 6);
      const a = (i / 12) * Math.PI * 2;
      this.tweens.add({
        targets: c,
        x: x + Math.cos(a) * (46 + Math.random() * 36),
        y: y - 70 - Math.random() * 80,
        alpha: 0,
        scale: 1.25,
        duration: 680,
        onComplete: () => c.destroy(),
      });
    }
  }

  private rel(gx: number, gy: number) {
    return {
      x: Phaser.Math.Clamp(gx / VERLD.b, 0.08, 0.92),
      y: Phaser.Math.Clamp(gy / VERLD.h, 0.12, 0.78),
    };
  }

  private hoppa(d: Djur) {
    d.squash = 0.22;
    d.studs = 0.64;
    d.studsTid = 0;
    d.gladStart = d.tid;
    d.gladTill = d.tid + Math.max(0.9, this.gladMs / 1000);
    if (this.blinkMs > 0) {
      d.blinkSlut = d.tid + this.blinkMs / 1000;
      d.dubbel = 0;
    }
  }

  private taBort(uid: string) {
    const d = this.djur.find((x) => x.uid === uid);
    if (!d || d.tarBort) return;
    d.tarBort = true;
    d.ring?.destroy();
    d.ring = null;
    this.tweens.add({
      targets: d.nod,
      alpha: 0,
      y: d.nod.y - 70,
      duration: 420,
      onComplete: () => {
        d.nod.destroy();
        this.djur = this.djur.filter((x) => x.uid !== uid);
      },
    });
  }

  private synka(d: Djur) {
    const glad = d.gladTill > d.gladStart && d.tid >= d.gladStart && d.tid < d.gladTill;
    const blinkar = !glad && d.tid < d.blinkSlut;
    const ansikte = blinkar ? "blink" : "normal";
    for (const lag of d.lager) {
      if (lag.ansikte) {
        if (lag.pose === "glad") lag.img.setVisible(glad && lag.ansikte === "glad");
        else lag.img.setVisible(!glad && lag.ansikte === ansikte);
      } else if (lag.kropp) {
        lag.img.setVisible(lag.pose === (glad ? "glad" : "idle"));
      }
    }
  }

  private fx(d: Djur) {
    const regnbage = d.spec.overraskningar.some((o) => o.effekt === "regnbågsflammor");
    const svaver = d.spec.overraskningar.some((o) => o.effekt === "svavande_eld");
    for (const lag of d.lager) {
      const img = lag.img;
      if (!img.visible && lag.kropp) continue;
      if (lag.fritt) {
        if (lag.namn === "vingar") img.setRotation(Math.sin(d.tid * 10) * 0.35);
        else if (lag.namn === "flammor") {
          const flick = 0.9 + Math.sin(d.tid * 14) * 0.1;
          img.setScale(lag.basSkala * flick);
          img.setAlpha(svaver ? 0.95 : flick);
        } else if (lag.namn === "aura") {
          img.setAlpha(lag.basAlfa * (0.82 + Math.sin(d.tid * 3) * 0.18));
        }
        continue;
      }
      if (!this.andas) continue;
      const våg = (sek: number) => 0.5 - 0.5 * Math.cos((d.tid / sek) * Math.PI * 2);
      if (lag.namn === "vingar") {
        const k = våg(0.52);
        img.setScale(lag.basSkala * (1 + (0.82 - 1) * k), lag.basSkala);
      } else if (lag.namn === "fena_L" || lag.namn === "fena_R") {
        const tecken = lag.namn === "fena_L" ? 1 : -1;
        img.setAngle(lag.basVinkel + Math.sin((d.tid / 1) * Math.PI * 2) * 10 * tecken);
      } else if (lag.namn === "bubblor") {
        const k = (d.tid % 1.6) / 1.6;
        img.setY(lag.basY - 24 * k);
        img.setAlpha(lag.basAlfa * (1 - k));
      } else if (lag.namn === "aura") {
        const k = våg(2.4);
        img.setScale(lag.basSkala * (0.96 + 0.08 * k));
        img.setAlpha(lag.basAlfa * (0.75 + 0.25 * k));
      } else if (lag.namn === "aura_gnistor") {
        img.setAngle(((d.tid * 1000) % 12000) / 12000 * 360);
        img.setAlpha(lag.basAlfa * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(d.tid * 6))));
      } else if (lag.namn === "eld" || lag.namn === "flammor") {
        const k = våg(0.28);
        img.setScale(lag.basSkala * (0.9 + 0.18 * k), lag.basSkala * (0.94 + 0.12 * k));
        img.setAlpha(svaver ? 0.95 : lag.basAlfa);
        if (regnbage) {
          const hue = (d.tid * 140) % 360;
          img.setTint(Phaser.Display.Color.HSLToColor(hue / 360, 0.85, 0.55).color);
        }
      } else if (lag.namn === "fart_linjer") {
        const k = (d.tid % 0.3) / 0.3;
        img.setX(lag.basX - 16 * k * d.spegel);
        img.setAlpha(lag.basAlfa * (1 - 0.7 * k));
      } else if (lag.namn === "glans") {
        img.setAlpha(0.22 + Math.sin(d.tid * 4) * 0.18);
      }
    }
    if (d.spec.kontur) {
      const a = 0.45 + Math.sin(d.tid * 6) * 0.55;
      for (const lag of d.lager) {
        if (lag.namn.startsWith("linje-") || lag.ansikte) lag.img.setAlpha(a);
      }
    }
  }

  private skilj(d: Djur, dt: number) {
    if (d.stil === "rus" || d.stil === "sim" || d.stil === "flyg") return;
    const min = VERLD.b * 0.24 * 0.6;
    for (const a of this.djur) {
      if (a === d || a.tarBort || a.stil === "flyg" || a.stil === "sim") continue;
      const dx = d.x - a.x;
      const dy = d.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      if (dist < min) {
        const knuff = ((min - dist) / min) * 80 * dt;
        d.x += (dx / dist) * knuff;
        d.y += (dy / dist) * knuff;
      }
    }
  }

  private hallInom(d: Djur, extraY: number) {
    const s = Math.abs(d.nod.scaleX) || 0.01;
    const sida = 110 * s;
    const topp = (d.stil === "flyg" ? 310 : 190) * s;
    const botten = 200 * s;
    const pad = 6;
    if (d.stil === "sim") {
      const z = this.lada("damm");
      d.x = Phaser.Math.Clamp(d.x, z.x0, z.x1);
      d.y = Phaser.Math.Clamp(d.y, Math.max(z.y0, pad + topp * 0.15), z.y1);
    } else if (d.stil === "rus") {
      d.y = Phaser.Math.Clamp(d.y, pad + topp, VERLD.h - pad - botten);
    } else {
      d.x = Phaser.Math.Clamp(d.x, pad + sida, VERLD.b - pad - sida);
      d.y = Phaser.Math.Clamp(d.y, pad + topp, VERLD.h - pad - botten);
    }
    d.nod.setPosition(d.x, d.y + extraY);
  }

  update(_tid: number, delta: number) {
    this.tick(_tid, delta);
  }

  private tick(_tid: number, delta: number) {
    this.nattHimmel?.rita();
    const dt = Math.min(0.05, delta / 1000);
    const n = this.djur.filter((d) => !d.tarBort).length;
    const kram = n > 6 ? 0.75 : 1;
    const duk = this.kit.duk?.b || 600;
    for (const d of this.djur) {
      if (d.tarBort) continue;
      d.tid += dt;
      d.fodelse += dt;
      if (this.blinkMs > 0 && d.tid > d.nastaBlink && d.tid > d.gladTill) {
        d.blinkSlut = d.tid + this.blinkMs / 1000;
        const [a, b] = this.blinkVarje;
        d.nastaBlink = d.tid + (a + Math.random() * (b - a)) / 1000;
        d.dubbel = Math.random() < this.dubbelChans ? 1 : 0;
      }
      if (d.dubbel === 1 && d.tid > d.blinkSlut + 0.07 && !(d.gladTill > d.gladStart && d.tid < d.gladTill)) {
        d.dubbel = 2;
        d.blinkSlut = d.tid + this.blinkMs / 1000;
      }
      this.synka(d);
      const ease = popEase(d.fodelse);
      if (!d.foddHop && d.fodelse > 0.42) {
        d.foddHop = true;
        d.studs = 0.64;
        d.studsTid = 0;
      }
      if (d.paus > 0) d.paus -= dt;
      else if (this.nattRor(d, dt)) {
        /* kväll: hem, träd eller uggla */
      } else if (d.stil === "flyg") this.flyg(d, dt);
      else if (d.stil === "sim") this.sim(d, dt);
      else if (d.stil === "rus") this.rus(d, dt);
      else this.ga(d, dt);
      this.skilj(d, dt);
      const bob = d.stil === "ga" && !d.sitt && !d.sov ? Math.sin(d.tid * 8) * 3 : 0;
      const glad = d.tid >= d.gladStart && d.tid < d.gladTill;
      let studsY = 0;
      if (d.studs > 0) {
        d.studsTid += dt;
        const u = Math.min(1, d.studsTid / 0.64);
        studsY = Math.sin(u * Math.PI) * (78 + 36 * d.bas);
        if (u >= 1) d.studs = 0;
      }
      const gladY = glad && d.studs <= 0 ? Math.sin(((d.tid - d.gladStart) / Math.max(0.4, this.gladMs / 1000)) * Math.PI * 2) * -18 : 0;
      const djupT = Phaser.Math.Clamp((d.y - VERLD.h * 0.45) / (VERLD.h * 0.4), 0, 1);
      const djup = d.stil === "flyg" ? 1 : 0.92 + 0.23 * djupT;
      let sx = d.bas * ease * djup * kram;
      if (ease > 0.95 && this.scale.displaySize.width > 80) {
        const fitNu = this.scale.displaySize.width / VERLD.b;
        const synlig = Math.abs(sx) * duk * KROPP_B * fitNu;
        const golv = 72 * d.spec.skala;
        if (synlig > 0 && synlig < golv) sx *= golv / synlig;
      }
      let sy = Math.abs(sx);
      if (d.spegel < 0) sx = -Math.abs(sx);
      if (this.andas && !glad) {
        const k = 0.5 - 0.5 * Math.cos((d.tid / (this.andasMs / 1000)) * Math.PI * 2);
        sx *= 1 + (this.andasSx - 1) * k;
        sy *= 1 + (this.andasSy - 1) * k;
      }
      if (d.squash > 0) {
        d.squash = Math.max(0, d.squash - dt);
        sx *= 0.9;
        sy *= 1.12;
      }
      d.nod.setScale(sx, sy);
      if (d.sov && this.nattNu() && d.spec.kropp !== "uggla" && d.stil !== "sim") {
        d.nod.setScale(Math.abs(sx), sy);
        d.nod.setAngle(80);
      }
      this.hallInom(d, bob - d.hopp - studsY + gladY);
      d.nod.setDepth(d.y);
      if (d.ring) {
        if (d.fodelse > 4.6) {
          d.ring.destroy();
          d.ring = null;
        } else {
          const wave = (d.fodelse * 1.7) % 1;
          const fade = d.fodelse > 3.4 ? Math.max(0, (4.6 - d.fodelse) / 1.2) : 1;
          d.ring.setPosition(d.x, d.y - 28);
          d.ring.setScale(0.7 + wave * 0.85);
          d.ring.setAlpha((1 - wave) * 0.95 * fade);
          d.ring.setDepth(d.y + 3);
        }
      }
      this.fx(d);
      this.glod(d);
    }
  }

  private nattNu() {
    return kvallStyrka(visningsTid()) > 0.7;
  }

  private nattRor(d: Djur, dt: number): boolean {
    if (!this.nattNu()) {
      if (d.sov && d.spec.kropp !== "uggla") d.sov = false;
      d.nod.rotation = d.stil === "flyg" || d.stil === "sim" || d.stil === "rus" ? d.nod.rotation : 0;
      return false;
    }
    if (d.spec.kropp === "uggla") {
      d.sov = false;
      d.landar = 0;
      d.nastaLand = d.tid + 999;
      this.flyg(d, dt);
      return true;
    }
    if (d.stil === "sim") {
      d.sov = true;
      this.sim(d, dt);
      return true;
    }
    const i = Math.max(0, this.djur.indexOf(d));
    const tradX = VERLD.b * 0.3;
    const tradY = VERLD.h * 0.58;
    const tx = tradX + (i % 3) * 28 - 28;
    const ty = tradY;
    const dx = tx - d.x;
    const dy = ty - d.y;
    const len = Math.hypot(dx, dy);
    if (len > 70) {
      d.sov = false;
      d.x += (dx / len) * 110 * dt;
      d.y += (dy / len) * 110 * dt;
      d.spegel = dx >= 0 ? 1 : -1;
      d.nod.rotation = 0;
    } else {
      d.sov = true;
      d.x += (tx - d.x) * Math.min(1, dt * 4);
      d.y += (ty - d.y) * Math.min(1, dt * 4);
      d.nod.rotation = 1.25;
    }
    d.hopp = 0;
    return true;
  }

  private glod(d: Djur) {
    const lyser = this.nattNu() && d.spec.formagor.includes("aura");
    if (!lyser) {
      d.glod?.setVisible(false);
      return;
    }
    if (!d.glod) d.glod = this.add.circle(0, 0, 78, 0xfff4c4, 0.42);
    d.glod.setVisible(true);
    d.glod.setPosition(d.nod.x, d.nod.y - 30);
    d.glod.setAlpha(0.28 + Math.sin(d.tid * 2) * 0.12);
    d.glod.setDepth(d.y - 2);
  }

  private flyg(d: Djur, dt: number) {
    const z = this.lada(d.zon);
    const uggla = d.spec.kropp === "uggla";
    if (d.landar > 0) {
      d.landar -= dt;
      const mark = this.lada("ang");
      d.y += (mark.y0 + 20 - d.y) * Math.min(1, dt * 1.6);
      d.nod.rotation = 0;
      d.spegel = 1;
      return;
    }
    if (d.tid > d.nastaLand) {
      d.landar = uggla ? 3 + Math.random() * 1.5 : 2 + Math.random() * 2;
      d.nastaLand = d.tid + (uggla ? 5 : 9) + Math.random() * 4;
    }
    const cx = (z.x0 + z.x1) / 2;
    const cy = (z.y0 + z.y1) / 2;
    const rx = (z.x1 - z.x0) * 0.42;
    const ry = (z.y1 - z.y0) * 0.38;
    const nx = cx + Math.sin(d.tid * 0.65) * rx;
    d.spegel = nx >= d.x ? 1 : -1;
    d.x = nx;
    d.y = cy + Math.sin(d.tid * 1.3) * ry;
    d.nod.rotation = Math.sin(d.tid * 1.3) * 0.06;
  }

  private sim(d: Djur, dt: number) {
    const z = this.lada("damm");
    d.x += d.vx * dt;
    if (d.x < z.x0 || d.x > z.x1) {
      d.vx *= -1;
      d.x = Phaser.Math.Clamp(d.x, z.x0, z.x1);
    }
    d.spegel = d.vx >= 0 ? 1 : -1;
    const mitt = (z.y0 + z.y1) / 2;
    d.y = mitt + Math.sin(d.tid * 1.1) * (z.y1 - z.y0) * 0.28;
    d.nod.rotation = d.spegel > 0 ? 0.04 : -0.04;
    if (d.tid - d.vag > 1.5) {
      d.vag = d.tid;
      const ring = this.add.ellipse(d.x, d.y + 18, 18, 8, 0xb3e5fc, 0.55);
      ring.setDepth(d.y - 1);
      this.tweens.add({
        targets: ring,
        width: 90,
        height: 28,
        alpha: 0,
        duration: 800,
        onComplete: () => ring.destroy(),
      });
    }
  }

  private rus(d: Djur, dt: number) {
    const z = this.lada(d.zon);
    const sida = 130 * Math.max(0.25, d.bas);
    const x0 = Math.max(z.x0, 6 + sida);
    const x1 = Math.min(z.x1, VERLD.b - 6 - sida);
    if (d.vilar > 0) {
      d.vilar -= dt;
      d.nod.rotation = 0;
      d.x = Phaser.Math.Clamp(d.x, x0, x1);
      return;
    }
    d.x += d.vx * dt;
    d.y = Phaser.Math.Clamp(d.y + Math.sin(d.tid * 3) * 10 * dt, z.y0, z.y1);
    if (d.x <= x0 || d.x >= x1) {
      d.x = Phaser.Math.Clamp(d.x, x0, x1);
      d.vx *= -1;
      d.vilar = 1 + Math.random() * 2;
    }
    d.spegel = d.vx >= 0 ? 1 : -1;
    d.nod.rotation = d.spegel > 0 ? 0.12 : -0.12;
  }

  private ga(d: Djur, dt: number) {
    d.nasta -= dt;
    const z = this.lada(d.zon);
    if (d.nasta <= 0) {
      d.sitt = false;
      d.sov = false;
      const r = Math.random();
      if (r < 0.12 && d.stil === "ga") {
        d.sitt = true;
        d.nasta = 1.6;
      } else if (r < 0.18 && d.stil === "ga") {
        d.sov = true;
        d.nasta = 2.2;
      } else if (d.spec.kropp === "groda" && r < 0.4) {
        const damm = this.lada("damm");
        d.malX = damm.x0 + Math.random() * (damm.x1 - damm.x0);
        d.malY = damm.y0;
        d.nasta = 1.4;
      } else {
        d.malX = z.x0 + Math.random() * (z.x1 - z.x0);
        d.malY = z.y0 + Math.random() * (z.y1 - z.y0);
        d.nasta = 2 + Math.random() * 2.4;
      }
    }
    if (!d.sitt && !d.sov) {
      const dx = d.malX - d.x;
      const dy = d.malY - d.y;
      const len = Math.hypot(dx, dy) || 1;
      const grund = d.stil === "hopp" ? 110 : 55;
      const fart = grund * (d.spec.kropp === "dinosaurie" ? 0.7 : 1);
      d.x += (dx / len) * fart * dt;
      d.y += (dy / len) * fart * dt;
      d.spegel = dx >= 0 ? 1 : -1;
    }
    d.x = Phaser.Math.Clamp(d.x, z.x0, z.x1);
    if (d.stil === "hopp") {
      const hojd = (d.bas * (this.kit.duk?.h || 600) * 0.62) / 3;
      d.hopp = Math.abs(Math.sin(d.tid * 4.2)) * hojd;
    } else d.hopp = 0;
    d.nod.rotation = 0;
  }
}
