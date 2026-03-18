import type { UploadResponse } from "@/lib/api";

type DataPreviewProps = {
  data: UploadResponse;
};

export default function DataPreview({ data }: DataPreviewProps) {
  return (
    <div className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Dataset preview</div>
          <h3 className="text-lg font-semibold">Sample rows</h3>
        </div>
        <div className="text-xs text-slate-500">
          {data.columns.length} columns · {data.preview.length} rows shown
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Show sample rows
        </summary>
        <div className="mt-4 max-w-[560px] overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {data.columns.map((column) => (
                  <th key={column} className="px-4 py-2 font-medium">
                    <div className="flex flex-col">
                      <span>{column}</span>
                      <span className="text-xs text-slate-400">{data.dtypes[column]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.preview.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-100">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 text-slate-700">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
