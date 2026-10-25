// V4: neutrum, ljudstam, spärrlista och singular stjärna. Rör inte befintliga testfiler.
import assert from "node:assert/strict";
import test from "node:test";
import { fyll } from "../spel/fyll.ts";
import { arSparrat } from "./sparr.ts";
import { tolkaMedReserv } from "./reserv.ts";
import { tolka } from "./tolka.ts";

function formel(fras: string): string {
  const u = tolka(fras);
  assert.equal(u.typ, "skapad", fras);
  if (u.typ !== "skapad") throw new Error(fras);
  return u.varelse.formel;
}

test("tjykling föreslås som kyckling", () => {
  assert.equal(tolkaMedReserv("tjykling").typ, "forslag");
});

test("sjöldpadda föreslås som sköldpadda", () => {
  assert.equal(tolkaMedReserv("sjöldpadda").typ, "forslag");
});

test("en hus blir ett hus", () => {
  assert.equal(formel("en hus"), "ett hus");
});

test("ett röd hus blir ett rött hus", () => {
  assert.equal(formel("ett röd hus"), "ett rött hus");
});

test("spärrlista: pistol spärras, vattenpistol och smörkniv släpps", () => {
  assert.equal(arSparrat("pistol"), true);
  assert.equal(arSparrat("en vattenpistol"), false);
  assert.equal(arSparrat("en smörkniv"), false);
});

test("en stjärna i singular", () => {
  assert.equal(fyll("{n} stjärnor", { n: 1 }), "1 stjärna");
});
