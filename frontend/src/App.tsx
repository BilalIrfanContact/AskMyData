import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Menu, Trash2 } from "lucide-react";
import type { Dataset, StoredDocumentSummary } from "@/types/workspace";
import { UploadArea } from "@/components/workspace/UploadArea";
import { Sidebar } from "@/components/workspace/Sidebar";
import { ChatContainer } from "@/components/workspace/ChatContainer";
import { deleteDocument, getDocuments, uploadDataset } from "@/lib/api/client";
import { supabase } from "@/lib/supabase";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Logo } from "@/components/workspace/Logo";

function AuthGate() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 backdrop-blur">
        <Logo className="justify-center" />
        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">Sign in to continue</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Your chats and datasets are stored per account.
        </p>
        <button
          onClick={() => void signInWithGoogle()}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {loading ? "Redirecting to Google..." : "Continue with Google"}
        </button>
      </div>
    </main>
  );
}

export function App() {
  const { session, loading } = useAuthSession();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [documents, setDocuments] = useState<StoredDocumentSummary[]>([]);
  const [showMobileSchema, setShowMobileSchema] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StoredDocumentSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const accessToken = session?.access_token ?? "";

  const onUpload = useMemo(
    () => (file: File, onProgress?: (percent: number) => void) => uploadDataset(file, accessToken, onProgress),
    [accessToken],
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    setDataset(null);
    setDocuments([]);
  };

  const refreshDocuments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const nextDocuments = await getDocuments(accessToken);
      setDocuments(nextDocuments);
    } catch {
      setDocuments([]);
    }
  }, [accessToken]);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const openDocument = (doc: StoredDocumentSummary) => {
    const restoredDataset: Dataset = {
      sessionId: doc.sessionId,
      fileName: doc.fileName,
      columns: doc.columns,
      preview: doc.preview,
      previewRowCount: doc.previewRowCount,
      sizeBytes: 0,
      createdAt: doc.createdAt,
      suggestedQuestions: doc.suggestedQuestions,
    };
    setDataset(restoredDataset);
  };

  const removeDocument = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDocument(pendingDelete.sessionId, accessToken);
      if (dataset?.sessionId === pendingDelete.sessionId) {
        setDataset(null);
      }
      await refreshDocuments();
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteModal = pendingDelete ? (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-elegant">
        <h3 className="text-base font-semibold">Delete dataset?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Delete <span className="font-medium text-foreground">{pendingDelete.fileName}</span>? This cannot be
          undone.
        </p>
        {deleteError ? (
          <p className="mt-2 text-xs text-destructive">{deleteError}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setPendingDelete(null)}
            disabled={isDeleting}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => void removeDocument()}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading session...</main>;
  }

  if (!session) {
    return <AuthGate />;
  }

  if (!dataset) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex justify-end p-4">
          <button
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        <UploadArea
          onUpload={onUpload}
          onUploaded={(nextDataset) => {
            setDataset(nextDataset);
            void refreshDocuments();
          }}
        />
        {documents.length > 0 && (
          <div className="mx-auto mt-6 w-full max-w-3xl px-6 pb-10">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recent documents</h2>
            <div className="grid gap-2">
              {documents.slice(0, 6).map((doc) => (
                <div
                  key={doc.sessionId}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card/40 px-4 py-3 hover:bg-card/70"
                >
                  <button onClick={() => openDocument(doc)} className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-medium">{doc.fileName}</div>
                    <div className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleString()}</div>
                  </button>
                  <button
                    onClick={() => {
                      setDeleteError(null);
                      setPendingDelete(doc);
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                    aria-label={`Delete ${doc.fileName}`}
                    title="Delete dataset"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {deleteModal}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-background">
      <div className="hidden lg:block">
        <Sidebar
          dataset={dataset}
          onReset={() => setDataset(null)}
          documents={documents}
          onSelectDocument={openDocument}
          onDeleteDocument={(doc) => {
            setDeleteError(null);
            setPendingDelete(doc);
          }}
        />
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDataset(null)}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground"
            >
              New dataset
            </button>
            <button
              onClick={() => void signOut()}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground"
            >
              Sign out
            </button>
          </div>
        </div>

        {showMobileSchema && (
          <div className="max-h-[45vh] overflow-y-auto border-b border-border bg-card/50 p-3 lg:hidden">
            <Sidebar
              compact
              dataset={dataset}
              onReset={() => setDataset(null)}
              documents={documents}
              onSelectDocument={openDocument}
              onDeleteDocument={(doc) => {
                setDeleteError(null);
                setPendingDelete(doc);
              }}
            />
          </div>
        )}

        <ChatContainer dataset={dataset} accessToken={accessToken} />
      </section>

      {deleteModal}
    </main>
  );
}
