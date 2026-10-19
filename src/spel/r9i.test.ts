// R9I: ett "sugen" djur öppnar gåvorutan bara vid första trycket per djur.
import assert from "node:assert/strict";
import { test } from "node:test";
import { gavoInbjudanVidTryck } from "./liv.ts";
import { useMinne } from "./minne.ts";

const liv = (humor: string) => ({ humor, humorMs: 0, humorLangd: 60_000, favorit: "", favoritHittad: false, hjartan: 0 });

test("R9I: gåvoinbjudan bara vid första trycket per djur", () => {
  useMinne.setState({ liv: { a: liv("sugen"), b: liv("sugen"), c: liv("glad") } });
  assert.equal(gavoInbjudanVidTryck("a"), true, "första trycket på a");
  assert.equal(gavoInbjudanVidTryck("a"), false, "andra trycket på a");
  assert.equal(gavoInbjudanVidTryck("a"), false, "tredje trycket på a");
  assert.equal(gavoInbjudanVidTryck("b"), true, "ett annat sugen djur får sin första inbjudan");
  assert.equal(gavoInbjudanVidTryck("c"), false, "glad bjuder inte in");
  assert.equal(gavoInbjudanVidTryck("saknas"), false);
});
