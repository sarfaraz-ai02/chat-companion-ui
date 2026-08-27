import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  error?: boolean;
};

export type Thread = {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
};

const WEBHOOK_STORAGE_KEY = "n8n-webhook-url";

type ChatStore = {
  threads: Thread[];
  pending: Record<string, boolean>;
  webhookUrl: string;
  saveWebhookUrl: (url: string) => void;
  ensureThread: (id: string) => void;
  deleteThread: (id: string) => void;
  addMessage: (threadId: string, message: ChatMessage) => void;
  setPending: (threadId: string, value: boolean) => void;
};

const ChatStoreContext = createContext<ChatStore | null>(null);

export function newThreadId() {
  return crypto.randomUUID();
}

export function ChatStoreProvider({ children }: { children: ReactNode }) {
  const [threadsById, setThreadsById] = useState<Record<string, Thread>>({});
  const [pending, setPendingState] = useState<Record<string, boolean>>({});
  const [webhookUrl, setWebhookUrl] = useState("");

  // Load the webhook URL on the client only (env var wins over stored value).
  useEffect(() => {
    const fromEnv = import.meta.env["VITE_N8N_WEBHOOK_URL"] as string | undefined;
    if (fromEnv) {
      setWebhookUrl(fromEnv);
      return;
    }
    setWebhookUrl(window.localStorage.getItem(WEBHOOK_STORAGE_KEY) ?? "");
  }, []);

  const saveWebhookUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    setWebhookUrl(trimmed);
    window.localStorage.setItem(WEBHOOK_STORAGE_KEY, trimmed);
  }, []);

  const ensureThread = useCallback((id: string) => {
    setThreadsById((prev) => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: { id, title: "New chat", createdAt: Date.now(), messages: [] },
      };
    });
  }, []);

  const deleteThread = useCallback((id: string) => {
    setThreadsById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addMessage = useCallback((threadId: string, message: ChatMessage) => {
    setThreadsById((prev) => {
      const thread = prev[threadId];
      if (!thread) return prev;
      const isFirstUserMessage =
        message.role === "user" &&
        !thread.messages.some((m) => m.role === "user");
      return {
        ...prev,
        [threadId]: {
          ...thread,
          title: isFirstUserMessage
            ? message.text.slice(0, 42) + (message.text.length > 42 ? "…" : "")
            : thread.title,
          messages: [...thread.messages, message],
        },
      };
    });
  }, []);

  const setPending = useCallback((threadId: string, value: boolean) => {
    setPendingState((prev) => ({ ...prev, [threadId]: value }));
  }, []);

  const threads = useMemo(
    () => Object.values(threadsById).sort((a, b) => b.createdAt - a.createdAt),
    [threadsById]
  );

  const value = useMemo<ChatStore>(
    () => ({
      threads,
      pending,
      webhookUrl,
      saveWebhookUrl,
      ensureThread,
      deleteThread,
      addMessage,
      setPending,
    }),
    [
      threads,
      pending,
      webhookUrl,
      saveWebhookUrl,
      ensureThread,
      deleteThread,
      addMessage,
      setPending,
    ]
  );

  return (
    <ChatStoreContext.Provider value={value}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStore() {
  const ctx = useContext(ChatStoreContext);
  if (!ctx) throw new Error("useChatStore must be used inside ChatStoreProvider");
  return ctx;
}
