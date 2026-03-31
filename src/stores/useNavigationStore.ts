import { create } from 'zustand';

import type { PostWithRelationships } from '@/lib/types';

type NavigationState = {
  currentPost: PostWithRelationships | null;
  tagSwipeMap: Record<string, number>;
};

type NavigationActions = {
  setCurrentPost: (post: PostWithRelationships | null) => void;
  setTagSwipeFor: (tagId: string, index: number) => void;
};

const useNavigationStore = create<NavigationState & NavigationActions>((set) => ({
  currentPost: null,
  tagSwipeMap: {},

  setCurrentPost: (post) => {
    set({ currentPost: post });
  },

  setTagSwipeFor: (tagId, index) => {
    set((state) => ({
      tagSwipeMap: { ...state.tagSwipeMap, [tagId]: index },
    }));
  },
}));

export default useNavigationStore;
