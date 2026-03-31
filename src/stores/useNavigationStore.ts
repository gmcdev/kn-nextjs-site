import { create } from 'zustand';

import type { PostWithRelationships } from '@/lib/types';

type NavigationState = {
  currentCategoryId: string | null;
  currentPost: PostWithRelationships | null;
  currentTagId: string | null;
  scrollActivated: boolean;
  tagSwipeMap: Record<string, number>;
};

type NavigationActions = {
  activateScroll: () => void;
  resetScrollActivated: () => void;
  setCurrentCategoryId: (categoryId: string | null) => void;
  setCurrentPost: (post: PostWithRelationships | null) => void;
  setCurrentTagId: (tagId: string | null) => void;
  setTagSwipeFor: (tagId: string, index: number) => void;
};

const useNavigationStore = create<NavigationState & NavigationActions>((set, get) => ({
  currentCategoryId: null,
  currentPost: null,
  currentTagId: null,
  scrollActivated: false,
  tagSwipeMap: {},

  activateScroll: () => {
    set({ scrollActivated: true });
  },

  resetScrollActivated: () => {
    set({ scrollActivated: false });
  },

  setCurrentCategoryId: (categoryId) => {
    set({ currentCategoryId: categoryId });
  },

  setCurrentPost: (post) => {
    if (get().scrollActivated) {
      set({ currentPost: post });
    }
  },

  setCurrentTagId: (tagId) => {
    set({ currentTagId: tagId });
  },

  setTagSwipeFor: (tagId, index) => {
    set((state) => ({
      tagSwipeMap: { ...state.tagSwipeMap, [tagId]: index },
    }));
  },
}));

export default useNavigationStore;
