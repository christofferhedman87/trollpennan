import platserJson from "../../../data/platser.json" with { type: "json" };
import { OMR, TEXTER_AV } from "../aventyr.ts";
import { useMinne } from "../minne.ts";
import { OLAST_KARTA, PLATSER } from "../platser.ts";
import * as rostKo from "../rostKo.ts";
import "./karta-v1.css";

const VARLDSKARTA = platserJson.varldskarta;

type KartaLagerProps = {
  forstaRad: string[] | null;
  kartaText: string | null;
  /** Resa till en världsplats (B1.4 PLATSER) eller "garden" (gården). */
  tryckPlats: (id: string) => void;
  /** Låst plats: visa ERROR + "Inte riktigt än". */
  onLast: () => void;
  /** @deprecated B1.4: lås styrs av upplast(); behålls för anropskompatibilitet. */
  oppna: string[];
  stangKarta?: () => void;
  nuvarandePlats?: string;
};

function metaFor(id: string) {
  return VARLDSKARTA.find((p) => p.id === id) ?? VARLDSKARTA[0];
}

function arBesokt(id: string, oppnade: string[], forstaGard: boolean): boolean {
  return id === "ang" || oppnade.includes(id) || (id === "garden" && !forstaGard);
}

function Landskap({ id }: { id: string }) {
  if (id === "garden") {
    return (
      <>
        <rect width="120" height="72" rx="12" fill="#ffe8b8" />
        <circle cx="22" cy="16" r="8" fill="#ffd15c" />
        <rect x="0" y="48" width="120" height="24" fill="#8fd16a" />
        <polygon points="46,30 68,14 90,30" fill="#a33b32" />
        <rect x="48" y="30" width="40" height="26" fill="#d3544a" />
        <rect x="48" y="38" width="40" height="2" fill="#fff6e5" />
        <rect x="48" y="46" width="40" height="2" fill="#fff6e5" />
        <rect x="56" y="30" width="2" height="26" fill="#fff6e5" />
        <rect x="63" y="42" width="10" height="14" fill="#fff6e5" />
        <rect x="8" y="52" width="28" height="3" fill="#fff" />
        <rect x="8" y="58" width="28" height="3" fill="#fff" />
        <rect x="10" y="50" width="3" height="14" fill="#fff" />
        <rect x="22" y="50" width="3" height="14" fill="#fff" />
        <rect x="32" y="50" width="3" height="14" fill="#fff" />
      </>
    );
  }
  if (id === "skogen") {
    return (
      <>
        <rect width="120" height="72" rx="12" fill="#d7ead4" />
        <rect x="0" y="56" width="120" height="16" fill="#6b8f4e" />
        <polygon points="16,58 30,20 44,58" fill="#2f6b3a" />
        <polygon points="36,58 54,12 72,58" fill="#245c30" />
        <polygon points="68,58 86,24 104,58" fill="#1f6b45" />
        <rect x="8" y="52" width="14" height="8" rx="2" fill="#a0714a" />
        <ellipse cx="15" cy="52" rx="7" ry="3" fill="#c4926a" />
        <rect x="100" y="50" width="4" height="10" fill="#f6e7c8" />
        <ellipse cx="102" cy="49" rx="8" ry="5" fill="#e04b4b" />
        <circle cx="99" cy="48" r="1.3" fill="#fff" />
        <circle cx="104" cy="47" r="1.2" fill="#fff" />
      </>
    );
  }
  if (id === "sjon") {
    return (
      <>
        <rect width="120" height="72" rx="12" fill="#e7eef2" />
        <rect x="0" y="34" width="120" height="38" fill="#8ec4de" />
        <path d="M0 46 Q15 40 30 46 T60 46 T90 46 T120 46" fill="none" stroke="#f4fbff" strokeWidth="2" />
        <path d="M0 58 Q15 52 30 58 T60 58 T90 58 T120 58" fill="none" stroke="#f4fbff" strokeWidth="2" />
        <ellipse cx="78" cy="40" rx="16" ry="6" fill="#7dce6a" />
        <rect x="74" y="18" width="8" height="22" fill="#fff" />
        <rect x="74" y="22" width="8" height="3" fill="#d3544a" />
        <rect x="74" y="28" width="8" height="3" fill="#d3544a" />
        <polygon points="72,18 78,10 84,18" fill="#d3544a" />
        <circle cx="78" cy="14" r="1.6" fill="#ffd15c" />
      </>
    );
  }
  if (id === "grottan") {
    return (
      <>
        <rect width="120" height="72" rx="12" fill="#4a4460" />
        <path d="M6 72 V34 Q6 8 60 8 Q114 8 114 34 V72 Z" fill="#2c2840" />
        <path d="M26 72 V44 Q26 22 60 22 Q94 22 94 44 V72 Z" fill="#16131f" />
        <polygon points="38,72 46,46 54,72" fill="#5ee0d0" />
        <polygon points="52,72 62,36 72,72" fill="#f48fb1" />
        <polygon points="70,72 78,50 88,72" fill="#7af0e0" />
        <polygon points="46,72 51,56 56,72" fill="#ffe082" />
      </>
    );
  }
  return (
    <>
      <rect width="120" height="72" rx="12" fill="#c9ecff" />
      <circle cx="98" cy="16" r="9" fill="#ffd15c" />
      <circle cx="98" cy="16" r="4" fill="#fff4c2" />
      <path d="M0 46 Q30 32 60 46 T120 40 V72 H0 Z" fill="#7dce6a" />
      <path d="M0 56 Q40 48 80 58 T120 52 V72 H0 Z" fill="#5eaf50" />
      <ellipse cx="78" cy="58" rx="16" ry="7" fill="#4fc3f7" />
      <ellipse cx="73" cy="57" rx="6" ry="2" fill="#e1f5fe" />
      <path d="M28 60 v-12" stroke="#3e8e5a" strokeWidth="2" />
      <circle cx="28" cy="46" r="4" fill="#f48fb1" />
      <circle cx="23" cy="49" r="3" fill="#ffd15c" />
    </>
  );
}

