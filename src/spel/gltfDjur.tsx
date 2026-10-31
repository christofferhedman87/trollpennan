import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { belysScen } from "./belys.ts";
import type { Sparad } from "./brygga.ts";
import { djurGltfUrl, entitet, forladdaUrls, framVinkel, modellUrl as modellUrlAv, skalaFor } from "./entiteter.ts";
import { forladdaNarLedig } from "./modeller/forladda.ts";
import type { DjurSignal } from "./modeller/djurSignal.ts";
import { fargaKlon } from "./modeller/gltfFarg.ts";
import { materialAlpha } from "./modeller/materialAlpha.ts";
import { GltfInnehall } from "./modeller/gltfPlagg.tsx";
import { fastAnkare, fargaOm, ingenKulling, klippNamn, metallNoll, slimePaKlon, tryggKlipp } from "./modeller/gltfVerktyg.ts";
export { squashSkala } from "./modeller/djurSignal.ts";
export type { DjurHumör, DjurSignal } from "./modeller/djurSignal.ts";

forladdaNarLedig(forladdaUrls());

export function GltfDjur({ spec, signal, index = 0 }: { spec: Sparad; signal: { current: DjurSignal }; index?: number }) {
  const url = djurGltfUrl(spec.kropp) ?? djurGltfUrl("kanin")!;
  const gltf = useGLTF(url);
  const rot = useRef<THREE.Group>(null);
  const inre = useRef<THREE.Group>(null);
  const fas = useRef<"skapas" | "idle" | "gar" | "klapp">("skapas");
  const senKlapp = useRef(0);
  const klappTid = useRef(0);
  const sign = JSON.stringify(spec);
  const klon = useMemo(() => {
    belysScen(gltf.scene);
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    metallNoll(c);
    ingenKulling(c);
    fargaKlon(c, spec);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const h = Math.max(0.001, box.max.y - box.min.y);
    const s = skalaFor(spec.kropp, h, box.max.x - box.min.x, box.max.z - box.min.z);
    c.scale.setScalar(s);
    // B6.6: mitten av modellens ruta på skapelsens plats (som GltfSak). Förut flyttades bara botten till marken, så en
    // modell med origo vid sidan av kroppen (kratern, raketen, rymdskeppet) ritades långt från sin plats, utanför bilden.
    c.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
    c.updateMatrixWorld(true);
    fastAnkare(c, spec);
    slimePaKlon(c, url);
    return c;
    // spec läses via sign så klonen inte byggs om varje render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.scene, sign]);
  const fram = framVinkel(entitet(spec.kropp)?.framAxel);
  const klipp = useMemo(() => gltf.animations.map(tryggKlipp), [gltf.animations]);
  const { actions, mixer } = useAnimations(klipp, rot);

  const spela = useMemo(() => {
    return (suffix: string, enGang: boolean) => {
      const namn = klippNamn(actions, suffix);
      const next = namn ? actions[namn] : null;
      if (!next) return false;
      const prevNamn = Object.keys(actions).find((n) => actions[n]?.isRunning());
      const prev = prevNamn ? actions[prevNamn] : null;
      next.enabled = true;
      next.setLoop(enGang ? THREE.LoopOnce : THREE.LoopRepeat, enGang ? 1 : Infinity);
      next.clampWhenFinished = enGang;
      if (!enGang) next.time = Math.random() * Math.max(0.01, next.getClip().duration);
      else next.time = 0;
      next.reset().fadeIn(0.25).play();
      if (prev && prev !== next) prev.crossFadeTo(next, 0.25, false);
      return true;
    };
  }, [actions]);

  useLayoutEffect(() => {
    const k = spec.kropp;
    const skapa = k === "drake" ? "Fast_Flying" : k === "häst" ? "Jump_Start" : k === "groda" ? "" : "dance";
    const idle = k === "drake" ? "Flying_Idle" : k === "häst" ? "Idle" : "idle";
    const startad = skapa ? spela(skapa, k !== "drake") : false;
    const ms = k === "drake" ? 1000 : k === "häst" ? 700 : 0;
    let timer = 0;
    const tillIdle = () => {
      fas.current = "idle";
      if (k !== "groda") spela(idle, false);
    };
    if (!startad) tillIdle();
    else if (ms > 0) timer = window.setTimeout(tillIdle, ms);
    const onFin = () => {
      if (fas.current === "skapas" && ms === 0) tillIdle();
      else if (fas.current === "klapp") {
        fas.current = "idle";
        if (k !== "groda") spela(idle, false);
      }
    };
    mixer.addEventListener("finished", onFin);
    return () => {
      if (timer) window.clearTimeout(timer);
      mixer.removeEventListener("finished", onFin);
    };
  }, [mixer, spela, spec.kropp]);

  const hals = useRef(0);
  useLayoutEffect(() => {
    if (spec.kropp !== "groda") return;
    const t = window.setInterval(() => {
      hals.current = 1;
    }, 6000);
    return () => window.clearInterval(t);
  }, [spec.kropp]);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const g = inre.current;
    const k = spec.kropp;
    const kl = signal.current.klapp;
    if (kl !== senKlapp.current) {
      senKlapp.current = kl;
      fas.current = "klapp";
      const suffix =
        k === "drake" ? "Yes" : k === "häst" ? "Jump_Start" : k === "hund" || k === "fågel" ? "dance" : kl % 2 === 0 ? "dance" : "gesture-positive";
      if (k === "groda") klappTid.current = 0.4;
      else if (!spela(suffix, true)) fas.current = "idle";
    }
    if (g && k === "groda") {
      const t = state.clock.elapsedTime;
      const andas = 1 + Math.sin((t * Math.PI * 2) / 2.5) * 0.03;
      if (hals.current > 0) hals.current = Math.max(0, hals.current - d / 0.8);
      const puff = Math.sin(Math.min(1, 1 - hals.current) * Math.PI) * 0.08;
      let sy = andas + puff;
      let sx = 1 + puff;
      if (klappTid.current > 0) {
        const u = 1 - klappTid.current / 0.4;
        const sq = u < 0.45 ? 0.8 + (1.1 - 0.8) * (u / 0.45) : 1.1 + (1 - 1.1) * ((u - 0.45) / 0.55);
        sy *= sq;
        sx *= 2 - sq;
        klappTid.current = Math.max(0, klappTid.current - d);
        if (klappTid.current === 0) fas.current = "idle";
      }
      g.scale.set(sx, sy, 1 + puff * 0.4);
      return;
    }
    if (fas.current === "skapas" || fas.current === "klapp") return;
    const gar = signal.current.ror > 0.2 && k !== "drake";
    const vill: "gar" | "idle" = gar ? "gar" : "idle";
    if (vill === fas.current) return;
    fas.current = vill;
    const suffix = vill === "gar" ? (k === "häst" ? "Walk" : "walk") : k === "drake" ? "Flying_Idle" : k === "häst" ? "Idle" : "idle";
    spela(suffix, false);
  });

  return (
    <group ref={rot} userData={{ gltfKropp: spec.kropp }}>
      <group ref={inre}>
        <GltfInnehall klon={klon} spec={spec} fram={fram} signal={signal} index={index} />
      </group>
    </group>
  );
}

