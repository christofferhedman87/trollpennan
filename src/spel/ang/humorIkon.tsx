// R9K: en liten humörikon ovanför varje djur i 3D (ängen och alla platser). Vilken ikon som visas står i data/humor.json
// (`ikon` per humör); ingen kod per humör. Ikonen tar inga tryck, så trycket går till djuret som förut.
import { Html } from "@react-three/drei";
import { HUMOR_IKON } from "../liv.ts";
import { useMinne } from "../minne.ts";

export function HumorIkon({ uid, hojd }: { uid: string; hojd: number }) {
  const humor = useMinne((s) => s.liv[uid]?.humor);
  const ikon = humor ? HUMOR_IKON[humor] : undefined;
  if (!humor || !ikon) return null;
  return (
    <Html position={[0, hojd, 0]} center zIndexRange={[3, 0]} style={{ pointerEvents: "auto" }}>
      <span
        className="humor-ikon-3d"
        data-testid={`humor3d-${humor}`}
        data-uid={uid}
        aria-hidden
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent("troll-gava-klick", { detail: uid }));
        }}
      >
        {ikon}
      </span>
    </Html>
  );
}
