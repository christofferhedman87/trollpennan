import { useEffect } from "react";
import { useDialogFokus } from "./dialogFokus";
import type { SpelKarna } from "./styr/typer.ts";
import { useSpelTillstand } from "./styr/useSpelTillstand.ts";
import { useBannrar } from "./styr/useBannrar.ts";
import { useVarld } from "./styr/useVarld.ts";
import { useAventyr } from "./styr/useAventyr.ts";
import { useOnska } from "./styr/useOnska.ts";
import { useBelona } from "./styr/useBelona.ts";
import { useSkapa } from "./styr/useSkapa.ts";
import { useGard } from "./styr/useGard.ts";
import { useHandelser } from "./styr/useHandelser.ts";
import { useKlocka } from "./styr/useKlocka.ts";
import { useSkriv } from "./styr/useSkriv.ts";
import { skapaTrollApi } from "./styr/trollApi.ts";
import { useAvBro } from "./styr/useAvBro.ts";
import { useVyData } from "./styr/useVyData.ts";
import { SpelKontext } from "./ui/SpelKontext.ts";
import { SpelVy } from "./ui/SpelVy.tsx";

export function Spel() {
  useDialogFokus();
  const t = useSpelTillstand();
  const b = useBannrar({ t });
  const v = useVarld({ t, b });
  const a = useAventyr({ t, b, v });
  const o = useOnska({ t, v });
  const be = useBelona({ t, b });
  const s = useSkapa({ t, b, v, a, be });
  const g = useGard({ t, b, v, s });
  useHandelser({ t, b, a });
  useKlocka({ t, b });
  const sk = useSkriv({ t, s });
  useEffect(() => {
    const api = skapaTrollApi(k);
    if (import.meta.env.DEV || navigator.webdriver === true) window.__troll = api; // TTS-3: bara i dev och när ett prov styr webbläsaren – aldrig för barn
    return () => {
      delete window.__troll;
    };
  });
  useAvBro({ t, b, v, a });
  const vy = useVyData({ t });
  const k: SpelKarna = { t, b, v, a, o, be, s, g, sk, vy };
  return (
    <SpelKontext.Provider value={k}>
      <SpelVy />
    </SpelKontext.Provider>
  );
}
