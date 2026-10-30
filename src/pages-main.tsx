import { begarBestandigLagring } from "./spel/lagringsSkydd.ts";
import { Component, Suspense, lazy, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./spel/ui/titel-p2.css"; // försidans stil måste finnas från första bildrutan (#forsida i index.html)
import texter from "../data/upplevelse.json";
import { tabortForsida } from "./spel/ui/forsida.ts";
void begarBestandigLagring(() => navigator.storage);
const Spel = lazy(() => import("./spel/Spel").then(m => ({ default: m.Spel })));
// P2-2: titelskärmen ligger över spelet (som laddar bakom), så att ängen är redo bakom "Fortsätt".
// Försidan i index.html täcker allt medan delarna laddar, så Suspense behöver ingen egen laddskylt.
const Titel = lazy(() => import("./spel/ui/Titel.tsx").then(m => ({ default: m.Titel })));
class SpelGrans extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() { return { fel: true }; }
  componentDidCatch() { tabortForsida(); }
  render() {
    if (this.state.fel) return <main className="spel laddar"><h1>Trollpennan</h1><p role="alert">{texter.error}</p><button type="button" onClick={() => window.location.reload()}>{texter.reload}</button></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById("root")!).render(<SpelGrans><Suspense fallback={null}><Spel /><Titel /></Suspense></SpelGrans>);
