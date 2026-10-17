import { laddaDeladeBilder } from "./deladeBilder.ts";
import * as PhaserNS from "phaser";
import type PhaserLib from "phaser";
import { valjStil } from "./beteende.ts";
import type { Sparad } from "./brygga.ts";
import { filerFor, hexTal, ritplan, VERLD, type Kit } from "./kit.ts";
import { SKYLTAR, UPP, VILDA, harTagg, type Vild } from "./aventyr.ts";
import { kvallStyrka, visningsTid } from "./liv.ts";
import { NattHimmel } from "./natthimmel.ts";
import { avBro, type AvLaget } from "./avbro.ts";

const Phaser = PhaserNS as unknown as typeof PhaserLib;

type Bild = PhaserLib.GameObjects.Image;
type Lager = { img: Bild; kropp: boolean; bas: number };
type DjurNod = {
  id: string;
  nod: PhaserLib.GameObjects.Container;
  lager: Lager[];
  x: number;
  y: number;
  vx: number;
  bas: number;
  tid: number;
  stil: string;
  spec: Sparad;
  ljus: boolean;
};

const PLATS: Record<string, { skyltar: string[]; vilda: string[]; saker: { id: string; x: number; y: number; slag: "skatt" | "plats" }[] }> = {
  skogen: {
    skyltar: ["skogen-1", "skogen-2", "skogen-3", "skogen-4"],
    vilda: ["mossugglan", "silverekorren"],
    saker: [
      { id: "silverkotte", x: 0.42, y: 0.78, slag: "skatt" },
      { id: "svampringen", x: 0.72, y: 0.68, slag: "plats" },
    ],
  },
  sjon: {
    skyltar: ["sjon-5", "sjon-6", "sjon-7", "sjon-8"],
    vilda: ["gamla-bavern", "parlhajen"],
    saker: [{ id: "on", x: 0.78, y: 0.42, slag: "plats" }],
  },
  on: {
    skyltar: [],
    vilda: ["vindhasten"],
    saker: [{ id: "on", x: 0.62, y: 0.48, slag: "plats" }],
  },
  grottan: {
    skyltar: ["grottan-9", "grottan-10", "grottan-11", "grottan-12"],
    vilda: ["kristallgrodan", "nattdraken"],
    saker: [{ id: "skattkista", x: 0.74, y: 0.62, slag: "skatt" }],
  },
};

const SKYLT_POS: Record<string, { x: number; y: number }> = {
  "skogen-1": { x: 0.16, y: 0.4 },
  "skogen-2": { x: 0.38, y: 0.58 },
  "skogen-3": { x: 0.62, y: 0.36 },
  "skogen-4": { x: 0.8, y: 0.55 },
  "sjon-5": { x: 0.16, y: 0.36 },
  "sjon-6": { x: 0.34, y: 0.52 },
  "sjon-7": { x: 0.52, y: 0.34 },
  "sjon-8": { x: 0.28, y: 0.7 },
  "grottan-9": { x: 0.18, y: 0.4 },
  "grottan-10": { x: 0.4, y: 0.58 },
  "grottan-11": { x: 0.58, y: 0.42 },
  "grottan-12": { x: 0.32, y: 0.72 },
};

const VILD_POS: Record<string, { x: number; y: number }> = {
  mossugglan: { x: 0.58, y: 0.32 },
  silverekorren: { x: 0.28, y: 0.7 },
  "gamla-bavern": { x: 0.36, y: 0.72 },
  parlhajen: { x: 0.58, y: 0.78 },
  vindhasten: { x: 0.48, y: 0.55 },
  kristallgrodan: { x: 0.36, y: 0.68 },
  nattdraken: { x: 0.62, y: 0.48 },
};

