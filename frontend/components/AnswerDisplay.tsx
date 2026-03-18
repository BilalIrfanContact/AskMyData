import type { AnalysisResult } from "@/lib/api";

type AnswerDisplayProps = {
  result: AnalysisResult;
};

export default function AnswerDisplay({ result }: AnswerDisplayProps) {
  return (
    <div className="panel p-6">
      <div className="badge">Answer</div>
      <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Question</div>
      <h3 className="mt-1 text-lg font-semibold">{result.question}</h3>
      <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Answer</div>
      <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
        {result.answer || "No text answer returned."}
      </p>
    </div>
  );
}