function PlatsInre({ id, aktiv, besokt }: { id: string; aktiv: boolean; besokt: boolean }) {
  const meta = metaFor(id);
  return (
    <>
      <svg className="plats-illustration" data-v1="plats-illustration" viewBox="0 0 120 72" aria-hidden="true">
        <Landskap id={id} />
      </svg>
      {id === "ang" ? (
        <h3>
          <span className="plats-titel-ankare" data-v1="plats-ang">
            {meta.ikon} {meta.namn}
          </span>
        </h3>
      ) : (
        <h3>
          {meta.ikon} {meta.namn}
        </h3>
      )}
      {aktiv ? (
        <span className="har-ar-du-badge" data-v1="har-ar-du">
          📍 Här är du nu
        </span>
      ) : null}
      <span className="plats-framsteg" data-v1="plats-framsteg">
        {besokt ? "⭐ Besökt" : "✨ Upptäck!"}
      </span>
      <p className="plats-lockelse">{meta.lockelse}</p>
      <span className="plats-ordrad">
        {meta.ordbrickor.map((b) => (
          <span key={b.ord} className="plats-ordbricka" data-v1="plats-ordbricka">
            {b.ikon} {b.ord}
          </span>
        ))}
      </span>
    </>
  );
}

function Lyssna({ id }: { id: string }) {
  const meta = metaFor(id);
  return (
    <button
      type="button"
      className="plats-lyssna"
      data-v1="plats-lyssna"
      aria-label={`Lyssna på ${meta.namn}`}
      onClick={() => rostKo.lasUpp(meta.rost_text)}
    >
      🔊
    </button>
  );
}

