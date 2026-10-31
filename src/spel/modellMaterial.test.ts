import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { djurGltfUrl, ENTITETER } from "./entiteter.ts";

type Material = { alphaMode?: string; alphaCutoff?: number; pbrMetallicRoughness?: { baseColorFactor?: number[] } };
type Modell = { materials?: Material[]; meshes?: { primitives: { material?: number }[] }[] };

test("Använda djurmodeller har minst ett material som inte döljs helt av alfavärdet", () => {
  const sedda = new Set<string>(), fel: string[] = [];
  for (const [id, ent] of Object.entries(ENTITETER)) {
    const fil = djurGltfUrl(id);
    if (ent.typ !== "djur" || !fil || !fil.endsWith(".glb") || sedda.has(fil)) continue;
    sedda.add(fil);
    const b = fs.readFileSync("public" + fil);
    assert.equal(b.readUInt32LE(0), 0x46546c67, fil);
    assert.equal(b.readUInt32LE(16), 0x4e4f534a, fil);
    const d = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as Modell;
    const synlig = d.meshes?.some((m) => m.primitives.some((p) => {
      const mat = p.material === undefined ? undefined : d.materials?.[p.material];
      const alfa = mat?.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 1;
      if (mat?.alphaMode === "MASK") return alfa >= (mat.alphaCutoff ?? 0.5);
      return mat?.alphaMode !== "BLEND" || alfa > 0;
    }));
    if (!synlig) fel.push(`${id}: ${fil}`);
  }
  assert.ok(sedda.size > 0, "använder spelets verkliga modellval");
  assert.deepEqual(fel, [], "alla huvudmaterial får inte vara helt bortklippta");
});
