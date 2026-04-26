import type { AnalysisResult, ColumnType, Dataset } from "@/types/workspace";

type UploadResponse = {
  session_id: string;
  columns: string[];
  dtypes: Record<string, string>;
  preview: unknown[][];
};

type AnalyzeResponse = {
  answer?: string | null;
  chart?: string | null;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_BASE ??
  import.meta.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:8000";

function normalizeErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

function parseCell(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

function mapPandasDtypeToUiType(dtype: string | undefined): ColumnType {
  if (!dtype) return "unknown";
  const normalized = dtype.toLowerCase();

  if (normalized.includes("int") || normalized.includes("float") || normalized.includes("double") || normalized.includes("decimal")) {
    return "number";
  }

  if (normalized.includes("date") || normalized.includes("time")) {
    return "date";
  }

  if (normalized.includes("bool")) {
    return "boolean";
  }

  if (normalized.includes("object") || normalized.includes("string") || normalized.includes("category")) {
    return "string";
  }

  return "unknown";
}

export function chartToImageSource(chart?: string | null): string | undefined {
  if (!chart) return undefined;
  if (chart.startsWith("data:") || chart.startsWith("http") || chart.startsWith("blob:")) {
    return chart;
  }
  return `data:image/png;base64,${chart}`;
}

export async function uploadDataset(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Dataset> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/upload`);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress?.(percent);
    });

    xhr.onload = () => {
      let payload: unknown;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        payload = undefined;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as UploadResponse);
        return;
      }

      reject(new Error(normalizeErrorMessage(payload, "Upload failed.")));
    };

    xhr.onerror = () => {
      reject(new Error("Could not connect to the backend."));
    };

    xhr.send(formData);
  });

  const preview = response.preview.map((row) => {
    const rowObject: Record<string, string | number | boolean | null> = {};
    response.columns.forEach((columnName, columnIndex) => {
      rowObject[columnName] = parseCell(row[columnIndex]);
    });
    return rowObject;
  });

  return {
    sessionId: response.session_id,
    fileName: file.name,
    sizeBytes: file.size,
    preview,
    previewRowCount: response.preview.length,
    columns: response.columns.map((columnName) => ({
      name: columnName,
      backendType: response.dtypes[columnName] ?? "unknown",
      type: mapPandasDtypeToUiType(response.dtypes[columnName]),
    })),
  };
}

export async function analyzeQuestion(sessionId: string, question: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      question,
    }),
  });

  let payload: AnalyzeResponse | { detail?: string } | null = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(normalizeErrorMessage(payload, "Analysis request failed."));
  }

  const response = payload as AnalyzeResponse;
  return {
    answer: response.answer ?? undefined,
    chart: response.chart ?? undefined,
  };
}
