export type ColumnType = "number" | "string" | "date" | "boolean" | "unknown";

export interface DatasetColumn {
  name: string;
  type: ColumnType;
  backendType: string;
}

export interface Dataset {
  sessionId: string;
  fileName: string;
  columns: DatasetColumn[];
  preview: Record<string, string | number | boolean | null>[];
  previewRowCount: number;
  sizeBytes: number;
  createdAt?: string;
  suggestedQuestions?: string[];
}

export interface AnalysisResult {
  answer?: string;
  chart?: string;
  error?: string;
}

export type MessageRole = "user" | "assistant";
export type MessageStatus = "pending" | "complete" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  result?: AnalysisResult;
  status: MessageStatus;
  createdAt: number;
}

export interface StoredDocumentSummary {
  sessionId: string;
  fileName: string;
  columns: DatasetColumn[];
  preview: Record<string, string | number | boolean | null>[];
  previewRowCount: number;
  createdAt: string;
  suggestedQuestions?: string[];
}
