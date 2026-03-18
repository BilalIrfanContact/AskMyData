import type { AnalysisResult } from "@/lib/api";

type ChartDisplayProps = {
  result: AnalysisResult;
  showPlaceholder?: boolean;
};

export default function ChartDisplay({ result, showPlaceholder = false }: ChartDisplayProps) {
  if (!result.chart && !showPlaceholder) return null;

  return (
    <div className="panel p-6">
      <div className="badge">Chart</div>
      <h3 className="mt-4 text-lg font-semibold">Generated visualization</h3>
      {result.chart ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img
            src={`data:image/png;base64,${result.chart}`}
            alt="Generated chart"
            className="w-full"
          />
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No chart was generated for this question.
        </div>
      )}
    </div>
  );
}
