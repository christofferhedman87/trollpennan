// R9H: håller stall-bannern i takt med vad som händer (se Stall.tsx).
import { useEffect, useRef } from "react";
import { useMinne } from "../minne.ts";
import { TEXTER } from "./spelData.ts";

/** R9H: bannern "Djuret är i stallet …" tas bort när ett djur hämtas ut eller barnet byter plats. Anropas en gång i Spel. */
export function useStallBanner(slackBanner: (texten: string) => void) {
  const slack = useRef(slackBanner);
  slack.current = slackBanner;
  useEffect(
    () =>
      useMinne.subscribe((s, f) => {
        if (s.plats !== f.plats || s.stall.length < f.stall.length) slack.current(TEXTER.stall.flytta);
      }),
    [],
  );
}
