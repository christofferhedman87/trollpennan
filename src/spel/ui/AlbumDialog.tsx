import { type ReactNode } from "react";
import { favoritMatEtikett } from "../solstjarna.ts";

type SlimepediaProps = {
  id: string;
  bild: string;
  namn: string;
  plats: string;
  albumNiva: number;
  stang: () => void;
  stjarnor: ReactNode;
};

export function SlimepediaKort({ id, bild, namn, plats, albumNiva, stang, stjarnor }: SlimepediaProps) {
  return (
    <>
      <div className="slimepedia-huvud" data-s5="slimepedia-huvud" data-album-niva={albumNiva}>
        <span className="album-kort-bild" data-v9a="album-bild" aria-hidden="true">{bild}</span>
        <span className="slimepedia-namn">{namn}</span>
        <span className="album-plats-tagg" data-v9a="album-plats">{plats}</span>
      </div>
      {stjarnor}
      <p className="favorit-piller" data-s5="favorit-piller">{favoritMatEtikett(id)}</p>
      <button type="button" className="slimepedia-skriv" data-s5="skriv-till-djuret" onClick={stang}>
        ✍️ Skriv till djuret
      </button>
    </>
  );
}
