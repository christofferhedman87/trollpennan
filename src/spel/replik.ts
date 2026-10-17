import { ORD } from "@/tolk/data.ts";
import type { Varelse } from "@/tolk/typer.ts";

function slump(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)] ?? "";
}

function fyll(rad: string, v: Varelse): string {
  return rad.replaceAll("{beskrivning}", v.beskrivning).replaceAll("{formel}", v.formel);
}

export function replik(v: Varelse, slag: "hej" | "tryck" | "sover"): string {
  const r = ORD.repliker;
  if (slag === "hej") {
    const lista = r.hej ?? [];
    const medFormel = lista.find((s) => s.includes("{formel}"));
    return fyll(medFormel ?? slump(lista), v);
  }
  let lista = r.hej ?? [];
  if (slag === "sover") lista = r.sover ?? lista;
  else if (v.kontur && v.alpha <= 0.3 && r.osynlig) lista = r.osynlig;
  else if (v.formagor.length) {
    const nyckel = v.formagor[Math.floor(Math.random() * v.formagor.length)] ?? "";
    lista = r[nyckel] ?? r.utan_formaga ?? lista;
  } else lista = r.utan_formaga ?? lista;
  return fyll(slump(lista), v);
}