/** R3G: en sak (entitet med modell, inte djur) bredvid ett djur – "en kanin med en hink". Hämtas först när den används (lazyload). */
/** `vand` (R8-2b): modellen vänds upp och ner med botten kvar på marken (droppsten → stalagmit). */
/** R9K: `farger` = materialnamn → färg ur platsens data (klonat material, delas inte med andra kopior). */
export function GltfSak({ id, vand = false, farger, farg, glans = false, alpha = 1 }: { id: string; vand?: boolean; farger?: Record<string, string>; farg?: string | null; glans?: boolean; alpha?: number }) {
  const gltf = useGLTF(modellUrlAv(id)!);
  const fargNyckel = farger ? JSON.stringify(farger) : "";
  const klon = useMemo(() => {
    belysScen(gltf.scene);
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    if (farger) fargaOm(c, farger);
    if (farg || glans) fargaKlon(c, { kropp: id, farg: farg ?? null, glans, monster: null, monsterfarg: null });
    if (alpha < 1) c.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const byt = (m: THREE.Material) => { const k = m.clone(); k.transparent = true; k.opacity = materialAlpha(m) * alpha; k.depthWrite = false; return k; };
      o.material = Array.isArray(o.material) ? o.material.map(byt) : byt(o.material);
    });
    metallNoll(c);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const s = skalaFor(id, box.max.y - box.min.y, box.max.x - box.min.x, box.max.z - box.min.z);
    c.scale.setScalar(s);
    if (vand) {
      c.rotation.x = Math.PI;
      c.position.set(-((box.min.x + box.max.x) / 2) * s, box.max.y * s, ((box.min.z + box.max.z) / 2) * s);
    } else c.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
    slimePaKlon(c, modellUrlAv(id) ?? "");
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fargNyckel bär innehållet i farger
  }, [gltf.scene, id, vand, fargNyckel, farg, glans, alpha]);
  return <primitive object={klon} />;
}
