import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { analyzeQuestion, getDocumentMessages } from "@/lib/api/client";
import type { ChatMessage } from "@/types/workspace";

function newId() {
  return crypto.randomUUID();
}

export function useDatasetChat(sessionId: string, accessToken: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ question }: { question: string }) =>
      analyzeQuestion(sessionId, question, accessToken),
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

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);

    getDocumentMessages(sessionId, accessToken)
      .then((history) => {
        if (cancelled) return;
        setMessages(history);
      })
      .catch(() => {
        if (cancelled) return;
        setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, accessToken]);

  return useMemo(
    () => ({
      messages,
      sendQuestion,
      isBusy: mutation.isPending,
      loadingHistory,
      resetConversation: () => {
        setMessages([]);
        mutation.reset();
      },
    }),
    [messages, mutation, loadingHistory],
  );
}
