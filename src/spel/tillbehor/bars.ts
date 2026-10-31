import type { TillbehorSpec } from "../../tolk/typer.ts";
export const barsPaKropp = (t: TillbehorSpec) => !t.relation || t.relation === "med";
