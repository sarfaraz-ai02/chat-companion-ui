import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ChatSidebar } from "@/components/chat-sidebar";
import { useChatStore } from "@/lib/chat-store";
import { sendChatMessage } from "@/lib/n8n";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — n8n Chat" },
      {
        name: "description",
        content: "Chat with your n8n AI agent in a clean, minimal interface.",
      },
      { property: "og:title", content: "Chat — n8n Chat" },
      {
        property: "og:description",
        content: "Chat with your n8n AI agent in a clean, minimal interface.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const {
    threads,
    pending,
    webhookUrl,
    ensureThread,
    addMessage,
    setPending,
  } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ensureThread(threadId);
  }, [threadId, ensureThread]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  const thread = threads.find((t) => t.id === threadId);
  const isPending = !!pending[threadId];

  const handleSubmit = useCallback(
    async ({ text }: PromptInputMessage) => {
      const input = text.trim();
      if (!input || isPending) return;

      addMessage(threadId, {
        id: crypto.randomUUID(),
        role: "user",
        text: input,
      });

      if (!webhookUrl) {
        addMessage(threadId, {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "No n8n webhook URL is configured yet. Open **Webhook settings** in the sidebar and paste your chat trigger URL.",
          error: true,
        });
        textareaRef.current?.focus();
        return;
      }

      setPending(threadId, true);
      try {
        const reply = await sendChatMessage(webhookUrl, threadId, input);
        addMessage(threadId, {
          id: crypto.randomUUID(),
          role: "assistant",
          text: reply,
        });
      } catch (err) {
        addMessage(threadId, {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            err instanceof Error
              ? `Something went wrong: ${err.message}`
              : "Something went wrong while contacting the workflow.",
          error: true,
        });
      } finally {
        setPending(threadId, false);
        textareaRef.current?.focus();
      }
    },
    [addMessage, isPending, setPending, threadId, webhookUrl]
  );

  const messages = thread?.messages ?? [];

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-6">
          <h1 className="truncate text-sm font-medium text-foreground">
            {thread?.title ?? "New chat"}
          </h1>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
          <Conversation className="flex-1">
            <ConversationContent className="gap-6 py-6">
              {messages.length === 0 && !isPending ? (
                <ConversationEmptyState
                  className="gap-3"
                  icon={
                    <img
                      src={logo}
                      alt="n8n Chat logo"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  }
                  title="How can I help?"
                  description="Send a message to your n8n AI agent to get started."
                />
              ) : (
                <>
                  {messages.map((message) => (
                    <Message key={message.id} from={message.role}>
                      <MessageContent
                        className={
                          message.error ? "text-destructive" : undefined
                        }
                      >
                        {message.role === "assistant" ? (
                          <MessageResponse>{message.text}</MessageResponse>
                        ) : (
                          message.text
                        )}
                      </MessageContent>
                    </Message>
                  ))}
                  {isPending && (
                    <Message from="assistant">
                      <MessageContent>
                        <Shimmer className="text-sm">Thinking…</Shimmer>
                      </MessageContent>
                    </Message>
                  )}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="shrink-0 pb-4 pt-2">
            <PromptInput
              onSubmit={handleSubmit}
              className="rounded-xl border border-input bg-card shadow-sm"
            >
              <PromptInputTextarea
                ref={textareaRef}
                autoFocus
                placeholder="Message your AI agent…"
                disabled={isPending}
              />
              <PromptInputFooter className="justify-end p-2">
                <PromptInputSubmit
                  status={isPending ? "submitted" : "ready"}
                  disabled={isPending}
                />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Connected to your n8n workflow · history clears on refresh
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
