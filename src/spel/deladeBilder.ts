import type Phaser from "phaser";
import { delaLaddning } from "./texturKo.ts";
export function laddaDeladeBilder(scen: Phaser.Scene, nycklar: string[], rot: string): Promise<void> {
  return delaLaddning(scen.game, nycklar, k => scen.textures.exists(k), saknas => new Promise<void>(resolve => {
    if (!scen.sys.isActive() && !scen.sys.isSleeping()) { resolve(); return; }
    const klart = () => {
      scen.load.off("complete", klart);
      scen.events.off("shutdown", klart);
      scen.events.off("destroy", klart);
      resolve();
    };
    scen.load.once("complete", klart);
    scen.events.once("shutdown", klart);
    scen.events.once("destroy", klart);
    for (const k of saknas) scen.load.image(k, `${rot}/${k}`);
    if (!scen.load.isLoading()) scen.load.start();
  }));
}
