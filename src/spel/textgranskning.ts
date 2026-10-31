// B4: Christoffers läsgodkända uppdragstexter. Ett uppdrag får `granskad: true` i data/bengtsson.json bara om det
// står här, och bara så länge texterna är exakt de som godkändes. Ändras en text måste den läsas och godkännas igen.
//
// Textpaket 01 (docs/en-varld/nya-repliker.md i d9f2752): Christoffer svarade 2026-10-31
// "Jag har läst och godkänner dessa sex". Fingeravtrycket är SHA-256 av
// JSON.stringify([text_bengtsson, klart_bengtsson, nastan, hjalp]) utan mellanslag.

// Textpaket 02: docs/en-varld/textpaket-02-granskad.md (SHA-256 1687e568…e539).
export const GRANSKADE_UPPDRAG: Readonly<Record<string, string>> = {
  "vit-som-sno": "3168de36df7a093984af52d0daa42eb8f95392f6ec30833fda14eb82581160e7",
  "rod-kompis": "0a2e9d0e823b722087a8a6827342c47dec60c333dcd34b001363ab813bad00d1",
  "gron-kompis": "ce512d79833c929dab9b1fab6b8241a5f6db76ddfb70cd94b3972468ffd57b29",
  "kanin-fryser": "0f238cbe17d651ead76f1acccfdd462e43acbc849f264c5f19e9373944af5f50",
  "vingar-i-luften": "836377d238dbb0028886c531a4bde6edf0da10a18cc95e7c9b79bffcee0e319a",
  "solgul-van": "91f0fe652814181f1f2ab349ac1b14800c4c905ace3aacb10ce4b164727cca11",
  "kalla-tassar": "04a9d7c1283ae97a9c06f9563df7b9fca374b0b382eaf773af9f889bf5fdb923",
  "tva-farger": "f9bd37c6c58d7705fc3532b58924f7b2bbc9af07b1a07956702dd1f0e647b364",
  "stor-och-liten": "7e338f2ce9ef4da4f9e16f13c49939456fc519932b28ca9326f03394dd27a44c",
  "varmt-och-kallt": "1cf40c5c509245a2ba86a49f04ed321ba119bda41be5f42ddbe13890f0c3c8b4",
};

/** Texterna som läsgodkännandet gäller, i den form fingeravtrycket räknas på. */
export function granskadeTexter(u: { text_bengtsson?: string; klart_bengtsson?: string; nastan?: string; hjalp?: readonly string[] }): string {
  return JSON.stringify([u.text_bengtsson, u.klart_bengtsson, u.nastan, u.hjalp]);
}
