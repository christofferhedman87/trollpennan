import byggSidorJson from "../../../data/byggsidor.json" with { type: "json" };
import tangentbordJson from "../../../data/tangentbord.json" with { type: "json" };
import firandeJson from "../../../data/firande.json" with { type: "json" };
import ledJson from "../../../data/ledtradar.json" with { type: "json" };
import ljudJson from "../../../data/ljud.json" with { type: "json" };
import sidorJson from "../../../data/sidor.json" with { type: "json" };
import texterJson from "../../../data/texter-gard.json" with { type: "json" };
import type { Led, SidaBygg, SidaDjur, Slot } from "./typer.ts";

export const SIDOR = sidorJson as {
  ekonomi: { kostnad_i_kopordning: number[] };
  sidor: SidaDjur[];
};
export const BYGGSIDOR = byggSidorJson as {
  sidor: SidaBygg[];
  last_ord: { text: string[] };
};
export const TEXTER = texterJson as {
  flikar: { angen: string; garden: string; byggboken: string };
  forsta_besok: string[];
  penna_bygg: { placeholder: string; knapp: string };
  bygg_nagot: string;
  byggt: string[];
  meny: { flytta: string; bygg_om: string; lada: string; bo: string };
  flytta_hjalp: string;
  bygg_om_hjalp: string;
  lada: { rubrik: string; tom: string; ta_fram: string; full: string };
  bo: { valj: string; flyttar_in: string[]; full: string; passar_inte: string; ingen: string };
  backup: {
    rubrik: string;
    spara: string;
    spara_hjalp: string;
    las_in: string;
    las_in_fraga: string;
    las_in_ja: string;
    las_in_nej: string;
    klart: string;
    fel: string;
  };
  borja_om: { knapp: string; fraga: string; ja: string };
  klapp: { en: string[]; mer: string[] };
  demo: { senare: string };
};
export const FIR = firandeJson as {
  guldord: { text: string[]; stjarnor: number };
  hemligt_ord: { text: string[]; stjarnor: number };
  framsteg: { text: string; kort: string };
  stjarnor: { fa: string; fa_en: string; har: string; kop: string; kop_ja: string; kop_nej: string; for_fa: string };
  ny_sida: { text: string };
  sida_klar: { text: string; stjarnor: number };
  bok_klar: { text: string };
  onskan: { knapp: string; inte_nu: string; rubrik: string; led: string; onskar: string; andra: string; kompis: string; fran_bengtsson: string; fran_bengtsson_djur: string; knapp_bengtsson: string };
};
export const LED = (ledJson as { ledtradar: Record<string, Led> }).ledtradar;
export const LJUD_KNAPP = (ljudJson as { foralder: { knapp: string } }).foralder.knapp;
export const [LJUD_PA, LJUD_AV_ORD] = LJUD_KNAPP.split(" / ");
export const LJUD_AV = `${LJUD_PA?.split(":")[0] ?? "Ljud"}: ${LJUD_AV_ORD ?? "av"}`;

export const FLIKAR: { id: Slot; namn: string }[] = [
  { id: "djur", namn: "Djur" },
  { id: "farg", namn: "Färg" },
  { id: "storlek", namn: "Storlek" },
  { id: "monster", namn: "Mönster" },
  { id: "formaga", namn: "Kan" },
  { id: "tillbehor", namn: "Har" },
];

// Skärmtangentbordets layout ligger i data/tangentbord.json (R6A-3B): rader av tangenter, specialtangenter i {klammer}.
export const TANGENTBORD = tangentbordJson as { rader: string[][] };
