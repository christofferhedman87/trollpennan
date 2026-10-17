import type PhaserLib from "phaser";
import { VERLD } from "./kit.ts";
import { kvallStyrka, visningsTid } from "./liv.ts";

const STJARNOR: [number, number][] = [
  [0.12, 0.08],
  [0.28, 0.14],
  [0.46, 0.06],
  [0.63, 0.12],
  [0.78, 0.08],
  [0.9, 0.18],
  [0.18, 0.22],
  [0.54, 0.2],
  [0.36, 0.1],
  [0.7, 0.24],
  [0.08, 0.16],
  [0.92, 0.11],
];

/** Kvällshimmel ritad i scenen, under djuren, så inget täcks. */
export class NattHimmel {
  private himmel: PhaserLib.GameObjects.Graphics;
  private mark: PhaserLib.GameObjects.Graphics;
  private stjarnor: PhaserLib.GameObjects.Arc[];

  constructor(scene: PhaserLib.Scene) {
    this.himmel = scene.add.graphics();
    this.mark = scene.add.graphics();
    this.himmel.setDepth(1);
    this.mark.setDepth(1);
    this.stjarnor = STJARNOR.map(([x, y]) => {
      const c = scene.add.circle(x * VERLD.b, y * VERLD.h, 5, 0xffffff, 1);
      c.setDepth(1.5);
      c.setVisible(false);
      return c;
    });
  }

  rita() {
    const n = kvallStyrka(visningsTid());
    this.himmel.clear();
    this.mark.clear();
    if (n <= 0.02) {
      for (const s of this.stjarnor) s.setVisible(false);
      return;
    }
    this.himmel.fillStyle(0x5c6bc0, 0.78 * n);
    this.himmel.fillRect(0, 0, VERLD.b, VERLD.h * 0.44);
    this.mark.fillStyle(0x1a1740, 0.25 * n);
    this.mark.fillRect(0, VERLD.h * 0.36, VERLD.b, VERLD.h);
    this.stjarnor.forEach((s, i) => s.setVisible(n > (i + 1) / this.stjarnor.length));
  }
}
