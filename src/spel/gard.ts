import { laddaDeladeBilder } from "./deladeBilder.ts";
import * as PhaserNS from "phaser";
import { paDuken } from "./pekare.ts";
import type PhaserLib from "phaser";
import { valjStil } from "./beteende.ts";
import { brygga, type Sparad } from "./brygga.ts";
import type { SparatBygge } from "./bygge.ts";
import { byggMedId } from "../tolk/byggtolk.ts";
import { filerFor, hexTal, ritplan, VERLD, type Kit } from "./kit.ts";
import { kvallStyrka, visningsTid } from "./liv.ts";
import { NattHimmel } from "./natthimmel.ts";
import { useMinne } from "./minne.ts";
import { byggeRorSig, ritaBygge } from "./ritaBygg.ts";
import type { Varelse } from "../tolk/typer.ts";
import texter from "../../data/texter-gard.json" with { type: "json" };

const Phaser = PhaserNS as unknown as typeof PhaserLib;
const PRAT = (texter as { djur_repliker_hemma: string[] }).djur_repliker_hemma;

type Bild = PhaserLib.GameObjects.Image;
type Lager = { img: Bild; kropp: boolean; bas: number };

type Nod = {
  uid: string;
  spec: SparatBygge;
  nod: PhaserLib.GameObjects.Container;
  g: PhaserLib.GameObjects.Graphics;
  w: number;
  h: number;
};

type Djur = {
  uid: string;
  spec: Sparad;
  hem: string;
  nod: PhaserLib.GameObjects.Container;
  lager: Lager[];
  x: number;
  y: number;
  vx: number;
  bas: number;
  tid: number;
  stil: string;
  sov: boolean;
};

export class GardScen extends Phaser.Scene {
  private kit!: Kit;
  private rot = "/kit";
  private byggen: Nod[] = [];
  private djur: Djur[] = [];
  private flyttar: string | null = null;
  private ko: { urls: string[]; klar: () => void }[] = [];
  private laddar = false;
  private lykta!: PhaserLib.GameObjects.Graphics;
  private nattHimmel!: NattHimmel;
  private mossaNod: PhaserLib.GameObjects.Container | null = null;
  private glodar: PhaserLib.GameObjects.Arc[] = [];

  constructor() {
    super("gard");
  }

  preload() {
    this.kit = this.game.registry.get("kit") as Kit;
    this.rot = (this.game.registry.get("rot") as string) || "/kit";
    const bg = this.kit.bakgrund_utan_damm;
    if (bg) this.load.image(bg, `${this.rot}/${bg}`);
  }

  create() {
    const bg = this.kit.bakgrund_utan_damm;
    if (bg && this.textures.exists(bg)) {
      const bild = this.add.image(VERLD.b / 2, VERLD.h / 2, bg);
      bild.setDisplaySize(VERLD.b, VERLD.h);
    }
    this.input.topOnly = true;
    this.input.on("pointermove", (p: PhaserLib.Input.Pointer) => {
      if (!this.flyttar || !p.isDown) return;
      const b = this.byggen.find((x) => x.uid === this.flyttar);
      if (!b) return;
      b.nod.setPosition(p.worldX, p.worldY);
      b.nod.setDepth(p.worldY);
    });
    this.input.on("pointerup", (p: PhaserLib.Input.Pointer) => {
      if (!this.flyttar) return;
      const uid = this.flyttar;
      this.flyttar = null;
      const b = this.byggen.find((x) => x.uid === uid);
      if (!b) return;
      b.nod.setPosition(p.worldX, p.worldY);
      brygga.skicka({ typ: "byggd", uid, x: p.worldX / VERLD.b, y: p.worldY / VERLD.h });
    });
    this.lykta = this.add.graphics();
    this.lykta.setDepth(8);
    this.nattHimmel = new NattHimmel(this);
    this.ritaMossa();
    brygga.registrera("gard", {
      skapa: () => undefined,
      taBort: (uid) => this.taBortDjur(uid),
      puff: () => undefined,
      platser: () => this.djur.map((d) => ({ uid: d.uid, x: d.x / VERLD.b, y: d.y / VERLD.h, topp: (d.y - 80) / VERLD.h })),
      tom: () => this.tom(),
      visa: (pa) => {
        if (pa) {
          if (this.scene.isSleeping()) this.scene.wake();
          this.synka();
          this.nastaKo();
        } else if (this.sys.settings.status === 5) {
          this.scene.sleep();
        }
      },
      synka: () => this.synka(),
      flytta: (uid) => {
        this.flyttar = uid;
      },
      glad: (uid) => {
        const d = this.djur.find((x) => x.uid === uid);
        if (!d) return;
        this.tweens.add({ targets: d.nod, y: d.y - 30, yoyo: true, duration: 180 });
      },
    });
    this.synka();
    // sleep() inne i create skrivs över när scenen sedan sätts till RUNNING.
    this.events.once("create", () => {
      if (brygga.plats() !== "gard") this.scene.sleep();
      else this.synka();
      this.nastaKo();
    });
  }

