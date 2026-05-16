import { AlertTriangle, Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/types/workspace";
import { ChartRenderer } from "@/components/workspace/ChartRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={index} className="text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="flex max-w-[85%] items-start gap-3 lg:max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm border border-border bg-secondary px-4 py-2.5 text-sm">
            {message.content}
          </div>
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-card">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const hasError = Boolean(message.result?.error);

  return (
    <div className="flex animate-fade-up">
      <div className="flex w-full items-start gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-primary shadow-glow">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {hasError ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">Execution error</div>
                <div className="mt-0.5 text-xs opacity-90">{message.result?.error}</div>
              </div>
            </div>
          ) : (
            <>
              {message.result?.answer ? (
                <div className="rounded-2xl rounded-tl-sm border border-border bg-card/60 px-4 py-3 text-sm leading-relaxed text-foreground/90 backdrop-blur">
                  {renderInlineFormatting(message.result.answer)}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
                  No textual answer was returned for this question.
                </div>
              )}

              {message.result?.chart ? <ChartRenderer chart={message.result.chart} /> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
