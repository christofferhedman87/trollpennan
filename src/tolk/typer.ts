export type Klass =
  | "djur"
  | "farg"
  | "storlek"
  | "monster"
  | "formaga"
  | "tillbehor"
  | "egenskap"
  /** R3G: härlett ur data/entiteter.json (föremål, natur, byggnad, mat, fordon med modell). Står inte i ord.json. */
  | "foremal";

export type Del = {
  kropp?: string;
  farg?: string;
  storlek?: string;
  skala?: number;
  monster?: string;
  monsterfarg?: string;
  formaga?: string;
  tillbehor?: string;
  tillbehorsfarg?: string;
  glans?: boolean;
  genomskinlighet?: number;
  kontur?: boolean;
  ljusare?: boolean;
  morkare?: boolean;
};

export type Ord = {
  id: string;
  klass: Klass;
  niva: "kort" | "fritt";
  visa: string;
  genus?: "u" | "n" | "pl";
  former: string[];
  fras?: string[][];
  valfritt_ord2?: boolean;
  bojning?: { u?: string; n?: string; pl?: string };
  efter?: string;
  sammansattningsled?: string[];
  signatur?: string;
  ordklass?: string;
  del?: Del;
  /** R3G (klass foremal): vilka former som är plural, eftersom genus inte är känt i förväg. */
  plural?: string[];
  /** R9F (klass egenskap): motsatsen ("hög" ↔ "låg"); det sista av två motsatser gäller. */
  motsats?: string;
};

export type Forled = {
  formaga?: string;
  monster?: string;
  farg?: string;
  glans?: boolean;
  skala?: number;
  ljusare?: boolean;
  morkare?: boolean;
};

export type OrdData = {
  version: number;
  grammatik: string;
  funktionsord: {
    som: string[];
    med: string[];
    och: string[];
    kan: string[];
    artiklar: string[];
    antal: Record<string, number>;
    forstarkning: Record<string, string>;
    antal_tak?: number;
    /** O1b: blandord. `koppla` gäller bara inuti ett blandmönster, inte som globala funktionsord. */
    blanda: {
      efter_a: string[];
      fore: string[];
      koppla: string[];
      halften: string[];
    };
  };
  sammansattningar: {
    regel: string;
    forled: Record<string, Forled>;
  };
  repliker: Record<string, string[] | string>;
  overraskningar: { om: string[]; effekt: string; text: string }[];
  ord: Ord[];
};

/** Vad ett djur lånar ut när det blandas in i ett annat (data/kannetecken.json). */
export type Kannetecken = {
  farg: string | null;
  monster: string | null;
  monsterfarg: string | null;
  tillbehor: string[];
  formagor: string[];
  beskrivning: string | null;
};

export type KanneteckenData = {
  version: number;
  djur: Record<string, Kannetecken>;
};

export type BlockData = {
  version: number;
  ord: string[];
  stammar: string[];
  undantag_fran_stammar: string[];
};

export const RELATIONER = ["med", "på", "under", "i", "vid", "bredvid"] as const;
export type Relation = typeof RELATIONER[number];
/** Saknat relationsfält i äldre v2 betyder det befintliga med-beteendet. */
export type TillbehorSpec = {
  id: string; farg: string | null; glans: boolean; relation?: Relation;
  /** Ord och uttryckliga egenskaper hör till just detta tillbehör; äldre v2 saknar dem. */
  ord?: string; egenskaper?: string[]; antal?: number;
};

/** Ett ord som tolka() inte känner, ritat som ett ägg (data/reserv.json, src/tolk/reserv.ts). */
export type ReservDel = {
  ord: string;
  kategori: string;
  steg: "kategori_ord" | "lemma" | "sammansatt" | "regel" | "plats" | "agg";
  plats: "djur" | "med" | "som" | "adj";
  farg: string;
  /** Ordet i kategori-ord.json som träffen byggde på (för listan över saknade ord); null = regel eller plats. */
  grund?: string | null;
};

export type Varelse = {
  kropp: string;
  farg: string | null;
  monster: string | null;
  monsterfarg: string | null;
  formagor: string[];
  tillbehor: TillbehorSpec[];
  skala: number;
  alpha: number;
  kontur: boolean;
  glans: boolean;
  formel: string;
  beskrivning: string;
  overraskningar: { effekt: string; text: string }[];
  /** Okända ord som ägg. Vid kropp "agg" är första posten själva kroppen, övriga svävar ovanför. */
  reserv?: ReservDel[];
  /** Barnets eget namn, t.ex. ur "en katt som heter Misse". */
  smeknamn?: string;
};

export type ForslagKort = { id: string; visa: string };

export type Utfall =
  | { typ: "sparr"; text: string }
  | { typ: "forslag"; token: string; text: string; forslag: ForslagKort[] }
  | {
      typ: "behover_djur";
      text: string;
      djur: { id: string; visa: string }[];
      okanda: string[];
      meddelanden: string[];
    }
  | {
      typ: "skapad";
      varelse: Varelse;
      antal: number;
      funna: string[];
      guld: string[];
      okanda: string[];
      meddelanden: string[];
    };

export type TolkaOpts = {
  kalla?: "kort" | "skriv";
  /** Torr bedömning ska inte notera blandningar som om barnet skapade dem. */
  noteraBlandning?: boolean;
  inteGuld?: string[];
  /** Nya Skapa: ord som barnet valt att behålla ("Behåll mitt ord"). Reservkedjan gör ordägg av dem utan att fråga igen. */
  behall?: string[];
};