  update(_t: number, dtMs: number) {
    this.nattHimmel?.rita();
    const dt = Math.min(0.05, dtMs / 1000);
    const tid = this.time.now / 1000;
    const natt = kvallStyrka(visningsTid()) > 0.7;
    for (const b of this.byggen) {
      if (!byggeRorSig(b.spec) && b.spec.material !== "moln") continue;
      const mal = ritaBygge(b.g, b.spec, tid);
      b.w = mal.w;
      b.h = mal.h;
      if (b.spec.material === "moln") b.nod.y = b.spec.y * VERLD.h + Math.sin(tid * 2) * 8;
    }
    for (const d of this.djur) {
      d.tid += dt;
      const hem = this.byggen.find((b) => b.uid === d.hem);
      const hx = hem ? hem.nod.x : d.x;
      const hy = hem ? hem.nod.y : d.y;
      if (!natt) d.sov = false;
      const uggla = d.spec.kropp === "uggla";
      if (natt && uggla) {
        d.sov = false;
        d.x = hx + Math.sin(d.tid * 0.9) * 90;
        d.y = hy - 150 + Math.sin(d.tid * 2.2) * 16;
        d.nod.setScale(Math.sin(d.tid) >= 0 ? d.bas : -d.bas, d.bas);
        d.nod.rotation = Math.sin(d.tid * 3) * 0.08;
      } else if (natt) {
        const malX = hx;
        const malY = hy - 8;
        const dx = malX - d.x;
        const dy = malY - d.y;
        if (Math.hypot(dx, dy) > 10) {
          d.sov = false;
          d.x += dx * Math.min(1, dt * 1.6);
          d.y += dy * Math.min(1, dt * 1.6);
          d.nod.rotation = 0;
          d.nod.setScale(dx >= 0 ? d.bas : -d.bas, d.bas);
        } else {
          d.sov = true;
          d.x = malX;
          d.y = malY;
          d.nod.rotation = 0.5;
          d.nod.setScale(d.bas);
        }
      } else if (d.stil === "sim") {
        const bred = hem?.spec.bygg === "vallgrav" ? 110 : 70;
        d.x += d.vx * dt;
        if (d.x > hx + bred || d.x < hx - bred) d.vx *= -1;
        const vatten = hem?.spec.bygg === "vallgrav" ? hy - 4 : hy - 16;
        d.y = vatten + Math.sin(d.tid * 2.2) * 8;
        d.nod.setScale(d.vx > 0 ? d.bas : -d.bas, d.bas);
        d.nod.rotation = d.vx > 0 ? 0.08 : -0.08;
      } else if (d.stil === "flyg") {
        d.x = hx + Math.sin(d.tid * 0.8) * 24;
        d.y = hy - (hem?.spec.bygg === "fågelholk" ? 120 : 90) + Math.sin(d.tid * 2) * 6;
        d.nod.setScale(d.bas);
        d.nod.rotation = Math.sin(d.tid * 3) * 0.06;
      } else {
        d.x += d.vx * dt;
        if (Math.abs(d.x - hx) > 70) d.vx *= -1;
        d.y = hy - 8;
        d.nod.setScale(d.vx >= 0 ? d.bas : -d.bas, d.bas);
        d.nod.rotation = 0;
      }
      d.nod.setPosition(d.x, d.y);
      d.nod.setDepth(d.y + 90);
    }
    this.lysByggen(natt, tid);
  }

