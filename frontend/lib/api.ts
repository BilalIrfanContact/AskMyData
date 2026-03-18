export type UploadResponse = {
  session_id: string;
  columns: string[];
  dtypes: Record<string, string>;
  preview: Array<Array<string | number | null>>;
};

export type AnalyzeResponse = {
  answer: string | null;
  chart: string | null;
};

export type AnalysisResult = {
  question: string;
  answer: string | null;
  chart: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to upload CSV");
  }

  return response.json();
}

export async function analyzeQuestion(
  sessionId: string,
  question: string
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId, question }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to analyze question");
  }

  return response.json();
}
