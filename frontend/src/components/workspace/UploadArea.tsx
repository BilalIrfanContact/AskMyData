import { useCallback, useRef, useState } from "react";
import { AlertCircle, FileSpreadsheet, FileUp, Loader2 } from "lucide-react";
import type { Dataset } from "@/types/workspace";
import { cn } from "@/lib/utils";

interface UploadAreaProps {
  onUpload: (file: File, onProgress?: (percent: number) => void) => Promise<Dataset>;
  onUploaded: (dataset: Dataset) => void;
}

export function UploadArea({ onUpload, onUploaded }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!/\.csv$/i.test(file.name)) {
        setError("Please upload a .csv file.");
        return;
      }

      setActiveFile(file.name);
      setProgress(0);

      try {
        const dataset = await onUpload(file, (percent) => setProgress(percent));
        setProgress(100);
        onUploaded(dataset);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
        setProgress(null);
        setActiveFile(null);
      }
    },
    [onUpload, onUploaded],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16">
      <div className="mb-10 text-center animate-fade-up">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" />
          AI data workspace · live
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Chat with your <span className="text-gradient">CSV</span>
        </h1>
        <p className="mt-3 text-balance text-muted-foreground">
          Upload a dataset. Ask anything in plain English. Get Python-powered answers and charts from your backend.
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const droppedFile = event.dataTransfer.files?.[0];
          if (droppedFile) {
            void handleFile(droppedFile);
          }
        }}
        disabled={progress !== null}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl border border-dashed border-border bg-card/40 p-10 text-left transition-all duration-300",
          "hover:border-primary/60 hover:bg-card/70 hover:shadow-elegant",
          dragOver && "border-primary bg-card/80 shadow-glow",
          progress !== null && "cursor-wait",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-border bg-secondary">
            {progress !== null ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <FileUp className="h-6 w-6 text-primary" />
            )}
          </div>

          <div>
            <p className="font-medium">
              {progress !== null ? `Uploading ${activeFile}...` : "Drop your CSV here, or click to browse"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {progress !== null ? "Preparing your data workspace..." : "CSV file with a header row"}
            </p>
          </div>

          {progress !== null && (
            <div className="mt-2 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-gradient-primary transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            if (selectedFile) {
              void handleFile(selectedFile);
            }
          }}
        />
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { title: "Ask in plain English", description: "No formulas or coding needed to explore your data." },
          { title: "Instant visual insights", description: "Get charts and trends you can understand at a glance." },
          { title: "Ready to share", description: "Turn quick questions into answers you can present confidently." },
        ].map((feature) => (
          <div key={feature.title} className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
              {feature.title}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