  private ritaLykta(natt: boolean, tid: number) {
    const g = this.lykta;
    if (!g) return;
    g.clear();
    const x = VERLD.b * 0.16;
    const y = VERLD.h * 0.66;
    if (natt) {
      g.fillStyle(0xfff3c4, 0.28 + Math.sin(tid * 3) * 0.06);
      g.fillCircle(x, y - 78, 70);
    }
    g.fillStyle(0x6d4c41, 1);
    g.fillRect(x - 5, y - 70, 10, 78);
    g.fillStyle(natt ? 0xffecb3 : 0xd7ccc8, 1);
    g.fillRoundedRect(x - 16, y - 102, 32, 28, 4);
    g.lineStyle(3, 0x5d4037, 1);
    g.strokeRoundedRect(x - 16, y - 102, 32, 28, 4);
  }

  private lysByggen(natt: boolean, tid: number) {
    const behov = natt ? this.byggen.filter((b) => b.spec.bygg === "lykta" || b.spec.bygg === "fyr") : [];
    while (this.glodar.length < behov.length) {
      const c = this.add.circle(0, 0, 54, 0xfff4c4, 0.4);
      c.setDepth(7);
      this.glodar.push(c);
    }
    this.glodar.forEach((c, i) => {
      const b = behov[i];
      if (!b) {
        c.setVisible(false);
        return;
      }
      c.setVisible(true);
      c.setPosition(b.nod.x, b.nod.y - 40);
      c.setAlpha(0.35 + Math.sin(tid * 3 + i) * 0.1);
    });
  }

  private ritaMossa() {
    if (!this.kit?.kroppar) return;
    const x = VERLD.b * 0.78;
    const y = VERLD.h * 0.7;
    const stubbe = this.add.graphics();
    stubbe.fillStyle(0x6d4c41, 1);
    stubbe.fillRoundedRect(x - 28, y - 36, 56, 48, 8);
    stubbe.fillStyle(0x8d6e63, 1);
    stubbe.fillEllipse(x, y - 36, 64, 22);
    stubbe.setDepth(y);
    const spec: Varelse & { uid: string; skapad: number } = {
      uid: "mossa",
      skapad: 0,
      kropp: "groda",
      farg: "#2E7D32",
      monster: null,
      monsterfarg: null,
      formagor: [],
      tillbehor: [
        { id: "hatt", farg: "#C62828", glans: false },
        { id: "mantel", farg: "#2E7D32", glans: false },
      ],
      skala: 0.9,
      alpha: 1,
      kontur: false,
      glans: false,
      formel: "",
      beskrivning: "",
      overraskningar: [],
    };
    const placera = () => {
      if (this.mossaNod || !this.kitRedo()) return;
      const plan = ritplan(spec, this.kit);
      const nod = this.add.container(x - 78, y);
      const cx = (this.kit.duk?.b || 512) / 2;
      const cy = (this.kit.duk?.h || 512) / 2;
      for (const del of plan) {
        if (!this.textures.exists(del.url)) continue;
        if (del.pose !== "idle") continue;
        if (del.ansikte && del.ansikte !== "normal") continue;
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
        nod.add(img);
      }
      const duk = this.kit.duk?.b || 600;
      const bas = ((VERLD.b * 0.16) / (duk * 0.42)) * 0.9;
      nod.setScale(bas);
      nod.setDepth(y + 30);
      nod.setInteractive(new Phaser.Geom.Rectangle(-150, -220, 300, 420), Phaser.Geom.Rectangle.Contains);
      nod.on("pointerup", (p: PhaserLib.Input.Pointer) => {
        if (!paDuken(p)) return;
        brygga.skicka({ typ: "mossa", x: (x - 78) / VERLD.b, y: (y - 120) / VERLD.h });
      });
      this.mossaNod = nod;
    };
    this.seTill(filerFor(spec, this.kit), placera);
  }

