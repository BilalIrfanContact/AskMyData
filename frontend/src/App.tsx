import { useState } from "react";
import type { Dataset } from "@/types/workspace";
import { UploadArea } from "@/components/workspace/UploadArea";
import { Sidebar } from "@/components/workspace/Sidebar";
import { ChatContainer } from "@/components/workspace/ChatContainer";
import { uploadDataset } from "@/lib/api/client";
import { Menu } from "lucide-react";

export function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [showMobileSchema, setShowMobileSchema] = useState(false);

  if (!dataset) {
    return (
      <main className="min-h-screen bg-background">
        <UploadArea
          onUpload={uploadDataset}
          onUploaded={(nextDataset) => setDataset(nextDataset)}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-background">
      <div className="hidden lg:block">
        <Sidebar dataset={dataset} onReset={() => setDataset(null)} />
      </div>

      <section className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
          <button
            onClick={() => setShowMobileSchema((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm"
          >
            <Menu className="h-4 w-4" />
            Schema
          </button>
          <button
            onClick={() => setDataset(null)}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground"
          >
            New dataset
          </button>
        </div>

        {showMobileSchema && (
          <div className="max-h-[45vh] overflow-y-auto border-b border-border bg-card/50 p-3 lg:hidden">
            <Sidebar compact dataset={dataset} onReset={() => setDataset(null)} />
          </div>
        )}

        <ChatContainer dataset={dataset} />
      </section>
    </main>
  );
}
