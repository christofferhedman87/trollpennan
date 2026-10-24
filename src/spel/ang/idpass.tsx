// P3a-fix (Arkitekten, beslut A): skärmen är facit. Ett id-pass ritar varje skapelse (och platsens fasta saker) i en egen
// platt färg i samma kamera och storlek som spelet, och räknar synliga pixlar per skapelse mot dess egen siluett (samma
// skapelse ritad ensam). Allt annat (marken, träden, staketet) ritas svart och skymmer som i spelet. Bara i dev och när ett
// prov styr webbläsaren (som window.__troll) – aldrig för barn. Inget pass körs i spelloopen; bara när provet anropar.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type Rekt = { x: number; y: number; w: number; h: number };
export type IdMatt = {
  /** pixlar i den egna siluetten (ritad ensam), i bild */
  sil: number;
  /** synliga pixlar i hela scenen, utan dem under HUD-rutorna */
  syn: number;
  /** siluettens övre halva och hur mycket av den som syns */
  silHuvud: number;
  synHuvud: number;
  /** siluettens ruta på skärmen (CSS-px) */
  x0: number; y0: number; x1: number; y1: number;
  /** siluetten når bildkanten (då är den inte helt i bild) */
  kant: boolean;
  /** siluettpixlar under HUD-rutorna (guiden, Bengtsson, knappraderna) */
  hud: number;
};

declare global {
  interface Window {
    /** P3a-fix: id-passet (bara dev/prov). hud = rutor (CSS-px) som står framför scenen. */
    __idPass?: (hud?: Rekt[]) => Record<string, IdMatt>;
    /** P3a-fix: scenen och renderaren för fps-mätningen (rundor/P3a-fix/fps.mjs) */
    __tredScen?: { scene: THREE.Scene; gl: THREE.WebGLRenderer };
    /** felsökning: sätt till "" så lägger id-passet hela bilden här (data-URL) */
    __idPassBild?: string;
    /** P3a-fix: platsens dekor (allt utom skapelserna och de fasta sakerna) som karta: världens z för den främsta dekoryta
     *  som syns i varje cell × cell px (null = ingen dekor). Underlag för data/dekor-karta.json. */
    __dekorKarta?: (cell?: number) => { w: number; h: number; cell: number; z: (number | null)[] };
  }
}

const FASTA = ["spokhus", "grind"];
const uidFor = (o: THREE.Object3D): string | null => {
  for (let q: THREE.Object3D | null = o; q; q = q.parent) {
    const u = q.userData?.trollUid as string | undefined;
    if (u) return u;
    if (FASTA.includes(q.name) && q.parent) return `fast:${q.name}`;
  }
  return null;
};

const delAv = (o: THREE.Object3D): boolean => {
  for (let q: THREE.Object3D | null = o; q; q = q.parent) if (q.userData?.trollDel) return true;
  return false;
};

/** Världens y/z i färgen. Instanser (träd, buskar) räknas med, så kartan träffar samma yta som djupbufferten. */
const varldPos = (sh: { vertexShader: string; fragmentShader: string }, frag: string) => {
  sh.vertexShader = sh.vertexShader
    .replace("void main() {", "varying float vWz;\nvarying float vWy;\nvoid main() {")
    .replace(
      "#include <project_vertex>",
      "#include <project_vertex>\nvec4 wpz = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwpz = instanceMatrix * wpz;\n#endif\nvec4 wwz = modelMatrix * wpz;\nvWz = wwz.z;\nvWy = wwz.y;",
    );
  sh.fragmentShader = sh.fragmentShader.replace("void main() {", "varying float vWz;\nvarying float vWy;\nvoid main() {").replace("#include <dithering_fragment>", frag);
};