export class AvScen extends Phaser.Scene {
  private kit!: Kit;
  private rot = "/kit";
  private bakgrund!: PhaserLib.GameObjects.Graphics;
  private nattHimmel!: NattHimmel;
  private mork!: PhaserLib.GameObjects.Graphics;
  private maskG!: PhaserLib.GameObjects.Graphics;
  private djur: DjurNod[] = [];
  private skyltar: { id: string; nod: PhaserLib.GameObjects.Container }[] = [];
  private saker: { id: string; nod: PhaserLib.GameObjects.Container; x: number; y: number }[] = [];
  private folje: DjurNod | null = null;
  private ritad = "";
  private ljusX = VERLD.b * 0.5;
  private ljusY = VERLD.h * 0.55;
  private ko: { urls: string[]; klar: () => void }[] = [];
  private laddar = false;
  private senaste = "";
  private nattGlod!: PhaserLib.GameObjects.Graphics;

  constructor() {
    super("av");
  }

  preload() {
    this.kit = this.game.registry.get("kit") as Kit;
    this.rot = (this.game.registry.get("rot") as string) || "/kit";
  }

  create() {
    this.bakgrund = this.add.graphics();
    this.nattHimmel = new NattHimmel(this);
    this.nattGlod = this.add.graphics();
    this.nattGlod.setDepth(6);
    this.mork = this.add.graphics();
    this.maskG = this.make.graphics({});
    this.mork.setDepth(50);
    this.input.on("pointermove", (p: PhaserLib.Input.Pointer) => {
      this.ljusX = p.worldX;
      this.ljusY = p.worldY;
    });
    avBro.andra(() => this.synka());
    this.synka();
  }

  private kor(): boolean {
    return this.sys.settings.status === 5;
  }

  private synka() {
    if (!this.add?.graphics) return;
    const s = avBro.hamta();
    if (!s.plats) {
      if (this.scene.isActive()) this.scene.sleep();
      return;
    }
    if (this.scene.isSleeping()) this.scene.wake();
    if (!this.kit?.kroppar) {
      const k = this.game?.registry?.get("kit") as Kit | undefined;
      if (!k?.kroppar) return;
      this.kit = k;
    }
    const nyckel = JSON.stringify({
      p: s.plats,
      v: s.van,
      u: s.uppdrag,
      f: s.fyr,
      o: s.on,
      d: s.folje?.uid ?? "",
    });
    if (nyckel !== this.senaste) {
      this.senaste = nyckel;
      this.ritaBakgrund(s.plats, s.fyr);
      this.ritaSkyltar(s.plats);
      this.ritaSaker(s);
      this.ritaVilda(s);
      this.ritaFolje(s.folje);
    }
  }

