import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { forladdaNarLedig, kopplaMeshopt } from "../modeller/forladda.ts";
import { belysScen } from "../belys.ts";
import { passaByggnad, skuggaUtanTraff } from "./modellPrep.ts";

type InramningObjekt = {
  id: string;
  fil: string;
  pos: [number, number, number];
  rotY: number;
  malhojd: number;
  maxBredd: number;
};

declare global {
  interface Window {
    __tredGardInramning?: {
      lada: boolean;
      vaderkvarn: boolean;
      staket: boolean;
      trad: boolean;
      kullar: boolean;
      antal?: number;
    };
  }
}

export const INRAMNING_OBJEKT: readonly InramningObjekt[] = [
  { id: "lada", fil: "/models/gard/lada-liten-quaternius.glb", pos: [-4.4, 0, -4.6], rotY: 0.45, malhojd: 2.1, maxBredd: 2.2 },
  { id: "hobal-1", fil: "/models/gard/hobal-kenney-hay-bale-bundled.glb", pos: [-3.5, 0, -3.6], rotY: 0.3, malhojd: 0.65, maxBredd: 0.9 },
  { id: "hobal-2", fil: "/models/gard/hobal-kenney-hay-bale.glb", pos: [-3.7, 0, -2.9], rotY: -0.4, malhojd: 0.55, maxBredd: 0.8 },
  { id: "vaderkvarn", fil: "/models/bulk/w-vaderkvarn-cc0.glb", pos: [4.5, 0, -4.5], rotY: -0.5, malhojd: 2.5, maxBredd: 2.0 },
  { id: "tunna", fil: "/models/bulk/tunna.glb", pos: [3.5, 0, -3.5], rotY: 0.2, malhojd: 0.65, maxBredd: 0.65 },
  { id: "grind-syd", fil: "/models/natur/fence_gate.glb", pos: [0, 0, 5.55], rotY: 0, malhojd: 0.95, maxBredd: 1.4 },
  { id: "staket-sv-1", fil: "/models/natur/fence_simple.glb", pos: [-1.25, 0, 5.55], rotY: 0, malhojd: 0.78, maxBredd: 1.2 },
  { id: "staket-sv-2", fil: "/models/natur/fence_simple.glb", pos: [-2.35, 0, 5.55], rotY: 0, malhojd: 0.78, maxBredd: 1.2 },
  { id: "staket-so-1", fil: "/models/natur/fence_simple.glb", pos: [1.25, 0, 5.55], rotY: 0, malhojd: 0.78, maxBredd: 1.2 },
  { id: "staket-so-2", fil: "/models/natur/fence_simple.glb", pos: [2.35, 0, 5.55], rotY: 0, malhojd: 0.78, maxBredd: 1.2 },
  { id: "stig-1", fil: "/models/natur/path_stone.glb", pos: [0, 0.01, 6.2], rotY: 0, malhojd: 0.12, maxBredd: 1.1 },
  { id: "stig-2", fil: "/models/natur/path_stone.glb", pos: [0, 0.01, 7.0], rotY: 0.15, malhojd: 0.12, maxBredd: 1.1 },
  { id: "lykta-v", fil: "/models/bulk/lykta.glb", pos: [-0.85, 0, 5.45], rotY: 0.2, malhojd: 1.25, maxBredd: 0.6 },
  { id: "lykta-o", fil: "/models/bulk/lykta.glb", pos: [0.85, 0, 5.45], rotY: -0.2, malhojd: 1.25, maxBredd: 0.6 },
  { id: "skylt-ang", fil: "/models/bulk/w-vagvisare-cc0.glb", pos: [1.65, 0, 5.95], rotY: -0.35, malhojd: 1.35, maxBredd: 0.9 },
  { id: "blomma-v1", fil: "/models/natur/flower_redA.glb", pos: [-3.45, 0, 1.4], rotY: 0.4, malhojd: 0.48, maxBredd: 0.6 },
  { id: "blomma-v2", fil: "/models/natur/flower_yellowA.glb", pos: [-3.45, 0, -1.2], rotY: -0.3, malhojd: 0.48, maxBredd: 0.6 },
  { id: "blomma-o1", fil: "/models/natur/flower_yellowA.glb", pos: [3.45, 0, 1.8], rotY: 0.6, malhojd: 0.48, maxBredd: 0.6 },
  { id: "blomma-o2", fil: "/models/natur/flower_redA.glb", pos: [3.45, 0, -1.4], rotY: -0.5, malhojd: 0.48, maxBredd: 0.6 },
  { id: "trad-v1", fil: "/models/natur/tree_oak.glb", pos: [-4.6, 0, 0.2], rotY: 0.8, malhojd: 2.4, maxBredd: 1.9 },
  { id: "trad-v2", fil: "/models/natur/tree_fat.glb", pos: [-4.2, 0, 3.8], rotY: -0.5, malhojd: 2.2, maxBredd: 1.8 },
  { id: "trad-o1", fil: "/models/natur/tree_oak.glb", pos: [4.7, 0, 0.4], rotY: -0.7, malhojd: 2.5, maxBredd: 1.9 },
  { id: "trad-o2", fil: "/models/natur/tree_fat.glb", pos: [4.3, 0, 3.6], rotY: 0.4, malhojd: 2.2, maxBredd: 1.8 },
  { id: "buske-nv", fil: "/models/natur/plant_bushLarge.glb", pos: [-3.55, 0, 4.6], rotY: 0.3, malhojd: 0.7, maxBredd: 0.9 },
  { id: "buske-no", fil: "/models/natur/plant_bushLarge.glb", pos: [3.55, 0, 4.6], rotY: -0.4, malhojd: 0.7, maxBredd: 0.9 },
  { id: "sten-nv", fil: "/models/natur/rock_smallA.glb", pos: [-3.6, 0, -4.9], rotY: 0.9, malhojd: 0.45, maxBredd: 0.7 },
  { id: "sten-no", fil: "/models/natur/rock_smallA.glb", pos: [3.6, 0, -4.9], rotY: -0.6, malhojd: 0.45, maxBredd: 0.7 },
  { id: "kulle-n1", fil: "/models/bulk/w-kulle-cc0.glb", pos: [-10, -0.2, -11], rotY: 0.3, malhojd: 3.2, maxBredd: 9.0 },
  { id: "kulle-n2", fil: "/models/bulk/w-kulle-cc0.glb", pos: [0, -0.2, -13], rotY: 1.2, malhojd: 3.6, maxBredd: 10.5 },
  { id: "kulle-n3", fil: "/models/bulk/w-kulle-cc0.glb", pos: [10, -0.2, -11], rotY: -0.5, malhojd: 3.1, maxBredd: 8.8 },
  { id: "kulle-v", fil: "/models/bulk/w-kulle-cc0.glb", pos: [-12, -0.2, -2], rotY: 0.8, malhojd: 2.8, maxBredd: 8.0 },
  { id: "kulle-o", fil: "/models/bulk/w-kulle-cc0.glb", pos: [12, -0.2, -2], rotY: -0.9, malhojd: 2.9, maxBredd: 8.2 },
  { id: "kulle-s", fil: "/models/bulk/w-kulle-cc0.glb", pos: [0, -0.2, 12], rotY: 0.1, malhojd: 2.4, maxBredd: 8.5 },
];

