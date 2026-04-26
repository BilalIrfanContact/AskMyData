import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import type { Dataset } from "@/types/workspace";
import { DataPreviewTable } from "@/components/workspace/DataPreviewTable";
import { MessageBubble } from "@/components/workspace/MessageBubble";
import { StatusIndicator } from "@/components/workspace/StatusIndicator";
import { useDatasetChat } from "@/hooks/useDatasetChat";

const SUGGESTED_QUESTIONS = [
  "Summarize this dataset",
  "Which columns have missing values?",
  "Show a chart of the strongest trend in this data",
  "What are the key outliers I should know about?",
];

interface ChatContainerProps {
  dataset: Dataset;
}

export function ChatContainer({ dataset }: ChatContainerProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendQuestion, isBusy } = useDatasetChat(dataset.sessionId);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isBusy]);

  const submitQuestion = async (question: string) => {
    const normalized = question.trim();
    if (!normalized || isBusy) return;
    setInput("");
    await sendQuestion(normalized);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitQuestion(input);
  };

  const onTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion(input);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="hidden h-14 shrink-0 items-center justify-between border-b border-border px-6 lg:flex">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Analysis</span>
          <span className="text-xs text-muted-foreground">/ {dataset.fileName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
          Connected · session {dataset.sessionId.slice(0, 8)}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 lg:px-6 lg:py-6">
          <DataPreviewTable dataset={dataset} />

          {messages.length === 0 ? (
            <div className="mt-8 animate-fade-up lg:mt-10">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Suggested questions
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => void submitQuestion(question)}
                    disabled={isBusy}
                    className="rounded-xl border border-border bg-card/40 px-4 py-3 text-left text-sm transition-all hover:border-primary/50 hover:bg-card/70 hover:shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isBusy ? <StatusIndicator /> : null}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-4xl px-4 py-3 lg:px-6 lg:py-4">
          <div className="group flex items-end gap-2 rounded-2xl border border-border bg-card/60 p-2 transition-all focus-within:border-primary/60 focus-within:shadow-elegant">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onTextareaKeyDown}
              disabled={isBusy}
              rows={1}
              placeholder={isBusy ? "Working..." : "Ask anything about your data"}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isBusy}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
          <div className="mt-2 px-2 text-[11px] text-muted-foreground">
            Press <kbd className="rounded border border-border bg-secondary px-1 font-mono">Enter</kbd> to send · <kbd className="rounded border border-border bg-secondary px-1 font-mono">Shift+Enter</kbd> for newline
          </div>
        </form>
      </div>
    </div>
  );
}
