import { Suspense } from "react";
import { HorisontVarld } from "./HorisontVarld.tsx";
import { FlygKameraV09 } from "./FlygKameraV09.tsx";
import { IntroKameraV09 } from "./IntroKameraV09.tsx";
import { Vagvisare3D, VagvisareProjektor, type VagvisarePlatsId, type VagvisareSkarmPunkt } from "./Vagvisare3D.tsx";
import { StigarOchSkyltar } from "./Stigar.tsx";

type Props = {
  introAktiv?: boolean;
  vyFlygAktiv?: boolean;
  resaMal?: VagvisarePlatsId | null;
  plats?: VagvisarePlatsId;
  onValjPlats?: (id: VagvisarePlatsId) => void;
  onPunkter?: (p: VagvisareSkarmPunkt[]) => void;
  /** Platsnamnen i fjärran under flygvyn ("Se hela dalen" och introts flygning). */
  dalEtiketter?: boolean;
};

/** Horisont, vägvisare och den enda flygkameran — en ägare åt gången. */
export function VarldsIntegrationV09({
  introAktiv = false,
  vyFlygAktiv = false,
  resaMal = null,
  plats = "ang",
  onValjPlats,
  onPunkter,
  dalEtiketter = false,
}: Props) {
  // På Ängen: stigar och skyltar med namnet på brädan, och platserna i fjärran går att trycka på.
  // På de andra platserna (returskylten "Till Ängen") används den gamla vägvisaren som förut.
  const pang = plats === "ang";
  return (
    <>
      <HorisontVarld onValjPlats={pang ? onValjPlats : undefined} etiketter={dalEtiketter} />
      {pang && onValjPlats ? (
        <Suspense fallback={null}>
          <StigarOchSkyltar onValjPlats={onValjPlats} />
        </Suspense>
      ) : null}
      {!pang && onPunkter ? <VagvisareProjektor plats={plats} onPunkter={onPunkter} /> : null}
      {!pang && onValjPlats ? (
        <Suspense fallback={null}>
          <Vagvisare3D plats={plats} onValjPlats={onValjPlats} />
        </Suspense>
      ) : null}
      <IntroKameraV09 />
      <FlygKameraV09 introAktiv={introAktiv} vyFlygAktiv={vyFlygAktiv} resaMal={resaMal} />
    </>
  );
}
