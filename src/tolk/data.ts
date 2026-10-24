import blockJson from "../../data/blocklist.json" with { type: "json" };
import kanneteckenJson from "../../data/kannetecken.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import type { BlockData, KanneteckenData, OrdData } from "./typer.ts";

export const ORD = ordJson as OrdData;
export const BLOCK = blockJson as BlockData;
export const KANNETECKEN = kanneteckenJson as KanneteckenData;
