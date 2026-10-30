// Ängens bakgrund (2026-10-30): tre målade lager (berg, kullar, trädrad) som platta ytor på olika avstånd bakom dalen.
// Kameran panorerar ±6 i sidled (DalKamera), så de närmare lagren glider förbi snabbare än bergen: djupkänsla utan
// 3D-modeller. Bilderna skärs ut ur Firefly-originalen med scripts/parallax-lager.py (public/parallax/*.webp).
//
// Ett ritanrop för alla tre: bilderna läggs under varandra i en atlas (en canvas, en textur) och de tre ytorna är
// fyrhörningar i samma geometri, ritade längst bort först. De gamla kull- och bergmodellerna kostade två.
// - MeshBasicMaterial: ljuset påverkar inte målningarna. toneMapped=false så att färgerna blir som i bilden.
// - Bilden upprepas speglad i sidled (som MirroredRepeatWrapping, men inom atlasens rad), så skarvarna aldrig syns.
//   Bildens mitt står mitt i dalen.
// - Atlasen är förmultiplicerad (premultiplied alpha): canvasen lagrar den så, och då blöder ingen kantfärg in.
// - Dis: varje lager tonas mot scenens dimfärg efter avståndet till kameran, inom ett spann per lager (bergen har eget
//   dis i bilden). Trädraden får full dimma, och dess gräsremsa tonas ut nerifrån så att den går ihop med marken.
// - Kvällen: dimfärgen följer KvallsLjus (scene.fog), och målningarna mörknar som ljuset (kvallsLjusFaktor).
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useStart } from "../start.ts";
import { MILJO } from "../miljo.ts";
import { kvallsLjusFaktor, kvallsTon } from "./kvallTon.ts";
import { LAGER, PARALLAX_FAR, PARALLAX_ORDNING, atlasRader, parallaxUrl, upprepning, type LagerSpec } from "./parallaxLager.ts";

/** En geometri med en fyrhörning per lager. uv.x i bildbredder (speglas i shadern), uv.y 0–1 i bilden, lager = index. */
function parallaxGeometri(): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const lager: number[] = [];
  const index: number[] = [];
  LAGER.forEach((l, i) => {
    const { gangar, start } = upprepning(l);
    const [x0, x1, y0, y1] = [-l.bredd / 2, l.bredd / 2, l.botten, l.botten + l.hojd];
    const b = i * 4;
    pos.push(x0, y0, l.z, x1, y0, l.z, x1, y1, l.z, x0, y1, l.z);
    uv.push(start, 0, start + gangar, 0, start + gangar, 1, start, 1);
    lager.push(i, i, i, i);
    index.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("lager", new THREE.Float32BufferAttribute(lager, 1));
  g.setIndex(index);
  return g;
}

type Uniforms = { uDis: { value: THREE.Color }; uDisM: { value: THREE.Vector3 }; uFot: { value: THREE.Vector3 }; uRadV0: { value: THREE.Vector3 }; uRadVh: { value: THREE.Vector3 } };

function skapaMaterial(tex: THREE.Texture): { mat: THREE.MeshBasicMaterial; u: Uniforms } {
  const { rader } = atlasRader();
  const v3 = (f: (l: LagerSpec) => number) => new THREE.Vector3(...(LAGER.map(f) as [number, number, number]));
  const u: Uniforms = {
    uDis: { value: new THREE.Color(MILJO.dis.farg) },
    uDisM: { value: new THREE.Vector3() },
    uFot: { value: v3((l) => l.fot) },
    uRadV0: { value: v3((l) => rader[l.namn].v0) },
    uRadVh: { value: v3((l) => rader[l.namn].vh) },
  };
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false });
  mat.name = "parallax";
  // Förmultiplicerad blandning: färgen i atlasen är redan gånger alfa.
  mat.blending = THREE.CustomBlending;
  mat.blendSrc = THREE.OneFactor;
  mat.blendDst = THREE.OneMinusSrcAlphaFactor;
  mat.blendSrcAlpha = THREE.OneFactor;
  mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    const valj = (v: string) => `(vLager < 0.5 ? ${v}.x : (vLager < 1.5 ? ${v}.y : ${v}.z))`;
    sh.vertexShader = sh.vertexShader.replace("void main() {", "attribute float lager;\nvarying float vLager;\nvoid main() {\nvLager = lager;");
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", "uniform vec3 uDis;\nuniform vec3 uDisM;\nuniform vec3 uFot;\nuniform vec3 uRadV0;\nuniform vec3 uRadVh;\nvarying float vLager;\nvoid main() {")
      .replace(
        "#include <map_fragment>",
        [
          // Speglad upprepning i sidled (triangelvåg: kontinuerlig, så mipmappen väljs rätt även vid skarven).
          "float spegelU = 1.0 - abs(1.0 - mod(vMapUv.x, 2.0));",
          `vec2 atlasUv = vec2(spegelU, ${valj("uRadV0")} + clamp(vMapUv.y, 0.0, 1.0) * ${valj("uRadVh")});`,
          "diffuseColor *= texture2D(map, atlasUv);",
          // Trädradens gräsremsa tonas ut nerifrån (förmultiplicerat: färg och alfa tillsammans).
          `float fot = ${valj("uFot")};`,
          "if (fot > 0.0) diffuseColor *= smoothstep(fot * 0.25, fot, vMapUv.y);",
        ].join("\n"),
      )
      // Samma ställe som three blandar in dimma, så att trädradens fot får exakt markens dimfärg.
      .replace("#include <fog_fragment>", `#include <fog_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uDis * gl_FragColor.a, ${valj("uDisM")});`);
  };
  mat.customProgramCacheKey = () => "parallax-atlas";
  return { mat, u };
}