export function IdPass() {
  const { gl, scene, camera, size } = useThree();
  useEffect(() => {
    if (!(import.meta.env.DEV || navigator.webdriver === true)) return;
    const matt = (hudRutor: Rekt[] = []): Record<string, IdMatt> => {
      const [W, H] = [Math.round(size.width), Math.round(size.height)];
      if (W < 2 || H < 2) return {};
      const rt = new THREE.WebGLRenderTarget(W, H, { depthBuffer: true });
      const sparat: { o: THREE.Object3D; m?: THREE.Material | THREE.Material[]; v: boolean }[] = [];
      const ids: string[] = [];
      const idFor = new Map<THREE.Object3D, number>();
      const svart = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, toneMapped: false });
      // dekorn skriver alfa 1, marken (y ≤ 0,06) alfa 0 – påverkar inte mätningen (blått), bara felsökningsbilden
      svart.onBeforeCompile = (sh) => {
        varldPos(sh, "#include <dithering_fragment>\ngl_FragColor.a = vWy > 0.06 ? 1.0 : 0.0;");
      };
      const farg = new Map<number, THREE.MeshBasicMaterial>();
      const mat = (i: number) => {
        let m = farg.get(i);
        if (!m) farg.set(i, (m = new THREE.MeshBasicMaterial({ color: new THREE.Color((i & 255) / 255, ((i >> 8) & 255) / 255, 1), fog: false, toneMapped: false })));
        return m;
      };
      scene.updateMatrixWorld(true);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!(mesh.isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Line).isLine || (o as THREE.Points).isPoints)) return;
        sparat.push({ o, m: mesh.material, v: o.visible });
        if (!mesh.isMesh) { o.visible = false; return; }
        const m0 = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.Material | undefined;
        if (m0 && m0.transparent && (m0.opacity ?? 1) < 0.5) { o.visible = false; return; }
        const u = uidFor(o);
        // det som hör till skapelsen men inte är kroppen (hjärtan, puffen, humörikonen, effekterna) är pålägg, inte skymning
        if (!u && delAv(o)) { o.visible = false; return; }
        if (u) {
          let i = ids.indexOf(u);
          if (i < 0) { ids.push(u); i = ids.length - 1; }
          idFor.set(o, i + 1);
          mesh.material = mat(i + 1);
        } else mesh.material = svart;
      });
      const bakgrund = scene.background;
      const dimma = scene.fog;
      scene.background = null;
      scene.fog = null;
      const forraRt = gl.getRenderTarget();
      const forraFarg = new THREE.Color();
      gl.getClearColor(forraFarg);
      const forraAlfa = gl.getClearAlpha();
      gl.setClearColor(0x000000, 0);
      const buf = new Uint8Array(W * H * 4);
      const rita = () => { gl.setRenderTarget(rt); gl.clear(); gl.render(scene, camera); gl.readRenderTargetPixels(rt, 0, 0, W, H, buf); };
      const hud = (x: number, y: number) => hudRutor.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      const kodAv = (p: number) => buf[p * 4]! + buf[p * 4 + 1]! * 256;
      // 1: hela scenen. Färgen jämförs med siluettens egen färg (samma material), inte med heltals-id:t – linjär färg avrundas.
      rita();
      const hel = new Uint16Array(W * H);
      for (let p = 0; p < W * H; p++) if (buf[p * 4 + 2]! > 127) hel[p] = kodAv(p);
      if (window.__idPassBild !== undefined) {
        const c = document.createElement("canvas");
        [c.width, c.height] = [W, H];
        const g = c.getContext("2d");
        if (g) {
          const im = g.createImageData(W, H);
          for (let row = 0; row < H; row++) for (let x = 0; x < W; x++) {
            const [p, q] = [row * W + x, (H - 1 - row) * W + x];
            const v = hel[p]!;
            im.data.set(v ? [(v * 97) % 256, (v * 53) % 256, (v * 151) % 256, 255] : buf[p * 4 + 3]! > 127 ? [90, 90, 90, 255] : [0, 0, 0, 255], q * 4);
          }
          g.putImageData(im, 0, 0);
          window.__idPassBild = c.toDataURL();
        }
      }
      // 2: var och en ensam (siluetten)
      const ut: Record<string, IdMatt> = {};
      const ursprung = new Map(sparat.map((s) => [s.o, s.o.visible]));
      ids.forEach((u, i) => {
        for (const s of sparat) s.o.visible = !!ursprung.get(s.o) && idFor.get(s.o) === i + 1;
        rita();
        let [sil, x0, y0, x1, y1, kant, nh] = [0, W, H, -1, -1, false, 0];
        for (let row = 0; row < H; row++) for (let x = 0; x < W; x++) {
          const p = row * W + x;
          if (buf[p * 4 + 2]! <= 127) continue;
          const y = H - 1 - row;
          sil++;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          if (x === 0 || y === 0 || x === W - 1 || y === H - 1) kant = true;
        }
        const mitt = y0 + (y1 - y0) / 2;
        let [syn, silHuvud, synHuvud] = [0, 0, 0];
        for (let row = 0; row < H; row++) for (let x = 0; x < W; x++) {
          const p = row * W + x;
          if (buf[p * 4 + 2]! <= 127) continue;
          const y = H - 1 - row;
          const huvud = y <= mitt;
          if (huvud) silHuvud++;
          if (hud(x, y)) { nh++; continue; }
          // synlig = samma färgkod som i hela scenen (egen siluett, inte någon framför)
          if (hel[p] === kodAv(p)) { syn++; if (huvud) synHuvud++; }
        }
        ut[u] = { sil, syn, silHuvud, synHuvud, x0, y0, x1: x1 + 1, y1: y1 + 1, kant, hud: nh };
      });
      for (const s of sparat) { s.o.visible = s.v; if (s.m) (s.o as THREE.Mesh).material = s.m; }
      scene.background = bakgrund;
      scene.fog = dimma;
      gl.setRenderTarget(forraRt);
      gl.setClearColor(forraFarg, forraAlfa);
      rt.dispose();
      svart.dispose();
      for (const m of farg.values()) m.dispose();
      return ut;
    };
    const karta = (cell = 8) => {
      const [W, H] = [Math.round(size.width), Math.round(size.height)];
      const tom = { w: 0, h: 0, cell, z: [] as (number | null)[] };
      if (W < 2 || H < 2) return tom;
      const rt = new THREE.WebGLRenderTarget(W, H, { depthBuffer: true });
      // världens z i färgen: (z + 20) / 32 i 16 bitar (R + 256·G), B = 255 betyder dekor, alfa 0 = marken (y ≤ 0,06)
      const zMat = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, side: THREE.DoubleSide });
      zMat.onBeforeCompile = (sh) => {
        varldPos(sh, "#include <dithering_fragment>\nfloat v = clamp((vWz + 20.0) / 32.0, 0.0, 1.0) * 65535.0;\ngl_FragColor = vec4(mod(v, 256.0) / 255.0, floor(v / 256.0) / 255.0, 1.0, vWy > 0.06 ? 1.0 : 0.0);");
      };
      const sparat: { o: THREE.Object3D; m?: THREE.Material | THREE.Material[]; v: boolean }[] = [];
      scene.updateMatrixWorld(true);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!(mesh.isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Line).isLine || (o as THREE.Points).isPoints)) return;
        sparat.push({ o, m: mesh.material, v: o.visible });
        if (!mesh.isMesh) { o.visible = false; return; }
        const m0 = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.Material | undefined;
        if ((m0 && m0.transparent && (m0.opacity ?? 1) < 0.5) || uidFor(o) || delAv(o)) { o.visible = false; return; }
        mesh.material = zMat;
      });
      const [bakgrund, dimma] = [scene.background, scene.fog];
      scene.background = null;
      scene.fog = null;
      const forraRt = gl.getRenderTarget();
      const forraFarg = new THREE.Color();
      gl.getClearColor(forraFarg);
      const forraAlfa = gl.getClearAlpha();
      gl.setClearColor(0x000000, 1);
      const buf = new Uint8Array(W * H * 4);
      gl.setRenderTarget(rt);
      gl.clear();
      gl.render(scene, camera);
      gl.readRenderTargetPixels(rt, 0, 0, W, H, buf);
      for (const s of sparat) { s.o.visible = s.v; if (s.m) (s.o as THREE.Mesh).material = s.m; }
      scene.background = bakgrund;
      scene.fog = dimma;
      gl.setRenderTarget(forraRt);
      gl.setClearColor(forraFarg, forraAlfa);
      rt.dispose();
      zMat.dispose();
      // cellens värde: den främsta (största z) dekorytan bland cellens pixlar
      const [cw, ch] = [Math.ceil(W / cell), Math.ceil(H / cell)];
      const z: (number | null)[] = new Array(cw * ch).fill(null);
      for (let row = 0; row < H; row++) for (let x = 0; x < W; x++) {
        const p = row * W + x;
        // marken och vattenytan (y ≤ 0,06, alfa 0) står aldrig framför en kropp som står på dem
        if (buf[p * 4 + 2]! <= 127 || buf[p * 4 + 3]! < 128) continue;
        const wz = ((buf[p * 4]! + buf[p * 4 + 1]! * 256) / 65535) * 32 - 20;
        const c = Math.floor((H - 1 - row) / cell) * cw + Math.floor(x / cell);
        if (z[c] === null || wz > z[c]!) z[c] = Math.round(wz * 100) / 100;
      }
      return { w: cw, h: ch, cell, z };
    };
    window.__idPass = matt;
    window.__dekorKarta = karta;
    window.__tredScen = { scene, gl };
    return () => {
      if (window.__idPass === matt) delete window.__idPass;
      if (window.__dekorKarta === karta) delete window.__dekorKarta;
      if (window.__tredScen?.scene === scene) delete window.__tredScen;
    };
  }, [gl, scene, camera, size]);
  return null;
}
