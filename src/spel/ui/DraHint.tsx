import { useEffect, useState } from "react";
import { useKvitto } from "../skapa/kvitto.ts";
import { useMinne } from "../minne.ts";
import { aktivtSteg } from "../forstaStunden.ts";
import texter from "../../../data/texter-gard.json" with { type: "json" };
import ui from "../../../data/skapa-ui.json" with { type: "json" };
/** Bara i fri värld efter en stunds lugn. Rendera ingen dold DOM som kan flytta andra bubblor. */
export function DraHint({ ledigt }: { ledigt: boolean }) {
  const kvitto = useKvitto((s) => s.kvitto);
  const tittat = useMinne((s) => s.dragit);
  const harDjur = useMinne((s) => s.ang.length > 0);
  const guide = useMinne((s) => !!aktivtSteg(s as unknown as Record<string, unknown>));
  const [synlig, setSynlig] = useState(false);
  const fritt = ledigt && !kvitto && !tittat && harDjur && !guide;
  useEffect(() => {
    setSynlig(false);
    if (!fritt) return;
    const timer = window.setTimeout(() => setSynlig(true), ui.tider_ms.pan_hint);
    return () => window.clearTimeout(timer);
  }, [fritt]);
  if (!fritt || !synlig) return null;
  return <p className="tred-hint" data-testid="tred-hint">{texter.tred_hint}</p>;
}