  private tom() {
    for (const b of this.byggen) b.nod.destroy();
    for (const d of this.djur) d.nod.destroy();
    this.byggen = [];
    this.djur = [];
  }

  private kitRedo(): boolean {
    if (!this.add?.container) return false;
    if (this.kit?.kroppar) return true;
    const k = this.game?.registry?.get("kit") as Kit | undefined;
    if (!k?.kroppar) return false;
    this.kit = k;
    const rot = this.game.registry.get("rot") as string | undefined;
    if (rot) this.rot = rot;
    return true;
  }

  private synka() {
    if (!this.kitRedo()) return;
    const s = useMinne.getState();
    const ids = new Set(s.garden.map((b) => b.uid));
    for (const b of [...this.byggen]) {
      if (!ids.has(b.uid)) {
        b.nod.destroy();
        this.byggen = this.byggen.filter((x) => x.uid !== b.uid);
      }
    }
    for (const spec of s.garden) {
      const har = this.byggen.find((b) => b.uid === spec.uid);
      if (!har) this.lagg(spec);
      else {
        har.spec = spec;
        if (this.flyttar !== spec.uid) {
          har.nod.setPosition(spec.x * VERLD.b, spec.y * VERLD.h);
          har.nod.setDepth(spec.y * VERLD.h);
        }
        const mal = ritaBygge(har.g, spec, this.time.now / 1000);
        har.w = mal.w;
        har.h = mal.h;
        har.nod.setInteractive(
          new Phaser.Geom.Rectangle(-har.w / 2, -har.h + 30, har.w, har.h),
          Phaser.Geom.Rectangle.Contains,
        );
      }
    }
    const hemIds = new Set(s.hemma.map((h) => h.spec.uid));
    for (const d of [...this.djur]) {
      if (!hemIds.has(d.uid)) this.taBortDjur(d.uid);
    }
    for (const h of s.hemma) {
      const d = this.djur.find((x) => x.uid === h.spec.uid);
      if (!d) this.laggDjur(h.spec, h.hem);
      else d.hem = h.hem;
    }
  }

