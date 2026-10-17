import * as PhaserNS from "phaser";
import type PhaserLib from "phaser";
import { hamtaKit, VERLD } from "./kit.ts";
import { AngScen } from "./scen.ts";
import { GardScen } from "./gard.ts";
import { AvScen } from "./avscen.ts";

const Phaser = PhaserNS as unknown as typeof PhaserLib;

export async function starta(parent: HTMLElement) {
  const { kit, rot } = await hamtaKit();
  let anim: unknown = null;
  try {
    const svar = await fetch(`${rot}/anim.json`);
    if (svar.ok) anim = await svar.json();
  } catch {
    anim = null;
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VERLD.b,
    height: VERLD.h,
    backgroundColor: "#000000",
    transparent: true,
    banner: false,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    scene: [AngScen, GardScen, AvScen],
    callbacks: {
      preBoot: (game) => {
        game.registry.set("kit", kit);
        game.registry.set("rot", rot);
        game.registry.set("anim", anim);
      },
    },
    render: { antialias: true },
    fps: { target: 60 },
  });
  if (!game.scene.isActive("gard") && !game.scene.isSleeping("gard")) game.scene.start("gard");
  if (!game.scene.isActive("av") && !game.scene.isSleeping("av")) game.scene.start("av");
  (window as unknown as { __spel?: PhaserLib.Game }).__spel = game;
  return game;
}
