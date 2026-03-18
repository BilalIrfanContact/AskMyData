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
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">AskMyData</div>
          <h1 className="text-4xl font-semibold">Start by uploading a CSV file.</h1>
          <p className="text-sm text-slate-600">
            Once your dataset is loaded, you can chat with it and receive answers and charts in real time.
          </p>
          {error ? (
            <div className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
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
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">AskMyData</div>
          <h1 className="text-2xl font-semibold">Dataset loaded</h1>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
          onClick={() => setSession(null)}
        >
          Upload another CSV
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.35fr]">
        <DataPreview data={session} />
        <div className="panel flex h-[620px] flex-col">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Conversation</div>
            <h2 className="text-lg font-semibold">Ask and analyze</h2>
          </div>
          <div className="flex-1 space-y-4 overflow-auto px-6 py-4">
            {history.length ? (
              history.map((item, index) => (
                <div key={`${item.question}-${index}`} className="space-y-3">
                  <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
                    <div className="text-xs uppercase tracking-wide text-slate-300">You</div>
                    <div className="mt-1">{item.question}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Assistant</div>
                    <div className="mt-2 whitespace-pre-wrap">
                      {item.answer || "No text answer returned."}
                    </div>
                    {item.chart ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Ask your first question to begin the conversation.
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 px-6 py-4">
            <ChatInput onSubmit={handleAnalyze} isLoading={analyzing} disabled={!session} />
          </div>
        </div>
      </section>
    </main>
  );
}
