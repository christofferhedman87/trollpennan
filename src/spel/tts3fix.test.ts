// TTS-3-fix: kön med riktiga texter ur manifestet och ett låtsat Audio-element (node). En banner avbryter en guiderad som
// läses (uttoning, bannerns röst börjar direkt, den avbrutna läses inte om). Ett tryck (tystna) stoppar rösten som spelar
// och tar bort en bannerröst som ligger i kön innan den hunnit starta.
import assert from "node:assert/strict";
import { test } from "node:test";
import manifest from "../../data/rost-manifest.json" with { type: "json" };

type Spel = { f: string; start: number; paus: number | null; volym: number[] };
const spelat: Spel[] = [];
class FakeAudio {
  src: string;
  paused = true;
  rec: Spel | null = null;
  private l = new Map<string, (() => void)[]>();
  _volume = 1;
  constructor(src: string) {
    this.src = src;
  }
  get volume() {
    return this._volume;
  }
  set volume(v: number) {
    this._volume = v;
    this.rec?.volym.push(v);
  }
  addEventListener(t: string, f: () => void) {
    this.l.set(t, [...(this.l.get(t) ?? []), f]);
  }
  play() {
    this.paused = false;
    this.rec = { f: this.src, start: performance.now(), paus: null, volym: [] };
    spelat.push(this.rec);
    return Promise.resolve();
  }
  pause() {
    if (!this.paused && this.rec) this.rec.paus ??= performance.now();
    this.paused = true;
  }
  slut() {
    this.paused = true;
    for (const f of this.l.get("ended") ?? []) f();
  }
}
const g = globalThis as unknown as Record<string, unknown>;
g.window = globalThis;
g.Audio = FakeAudio;
const { useMinne } = await import("./minne.ts");
const rost = await import("./rost.ts");
const { rostPlan } = await import("./rostManifest.ts");
useMinne.setState({ ljudPa: true });

const enkla = Object.values((manifest as unknown as { rader: Record<string, { t: string }> }).rader)
  .map((r) => r.t)
  .filter((t) => !t.includes(" /") && rostPlan(t)?.delar.length === 1);
const [guide, bannerA, bannerB] = enkla.slice(0, 3) as [string, string, string];
const fil = (t: string) => (rostPlan(t)!.delar[0] as { f: string }).f;
const vanta = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("TTS-3-fix: en banner avbryter guideraden som läses – uttoning ≈ 150 ms, bannerns röst börjar direkt, guiden läses inte om", async () => {
  spelat.length = 0;
  rost.sag(guide, "g1");
  await vanta(5);
  assert.equal(spelat.length, 1);
  assert.equal(spelat[0]!.f, fil(guide));
  rost.sag(bannerA, "b1", true);
  await vanta(5);
  assert.equal(spelat.length, 2, "bannerns röst började direkt, utan att vänta på guiden");
  assert.equal(spelat[1]!.f, fil(bannerA));
  assert.equal(spelat[0]!.paus, null, "guiden tonas ut, inte klipps");
  await vanta(rost.TONA_MS + 80);
  assert.ok(spelat[0]!.paus !== null, "guiden är pausad efter uttoningen");
  assert.ok(spelat[0]!.volym.length >= 2 && spelat[0]!.volym.at(-1)! < 0.6, "volymen sänktes stegvis");
  assert.equal(spelat[1]!.paus, null, "bannerns röst spelar vidare");
  rost.tystna();
  await vanta(5);
  assert.equal(spelat.filter((s) => s.f === fil(guide)).length, 1, "den avbrutna guideraden läses inte om");
});

test("TTS-3-fix: ett tryck stoppar rösten som spelar och tar bort en bannerröst som ligger i kön innan den startar", async () => {
  spelat.length = 0;
  rost.sag(bannerA, "b2", true);
  await vanta(5);
  rost.sag(bannerB, "b3", true); // en banner avbryter inte en annan – den ligger i kön
  rost.sag(guide, "g2");
  await vanta(5);
  assert.deepEqual(spelat.map((s) => s.f), [fil(bannerA)], "B och guiden ligger i kön");
  rost.tystna();
  assert.ok(spelat[0]!.paus !== null, "rösten som spelade pausades");
  await vanta(rost.TONA_MS + 50);
  assert.deepEqual(spelat.map((s) => s.f), [fil(bannerA)], "inget ur kön startade efter trycket");
});

test("TTS-3-fix: ett tryck under uttoningen stoppar också den uttonade rösten direkt", async () => {
  spelat.length = 0;
  rost.sag(guide, "g3");
  await vanta(5);
  rost.sag(bannerB, "b4", true);
  await vanta(5);
  rost.tystna();
  assert.ok(spelat.every((s) => s.paus !== null), "både den uttonade guiden och bannerns röst är pausade");
});
