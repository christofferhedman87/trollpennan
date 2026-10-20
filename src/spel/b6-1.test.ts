// B6.1 kontroll och buggfix: obelysta GLB-material, gåtvalet per plats, tackbubblan mot banderollen,
// djur:true / final:true i platsernas uppdrag, och färguppdragen utan "låna färg".
import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import entJson from "../../data/entiteter.json" with { type: "json" };
import { SKRIV } from "./aventyr.ts";
import { belysMaterial, belysScen } from "./belys.ts";
import { gatUrval } from "./gata.ts";
import { PLATSER, klaraPerPlats, platsMed } from "./platser.ts";
import { kravUppfylltTolkat, nastaSkrivUppdrag } from "./uppdragsmotor.ts";
import { skjutForbi } from "./ui/bubbla.ts";
import { tolkaMedReserv } from "../tolk/reserv.ts";
import { kanInteRita } from "../tolk/aterkoppling.ts";
import { ENTITETER, malhojd, storlekKlass, takSkala } from "./entiteter.ts";
import { djurPlats } from "./ang/delat.ts";
import ordJson from "../../data/ord.json" with { type: "json" };

test("B6.1 (1): KHR_materials_unlit-material blir upplysta, med samma textur, och glans (emissive) går att sätta", () => {
  const tex = new THREE.Texture();
  tex.offset.set(0.25, 0.5);
  const obelyst = new THREE.MeshBasicMaterial({ name: "skin", color: 0xff8800, map: tex, transparent: true, opacity: 0.9 });
  const lit = new THREE.MeshStandardMaterial({ name: "redan" });
  const rot = new THREE.Group();
  const a = new THREE.Mesh(new THREE.BoxGeometry(), obelyst);
  const b = new THREE.Mesh(new THREE.BoxGeometry(), obelyst);
  const c = new THREE.Mesh(new THREE.BoxGeometry(), [obelyst, lit]);
  const d = new THREE.Mesh(new THREE.BoxGeometry(), lit);
  rot.add(a, b, c, d);
  assert.equal(belysScen(rot), 3, "tre nät hade ett obelyst material");
  const ny = a.material as unknown as THREE.MeshStandardMaterial;
  assert.ok(ny.isMeshStandardMaterial);
  assert.equal(b.material, ny, "samma källmaterial delar ett upplyst material");
  assert.equal((c.material as THREE.Material[])[0], ny);
  assert.equal((c.material as THREE.Material[])[1], lit, "upplysta material lämnas");
  assert.equal(d.material, lit);
  assert.equal(ny.map, tex, "samma textur (och därmed KHR_texture_transform)");
  assert.equal(ny.map!.offset.x, 0.25);
  assert.equal(ny.color.getHex(), 0xff8800);
  assert.equal(ny.name, "skin");
  assert.ok(ny.transparent && ny.opacity === 0.9);
  assert.equal(ny.userData.belystFran, "KHR_materials_unlit");
  assert.ok("emissive" in ny, "glans kan sättas utan att three.js kraschar");
  assert.equal(belysScen(rot), 0, "idempotent");
  assert.equal(belysMaterial(lit), lit);
});

test("B6.1 (B): gåtan tar platsens egna djur först, och andra först när platsens är slut", () => {
  assert.deepEqual(gatUrval(["katt", "gadda", "hund", "and"], ["gadda", "and", "groda"]), ["gadda", "and"]);
  assert.deepEqual(gatUrval(["katt", "hund"], ["gadda", "and"]), ["katt", "hund"], "platsens är funna → andra gåtor");
  assert.deepEqual(gatUrval(["katt"], undefined), ["katt"], "ängen/gården utan lista → alla");
  assert.deepEqual(gatUrval(["katt"], []), ["katt"]);
  for (const p of PLATSER) if (p.id !== "ang") assert.ok((platsMed(p.id)?.hemliga ?? []).length >= 3, `${p.id} har egna gåtdjur`);
});

test("B6.1 (4): en pratbubbla skjuts förbi banderollen och tidigare bubblor, och lämnas där inget krockar", () => {
  const banner = { top: 118, bottom: 186, left: 8, right: 367 };
  assert.equal(skjutForbi({ top: 108, bottom: 202, left: 94, right: 281 }, [banner]), 186 + 6 - 108);
  const forsta = { top: 192, bottom: 264, left: 94, right: 281 };
  const dy = skjutForbi({ top: 133, bottom: 205, left: 94, right: 281 }, [banner, forsta]);
  assert.equal(133 + dy, 264 + 6, "hamnar under både banderoll och första bubblan");
  assert.equal(skjutForbi({ top: 300, bottom: 360, left: 94, right: 281 }, [banner]), 0);
  assert.equal(skjutForbi({ top: 120, bottom: 160, left: 380, right: 400 }, [banner]), 0, "olika spalter krockar inte");
});

