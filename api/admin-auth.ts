import { requestAdminLoginCode, validateAdminRequest, verifyAdminLoginCode } from "./_lib/admin-auth.js";

interface ApiRequest {
  method?: string;
  body?: {
    action?: "request" | "verify";
    code?: string;
    label?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "GET") {
      const session = await validateAdminRequest(req);
      res.status(200).json({
        ok: Boolean(session),
        authenticated: Boolean(session),
        session: session ?? null,
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    if (req.body?.action === "request") {
      const result = await requestAdminLoginCode();
      res.status(200).json({ ok: true, ...result });
      return;
    }

    if (req.body?.action === "verify") {
      const session = await verifyAdminLoginCode(req.body?.code ?? "", req.body?.label);
      res.status(200).json({
        ok: true,
        token: session.token,
        expiresAt: session.expiresAt,
        session,
      });
      return;
    }

    res.status(400).json({ ok: false, error: "Noto'g'ri action." });
  } catch (error) {
    console.error("[admin-auth] failed", error);
    const message = error instanceof Error ? error.message : "Admin auth failed";
    res.status(
      message.includes("noto'g'ri") || message.includes("eskirgan") || message.includes("kiritilmagan")
        ? 400
        : 500,
    ).json({
      ok: false,
      error: message,
    });
  }
}
