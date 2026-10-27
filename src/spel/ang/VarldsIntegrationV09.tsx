import { Suspense } from "react";
import { HorisontVarld } from "./HorisontVarld.tsx";
import { FlygKameraV09 } from "./FlygKameraV09.tsx";
import { IntroKameraV09 } from "./IntroKameraV09.tsx";
import { Vagvisare3D, VagvisareProjektor, type VagvisarePlatsId, type VagvisareSkarmPunkt } from "./Vagvisare3D.tsx";

type Props = {
  introAktiv?: boolean;
  vyFlygAktiv?: boolean;
  resaMal?: VagvisarePlatsId | null;
  plats?: VagvisarePlatsId;
  onValjPlats?: (id: VagvisarePlatsId) => void;
  onPunkter?: (p: VagvisareSkarmPunkt[]) => void;
};

/** Horisont, vägvisare och den enda flygkameran — en ägare åt gången. */
export function VarldsIntegrationV09({
  introAktiv = false,
  vyFlygAktiv = false,
  resaMal = null,
  plats = "ang",
  onValjPlats,
  onPunkter,
}: Props) {
  return (
    <>
      <HorisontVarld />
      {onPunkter ? <VagvisareProjektor plats={plats} onPunkter={onPunkter} /> : null}
      {onValjPlats ? (
        <Suspense fallback={null}>
          <Vagvisare3D plats={plats} onValjPlats={onValjPlats} />
        </Suspense>
      ) : null}
      <IntroKameraV09 />
      <FlygKameraV09 introAktiv={introAktiv} vyFlygAktiv={vyFlygAktiv} resaMal={resaMal} />
    </>
  );
}
