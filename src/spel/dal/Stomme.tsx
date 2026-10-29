// Block 3 (formsystemet): stommen. Formens modell (byggnad, djur eller sak) skalas till funktionens storlek,
// vänds mot kameran, färgas efter barnets mening och får materialets skal (is, guld, godis, moln …).
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { belysScen } from "../belys.ts";
import { kopplaMeshopt } from "../modeller/forladda.ts";
import { egnaMaterial, passaByggnad, skuggaUtanTraff, slappMaterial } from "../gard/modellPrep.ts";
import { BYGGDATA, type Ritplan } from "./ritplan.ts";

export type Matt = readonly [number, number, number];
const BOX = new THREE.Box3();
const STL = new THREE.Vector3();

type FargMat = THREE.Material & { color?: THREE.Color; emissive?: THREE.Color; emissiveIntensity?: number; roughness?: number; metalness?: number; flatShading?: boolean };

/** Materialets skal på vilken modell som helst. Godis får randiga pastellfärger, kristall och is glimmar. */
/** Quaternius-djur har alphaMode MASK med färgens alfa 0 (vertexfärger bär färgen): utan rättning klipps allt bort. */
function synligaMaterial(rot: THREE.Object3D): void {
  rot.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material]) as THREE.Material[]) {
      if (m.opacity < 0.05) {
        m.opacity = 1;
        m.alphaTest = 0;
        m.transparent = false;
        m.needsUpdate = true;
      }
    }
  });
}

function skal(rot: THREE.Object3D, plan: Ritplan): void {
  synligaMaterial(rot);
  const mat = plan.material;
  const lysande = plan.egenskaper.has("lysande") || plan.egenskaper.has("magisk");
  if (!mat && !lysande) return;
  const blanda = BYGGDATA.material_blandning;
  let i = 0;
  rot.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const lista = (Array.isArray(o.material) ? o.material : [o.material]) as FargMat[];
    for (const m of lista) {
      if (!m.color) continue;
      if (mat) {
        const c = new THREE.Color(mat.id === "godis" ? BYGGDATA.godis[i % BYGGDATA.godis.length]! : mat.farg);
        i += 1;
        m.color.lerp(c, mat.id === "godis" ? 0.9 : mat.id === "moln" ? 0.6 : blanda);
        // Moln (0,9) ritas ogenomskinligt: genomskinlighet på en hel byggnad blir blek och flimrar i sorteringen.
        if (mat.alpha < 0.85) {
          m.transparent = true;
          m.opacity = Math.max(0.7, mat.alpha);
          m.depthWrite = true;
        }
        if (mat.glans && m.roughness !== undefined) m.roughness = 0.22;
        if (mat.id === "guld" && m.metalness !== undefined) m.metalness = 0.65;
        if ((mat.id === "kristall" || mat.id === "is") && m.emissive) {
          m.emissive.copy(c).multiplyScalar(0.25);
          m.flatShading = true;
        }
        if (mat.id === "moln" && m.roughness !== undefined) m.roughness = 1;
      }
      if (lysande && m.emissive) {
        m.emissive.copy(m.color);
        m.emissiveIntensity = 0.38;
      }
      m.needsUpdate = true;
    }
  });
}

/** Former (djur, saker) står med framsidan mot kameran och är ofta långa bakåt: bredden och höjden styr storleken,
 *  djupet får vara lite större (som djuren i gltfDjur mäts de med Box3 utan precise). */
function uppdateraSkelett(g: THREE.Object3D): void {
  g.updateMatrixWorld(true);
  g.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) (o as THREE.SkinnedMesh).skeleton.update();
  });
}

function passaForm(g: THREE.Object3D, plan: Ritplan & { url: string }): void {
  g.scale.setScalar(1);
  g.position.set(0, 0, 0);
  // Benens matriser räknas annars först när bilden ritas – utan dem blir den exakta rutan fel.
  uppdateraSkelett(g);
  let riggad = false;
  g.traverse((o) => {
    if (!(o as THREE.SkinnedMesh).isSkinnedMesh) return;
    riggad = true;
    // Som gltfDjur: riggade kroppars avgränsning räknas från bindningsposen och kan klippas bort i bild.
    o.frustumCulled = false;
  });
  BOX.setFromObject(g);
  if (BOX.isEmpty()) return;
  BOX.getSize(STL);
  // Riggade djur (Quaternius) har ett djup i rutan som inte syns (benens bindningspose): bara bredd och höjd styr,
  // och modellens egen origo (mellan fötterna) står mitt på tomten.
  const djup = riggad ? Infinity : (plan.maxBredd * 1.25) / Math.max(STL.z, 1e-4);
  const s = Math.min(plan.malhojd / Math.max(STL.y, 1e-4), plan.maxBredd / Math.max(STL.x, 1e-4), djup);
  g.scale.setScalar(s);
  uppdateraSkelett(g);
  BOX.setFromObject(g);
  g.position.set(-(BOX.min.x + BOX.max.x) / 2, -BOX.min.y, riggad ? 0 : -(BOX.min.z + BOX.max.z) / 2);
  uppdateraSkelett(g);
}

export function Stomme({ plan, onMatt }: { plan: Ritplan & { url: string }; onMatt: (m: Matt) => void }) {
  const gltf = useGLTF(plan.url, false, true, kopplaMeshopt);
  const { grupp, inre, matt } = useMemo(() => {
    belysScen(gltf.scene);
    // Djurformer är riggade: en vanlig klon delar skelett med originalet och ritas på fel plats och i fel storlek.
    const k = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    k.rotation.y = plan.rotY;
    const g = new THREE.Group();
    g.add(k);
    if (plan.arForm) passaForm(g, plan);
    else passaByggnad(g, plan.malhojd, plan.maxBredd, plan.skala);
    egnaMaterial(k, plan.farg ?? (plan.arForm || plan.egenFarg ? null : plan.standardFarg), plan.takFarg, plan.arForm ? 0 : (plan.fonster ?? 3));
    skal(k, plan);
    skuggaUtanTraff(k, true);
    // Byggena kastar ingen skugga i skuggpasset (det dubblar ritanropen); den mjuka skuggfläcken under tomten räcker.
    k.traverse((o) => {
      o.castShadow = false;
    });
    uppdateraSkelett(g);
    BOX.setFromObject(g);
    BOX.getSize(STL);
    // Formens djup räknas högst som dess bredd, så att dörren sitter på kroppen och inte långt framför den.
    const djup = plan.arForm ? Math.min(STL.z, Math.max(STL.x, 0.8)) : STL.z;
    return { grupp: g, inre: k, matt: [STL.x, STL.y, djup] as Matt };
  }, [gltf.scene, plan]);
  useEffect(() => () => slappMaterial(inre), [inre]);
  useEffect(() => onMatt(matt), [matt, onMatt]);
  return <primitive object={grupp} />;
}
