import { useSyncExternalStore } from "react";
import { lagringsStatus, lyssnaLagring } from "./lagring.ts";
import texter from "../../data/upplevelse.json";
export function LagringsInfo() {
  const status = useSyncExternalStore(lyssnaLagring, lagringsStatus, () => "ok" as const);
  return status === "ok" ? null : <aside className="lagrings-info">
    <details><summary><span role="status">{status === "skadad" ? texter.damagedTitle : texter.storageTitle}</span></summary>
      <p>{status === "skadad" ? texter.damaged : texter.storage}</p>
    </details>
  </aside>;
}
