import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      toggleFavorite: (productId) => {
        const current = get().favoriteIds;
        if (current.includes(productId)) {
          set({ favoriteIds: current.filter((id) => id !== productId) });
        } else {
          set({ favoriteIds: [...current, productId] });
        }
      },

      isFavorite: (productId) => {
        return get().favoriteIds.includes(productId);
      },
    }),
    {
      name: 'favorites-storage',
    }
  )
);
