// R9K: en liten humörikon ovanför varje djur i 3D (ängen och alla platser). Vilken ikon som visas står i data/humor.json
// (`ikon` per humör); ingen kod per humör. Ikonen tar inga tryck, så trycket går till djuret som förut.
import { Html } from "@react-three/drei";
import { HUMOR_IKON } from "../liv.ts";
import { useMinne } from "../minne.ts";
import type { DjurSignal } from "../gltfDjur.tsx";

export function HumorIkon({ uid, hojd, signal }: { uid: string; hojd: number; signal?: { current: DjurSignal } }) {
  const humor = useMinne((s) => s.liv[uid]?.humor);
  const ikon = humor ? HUMOR_IKON[humor] : undefined;
  const smeknamn = useMinne((s) => s.ang.find((d) => d.uid === uid)?.smeknamn ?? Object.values(s.platsSkapelser).flat().find((d) => d.uid === uid)?.smeknamn ?? s.hemma.find((h) => h.spec.uid === uid)?.spec.smeknamn);
  const harNamngivetPaAng = useMinne((s) => s.ang.some((d) => !!d.smeknamn));
  void signal;
  if ((!humor || !ikon) && !smeknamn) return null;
  return (
    <Html position={[0, hojd, 0]} center zIndexRange={[3, 0]} style={{ pointerEvents: "auto" }}>
      <span className="humor-etikett-3d">
        {smeknamn ? (
          <span className="djur-namn-3d" data-d3="djur-namn-3d" data-uid={uid} ref={(el) => el?.setAttribute("data-testid", "djur-namn-3d")} onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("troll-gava-klick", { detail: uid })); }}>{smeknamn}</span>
        ) : null}
        {humor && ikon ? (
          <span className="humor-ikon-3d" data-testid={`humor3d-${humor}`} data-uid={smeknamn || !harNamngivetPaAng ? uid : undefined} aria-hidden onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("troll-gava-klick", { detail: uid })); }}>{ikon}</span>
        ) : null}
      </span>
    </Html>
  );
}
