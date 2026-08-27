import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquare, Plus, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { newThreadId, useChatStore } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export function ChatSidebar() {
  const { threads, webhookUrl, saveWebhookUrl, deleteThread } = useChatStore();
  const params = useParams({ strict: false }) as { threadId?: string };
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  useEffect(() => {
    setUrlDraft(webhookUrl);
  }, [webhookUrl]);

  const startNewChat = () => {
    navigate({
      to: "/chat/$threadId",
      params: { threadId: newThreadId() },
    });
  };

  const handleDelete = (threadId: string) => {
    deleteThread(threadId);
    if (params.threadId === threadId) {
      navigate({
        to: "/chat/$threadId",
        params: { threadId: newThreadId() },
        replace: true,
      });
    }
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <img src={logo} alt="n8n Chat logo" width={24} height={24} className="rounded-sm" />
        <span className="text-sm font-semibold tracking-tight">n8n Chat</span>
      </div>

      <div className="px-3">
        <button
          onClick={startNewChat}
          className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Plus className="size-4" />
          New chat
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
        {threads.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            No conversations yet.
          </p>
        )}
        {threads.map((thread) => {
          const active = thread.id === params.threadId;
          return (
            <div
              key={thread.id}
              className={cn(
                "group flex items-center rounded-md text-sm transition-colors",
                active ? "bg-accent font-medium" : "hover:bg-accent/60"
              )}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: thread.id }}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2"
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{thread.title}</span>
              </Link>
              <button
                onClick={() => handleDelete(thread.id)}
                aria-label={`Delete ${thread.title}`}
                className="mr-1 hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive group-hover:block"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <Settings2 className="size-4" />
          Webhook settings
          <span
            className={cn(
              "ml-auto size-1.5 rounded-full",
              webhookUrl ? "bg-green-500" : "bg-destructive"
            )}
          />
        </button>
        {showSettings && (
          <form
            className="mt-2 space-y-2 px-1 pb-1"
            onSubmit={(e) => {
              e.preventDefault();
              saveWebhookUrl(urlDraft);
              setShowSettings(false);
            }}
          >
            <label className="block text-xs text-muted-foreground" htmlFor="webhook-url">
              n8n chat webhook URL
            </label>
            <input
              id="webhook-url"
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://your-n8n.app/webhook/…/chat"
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-ring"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
