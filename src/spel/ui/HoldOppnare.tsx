import { useEffect, useRef } from "react";

export function HoldOppnare({ haller, oppna }: { haller: boolean; oppna: () => void }) {
  const oppnaRef = useRef(oppna);
  oppnaRef.current = oppna;
  useEffect(() => {
    if (!haller) return;
    const timer = window.setTimeout(() => oppnaRef.current(), 3000);
    return () => window.clearTimeout(timer);
  }, [haller]);
  return null;
}
