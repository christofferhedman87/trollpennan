import { useState } from "react";
import { idag, lasLokalt, rensaLokalt, tillExport, tillText, type Saknad } from "../../tolk/saknade.ts";

/** För vuxna: orden som blev ägg. Bara lokalt; en vuxen kopierar eller sparar listan själv. Inget skickas. */
export function SaknadeOrd() {
  const [lista, setLista] = useState<Saknad[]>(() => lasLokalt());
  const [rad, setRad] = useState<string | null>(null);
  const topp = [...lista].sort((a, b) => b.antal - a.antal).slice(0, 12);

  async function kopiera() {
    try {
      await navigator.clipboard.writeText(tillText(lista));
      setRad("Kopierat.");
    } catch {
      setRad("Det gick inte att kopiera. Använd Spara fil.");
    }
  }
  function sparaFil() {
    const blob = new Blob([tillExport(lista, idag())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saknade-ord.json";
    a.click();
    URL.revokeObjectURL(url);
    setRad("Filen sparades.");
  }
  function rensa() {
    rensaLokalt();
    setLista([]);
    setRad("Listan är rensad.");
  }

  return (
    <div data-saknade="ord">
      <h3>Ord utan modell</h3>
      <p>
        Ord som blev ägg för att Trollpennan saknar en modell. Listan finns bara här på enheten och skickas aldrig av sig själv. Titta igenom den (ett barn kan ha skrivit ett namn)
        innan du delar den.
      </p>
      {lista.length === 0 ? <p>Inget ägg än.</p> : null}
      <ul className="onske-lista" data-saknade="lista">
        {topp.map((s) => (
          <li key={s.ord}>
            {s.ord} × {s.antal}
          </li>
        ))}
      </ul>
      {lista.length > topp.length ? <p>… och {lista.length - topp.length} till.</p> : null}
      {lista.length ? (
        <div className="rad-kort">
          <button type="button" className="kort" data-saknade="kopiera" onClick={() => void kopiera()}>
            Kopiera lista
          </button>
          <button type="button" className="kort" data-saknade="fil" onClick={sparaFil}>
            Spara fil
          </button>
          <button type="button" className="nej" data-saknade="rensa" onClick={rensa}>
            Rensa
          </button>
        </div>
      ) : null}
      {rad ? <p data-saknade="rad">{rad}</p> : null}
    </div>
  );
}
