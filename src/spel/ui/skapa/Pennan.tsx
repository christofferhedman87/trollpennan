// Nya Skapa 6.4: Pennan är Trolla-knappen, ett öra uppe till höger på arket. Den sover tills meningen har ett Vad
// och inget ord väntar på svar. Tryck när den sover: den skakar och puffen läses upp, inget annat händer.
import uiJson from "../../../../data/skapa-ui.json" with { type: "json" };
import { ikon } from "../../skapa/ikoner.ts";

const UI = uiJson as unknown as { ark: Record<string, string> };

export function Pennan({ redo, lage, onTryck }: { redo: boolean; lage: "vilar" | "redo" | "trollar" | "puttar" | "blinka"; onTryck: () => void }) {
  const bild = lage === "trollar" ? "penna-trollar" : redo ? "penna-redo" : "penna-vilar";
  return (
    <div className="sk-penn-ora">
      <span className={redo ? "sk-penn-etikett redo" : "sk-penn-etikett"} aria-hidden="true">
        {UI.ark.trolla}
      </span>
      <button
        type="button"
        className={["sk-penn-knapp", redo ? "redo" : "", lage === "puttar" ? "puttar" : "", lage === "blinka" ? "blinka" : ""].filter(Boolean).join(" ")}
        data-testid="vakna"
        data-redo={redo ? "ja" : "nej"}
        aria-label={UI.ark.trolla_aria}
        ref={(el) => el?.setAttribute("data-v3", "vack-knapp")}
        onClick={onTryck}
      >
        <img alt="" src={ikon("grafik", bild)} ref={(el) => el?.setAttribute("data-testid", "vack-knapp")} />
      </button>
    </div>
  );
}
