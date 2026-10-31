import { useEffect, useState } from "react";
const kortYta = () => window.innerHeight <= 420 || window.innerWidth <= window.innerHeight && window.innerHeight <= 720;
export function useLagBok() {
  const [lag, setLag] = useState(() => typeof window !== "undefined" && kortYta());
  useEffect(() => { const synka = () => setLag(kortYta()); window.addEventListener("resize", synka); return () => window.removeEventListener("resize", synka); }, []);
  return lag;
}
