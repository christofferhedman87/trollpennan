import { Component, Suspense, lazy, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import texter from "../data/upplevelse.json";
const Spel = lazy(() => import("./spel/Spel").then(m => ({ default: m.Spel })));
// P2-2: titelskärmen ligger över spelet (som laddar bakom), så att ängen lever bakom "Fortsätt".
const Titel = lazy(() => import("./spel/ui/Titel.tsx").then(m => ({ default: m.Titel })));
class SpelGrans extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() { return { fel: true }; }
  render() {
    if (this.state.fel) return <main className="spel laddar"><h1>Trollpennan</h1><p role="alert">{texter.error}</p><button type="button" onClick={() => window.location.reload()}>{texter.reload}</button></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById("root")!).render(<SpelGrans><Suspense fallback={<main className="spel laddar"><h1>Trollpennan</h1><p role="status">{texter.load}</p></main>}><Spel /><Titel /></Suspense></SpelGrans>);
