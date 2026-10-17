import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Spel } from "@/spel/Spel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [redo, setRedo] = useState(false);
  useEffect(() => setRedo(true), []);
  if (!redo) {
    return (
      <main className="spel laddar">
        <h1>Trollpennan</h1>
      </main>
    );
  }
  return <Spel />;
}
