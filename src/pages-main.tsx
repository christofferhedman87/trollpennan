import { Component, Suspense, lazy, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import texter from "../data/upplevelse.json";
const Spel = lazy(() => import("./spel/Spel").then(m => ({ default: m.Spel })));
class SpelGrans extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() { return { fel: true }; }
  render() {
    if (this.state.fel) return <main className="spel laddar"><h1>Trollpennan</h1><p role="alert">{texter.error}</p><button type="button" onClick={() => window.location.reload()}>{texter.reload}</button></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById("root")!).render(<SpelGrans><Suspense fallback={<main className="spel laddar"><h1>Trollpennan</h1><p role="status">{texter.load}</p></main>}><Spel /></Suspense></SpelGrans>);
