/**
 * Client for the n8n "Chat Trigger" webhook.
 * Sends the hosted-chat payload shape ({ action, sessionId, chatInput })
 * and tolerates the common response shapes n8n returns.
 */
export async function sendChatMessage(
  webhookUrl: string,
  sessionId: string,
  chatInput: string
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        chatInput,
      }),
    });
  } catch {
    throw new Error(
      "Could not reach the n8n webhook. Check the URL and that CORS is enabled on the chat trigger."
    );
  }

  if (!res.ok) {
    throw new Error(`n8n webhook responded with ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    const pick = (obj: unknown): string | undefined => {
      if (typeof obj === "string") return obj;
      if (obj && typeof obj === "object") {
        const rec = obj as Record<string, unknown>;
        for (const key of ["output", "text", "message", "response", "content"]) {
          const v = rec[key];
          if (typeof v === "string" && v.trim()) return v;
        }
      }
      return undefined;
    };
    const text = Array.isArray(data) ? pick(data[0]) : pick(data);
    if (text) return text;
    return "Received an empty response from the workflow.";
  }

  const text = await res.text();
  return text.trim() || "Received an empty response from the workflow.";
}
