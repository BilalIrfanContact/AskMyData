import type { Dataset } from "@/types/workspace";

interface DataPreviewTableProps {
  dataset: Dataset;
}

export function DataPreviewTable({ dataset }: DataPreviewTableProps) {
  if (dataset.columns.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/60 px-4 py-5 text-sm text-muted-foreground">
        The uploaded CSV has no readable columns.
      </div>
    );
  }

  return (
    <div className="animate-fade-up overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-sm font-medium">Dataset preview</span>
          <span className="text-xs text-muted-foreground">
            first {dataset.previewRowCount} rows from the backend
          </span>
        </div>
      </div>

      {dataset.preview.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">No preview rows were returned by the backend.</div>
      ) : (
        <div className="max-h-72 overflow-auto scrollbar-thin">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
              <tr>
                {dataset.columns.map((column) => (
                  <th key={column.name} className="border-b border-border px-3 py-2 text-left font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{column.name}</span>
                      <span className="rounded bg-background/60 px-1 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                        {column.type}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.preview.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/60 transition-colors hover:bg-secondary/40">
                  {dataset.columns.map((column) => {
                    const value = row[column.name];

                    return (
                      <td
                        key={`${rowIndex}-${column.name}`}
                        className={`px-3 py-2 ${column.type === "number" ? "font-mono text-primary" : "text-foreground"} ${value == null ? "italic text-muted-foreground" : ""}`}
                      >
                        {value == null ? "null" : String(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