function laddaBild(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, fel) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => ok(img);
    img.onerror = () => fel(new Error(`Kunde inte ladda ${url}`));
    img.src = url;
  });
}

/** Ritar de tre bilderna under varandra i en canvas (en textur för ett ritanrop). */
async function byggAtlas(): Promise<THREE.CanvasTexture> {
  const { bredd, hojd, rader } = atlasRader();
  const bilder = await Promise.all(LAGER.map((l) => laddaBild(parallaxUrl(l.namn))));
  const c = document.createElement("canvas");
  c.width = bredd;
  c.height = hojd;
  const g = c.getContext("2d");
  if (!g) throw new Error("Ingen 2D-canvas");
  LAGER.forEach((l, i) => g.drawImage(bilder[i]!, 0, rader[l.namn].y, bredd, rader[l.namn].h));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.premultiplyAlpha = true;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function Lagren({ natt }: { natt: number }) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let lever = true;
    byggAtlas()
      .then((t) => (lever ? setTex(t) : t.dispose()))
      .catch(() => undefined); // utan bakgrund syns himlen; spelet påverkas inte
    return () => {
      lever = false;
    };
  }, []);
  const geo = useMemo(() => parallaxGeometri(), []);
  const ritat = useMemo(() => (tex ? skapaMaterial(tex) : null), [tex]);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(
    () => () => {
      ritat?.mat.dispose();
      tex?.dispose();
    },
    [ritat, tex],
  );
  const vit = useMemo(() => new THREE.Color("#ffffff"), []);
  const kvallTint = useMemo(() => new THREE.Color(MILJO.kvall.fyll_farg), []);
  useFrame(({ camera, scene }) => {
    if (!ritat) return;
    const { mat, u } = ritat;
    const fog = scene.fog instanceof THREE.Fog ? scene.fog : null;
    LAGER.forEach((l, i) => {
      const avst = Math.hypot(camera.position.z - l.z, camera.position.y - (l.botten + l.hojd / 2));
      const grad = fog ? THREE.MathUtils.clamp((avst - fog.near) / Math.max(1e-3, fog.far - fog.near), 0, 1) : 0;
      u.uDisM.value.setComponent(i, THREE.MathUtils.clamp(grad, l.dis[0], l.dis[1]));
    });
    if (fog) u.uDis.value.copy(fog.color);
    mat.color.copy(vit).lerp(kvallTint, kvallsTon(natt) * 0.5).multiplyScalar(0.5 + 0.5 * kvallsLjusFaktor(natt));
  });
  if (!ritat) return null;
  return <mesh geometry={geo} material={ritat.mat} renderOrder={PARALLAX_ORDNING} frustumCulled={false} raycast={() => null} userData={{ parallax: true }} />;
}

/** Lagren laddas först när ängen visat sin första bild, så att försidan och ängen inte väntar på dem. */
export function Parallax({ natt = 0 }: { natt?: number }) {
  const redo = useStart((s) => s.angRedo);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    if (camera.far < PARALLAX_FAR) {
      camera.far = PARALLAX_FAR;
      camera.updateProjectionMatrix();
    }
  }, [camera]);
  useEffect(() => {
    if (!redo) return;
    const w = window as unknown as { __parallax?: string[] };
    w.__parallax = LAGER.map((l) => l.namn);
    return () => {
      delete w.__parallax;
    };
  }, [redo]);
  return redo ? <Lagren natt={natt} /> : null;
}
