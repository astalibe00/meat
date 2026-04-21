import { getAdminChatIds, getChannelId, sendMessage } from "./_lib/telegram.js";
import { requireAdminRequest } from "./_lib/admin-auth.js";
import { appendAuditLog, mutateAppData, nextBroadcastId } from "./_lib/app-data.js";
import { buildCustomerInsights, filterAudienceInsights } from "../src/lib/customer-intelligence.js";
import type { BroadcastAudience } from "../src/types/app-data.js";

interface ApiRequest {
  method?: string;
  body?: {
    title?: string;
    body?: string;
    audience?: BroadcastAudience;
  };
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

function getRecipients(telegramIds: number[]) {
  return [...new Set([...telegramIds, ...getAdminChatIds().map(Number), Number(getChannelId() || 0)])].filter(
    Boolean,
  );
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    await requireAdminRequest(req);
    const title = req.body?.title?.trim() || "Fresh Halal yangiliklari";
    const body = req.body?.body?.trim();
    const audience = req.body?.audience ?? "all";

    if (!body) {
      res.status(400).json({ ok: false, error: "Message body is required" });
      return;
    }

    const nextState = await mutateAppData((state) => {
      const customerInsights = buildCustomerInsights(state.customers, state.orders);
      const targetedCustomers = filterAudienceInsights(customerInsights, audience);
      const recipients = getRecipients(
        targetedCustomers.map((entry) => entry.customer.telegramUserId).filter(Boolean) as number[],
      );

      return {
        ...state,
        broadcasts: [
          {
            id: nextBroadcastId(),
            title,
            body,
            createdAt: new Date().toISOString(),
            audience,
            sentCount: recipients.length,
          },
          ...state.broadcasts,
        ].slice(0, 50),
        auditLog: appendAuditLog(state.auditLog, {
          actor: "admin-panel",
          action: "broadcast.sent",
          actorRole: "owner",
          entityType: "broadcast",
          summary: `${audience} segmentiga "${title}" xabari yuborildi.`,
        }),
      };
    });

    const latestBroadcast = nextState.broadcasts[0];
    const customerInsights = buildCustomerInsights(nextState.customers, nextState.orders);
    const recipients = getRecipients(
      filterAudienceInsights(customerInsights, audience)
        .map((entry) => entry.customer.telegramUserId)
        .filter(Boolean) as number[],
    );

    await Promise.all(
      recipients.map((chatId) =>
        sendMessage(chatId, `${title}\n\n${body}`),
      ),
    );

    res.status(200).json({ ok: true, sent: recipients.length, broadcast: latestBroadcast });
  } catch (error) {
    console.error("[broadcast] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Broadcast failed",
    });
  }
}