const INRAMNING_FILER = [...new Set(INRAMNING_OBJEKT.map((o) => o.fil))];
forladdaNarLedig(INRAMNING_FILER);

class TystGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? null : this.props.children;
  }
}

function InramningSak({ o }: { o: InramningObjekt }) {
  const gltf = useGLTF(o.fil, false, true, kopplaMeshopt);
  const klon = useMemo(() => {
    const k = gltf.scene.clone(true);
    belysScen(k);
    passaByggnad(k, o.malhojd, o.maxBredd);
    skuggaUtanTraff(k, false);
    return k;
  }, [gltf.scene, o.malhojd, o.maxBredd]);
  return (
    <group name={`inramning-${o.id}`} position={o.pos} rotation={[0, o.rotY, 0]}>
      <primitive object={klon} />
    </group>
  );
}

export function SolgardInramning() {
  useEffect(() => {
    window.__tredGardInramning = {
      lada: true,
      vaderkvarn: true,
      staket: true,
      trad: true,
      kullar: true,
      antal: INRAMNING_OBJEKT.length,
    };
    if (window.__gard3d) {
      window.__gard3d.inramningAntal = INRAMNING_OBJEKT.length;
    }
  }, []);

  useFrame(({ gl }) => {
    const gard = window.__gard3d;
    if (!gard) return;
    gard.inramningAntal = INRAMNING_OBJEKT.length;
    gard.calls = gl.info.render.calls;
    gard.tris = gl.info.render.triangles;
  });

  return (
    <group name="solgard-inramning">
      <pointLight position={[-0.85, 1.15, 5.45]} color="#FFB74D" intensity={0.85} distance={4.5} />
      <pointLight position={[0.85, 1.15, 5.45]} color="#FFB74D" intensity={0.85} distance={4.5} />
      {INRAMNING_OBJEKT.map((o) => (
        <TystGren key={o.id}>
          <Suspense fallback={null}>
            <InramningSak o={o} />
          </Suspense>
        </TystGren>
      ))}
    </group>
  );
}
