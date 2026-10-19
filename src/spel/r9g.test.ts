// R9G: stall (till/från, alla platser, tak), låst gåta och skrivhint.
import assert from "node:assert/strict";
import { test } from "node:test";
import hemligt from "../../data/hemligt.json" with { type: "json" };
import texter from "../../data/texter-gard.json" with { type: "json" };
import { aktivGata, nastaGata } from "./gata.ts";
import { useMinne, franSparning } from "./minne.ts";
import { TAK_PER_PLATS } from "./platser.ts";
import { flyttaTillStall, hamtaFranStall } from "./stall.ts";

const v = { kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] } as never;

test("R9G: tillStall/franStall rundresa på ängen", () => {
  const m = useMinne.getState();
  m.aterstall();
  const { nya } = useMinne.getState().laggPaAng(v, 2);
  const uid = nya[0]!.uid;
  assert.equal(useMinne.getState().tillStall(uid), true);
  assert.ok(!useMinne.getState().ang.some((a) => a.uid === uid), "borta från ängen");
  assert.deepEqual(useMinne.getState().stall.map((s) => s.uid), [uid]);
  assert.equal(useMinne.getState().tillStall("finns-inte"), false);
  assert.equal(useMinne.getState().franStall(uid), "ok");
  assert.ok(useMinne.getState().ang.some((a) => a.uid === uid), "tillbaka på ängen");
  assert.equal(useMinne.getState().stall.length, 0);
  assert.equal(useMinne.getState().franStall(uid), "saknas");
  useMinne.getState().aterstall();
});

test("R9G: stall gäller platsSkapelser och hämtning går till platsen barnet står på", () => {
  const d = { plats: "skogen", ang: [], hemma: [], garden: [], stall: [], foljeUid: "x", platsSkapelser: { skogen: [{ ...(v as object), uid: "x", skapad: 1 }] } } as never;
  const ut = flyttaTillStall(d, "x")!;
  assert.ok(ut, "djuret i skogen hittas");
  assert.deepEqual((ut as { platsSkapelser: Record<string, unknown[]> }).platsSkapelser.skogen, []);
  assert.equal((ut as { foljeUid: string | null }).foljeUid, null, "följeslagaren släpps");
  const efter = { ...(d as object), ...ut, plats: "sjon" } as never;
  const r = hamtaFranStall(efter, "x");
  assert.equal(r.status, "ok");
  assert.equal((r as { andring: { platsSkapelser: Record<string, unknown[]> } }).andring.platsSkapelser.sjon!.length, 1);
});

test("R9G: franStall respekterar TAK_PER_PLATS (ingen hårdkodad 10)", () => {
  const full = Array.from({ length: TAK_PER_PLATS }, (_, i) => ({ ...(v as object), uid: `a${i}`, skapad: i }));
  const d = { plats: "ang", ang: full, hemma: [], garden: [], platsSkapelser: {}, foljeUid: null, stall: [{ ...(v as object), uid: "s", skapad: 1 }] } as never;
  assert.equal(hamtaFranStall(d, "s").status, "full");
  assert.equal(hamtaFranStall(d, "s", TAK_PER_PLATS + 1).status, "ok");
});

test("R9G: stall och gataId sparas bakåtkompatibelt", () => {
  const gammal = franSparning({ version: 2, ang: [], garden: [], stjarnor: 0 });
  assert.deepEqual(gammal.stall, []);
  assert.equal(gammal.gataId, null);
  const ny = franSparning({ version: 2, ang: [], garden: [], stjarnor: 0, gataId: "lodjur", stall: [{ ...(v as object), uid: "s", skapad: 1 }] });
  assert.equal(ny.gataId, "lodjur");
  assert.equal(ny.stall.length, 1);
});

test("R9G: gåtan är låst – byts bara när ordet hittats eller Ny gåta trycks", () => {
  const kvar = ["a", "b", "c"];
  assert.equal(aktivGata(kvar, null), "a");
  assert.equal(aktivGata(kvar, "b"), "b", "sparad gåta gäller");
  assert.equal(aktivGata(kvar, "b"), "b", "samma igen (ingen slump)");
  assert.equal(aktivGata(["a", "c"], "b"), "a", "hittad → nästa ohittade");
  assert.equal(nastaGata(kvar, "b"), "c");
  assert.equal(nastaGata(kvar, "c"), "a");
  assert.equal(aktivGata([], "a"), null);
  useMinne.getState().aterstall();
  useMinne.getState().sattGataId("b");
  assert.equal(useMinne.getState().gataId, "b");
  useMinne.getState().aterstall();
});

test("R9G: texter finns i data", () => {
  assert.ok(hemligt.skriv_hint.length > 0 && hemligt.visa_gata.length > 0);
  for (const k of ["meny", "chip", "flytta", "forklaring", "tom", "hamta", "full"] as const) assert.ok(texter.stall[k].length > 0, k);
});

test("R9G-data: litet vatten i skogen/grottan, sjön har kvar sitt, brygga mindre, grottvalvet bak", async () => {
  const { dekorFor, vattenytor } = await import("./platsDekor.ts");
  const { platsMed } = await import("./platser.ts");
  const yta = (id: string) => vattenytor(platsMed(id)).reduce((n, v) => n + v.storlek[0] * v.storlek[1], 0);
  assert.ok(yta("skogen") <= 2, `skogens vatten ska vara en liten tjärn (${yta("skogen")})`);
  assert.ok(yta("grottan") <= 2, `grottans vatten ska vara en liten pöl (${yta("grottan")})`);
  assert.ok(yta("sjon") >= 20, "sjön behåller sitt stora vatten");
  const brygga = dekorFor(platsMed("sjon")).saker.find((s) => s.ord === "brygga")!;
  assert.ok(brygga.skala <= 0.4, `brygga skala ${brygga.skala}`);
  const valv = dekorFor(platsMed("grottan")).saker.find((s) => s.ord === "grotta")!;
  assert.ok(valv.skala <= 1 && valv.pos[2] <= -5, `grottvalv skala ${valv.skala}, z ${valv.pos[2]}`);
});
