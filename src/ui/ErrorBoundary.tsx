import { Component, type ReactNode } from "react";

interface State {
  failed: boolean;
}

/** R1: neočakávaná chyba v UI nesmie zahodiť dáta ani zobraziť prázdnu stránku bez vysvetlenia. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <h1 style={{ fontSize: "var(--font-title)" }}>Niečo sa pokazilo</h1>
        <p>Dáta sa nezmazali. Obnov stránku; ak chyba pretrváva, exportuj zálohu, kým to ešte ide.</p>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 14px", fontSize: "var(--font-text)" }}>
          Obnoviť stránku
        </button>
      </main>
    );
  }
}