  private lagg(spec: SparatBygge) {
    const nod = this.add.container(spec.x * VERLD.b, spec.y * VERLD.h);
    nod.setScale(0.04);
    this.tweens.add({
      targets: nod,
      scaleX: 0.72,
      scaleY: 0.72,
      duration: 680,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: nod,
      angle: 7,
      duration: 140,
      yoyo: true,
      repeat: 1,
    });
    const gnista = this.add.graphics();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      gnista.fillStyle(i % 2 === 0 ? 0xffe082 : 0xf48fb1, 1);
      gnista.fillCircle(Math.cos(a) * 42, Math.sin(a) * 28 - 36, 6);
    }
    gnista.setPosition(nod.x, nod.y);
    gnista.setDepth(spec.y * VERLD.h + 2);
    this.tweens.add({
      targets: gnista,
      alpha: 0,
      scale: 1.7,
      y: nod.y - 64,
      duration: 800,
      onComplete: () => gnista.destroy(),
    });
    const ring = this.add.circle(nod.x, nod.y - 30, 18, 0xffe082, 0);
    ring.setStrokeStyle(7, 0xffd54f, 1);
    ring.setDepth(spec.y * VERLD.h + 3);
    this.tweens.add({
      targets: ring,
      scale: 4.5,
      alpha: 0,
      duration: 720,
      onComplete: () => ring.destroy(),
    });
    const g = this.add.graphics();
    nod.add(g);
    const mal = ritaBygge(g, spec, 0);
    nod.setDepth(spec.y * VERLD.h);
    nod.setInteractive(new Phaser.Geom.Rectangle(-mal.w / 2, -mal.h + 30, mal.w, mal.h), Phaser.Geom.Rectangle.Contains);
    let lang = false;
    let nere = false;
    let start = new Phaser.Math.Vector2();
    let timer: PhaserLib.Time.TimerEvent | null = null;
    const skicka = (typ: "bygg" | "byggLang") => {
      const r = nod.getBounds();
      const cam = this.cameras.main;
      const x = (r.centerX - cam.worldView.x) / cam.worldView.width;
      const y = (r.top - cam.worldView.y) / cam.worldView.height;
      brygga.skicka({ typ, uid: spec.uid, x, y });
    };
    nod.on("pointerdown", (p: PhaserLib.Input.Pointer) => {
      if (this.flyttar || !paDuken(p)) return;
      nere = true;
      lang = false;
      start = new Phaser.Math.Vector2(p.x, p.y);
      timer?.remove();
      timer = this.time.delayedCall(560, () => {
        if (!nere) return;
        lang = true;
        skicka("byggLang");
      });
    });
    nod.on("pointermove", (p: PhaserLib.Input.Pointer) => {
      if (!nere) return;
      if (Phaser.Math.Distance.Between(start.x, start.y, p.x, p.y) > 18) {
        nere = false;
        timer?.remove();
      }
    });
    const slapp = () => {
      nere = false;
      timer?.remove();
    };
    nod.on("pointerup", (p: PhaserLib.Input.Pointer) => {
      const varNere = nere;
      slapp();
      if (this.flyttar) return;
      if (!varNere || lang) return;
      if (Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > 12) return;
      skicka("bygg");
    });
    nod.on("pointerupoutside", slapp);
    this.byggen.push({ uid: spec.uid, spec, nod, g, w: mal.w, h: mal.h });
  }

  private laggDjur(v: Sparad, hem: string) {
    if (!this.kitRedo()) return;
    if (this.djur.some((d) => d.uid === v.uid)) return;
    const plan = ritplan(v, this.kit);
    this.seTill(filerFor(v, this.kit), () => {
      if (this.djur.some((d) => d.uid === v.uid)) return;
      const hemNod = this.byggen.find((b) => b.uid === hem);
      const x = hemNod?.nod.x ?? VERLD.b * 0.5;
      const y = (hemNod?.nod.y ?? VERLD.h * 0.7) - 8;
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
        const synlig = del.pose === "idle" && (del.ansikte == null || del.ansikte === "normal");
        img.setVisible(synlig);
        const kropp = /^(skugga|bas|monster|linje|ansikte)-/.test(del.namn);
        if (valjStil(v).stil === "sim" && kropp) img.setCrop(0, 0, w, Math.floor(h * 0.67));
        nod.add(img);
        lager.push({ img, kropp, bas: del.skala });
      }
      const duk = this.kit.duk?.b || 600;
      const bas = ((VERLD.b * 0.16) / (duk * 0.42)) * (v.skala || 1);
      nod.setScale(bas);
      const stil = valjStil(v).stil;
      const bygge = byggMedId(hemNod?.spec.bygg ?? "");
      const simmar = stil === "sim" && (bygge?.id === "damm" || bygge?.id === "vallgrav");
      const djur: Djur = {
        uid: v.uid,
        spec: v,
        hem,
        nod,
        lager,
        x,
        y,
        vx: 40,
        bas,
        tid: Math.random() * 4,
        stil: simmar ? "sim" : stil === "flyg" ? "flyg" : "ga",
        sov: false,
      };
      nod.setInteractive(new Phaser.Geom.Rectangle(-120, -180, 240, 320), Phaser.Geom.Rectangle.Contains);
      nod.on("pointerup", (p: PhaserLib.Input.Pointer) => {
        if (!paDuken(p)) return;
        const text = PRAT[Math.floor(Math.random() * PRAT.length)] ?? PRAT[0]!;
        brygga.skicka({ typ: "hemTryck", uid: v.uid, text, x: djur.x / VERLD.b, y: (djur.y - 100) / VERLD.h });
      });
      this.djur.push(djur);
    });
  }

  private taBortDjur(uid: string) {
    const d = this.djur.find((x) => x.uid === uid);
    if (!d) return;
    d.nod.destroy();
    this.djur = this.djur.filter((x) => x.uid !== uid);
  }

  private seTill(urls: string[], klar: () => void) {
    const saknas = urls.filter((u) => u && !this.textures.exists(u));
    if (!saknas.length) {
      klar();
      this.nastaKo();
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
