import type { Slot } from "./typer.ts";

export const KATEGORIER: { id: Slot; namn: string }[] = [
  { id: "djur", namn: "Djur" },
  { id: "farg", namn: "Färg" },
  { id: "storlek", namn: "Storlek" },
  { id: "monster", namn: "Mönster" },
  { id: "formaga", namn: "Kan" },
  { id: "tillbehor", namn: "Har" },
];

export const RADER: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Å"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];
