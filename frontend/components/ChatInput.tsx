"use client";

import { useState } from "react";

type ChatInputProps = {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
};

export default function ChatInput({ onSubmit, isLoading, disabled }: ChatInputProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    onSubmit(question.trim());
    setQuestion("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!disabled && !isLoading && question.trim()) {
              onSubmit(question.trim());
              setQuestion("");
            }
          }
        }}
        placeholder="Ask a question about the data..."
        className="min-h-[96px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-ocean focus:outline-none"
        disabled={disabled}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">Press Enter to send · Shift+Enter for new line</div>
        <button
          type="submit"
          className="rounded-full bg-ocean text-white px-5 py-2 text-sm font-semibold transition hover:bg-ocean/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={disabled || isLoading}
        >
          {isLoading ? "Analyzing..." : "Send"}
        </button>
      </div>
    </form>
  );
}
