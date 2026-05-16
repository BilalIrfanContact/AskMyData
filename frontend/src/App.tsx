import { useMemo, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import type { Dataset } from "@/types/workspace";
import { UploadArea } from "@/components/workspace/UploadArea";
import { Sidebar } from "@/components/workspace/Sidebar";
import { ChatContainer } from "@/components/workspace/ChatContainer";
import { uploadDataset } from "@/lib/api/client";
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
  const [showMobileSchema, setShowMobileSchema] = useState(false);

  const accessToken = session?.access_token ?? "";

  const onUpload = useMemo(
    () => (file: File, onProgress?: (percent: number) => void) => uploadDataset(file, accessToken, onProgress),
    [accessToken],
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    setDataset(null);
  };

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
        <UploadArea onUpload={onUpload} onUploaded={(nextDataset) => setDataset(nextDataset)} />
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
            <Sidebar compact dataset={dataset} onReset={() => setDataset(null)} />
          </div>
        )}

        <ChatContainer dataset={dataset} accessToken={accessToken} />
      </section>
    </main>
  );
}
