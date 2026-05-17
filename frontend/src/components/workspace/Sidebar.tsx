import { Calendar, Database, Hash, History, RotateCcw, ToggleLeft, Trash2, Type } from "lucide-react";
import type { ColumnType, Dataset, StoredDocumentSummary } from "@/types/workspace";
import { formatBytes } from "@/lib/utils";
import { Logo } from "@/components/workspace/Logo";

const TYPE_ICON: Record<ColumnType, typeof Hash> = {
  number: Hash,
  string: Type,
  date: Calendar,
  boolean: ToggleLeft,
  unknown: Type,
};

const TYPE_COLOR: Record<ColumnType, string> = {
  number: "text-primary",
  string: "text-muted-foreground",
  date: "text-accent",
  boolean: "text-[hsl(var(--success))]",
  unknown: "text-muted-foreground",
};

interface SidebarProps {
  dataset: Dataset;
  onReset: () => void;
  compact?: boolean;
  documents?: StoredDocumentSummary[];
  onSelectDocument?: (doc: StoredDocumentSummary) => void;
  onDeleteDocument?: (doc: StoredDocumentSummary) => void;
}

export function Sidebar({
  dataset,
  onReset,
  compact = false,
  documents = [],
  onSelectDocument,
  onDeleteDocument,
}: SidebarProps) {
  return (
    <aside
      className={
        compact
          ? "w-full"
          : "flex h-screen w-72 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur"
      }
    >
      {!compact && (
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo />
        </div>
      )}

      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Database className="h-3 w-3" />
          Dataset
        </div>
        <p className="mt-2 truncate font-medium" title={dataset.fileName}>
          {dataset.fileName}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Columns" value={dataset.columns.length.toString()} />
          <Stat label="Preview rows" value={dataset.previewRowCount.toString()} />
          <Stat label="Size" value={formatBytes(dataset.sizeBytes)} />
          <Stat label="Session" value={dataset.sessionId.slice(0, 8)} mono />
        </div>
      </div>

      <div className={`${compact ? "max-h-[28vh]" : "flex-1"} overflow-y-auto scrollbar-thin`}>
        {documents.length > 0 && (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between bg-card/80 px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
              <span className="inline-flex items-center gap-1">
                <History className="h-3 w-3" />
                Recent
              </span>
            </div>
            <ul className="px-2 pb-3">
              {documents.slice(0, 8).map((doc) => (
                <li key={doc.sessionId}>
                  <div className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary">
                    <button
                      onClick={() => onSelectDocument?.(doc)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm">{doc.fileName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleString()}
                      </div>
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteDocument?.(doc);
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                      aria-label={`Delete ${doc.fileName}`}
                      title="Delete dataset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="sticky top-0 z-10 flex items-center justify-between bg-card/80 px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
          <span>Schema</span>
          <span>{dataset.columns.length}</span>
        </div>

        <ul className="px-2 pb-4">
          {dataset.columns.map((column) => {
            const Icon = TYPE_ICON[column.type];

            return (
              <li
                key={column.name}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary"
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${TYPE_COLOR[column.type]}`} />
                <span className="flex-1 truncate text-sm" title={column.name}>
                  {column.name}
                </span>
                <span className="hidden text-[10px] uppercase text-muted-foreground md:block">
                  {column.backendType}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border p-3">
        <button
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New dataset
        </button>
      </div>
    </aside>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs" : "text-sm font-medium"}>{value}</div>
    </div>
  );
}
