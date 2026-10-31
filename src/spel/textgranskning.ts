// B4: Christoffers läsgodkända uppdragstexter. Ett uppdrag får `granskad: true` i data/bengtsson.json bara om det
// står här, och bara så länge texterna är exakt de som godkändes. Ändras en text måste den läsas och godkännas igen.
//
// Textpaket 01 (docs/en-varld/nya-repliker.md i d9f2752): Christoffer svarade 2026-10-31
// "Jag har läst och godkänner dessa sex". Fingeravtrycket är SHA-256 av
// JSON.stringify([text_bengtsson, klart_bengtsson, nastan, hjalp]) utan mellanslag.

// Textpaket 02: docs/en-varld/textpaket-02-granskad.md (SHA-256 1687e568…e539).
export const GRANSKADE_UPPDRAG: Readonly<Record<string, string>> = {
  "skog-vila-benen": "228c5b801acce4cc46949df77ba57fcffc1b4b66b25c21c73f778db2ac4512a2",
  "grotta-sittpaus": "db15f6ddfcc5798144dee71d92d0a6d6c7884f4c1467f2bd19935eade455d1d4",
  "ljus-i-kvallen": "c28cb2c401603f977f61216b97c5f107a1b8e4354e974dd45e0dd141b9e1e3b5",
  "skog-kvallsljus": "09de62f2bd6ebd56183177193229ca62c173647d6cdfbdb7654e74d55e4ec4af",
  "grotta-forsta-skenet": "96585cfb2834d293ad2f42b319dfd9354a1d76e567bf2c1b6c7d225640eb9a90",
  "magen-kurrar": "21810ea70ec4c8eba6d93013f0f82b10b4a32a8a76c9589e43df16258405dc1f",
  "skog-magen-kurrar": "d717782c3f50e6f9764caba64ecf52e6776b8d17e8ace172e7587ffd29799482",
  "sjo-fruktpaus": "38f2235903c94975f45d83b233e56e0b805b793364e0ed5b172b52907b2ff737",
  "dags-att-vila": "a1754d06255a6f4588bd28c31900b51b1453ea7747156a6a740bd339ff18e9a0",
  "grotta-mjuk-vila": "2744e59fa54cff8006a09d199df3f780952739eaf765d2d4f12cbe181a8bb8fc",
  "present-till-en-van": "3073a8975c27d84ac7cb25d248ae8ad9d024c182aff96478dfa2cc7a62622e3e",
  "skog-stor-och-liten": "0bd238f76dd94ee85f776627a5a53e0b237610b64c522029451758a0b3f31a45",
  "sjo-tva-storlekar": "2b489fc745fd5fbb8e247343a07e41999d689c2884fedd35dacc09dc84428540",
  "grotta-stor-och-liten": "3b87784579db06b99230b88d1fe5a86da3801ee29cf04f13d5d47dd02cfac401",
  "sjo-tva-farger": "7e7dee2a6042ff8f95aa2e1bf3871732fd54a91ee14486f7f37cb0ec354bb3df",
  "grotta-tva-farger": "a5a97203b2b86417e8ec19d42fae90c356ed31794308d87c4076d4e24ea4ff8e",
  "skog-rod-van": "7243c259a2c36d3e92ee7c12e8329d0fa8373dec33e9f8ac74c368992cb73140",
  "sjo-bla-van": "a7ea7f10da33b1f83bbec2a202e12218a63681dc65f16382e1fa960e5d4af652",
  "grotta-gul-van": "9c08e42c4eb907a859826d62ffd53ae66a12bcbf3a0364e260690d685bc7030b",
  "skog-liten-van": "39aaa535c49a9d1f9f43b3bcb5f1a7be24d8ec49591d103ca96200f99095b993",
  "grotta-liten-upptackare": "75559861ae74a1478a56c9c33b8a307b0491807453ffc2e1b01843a36bcdd596",
  "sjo-stor-simmare": "b770723d55a1a4cbf7f5bc9fed2064b92b3d37d7b1e7ff8ce6ab4323f289268c",
  "pytteliten-kompis": "421a27464b36b9642ca5779002928ba5a4f160af8519affcaab6ebcc5e3ec675",
  "jattestor-van": "721c7aeb7aff31aefc6dfac18771c4ef552aa0a3920b8f683e6c0c05fcaf204e",
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
