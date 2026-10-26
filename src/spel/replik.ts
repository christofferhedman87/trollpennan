import { ORD } from "@/tolk/data.ts";
import type { Varelse } from "@/tolk/typer.ts";
import { storMeningsStart } from "./fyll.ts";

function slump(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)] ?? "";
}

function rader(v: string[] | string | undefined, fallback: string[]): string[] {
  if (typeof v === "string") return v ? [v] : fallback;
  if (v && v.length) return v;
  return fallback;
}

function fyll(rad: string, v: Varelse): string {
  return rad.replaceAll("{beskrivning}", v.beskrivning).replaceAll("{formel}", v.formel);
}

export function replik(v: Varelse, slag: "hej" | "tryck" | "sover"): string {
  const r = ORD.repliker;
  if (slag === "hej") {
    const lista = rader(r.hej, []);
    const medFormel = lista.find((s) => s.includes("{formel}"));
    return storMeningsStart(fyll(medFormel ?? slump(lista), v));
  }
  let lista = rader(r.hej, []);
  if (slag === "sover" && r.sover) lista = Array.isArray(r.sover) ? r.sover : [r.sover];
  else if (v.kontur && v.alpha <= 0.3 && r.osynlig) lista = rader(r.osynlig, lista);
  else if (v.formagor.length) {
    const nyckel = v.formagor[Math.floor(Math.random() * v.formagor.length)] ?? "";
    lista = rader(r[nyckel], rader(r.utan_formaga, lista));
  } else lista = rader(r.utan_formaga, lista);
  return storMeningsStart(fyll(slump(lista), v));
}
