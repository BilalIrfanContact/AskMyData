"use client";

import { useState } from "react";

import CSVUploader from "@/components/CSVUploader";
import ChatInput from "@/components/ChatInput";
import DataPreview from "@/components/DataPreview";
import { analyzeQuestion, uploadCSV, type AnalysisResult, type UploadResponse } from "@/lib/api";

export default function HomePage() {
  const [session, setSession] = useState<UploadResponse | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const response = await uploadCSV(file);
      setSession(response);
      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (question: string) => {
    if (!session) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await analyzeQuestion(session.session_id, question);
      setHistory((prev) => [
        ...prev,
        {
          question,
          answer: response.answer,
          chart: response.chart,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <div className="flex flex-col gap-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">AskMyData</div>
          <h1 className="text-4xl font-semibold">Start by uploading a CSV file.</h1>
          <p className="text-sm text-white/70">
            Once your dataset is loaded, you can chat with it and receive answers and charts in real time.
          </p>
          {error ? (
            <div className="rounded-xl border border-crimson/60 bg-main/70 px-4 py-3 text-sm text-white">
              {error}
            </div>
          ) : null}
          <CSVUploader onUpload={handleUpload} isUploading={uploading} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">AskMyData</div>
          <h1 className="text-2xl font-semibold">Dataset loaded</h1>
        </div>
        <button
          type="button"
          className="rounded-full border border-ember/60 bg-main/60 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-ember/30"
          onClick={() => setSession(null)}
        >
          Upload another CSV
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-crimson/60 bg-main/70 px-4 py-3 text-sm text-white">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr]">
        <DataPreview data={session} />
        <div className="panel flex h-[620px] flex-col">
          <div className="border-b border-ember/60 px-6 py-4">
            <div className="text-xs uppercase tracking-wide text-white/60">Conversation</div>
            <h2 className="text-lg font-semibold">Ask and analyze</h2>
          </div>
          <div className="flex-1 space-y-4 overflow-auto px-6 py-4">
            {history.length ? (
              history.map((item, index) => (
                <div key={`${item.question}-${index}`} className="space-y-3">
                  <div className="rounded-2xl bg-main/80 px-4 py-3 text-sm text-white">
                    <div className="text-xs uppercase tracking-wide text-white/60">You</div>
                    <div className="mt-1">{item.question}</div>
                  </div>
                  <div className="rounded-2xl border border-ember/60 bg-main/70 px-4 py-3 text-sm text-white/90">
                    <div className="text-xs uppercase tracking-wide text-white/60">Assistant</div>
                    <div className="mt-2 whitespace-pre-wrap">
                      {item.answer || "No text answer returned."}
                    </div>
                    {item.chart ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-ember/60 bg-main/60">
                        <img
                          src={`data:image/png;base64,${item.chart}`}
                          alt="Generated chart"
                          className="w-full"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-ember/50 bg-main/40 px-4 py-10 text-center text-sm text-white/60">
                Ask your first question to begin the conversation.
              </div>
            )}
          </div>
          <div className="border-t border-ember/60 px-6 py-4">
            <ChatInput onSubmit={handleAnalyze} isLoading={analyzing} disabled={!session} />
          </div>
        </div>
      </section>
    </main>
  );
}