  private ritaBakgrund(plats: string, fyr: boolean) {
    const g = this.bakgrund;
    g.clear();
    g.setDepth(0);
    if (plats === "skogen") {
      g.fillStyle(0x81c784, 1);
      g.fillRect(0, 0, VERLD.b, VERLD.h);
      g.fillStyle(0xc8e6c9, 0.8);
      g.fillRect(0, 0, VERLD.b, VERLD.h * 0.28);
      g.fillStyle(0xfff59d, 0.35);
      g.fillTriangle(80, 40, 140, 180, 20, 180);
      g.fillTriangle(420, 10, 500, 200, 340, 200);
      for (const [x, h] of [
        [70, 220],
        [160, 260],
        [250, 200],
        [430, 280],
        [540, 230],
        [640, 250],
        [300, 180],
        [500, 190],
      ] as const) {
        g.fillStyle(0x5d4037, 1);
        g.fillRect(x, VERLD.h * 0.55 - h * 0.2, 18, h * 0.45);
        g.fillStyle(0x2e7d32, 1);
        g.fillTriangle(x - 50, VERLD.h * 0.55, x + 9, VERLD.h * 0.55 - h, x + 70, VERLD.h * 0.55);
        g.fillStyle(0x388e3c, 1);
        g.fillTriangle(x - 38, VERLD.h * 0.48, x + 9, VERLD.h * 0.48 - h * 0.7, x + 56, VERLD.h * 0.48);
      }
      g.fillStyle(0x8d6e63, 1);
      g.fillEllipse(300, 760, 90, 36);
      g.fillStyle(0xe53935, 1);
      g.fillEllipse(270, 730, 28, 22);
      g.fillEllipse(330, 720, 26, 20);
      g.fillStyle(0xfafafa, 1);
      g.fillCircle(264, 724, 5);
      g.fillCircle(336, 714, 4);
      return;
    }
    if (plats === "sjon" || plats === "on") {
      g.fillStyle(0xb3e5fc, 1);
      g.fillRect(0, 0, VERLD.b, VERLD.h * 0.42);
      g.fillStyle(0xfff59d, 1);
      g.fillCircle(620, 70, 36);
      g.fillStyle(0x4fc3f7, 1);
      g.fillRect(0, VERLD.h * 0.42, VERLD.b, VERLD.h);
      g.lineStyle(4, 0xffffff, 0.8);
      for (let i = 0; i < 6; i++) g.lineBetween(40, 460 + i * 60, 180, 460 + i * 60);
      g.fillStyle(0x8d6e63, 1);
      g.fillRect(40, 500, 220, 16);
      g.fillRect(70, 500, 14, 80);
      g.fillRect(210, 500, 14, 80);
      if (plats === "sjon") {
        g.fillStyle(0x66bb6a, 1);
        g.fillEllipse(600, 360, 220, 90);
        g.fillStyle(0xc62828, 1);
        g.fillRect(590, 300, 22, 50);
        g.fillStyle(0xfffde7, 1);
        g.fillCircle(601, 292, 12);
      } else {
        g.fillStyle(0x66bb6a, 1);
        g.fillEllipse(VERLD.b / 2, 620, 520, 220);
        g.fillStyle(0xc62828, 1);
        g.fillRect(460, 430, 28, 90);
        g.fillStyle(0xffecb3, 1);
        g.fillRect(448, 400, 52, 36);
        g.fillStyle(fyr ? 0xfff176 : 0x455a64, 1);
        g.fillCircle(474, 392, 16);
      }
      return;
    }
    g.fillStyle(0x263238, 1);
    g.fillRect(0, 0, VERLD.b, VERLD.h);
    const krist = [
      [80, 200, 0x7e57c2],
      [160, 260, 0x26c6da],
      [560, 220, 0x7e57c2],
      [640, 300, 0x26c6da],
      [200, 640, 0x7e57c2],
      [520, 680, 0x7e57c2],
      [400, 180, 0x26c6da],
    ] as const;
    for (const [x, y, f] of krist) {
      g.fillStyle(f, 1);
      g.fillTriangle(x, y, x + 18, y + 50, x - 18, y + 50);
      g.fillStyle(0xffffff, 0.35);
      g.fillTriangle(x, y + 6, x + 6, y + 28, x - 4, y + 28);
    }
  }

  private ritaSkyltar(plats: string) {
    for (const s of this.skyltar) s.nod.destroy();
    this.skyltar = [];
    const ids = PLATS[plats]?.skyltar ?? [];
    for (const id of ids) {
      const pos = SKYLT_POS[id];
      const meta = SKYLTAR.skyltar.find((s) => s.id === id);
      if (!pos || !meta) continue;
      const nod = this.add.container(pos.x * VERLD.b, pos.y * VERLD.h);
      const g = this.add.graphics();
      g.fillStyle(0x6d4c41, 1);
      g.fillRect(-4, 0, 8, 46);
      g.fillStyle(meta.typ === "lapp" ? 0xfff8e1 : 0xefebe9, 1);
      g.fillRoundedRect(-36, -40, 72, 44, 6);
      g.lineStyle(3, 0x5d4037, 1);
      g.strokeRoundedRect(-36, -40, 72, 44, 6);
      nod.add(g);
      nod.setDepth(pos.y * VERLD.h);
      nod.setInteractive(new Phaser.Geom.Rectangle(-40, -44, 80, 96), Phaser.Geom.Rectangle.Contains);
      nod.on("pointerup", () => {
        if (!this.syns(nod.x, nod.y)) return;
        avBro.skicka({ typ: "skylt", id });
      });
      this.skyltar.push({ id, nod });
    }
  }

