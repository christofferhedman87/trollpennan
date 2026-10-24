// P3a – skapelsen syns: minsta synliga storlek, saken bredvid ett djur på torr mark, småsakernas inbördes storlek.
// Placeringsregeln provas i p3a.test.ts; kläder och tolkning kommer i P3b.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENTITETER, halvBredd, harModell, malhojd, skalaFor, SYN, synSkala, takSkala } from "./entiteter.ts";
import modellmattJson from "../../data/modellmatt.json" with { type: "json" };
import { sakLage } from "./landning.ts";
import { platsMed, START_PLATS } from "./platser.ts";
import { torrKropp } from "./platsYta.ts";
import { skarmRuta } from "./skarm.ts";

// P3a torr 4: kroppens mått som synSkala och placeringsregeln räknar med – modellens egna (data/modellmatt.json), annars
// fotavtrycket och målhöjden
const MM = (modellmattJson as unknown as { matt: Record<string, number[]> }).matt;
const matt = (k: string): [number, number] => {
  const mm = MM[k];
  return mm && (harModell(k) || mm.length > 3) ? [(mm[0]! * takSkala(k, 1)) / 2, mm[1]! * takSkala(k, 1)] : [halvBredd(k), malhojd(k)];
};

test("P3 (Doodle r83a): minsta synliga storlek – varje djur på varje djup är minst syn.min_px (inom max_forstoring)", () => {
  const S = SYN!;
  assert.ok(S.min_px > 0 && S.max_forstoring >= 1);
  let n = 0;
  for (const [k, e] of Object.entries(ENTITETER)) {
    if (e.typ !== "djur") continue;
    for (const z of [-6, -4, -2, 0, 2]) {
      const f = synSkala(k, 1, z);
      const [hb, h] = matt(k);
      const r = skarmRuta(0, 0, z, hb * f, h * f);
      const minsta = Math.min(r.x1 - r.x0, r.y1 - r.y0);
      assert.ok(minsta >= S.min_px - 0.5 || f >= S.max_forstoring - 1e-9, `${k} på z ${z}: ${minsta.toFixed(0)} px`);
      n++;
    }
  }
  assert.ok(n > 500);
  const narval = skarmRuta(0, 0, -4, matt("narval")[0] * synSkala("narval", 1, -4), matt("narval")[1] * synSkala("narval", 1, -4));
  assert.ok(narval.y1 - narval.y0 >= S.min_px - 0.5, "narvalen");
});

test("P3: en sak bredvid ett djur vid dammen står på torr mark", () => {
  const ang = platsMed(START_PLATS)!;
  const torr = (wx: number, wz: number) => torrKropp(ang, wx, wz, 0.4);
  let provade = 0;
  for (let x = -1.5; x <= 1.5; x += 0.25)
    for (let z = -1; z <= 1.5; z += 0.25) {
      if (!torrKropp(ang, x, z, 0.5)) continue;
      provade++;
      const [ox, oz] = sakLage(x, z, [0.8, 0.2], torr);
      const ok = [[0.8, 0.2], [-0.8, 0.2], [0.32, 0.75], [-0.32, 0.75], [0.8, 0.8], [-0.8, 0.8]].some(([a, b]) => torr(x + a!, z + b!));
      if (ok) assert.ok(torr(x + ox, z + oz), `hinken i dammen vid (${x}, ${z})`);
    }
  assert.ok(provade > 10);
});

test("P3 (Doodle 15:35): småsaker har rimlig inbördes storlek – pucken är mindre än kaffekoppen, ordningen följer målhöjden", () => {
  // modellernas egna mått (GLB-bbox: höjd, bredd, djup), uppmätta 2026-10-20
  const matt: Record<string, [number, number, number]> = { puck: [0.08, 0.24, 0.24], kaffekopp: [0.25, 0.32, 0.32], kopp: [0.2, 0.23, 0.29], tallrik: [0.1, 0.95, 0.95] };
  const storst = (k: string) => Math.max(...matt[k]!) * skalaFor(k, ...matt[k]!);
  assert.ok(storst("puck") < 0.92 * storst("kaffekopp"), `puck ${storst("puck").toFixed(2)}, kaffekopp ${storst("kaffekopp").toFixed(2)}`);
  assert.ok(storst("kaffekopp") <= storst("kopp") + 1e-9 && storst("kopp") <= storst("tallrik") + 1e-9, "kaffekopp ≤ kopp ≤ tallrik (målhöjd 0,4 / 0,5 / 0,5)");
  // ingen småsak försvinner: största måttet minst storlek × (1 − lutning) + lutning × målhöjd
  assert.ok(storst("puck") >= 0.3, `puck ${storst("puck")}`);
});

