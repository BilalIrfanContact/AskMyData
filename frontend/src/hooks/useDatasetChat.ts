import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { analyzeQuestion } from "@/lib/api/client";
import type { ChatMessage } from "@/types/workspace";

function newId() {
  return crypto.randomUUID();
}

export function useDatasetChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const mutation = useMutation({
    mutationFn: ({ question }: { question: string }) => analyzeQuestion(sessionId, question),
    onSuccess: (result) => {
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content: result.answer ?? "",
          result,
          status: result.error ? "error" : "complete",
          createdAt: Date.now(),
        },
      ]);
    },
    onError: (error) => {
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content: "",
          result: {
            error: error instanceof Error ? error.message : "Unexpected backend error.",
          },
          status: "error",
          createdAt: Date.now(),
        },
      ]);
    },
  });

  const sendQuestion = async (question: string) => {
    const normalized = question.trim();
    if (!normalized || mutation.isPending) return;

    setMessages((current) => [
      ...current,
      {
        id: newId(),
        role: "user",
        content: normalized,
        status: "complete",
        createdAt: Date.now(),
      },
    ]);

    await mutation.mutateAsync({ question: normalized });
  };

  return useMemo(
    () => ({
      messages,
      sendQuestion,
      isBusy: mutation.isPending,
      resetConversation: () => {
        setMessages([]);
        mutation.reset();
      },
    }),
    [messages, mutation],
  );
}
