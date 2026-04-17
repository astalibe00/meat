import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TelegramUser {
  first_name?: string;
  id: number;
  last_name?: string;
  username?: string;
}

interface AppState {
  compareIds: string[];
  consumeStartParam: () => string | undefined;
  favoriteIds: string[];
  isTelegram: boolean;
  setLaunchData: (payload: {
    isTelegram: boolean;
    startParam?: string;
    user?: TelegramUser;
  }) => void;
  startParam?: string;
  toggleCompare: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  user?: TelegramUser;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      compareIds: [],
      consumeStartParam: () => {
        const current = get().startParam;
        set({ startParam: undefined });
        return current;
      },
      favoriteIds: [],
      isTelegram: false,
      setLaunchData: (payload) => {
        set(payload);
      },
      startParam: undefined,
      toggleCompare: (productId) => {
        const compareIds = get().compareIds;
        const nextIds = compareIds.includes(productId)
          ? compareIds.filter((id) => id !== productId)
          : compareIds.length >= 3
            ? [...compareIds.slice(1), productId]
            : [...compareIds, productId];

        set({ compareIds: nextIds });
      },
      toggleFavorite: (productId) => {
        const favoriteIds = get().favoriteIds;
        const nextIds = favoriteIds.includes(productId)
          ? favoriteIds.filter((id) => id !== productId)
          : [...favoriteIds, productId];

        set({ favoriteIds: nextIds });
      },
      user: undefined,
    }),
    {
      name: "telegram-marketplace-ui",
      partialize: (state) => ({
        compareIds: state.compareIds,
        favoriteIds: state.favoriteIds,
      }),
    },
  ),
);
