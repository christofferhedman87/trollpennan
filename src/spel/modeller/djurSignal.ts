/** Kodbyggd reserv om en GLB saknas. Komponenten skickas in utifrån så den här filen inte drar in hela ängen. */
export type DjurHumör = "glad" | "hungrig" | "fortjust" | "somnig" | "busig";
export type DjurSignal = { klapp: number; ror: number; humör?: DjurHumör; malPunkt?: [number, number] | null };

/** Volymbevarande squash-and-stretch. `fas` 0 = vila, (0..1] = hopp. Nollställs när window.__PAUSE_ANIM. */
export function squashSkala(t: number, fas: number, amp = 0.045, humör?: DjurHumör): { sy: number; sxz: number; lyft: number } {
  if (typeof window !== "undefined" && (window as unknown as { __PAUSE_ANIM?: boolean }).__PAUSE_ANIM === true) {
    return { sy: 1, sxz: 1, lyft: 0 };
  }
  const a = amp * (humör === "glad" || humör === "busig" ? 1.25 : humör === "somnig" ? 0.4 : 1);
  const u = fas;
  let sy: number;
  let lyft = 0;
  if (u <= 0) sy = 1 + Math.sin(t * 2.8) * a;
  else if (u < 0.16) sy = 1 - (u / 0.16) * 0.22;
  else if (u < 0.82) {
    const h = (u - 0.16) / 0.66;
    sy = 1 + Math.sin(h * Math.PI) * 0.12;
    lyft = Math.sin(h * Math.PI) * 0.45;
  } else {
    sy = 1 - Math.sin(((u - 0.82) / 0.18) * Math.PI) * 0.18;
  }
  return { sy, sxz: 1 / Math.sqrt(Math.max(0.5, sy)), lyft };
}