function Stig() {
  return (
    <svg className="varldskarta-stig" data-v1="varldskarta-stig" viewBox="0 0 340 88" aria-hidden="true">
      <rect width="340" height="88" rx="16" fill="#f3e6c4" />
      <path
        d="M36 64 C 70 18, 100 78, 140 40 S 210 14, 248 48 S 300 76, 322 28"
        fill="none"
        stroke="#c47b3a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M36 64 C 70 18, 100 78, 140 40 S 210 14, 248 48 S 300 76, 322 28"
        fill="none"
        stroke="#fffaf0"
        strokeWidth="2"
        strokeDasharray="1 9"
        strokeLinecap="round"
      />
      <text x="28" y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill="#c93a5a">
        N
      </text>
      <circle cx="28" cy="28" r="13" fill="#fffdf7" stroke="#3b2f2f" strokeWidth="2" />
      <polygon points="28,16 32,28 28,26 24,28" fill="#c93a5a" />
      <polygon points="28,40 24,28 28,30 32,28" fill="#3b2f2f" />
      <circle cx="78" cy="34" r="6" fill="#f48fb1" />
      <rect x="128" y="32" width="12" height="9" rx="1" fill="#d3544a" />
      <polygon points="176,48 184,30 192,48" fill="#2f6b3a" />
      <ellipse cx="236" cy="42" rx="9" ry="4" fill="#4fc3f7" />
      <polygon points="300,30 306,46 312,30" fill="#5ee0d0" />
    </svg>
  );
}

/** B1.4/V1: sagokarta. Alla vägar är öppna när OLAST_KARTA är sann, så ingen knapp får klassen last. */
export function KartaLager({ kartaText, tryckPlats, stangKarta, nuvarandePlats }: KartaLagerProps) {
  const oppnadePlatser = useMinne((s) => s.oppnadePlatser);
  const forstaGard = useMinne((s) => s.forstaGard);
  const nu = nuvarandePlats ?? "ang";
  const gardAktiv = nu === "garden";
  return (
    <div className="karta-lager" data-testid="karta">
      <div className="karta-topp" data-v1="varldskarta-topp">
        <div className="karta-rubrik">
          <h2>{OMR.karta.rubrik}</h2>
          <p>{OMR.karta.hjalp}</p>
        </div>
        <button
          type="button"
          className="karta-lyssna"
          data-v1="karta-lyssna"
          onClick={() => rostKo.lasUpp("Världskartan. Välj en plats på stigen! Alla vägar är öppna.")}
        >
          🔊 Lyssna
        </button>
        <button type="button" className="karta-stang" data-v1="karta-stang" aria-label="Stäng karta" onClick={() => stangKarta?.()}>
          ×
        </button>
      </div>
      {kartaText ? <p data-testid="karta-text">{kartaText}</p> : null}
      <Stig />
      <div className="plats-lista">
        <div className="plats-kort garden" data-v1="plats-kort">
          <button
            type="button"
            className={`plats-knapp garden${gardAktiv ? " aktiv" : ""}${OLAST_KARTA ? "" : " last"}`}
            data-testid="plats-garden"
            onClick={() => tryckPlats("garden")}
          >
            <PlatsInre id="garden" aktiv={gardAktiv} besokt={arBesokt("garden", oppnadePlatser, forstaGard)} />
          </button>
          <Lyssna id="garden" />
        </div>
        {PLATSER.map((o) => {
          const aktiv = nu === o.id;
          return (
            <div key={o.id} className={`plats-kort ${o.id}`} data-v1="plats-kort">
              <button
                type="button"
                className={`plats-knapp ${o.id}${aktiv ? " aktiv" : ""}${OLAST_KARTA ? "" : " last"}`}
                data-testid={`plats-${o.id}`}
                onClick={() => tryckPlats(o.id)}
              >
                <PlatsInre id={o.id} aktiv={aktiv} besokt={arBesokt(o.id, oppnadePlatser, forstaGard)} />
              </button>
              <Lyssna id={o.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

type OmradeHudProps = {
  tryckPlats: (id: string) => void;
  bytFolje: () => void;
};

export function OmradeHud({ tryckPlats, bytFolje }: OmradeHudProps) {
  return (
    <div className="omrade-hud">
      <button type="button" data-testid="hem-knapp" onClick={() => tryckPlats("garden")}>
        {OMR.karta.hem}
      </button>
      <button type="button" data-testid="byt-folje" onClick={bytFolje}>
        {TEXTER_AV.foljeslagare.byt}
      </button>
    </div>
  );
}
