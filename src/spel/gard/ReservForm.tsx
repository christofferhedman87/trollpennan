import type { ReservSlag } from "./modellPrep.ts";

function Hus({ farg, hojd }: { farg: string; hojd: number }) {
  const vaggar = hojd * 0.62;
  const tak = hojd * 0.4;
  return (
    <group>
      <mesh position={[0, vaggar / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, vaggar, 0.56]} />
        <meshStandardMaterial color={farg} roughness={0.75} />
      </mesh>
      <mesh position={[0, vaggar + tak / 2 - 0.02, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.46, tak, 4]} />
        <meshStandardMaterial color={farg} roughness={0.6} />
      </mesh>
      <mesh position={[0, vaggar * 0.36, 0.29]}>
        <boxGeometry args={[0.16, vaggar * 0.42, 0.04]} />
        <meshStandardMaterial color="#fff6e5" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Torn({ farg, hojd }: { farg: string; hojd: number }) {
  const kropp = hojd * 0.72;
  const tak = hojd * 0.32;
  return (
    <group>
      <mesh position={[0, kropp / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.26, kropp, 8]} />
        <meshStandardMaterial color={farg} roughness={0.7} />
      </mesh>
      <mesh position={[0, kropp + tak / 2 - 0.02, 0]} castShadow>
        <coneGeometry args={[0.32, tak, 8]} />
        <meshStandardMaterial color={farg} roughness={0.55} />
      </mesh>
    </group>
  );
}

function Damm({ farg, hojd }: { farg: string; hojd: number }) {
  const h = Math.max(0.08, hojd);
  return (
    <group>
      <mesh position={[0, h / 2, 0]} receiveShadow>
        <cylinderGeometry args={[0.42, 0.46, h, 20]} />
        <meshStandardMaterial color={farg} roughness={0.22} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, h + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshStandardMaterial color="#e1f5fe" roughness={0.15} />
      </mesh>
    </group>
  );
}

function Trad({ farg, hojd }: { farg: string; hojd: number }) {
  const stam = hojd * 0.4;
  const krona = hojd * 0.32;
  return (
    <group>
      <mesh position={[0, stam / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, stam, 6]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} />
      </mesh>
      <mesh position={[0, stam + krona * 0.5, 0]} castShadow>
        <sphereGeometry args={[krona, 10, 8]} />
        <meshStandardMaterial color={farg} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Lek({ farg, hojd }: { farg: string; hojd: number }) {
  const stolpe = hojd * 0.75;
  return (
    <group>
      <mesh position={[0, hojd * 0.08, 0]} receiveShadow>
        <boxGeometry args={[0.72, hojd * 0.14, 0.72]} />
        <meshStandardMaterial color={farg} roughness={0.7} />
      </mesh>
      <mesh position={[-0.22, stolpe / 2, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, stolpe, 6]} />
        <meshStandardMaterial color={farg} roughness={0.6} />
      </mesh>
      <mesh position={[0.22, stolpe / 2, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, stolpe, 6]} />
        <meshStandardMaterial color={farg} roughness={0.6} />
      </mesh>
      <mesh position={[0, stolpe, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.52, 6]} />
        <meshStandardMaterial color="#fff6e5" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Bro({ farg, hojd }: { farg: string; hojd: number }) {
  const dack = Math.max(0.08, hojd * 0.4);
  return (
    <group>
      <mesh position={[0, dack / 2 + 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.86, dack, 0.34]} />
        <meshStandardMaterial color={farg} roughness={0.8} />
      </mesh>
      <mesh position={[0, dack + 0.16, 0.14]}>
        <boxGeometry args={[0.86, 0.06, 0.04]} />
        <meshStandardMaterial color="#fff6e5" roughness={0.55} />
      </mesh>
      <mesh position={[0, dack + 0.16, -0.14]}>
        <boxGeometry args={[0.86, 0.06, 0.04]} />
        <meshStandardMaterial color="#fff6e5" roughness={0.55} />
      </mesh>
    </group>
  );
}

export function ReservForm({ slag, farg, hojd }: { slag: ReservSlag; farg: string; hojd: number }) {
  switch (slag) {
    case "hus":
      return <Hus farg={farg} hojd={hojd} />;
    case "torn":
      return <Torn farg={farg} hojd={hojd} />;
    case "damm":
      return <Damm farg={farg} hojd={hojd} />;
    case "trad":
      return <Trad farg={farg} hojd={hojd} />;
    case "lek":
      return <Lek farg={farg} hojd={hojd} />;
    case "bro":
      return <Bro farg={farg} hojd={hojd} />;
    default: {
      const ogiltig: never = slag;
      return ogiltig;
    }
  }
}

export function StaketReserv({ farg }: { farg: string }) {
  return (
    <mesh position={[0, 0.28, -0.5]} castShadow>
      <boxGeometry args={[0.92, 0.46, 0.08]} />
      <meshStandardMaterial color={farg} roughness={0.8} />
    </mesh>
  );
}
