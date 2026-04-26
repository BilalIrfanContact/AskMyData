import { useEffect, useState } from "react";

const STAGES = [
  "Parsing your question",
  "Generating Python code",
  "Running computations",
  "Composing answer",
];

export function StatusIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % STAGES.length);
    }, 900);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="animate-fade-up rounded-xl border border-border bg-card/60 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-glow rounded-full bg-primary/20" />
          <span className="h-2 w-2 rounded-full bg-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{STAGES[index]}...</div>
          <div className="mt-1 h-0.5 w-full overflow-hidden rounded bg-secondary">
            <div
              className="h-full w-1/3 rounded"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.6s linear infinite",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
