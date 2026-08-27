import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { newThreadId } from "@/lib/chat-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "n8n Chat — New conversation" },
      {
        name: "description",
        content: "A clean, minimal chat interface for your n8n AI agent workflow.",
      },
      { property: "og:title", content: "n8n Chat" },
      {
        property: "og:description",
        content: "A clean, minimal chat interface for your n8n AI agent workflow.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: "/chat/$threadId",
      params: { threadId: newThreadId() },
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Starting a new chat…</p>
    </div>
  );
}
