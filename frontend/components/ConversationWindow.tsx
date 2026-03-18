import type { AnalysisResult } from "@/lib/api";

type ConversationWindowProps = {
  history: AnalysisResult[];
};

export default function ConversationWindow({ history }: ConversationWindowProps) {
  return (
    <div className="panel p-6">
      <div className="badge">Conversation</div>
      <h3 className="mt-4 text-lg font-semibold">Your questions</h3>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-2">
        {history.length ? (
          history.map((item, index) => (
            <div key={`${item.question}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Question</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{item.question}</div>
              <div className="mt-3 text-xs uppercase tracking-wide text-slate-400">Answer</div>
              <div className="mt-1 text-xs text-slate-600">
                {item.answer ? item.answer.slice(0, 160) : "Chart generated or no text answer."}
                {item.answer && item.answer.length > 160 ? "…" : ""}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Ask a question to start the conversation.
          </div>
        )}
      </div>
    </div>
  );
}
