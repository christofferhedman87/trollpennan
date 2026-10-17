export type Klass =
  | "djur"
  | "farg"
  | "storlek"
  | "monster"
  | "formaga"
  | "tillbehor"
  | "egenskap";

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
  };
  sammansattningar: {
    regel: string;
    forled: Record<string, Forled>;
  };
  repliker: Record<string, string[]>;
  overraskningar: { om: string[]; effekt: string; text: string }[];
  ord: Ord[];
};

export type BlockData = {
  version: number;
  ord: string[];
  stammar: string[];
  undantag_fran_stammar: string[];
};

export type TillbehorSpec = { id: string; farg: string | null; glans: boolean };

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
  inteGuld?: string[];
};
