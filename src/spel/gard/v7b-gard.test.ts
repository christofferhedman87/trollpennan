import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { franTolk } from "../bygge.ts";
import { fyll } from "../fyll.ts";
import { appliceraByggMening, tolkaByggMening } from "./byggTolk.ts";
import { egnaMaterial, inspekteraHus3D } from "./modellPrep.ts";

const MENING = "ett stort rött hus med blått tak och tre fönster";

test("tolkaByggMening läser storlek, vägg, tak och tre fönster", () => {
  const t = tolkaByggMening(MENING);
  assert.ok(t);
  assert.equal(t.bygg, "hus");
  assert.equal(t.storlekId, "stor");
  assert.equal(t.fargId, "röd");
  assert.equal(t.fargHex, "#e53935");
  assert.equal(t.takFargId, "blå");
  assert.equal(t.takFargHex, "#1e88e5");
  assert.equal(t.fonsterAntal, 3);
  assert.equal((t.formel.match(/\bmed\b/g) ?? []).length, 1);
});

test("utan fönster ger antal 0 och formeln utan dubbel med", () => {
  const t = tolkaByggMening("ett rött hus utan fönster");
  assert.ok(t);
  assert.equal(t.bygg, "hus");
  assert.equal(t.fonsterAntal, 0);
  assert.equal(t.formel, "ett rött hus utan fönster");
});

test("appliceraByggMening skriver över färg, tak, storlek och fönster", () => {
  const forst = tolkaByggMening("ett litet blått hus");
  assert.ok(forst);
  const bas = franTolk(forst.tolk, forst.formel, 0.4, 0.6);
  bas.uid = "hus-1";
  bas.boende = ["katt"];
  const ny = tolkaByggMening(MENING);
  assert.ok(ny);
  const upp = appliceraByggMening(bas, ny);
  assert.equal(upp.uid, "hus-1");
  assert.equal(upp.x, 0.4);
  assert.equal(upp.y, 0.6);
  assert.deepEqual(upp.boende, ["katt"]);
  assert.equal(upp.fargHex?.toLowerCase(), "#e53935");
  assert.equal(upp.storlekId, "stor");
  assert.equal(upp.delar.find((d) => d.id === "tak")?.fargHex?.toLowerCase(), "#1e88e5");
  assert.equal(upp.delar.find((d) => d.id === "fönster")?.antal, 3);
});

function husMock(): THREE.Group {
  const rot = new THREE.Group();
  const vaggMat = new THREE.MeshStandardMaterial({ color: "#ffffff" });
  vaggMat.name = "Walls";
  const vagg = new THREE.Mesh(new THREE.BufferGeometry(), vaggMat);
  vagg.name = "House";
  const takMat = new THREE.MeshStandardMaterial({ color: "#888888" });
  takMat.name = "Roof";
  const tak = new THREE.Mesh(new THREE.BufferGeometry(), takMat);
  tak.name = "Roof";
  rot.add(vagg, tak);
  for (const namn of ["Window_1", "Window_2", "Window_3", "Window_Side"]) {
    const nod = new THREE.Group();
    nod.name = namn;
    rot.add(nod);
  }
  return rot;
}

test("egnaMaterial färgar Walls och Roof och visar rätt fönsternoder", () => {
  const tre = husMock();
  egnaMaterial(tre, "#e53935", "#1e88e5", 3);
  const d3 = inspekteraHus3D(tre);
  assert.equal(d3.wallsColorHex, "#e53935");
  assert.equal(d3.roofColorHex, "#1e88e5");
  assert.deepEqual(d3.synligaFonsterNoder, ["Window_1", "Window_2", "Window_3"]);

  const tva = husMock();
  egnaMaterial(tva, "#e53935", "#1e88e5", 2);
  assert.deepEqual(inspekteraHus3D(tva).synligaFonsterNoder, ["Window_1", "Window_2"]);

  const noll = husMock();
  egnaMaterial(noll, "#e53935", "#1e88e5", 0);
  const d0 = inspekteraHus3D(noll);
  assert.equal(d0.wallsColorHex, "#e53935");
  assert.equal(d0.roofColorHex, "#1e88e5");
  assert.deepEqual(d0.synligaFonsterNoder, []);
});

test("fyll versaliserar efter utropstecken", () => {
  assert.equal(
    fyll("Klart! {formel} står på gården.", { formel: MENING }),
    "Klart! Ett stort rött hus med blått tak och tre fönster står på gården.",
  );
});
