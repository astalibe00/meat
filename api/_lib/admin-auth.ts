import type { AppDataState, AdminSession } from "../../src/types/app-data.js";
import { mutateAppData, readAppData } from "./app-data.js";
import { getAdminChatIds, sendMessage } from "./telegram.js";

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
}

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createToken() {
  return `admin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

function getDefaultAdminRole() {
  const role = process.env.ADMIN_DEFAULT_ROLE?.trim().toLowerCase();
  if (role === "manager" || role === "support" || role === "owner") {
    return role;
  }

  return "owner";
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
) {
  const direct = headers[name];
  if (Array.isArray(direct)) {
    return direct[0] ?? "";
  }

  if (typeof direct === "string") {
    return direct;
  }

  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  if (!match) {
    return "";
  }

  return Array.isArray(match[1]) ? match[1][0] ?? "" : match[1] ?? "";
}

function getAuthToken(req: RequestLike) {
  const authorization = getHeaderValue(req.headers ?? {}, "authorization");
  if (!authorization) {
    return "";
  }

  const [scheme, token] = authorization.split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token.trim();
}

function getValidSession(state: AppDataState, token: string) {
  if (!token) {
    return undefined;
  }

  return state.adminAuth.sessions.find(
    (session) => session.token === token && Date.parse(session.expiresAt) > Date.now(),
  );
}

export async function requestAdminLoginCode() {
  const adminChatIds = [...new Set(getAdminChatIds().filter(Boolean))];
  if (adminChatIds.length === 0) {
    throw new Error("ADMIN_TELEGRAM_IDS sozlanmagan.");
  }

  const code = createCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await mutateAppData((state) => ({
    ...state,
    adminAuth: {
      ...state.adminAuth,
      loginCode: code,
      loginCodeExpiresAt: expiresAt,
      sessions: state.adminAuth.sessions.filter((session) => Date.parse(session.expiresAt) > Date.now()),
    },
  }));

  await Promise.all(
    adminChatIds.map((chatId) =>
      sendMessage(
        chatId,
        `Admin panelga kirish kodi: ${code}\nAmal qilish muddati: 10 daqiqa.`,
      ),
    ),
  );

  return {
    sent: adminChatIds.length,
    expiresAt,
  };
}

export async function verifyAdminLoginCode(code: string, label = "Admin panel") {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    throw new Error("Tasdiqlash kodi kiritilmagan.");
  }

  let createdSession: AdminSession | undefined;

  await mutateAppData((state) => {
    const expectedCode = state.adminAuth.loginCode?.trim();
    const expiresAt = state.adminAuth.loginCodeExpiresAt
      ? Date.parse(state.adminAuth.loginCodeExpiresAt)
      : 0;

    if (!expectedCode || !expiresAt || expiresAt <= Date.now()) {
      throw new Error("Kirish kodi eskirgan. Yangisini so'rang.");
    }

    if (expectedCode !== trimmedCode) {
      throw new Error("Kod noto'g'ri.");
    }

    createdSession = {
      token: createToken(),
      label: label.trim() || "Admin panel",
      role: getDefaultAdminRole(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date().toISOString(),
    };

    return {
      ...state,
      adminAuth: {
        loginCode: undefined,
        loginCodeExpiresAt: undefined,
        sessions: [createdSession, ...state.adminAuth.sessions]
          .filter((session) => Date.parse(session.expiresAt) > Date.now())
          .slice(0, 10),
      },
    };
  });

  if (!createdSession) {
    throw new Error("Sessiya yaratilmadi.");
  }

  return createdSession;
}

export async function validateAdminRequest(req: RequestLike) {
  const token = getAuthToken(req);
  const state = await readAppData();
  const session = getValidSession(state, token);

  if (!session) {
    return undefined;
  }

  if (Date.parse(session.lastUsedAt) < Date.now() - 5 * 60 * 1000) {
    await mutateAppData((currentState) => ({
      ...currentState,
      adminAuth: {
        ...currentState.adminAuth,
        sessions: currentState.adminAuth.sessions.map((item) =>
          item.token === session.token
            ? {
                ...item,
                lastUsedAt: new Date().toISOString(),
              }
            : item,
        ),
      },
    }));
  }

  return session;
}

export async function requireAdminRequest(req: RequestLike) {
  const session = await validateAdminRequest(req);
  if (!session) {
    throw new Error("Admin avtorizatsiyasi talab qilinadi.");
  }

  return session;
}
