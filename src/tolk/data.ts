import blockJson from "../../data/blocklist.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import type { BlockData, OrdData } from "./typer.ts";

export const ORD = ordJson as OrdData;
export const BLOCK = blockJson as BlockData;