  private ritaSaker(s: AvLaget) {
    for (const x of this.saker) x.nod.destroy();
    this.saker = [];
    const plats = s.plats ?? "";
    for (const sak of PLATS[plats]?.saker ?? []) {
      if (sak.slag === "skatt") {
        const upp = UPP.uppdrag.find((u) => u.mal.tryck === sak.id);
        if (!upp || s.uppdrag[upp.id] !== "pagar") continue;
      }
      if (sak.id === "svampringen" && s.uppdrag["svampring"] !== "pagar") continue;
      if (sak.id === "on" && plats === "on" && s.uppdrag.fyren !== "pagar") continue;
      const nod = this.add.container(sak.x * VERLD.b, sak.y * VERLD.h);
      const g = this.add.graphics();
      if (sak.id === "silverkotte") {
        g.fillStyle(0xcfd8dc, 1);
        g.fillEllipse(0, -10, 28, 40);
        g.fillStyle(0x90a4ae, 1);
        for (let i = 0; i < 4; i++) g.fillEllipse(-8 + i * 5, -20 + i * 6, 10, 8);
      } else if (sak.id === "skattkista") {
        g.fillStyle(0x6d4c41, 1);
        g.fillRoundedRect(-28, -20, 56, 36, 4);
        g.fillStyle(0xffc107, 1);
        g.fillRect(-30, -24, 60, 10);
        g.fillCircle(0, -4, 5);
      } else if (sak.id === "svampringen") {
        g.fillStyle(0xe53935, 1);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          g.fillEllipse(Math.cos(a) * 36, -10 + Math.sin(a) * 16, 18, 14);
        }
      } else if (sak.id === "on" && plats === "sjon") {
        g.fillStyle(0xffffff, 0.01);
        g.fillCircle(0, 0, 50);
      } else if (sak.id === "on") {
        g.fillStyle(0xfff176, s.fyr ? 1 : 0.3);
        g.fillCircle(0, -70, 22);
      }
      nod.add(g);
      nod.setDepth(sak.y * VERLD.h + 1);
      nod.setInteractive(new Phaser.Geom.Rectangle(-48, -48, 96, 96), Phaser.Geom.Rectangle.Contains);
      nod.on("pointerup", () => {
        if (!this.syns(sak.x * VERLD.b, sak.y * VERLD.h)) return;
        avBro.skicka({ typ: sak.slag, id: sak.id });
      });
      this.saker.push({ id: sak.id, nod, x: sak.x * VERLD.b, y: sak.y * VERLD.h });
    }
    this.ritad = plats;
  }

  private ritaVilda(s: AvLaget) {
    for (const d of this.djur) d.nod.destroy();
    this.djur = [];
    const plats = s.plats ?? "";
    for (const id of PLATS[plats]?.vilda ?? []) {
      if (s.van.includes(id)) continue;
      const v = VILDA.djur.find((d) => d.id === id);
      const pos = VILD_POS[id];
      if (!v || !pos) continue;
      this.laggDjur(v, pos.x * VERLD.b, pos.y * VERLD.h, id);
    }
  }

  private ritaFolje(spec: Sparad | null) {
    this.folje?.nod.destroy();
    this.folje = null;
    if (!spec) return;
    const x = VERLD.b * 0.5;
    const y = VERLD.h * 0.62;
    this.seTill(filerFor(spec, this.kit), () => {
      if (avBro.hamta().folje?.uid !== spec.uid) return;
      const nod = this.gorNod(spec, x, y);
      if (!nod) return;
      this.folje = nod;
    });
  }

  private laggDjur(v: Vild, x: number, y: number, id: string) {
    const spec: Sparad = {
      ...{
        kropp: v.utseende.kropp,
        farg: v.utseende.farg,
        monster: v.utseende.monster ?? null,
        monsterfarg: v.utseende.monsterfarg ?? null,
        formagor: v.utseende.formagor ?? [],
        tillbehor: (v.utseende.tillbehor ?? []).map((t) => ({ id: t.id, farg: t.farg, glans: false })),
        skala: 1,
        alpha: v.utseende.alpha ?? 1,
        kontur: true,
        glans: !!v.utseende.glans,
        formel: v.namn,
        beskrivning: v.namn,
        overraskningar: [],
      },
      uid: id,
      skapad: 0,
    };
    this.seTill(filerFor(spec, this.kit), () => {
      if (avBro.hamta().van.includes(id)) return;
      const nod = this.gorNod(spec, x, y);
      if (!nod) return;
      let sen = 0;
      nod.nod.on("pointerup", () => {
        if (!this.syns(nod.x, nod.y)) return;
        const nu = Date.now();
        if (nu - sen < 450) {
          nod.x += nod.vx > 0 ? 50 : -50;
          nod.nod.setPosition(nod.x, nod.y);
        }
        sen = nu;
        avBro.skicka({ typ: "vild", id });
      });
      nod.ljus = harTagg(spec, "lysa");
      this.djur.push(nod);
    });
  }

  private gorNod(spec: Sparad, x: number, y: number): DjurNod | null {
    if (!this.kit?.kroppar) return null;
    const plan = ritplan(spec, this.kit);
    const nod = this.add.container(x, y);
    const cx = (this.kit.duk?.b || 512) / 2;
    const cy = (this.kit.duk?.h || 512) / 2;
    const lager: Lager[] = [];
    for (const del of plan) {
      if (!this.textures.exists(del.url)) continue;
      const img = this.add.image(0, 0, del.url);
      const w = img.width || 1;
      const h = img.height || 1;
      let px = del.dx;
      let py = del.dy;
      if (!del.ankare) img.setOrigin(0.5);
      else {
        const piv = del.pivot ?? [w / 2, h / 2];
        img.setOrigin(piv[0] / w, piv[1] / h);
        px = del.ankare[0] - cx + del.dx;
        py = del.ankare[1] - cy + del.dy;
      }
      img.setPosition(px, py);
      img.setScale(del.skala);
      img.setAngle(del.rot);
      if (del.tint != null) img.setTint(hexTal(del.tint));
      img.setAlpha(del.alpha);
      const synlig = del.pose === "idle" && (del.ansikte == null || del.ansikte === "normal");
      img.setVisible(synlig);
      const kropp = /^(skugga|bas|monster|linje|ansikte)-/.test(del.namn);
      if (valjStil(spec).stil === "sim" && kropp) img.setCrop(0, 0, w, Math.floor(h * 0.67));
      nod.add(img);
      lager.push({ img, kropp, bas: del.skala });
    }
    const duk = this.kit.duk?.b || 600;
    const bas = ((VERLD.b * 0.18) / (duk * 0.42)) * (spec.skala || 1);
    nod.setScale(bas);
    nod.setDepth(y);
    nod.setInteractive(new Phaser.Geom.Rectangle(-120, -180, 240, 320), Phaser.Geom.Rectangle.Contains);
    return {
      id: spec.uid,
      nod,
      lager,
      x,
      y,
      vx: 36,
      bas,
      tid: Math.random() * 4,
      stil: valjStil(spec).stil,
      spec,
      ljus: harTagg(spec, "lysa"),
    };
  }

  private syns(x: number, y: number): boolean {
    if (avBro.hamta().plats !== "grottan") return true;
    const r = this.radie();
    const cx = this.folje && harTagg(this.folje.spec, "lysa") ? this.folje.x : this.ljusX;
    const cy = this.folje && harTagg(this.folje.spec, "lysa") ? this.folje.y : this.ljusY;
    const iLjus = Math.hypot(x - cx, y - cy) < r || Math.hypot(x - this.ljusX, y - this.ljusY) < 80;
    return iLjus;
  }

  private radie(): number {
    return this.folje && harTagg(this.folje.spec, "lysa") ? 230 : 70;
  }

  update(_t: number, dtMs: number) {
    const s = avBro.hamta();
    if (!s.plats) {
      if (this.sys.settings.status === 5) this.scene.sleep();
      return;
    }
    if (!this.bakgrund) return;
    this.nattHimmel?.rita();
    if (this.ko.length) this.nastaKo();
    const dt = Math.min(0.05, dtMs / 1000);
    const alla = [...this.djur, ...(this.folje ? [this.folje] : [])];
    for (const d of alla) {
      d.tid += dt;
      if (d.stil === "flyg") {
        d.y = d.y + Math.sin(d.tid * 2) * 0.4;
        d.nod.y = (VILD_POS[d.id]?.y ?? 0.5) * VERLD.h - 40 + Math.sin(d.tid * 2) * 10;
      } else if (d.stil === "sim") {
        d.x += d.vx * dt;
        const hem = (VILD_POS[d.id]?.x ?? 0.5) * VERLD.b;
        if (d.x > hem + 70 || d.x < hem - 70) d.vx *= -1;
        d.nod.setScale(d.vx > 0 ? d.bas : -d.bas, d.bas);
        d.nod.setPosition(d.x, d.y);
      } else if (d === this.folje) {
        d.x += d.vx * dt;
        if (d.x > VERLD.b * 0.72 || d.x < VERLD.b * 0.28) d.vx *= -1;
        d.nod.setScale(d.vx > 0 ? d.bas : -d.bas, d.bas);
        d.nod.setPosition(d.x, d.y);
      }
      d.nod.setVisible(this.syns(d.nod.x, d.nod.y));
    }
    for (const sk of this.skyltar) sk.nod.setVisible(this.syns(sk.nod.x, sk.nod.y));
    for (const sak of this.saker) sak.nod.setVisible(this.syns(sak.x, sak.y));
    this.ritaNatt(s.plats);
    this.ritaMorker(s.plats);
  }

  private ritaNatt(plats: string) {
    if (!this.nattGlod) return;
    this.nattGlod.clear();
    const styrka = kvallStyrka(visningsTid());
    if (styrka < 0.2 || plats !== "on") return;
    const puls = 64 + Math.sin(this.time.now / 380) * 10;
    this.nattGlod.fillStyle(0xfff176, 0.45 * styrka);
    this.nattGlod.fillCircle(474, 392, puls);
    this.nattGlod.fillStyle(0xfffde7, 0.9);
    this.nattGlod.fillCircle(474, 392, 14);
  }

  private ritaMorker(plats: string) {
    this.mork.clear();
    if (plats !== "grottan") return;
    const r = this.radie();
    const cx = this.folje && harTagg(this.folje.spec, "lysa") ? this.folje.x : this.ljusX;
    const cy = this.folje && harTagg(this.folje.spec, "lysa") ? this.folje.y - 40 : this.ljusY;
    this.mork.fillStyle(0x000000, 0.93);
    this.mork.fillRect(0, 0, VERLD.b, VERLD.h);
    this.mork.fillStyle(0x000000, 1);
    this.maskG.clear();
    this.maskG.fillStyle(0xffffff, 1);
    this.maskG.fillCircle(cx, cy, r);
    this.maskG.fillCircle(this.ljusX, this.ljusY, 78);
    if (!this.mork.mask) {
      const mask = this.maskG.createGeometryMask();
      mask.invertAlpha = true;
      this.mork.setMask(mask);
    }
  }

  private seTill(urls: string[], klar: () => void) {
    const saknas = urls.filter((u) => u && !this.textures.exists(u));
    if (!saknas.length) {
      klar();
      return;
    }
    this.ko.push({ urls: saknas, klar });
    this.nastaKo();
  }

  private nastaKo() {
    if (this.laddar || !this.ko.length) return;
    if (this.sys.settings.status !== 5) return;
    const batch = this.ko.splice(0);
    const alla = [...new Set(batch.flatMap((b) => b.urls))].filter((u) => u && !this.textures.exists(u));
    if (!alla.length) {
      for (const b of batch) b.klar();
      this.nastaKo();
      return;
    }
    this.laddar = true;
    void laddaDeladeBilder(this, alla, this.rot).then(() => {
      this.laddar = false;
      if (!this.sys.isActive() && !this.sys.isSleeping()) return;
      for (const b of batch) b.klar();
      this.nastaKo();
    });

  }
}
