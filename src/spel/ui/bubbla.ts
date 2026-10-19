/** R9F: pratbubblan (max-width min(18rem, 78%), centrerad med translate(-50%)) hålls hel innanför skärmkanterna. */
export function bubblaVanster(left: string): string {
  const halv = "min(9rem, 39%) + 6px";
  return `clamp(calc(${halv}), ${left}, calc(100% - (${halv})))`;
}
