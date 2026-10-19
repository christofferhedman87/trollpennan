import { ordLista } from "@/tolk/tolka.ts";
import { LED } from "./spelData.ts";

/** R9: hemliga djur = ord med nivå "fritt" och klass djur som har en gåta i data/ledtradar.json. */
export function hemligaDjur() {
  return ordLista().filter((o) => o.klass === "djur" && o.niva === "fritt" && LED[o.id]);
}
