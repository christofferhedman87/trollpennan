// Förenklar en GLB till under ett triangeltak (weld + simplify med stigande fel). node forenkla.mjs in.glb ut.glb 5600
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, simplify } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
const [inn, ut, tak] = [process.argv[2], process.argv[3], Number(process.argv[4] ?? 5600)];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const tri = (d) => d.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((s, p) => s + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3, 0);
await MeshoptSimplifier.ready;
for (const [ratio, error] of [[0.8, 0.01], [0.6, 0.02], [0.5, 0.04], [0.4, 0.06], [0.3, 0.08], [0.25, 0.1], [0.2, 0.15]]) {
  const d = await io.read(inn);
  const fore = tri(d);
  await d.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: false }));
  const n = tri(d);
  if (n <= tak) { await io.write(ut, d); console.log(`${inn}: ${fore} → ${n} (ratio ${ratio}, fel ${error})`); process.exit(0); }
}
console.log(`${inn}: når inte ${tak}`); process.exit(1);