test("B6.1 (5): djur:true och final:true används – platsuppdragen kräver djur och varje plats har exakt en final", () => {
  const ent = (entJson as unknown as { entiteter: Record<string, { typ?: string }> }).entiteter;
  for (const p of PLATSER) {
    const egna = SKRIV.filter((u) => u.omrade === p.id);
    if (!egna.length) continue;
    const finaler = egna.filter((u) => u.final);
    if (p.id === "ang") {
      assert.equal(finaler.length, 0, "ängen har ingen final");
      continue;
    }
    assert.equal(finaler.length, 1, `${p.id}: exakt en final`);
    for (const u of egna) assert.equal(u.krav?.djur, true, `${u.id}: platsuppdrag kräver ett djur`);
    // final:true: erbjuds inte förrän milstolpen nåtts, och räknas inte som klart uppdrag för upplåsningen
    const allaUtomFinal = Object.fromEntries(egna.filter((u) => !u.final).map((u) => [u.id, "klar" as const]));
    assert.equal(nastaSkrivUppdrag(allaUtomFinal, p.id, false), undefined, `${p.id}: finalen väntar på milstolpen`);
    assert.equal(nastaSkrivUppdrag(allaUtomFinal, p.id, true)?.id, finaler[0]!.id);
    assert.equal(klaraPerPlats({ ...allaUtomFinal, [finaler[0]!.id]: "klar" })[p.id], egna.length - 1, "finalen räknas inte");
  }
  // djur:true: varje förslag i idéraden skapar ett djur och klarar sitt uppdrag; en sak räcker inte
  let n = 0;
  for (const u of SKRIV) {
    if (!u.krav) continue;
    for (const g of u.val?.grupper ?? []) for (const f of g.forslag) {
      const t = tolkaMedReserv(f.fras) as { typ: string; varelse?: { kropp: string } };
      const djur = t.typ === "skapad" && ent[t.varelse!.kropp]?.typ === "djur";
      assert.ok(kravUppfylltTolkat(u.krav, f.fras, !u.krav.djur || djur), `${u.id}: förslaget "${f.fras}" klarar inte uppdraget`);
      n++;
    }
  }
  assert.ok(n > 300, `${n} förslag provade`);
  const djurKrav = SKRIV.find((u) => u.krav?.djur)!;
  assert.equal(kravUppfylltTolkat(djurKrav.krav!, djurKrav.krav!.ord.join(" "), false), false, "djur:true utan djur → inte klart");
});

test("B6.1 (C): färguppdragen säger rakt ut vilken sak färgen finns på – inget 'lånar färg'", () => {
  const farg = SKRIV.filter((u) => /färg/i.test(u.text_bengtsson ?? ""));
  assert.ok(farg.length >= 7);
  for (const u of SKRIV) assert.doesNotMatch(u.text_bengtsson ?? "", /lån(a|ar)\b.*färg|varsin färg/i, `${u.id}: "${u.text_bengtsson}"`);
  for (const id of ["tva-farger", "sjo-tva-farger", "grotta-tva-farger", "sol-och-gras"]) {
    const u = SKRIV.find((x) => x.id === id)!;
    assert.equal(u.granskad, false, `${id} är ett Copilot-utkast`);
    assert.match(u.text_bengtsson!, /en (vän )?i (tomatens|himlens|solens|gräsets) färg/i, id);
  }
});

test("B6.1 (E): stora saker har ett tak och står längst bak, bakom alla djur – regeln kommer ur data/storlek.json", () => {
  for (const k of ["skyskrapa", "slott", "ufo", "gravmaskin"]) {
    const kl = storlekKlass(k);
    assert.ok(kl, `${k} har en storleksklass`);
    assert.ok(malhojd(k) <= kl!.tak, `${k}: målhöjden under taket`);
    assert.ok(takSkala(k, 3) * malhojd(k) <= kl!.tak + 1e-9, `${k}: "jättestor" går inte över taket`);
  }
  for (const [k, e] of Object.entries(ENTITETER)) {
    if (e.typ === "djur") assert.equal(storlekKlass(k), null, `${k}: djur har ingen klass`);
    if (e.typ === "byggnad" && e.kategori === "hus") assert.ok(storlekKlass(k), `${k}: hus är stora`);
  }
  assert.equal(takSkala("katt", 3), 3, "djur påverkas inte");
  const spar = (uid: string, kropp: string) => ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1 }) as never;
  const alla = [spar("a", "skyskrapa"), spar("b", "flicka"), spar("c", "katt"), spar("d", "slott"), spar("e", "ufo"), spar("f", "gravmaskin"), spar("g", "hund")];
  const z = (uid: string) => djurPlats(alla.find((d: { uid: string }) => d.uid === uid)!, alla)[2];
  const bakerst = Math.max(z("a"), z("d"), z("e"), z("f"));
  for (const uid of ["b", "c", "g"]) assert.ok(z(uid) > bakerst + 0.5, `djuret ${uid} står framför alla stora saker`);
});

test("B6.1 (F): varje känt ord ger något synligt – ett djur/en sak, ett ägg, ett förslag eller 'kan inte rita än' (boken stängs)", () => {
  const ord = new Set<string>();
  for (const o of (ordJson as { ord: { id: string; visa?: string }[] }).ord) ord.add(o.visa ?? o.id);
  for (const e of Object.values(ENTITETER)) for (const w of (e as { ord?: string[] }).ord ?? []) ord.add(w);
  const tysta: string[] = [];
  for (const w of ord) {
    const u = tolkaMedReserv(w);
    if (u.typ === "skapad" && (u.varelse.kropp === "agg" || ENTITETER[u.varelse.kropp])) continue;
    if (u.typ === "forslag" || u.typ === "sparr") continue;
    if (kanInteRita(u, w)) continue;
    tysta.push(`${w} (${u.typ})`);
  }
  assert.deepEqual(tysta, [], `ord som inte ger något: ${tysta.slice(0, 20).join(", ")}`);
  assert.ok(ord.size > 900);
  assert.ok(kanInteRita(tolkaMedReserv("en regnbåge"), "en regnbåge"), "en regnbåge");
  assert.equal(kanInteRita(tolkaMedReserv("en katt"), "en katt"), null);
});
