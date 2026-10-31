import { useEffect, useState } from "react";
export function useLagBok() {
  const [lag, setLag] = useState(() => typeof window !== "undefined" && window.innerHeight <= 420);
  useEffect(() => { const synka = () => setLag(window.innerHeight <= 420); window.addEventListener("resize", synka); return () => window.removeEventListener("resize", synka); }, []);
  return lag;
}
