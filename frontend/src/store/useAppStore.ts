import { create } from "zustand";

interface TelegramUser {
  first_name?: string;
  id: number;
  last_name?: string;
  username?: string;
}

interface AppState {
  consumeStartParam: () => string | undefined;
  isTelegram: boolean;
  setLaunchData: (payload: {
    isTelegram: boolean;
    startParam?: string;
    user?: TelegramUser;
  }) => void;
  startParam?: string;
  user?: TelegramUser;
}

export const useAppStore = create<AppState>((set, get) => ({
  consumeStartParam: () => {
    const current = get().startParam;
    set({ startParam: undefined });
    return current;
  },
  isTelegram: false,
  setLaunchData: (payload) => {
    set(payload);
  },
  startParam: undefined,
  user: undefined,
}));
