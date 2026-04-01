import { create } from 'zustand';

import type { PostWithRelationships, TagWithRelationships } from '@/lib/types';

type ModalState = {
  currentIndex: number;
  post: PostWithRelationships | null;
  tag: TagWithRelationships | null;
};

type ModalActions = {
  close: () => void;
  goToIndex: (index: number) => void;
  open: (post: PostWithRelationships, tag: TagWithRelationships) => void;
};

const useModalStore = create<ModalState & ModalActions>((set) => ({
  currentIndex: 0,
  post: null,
  tag: null,

  close: () => {
    set({ currentIndex: 0, post: null, tag: null });
  },

  goToIndex: (index) => {
    set({ currentIndex: index });
  },

  open: (post, tag) => {
    const index = tag.postIds.indexOf(post.id);
    set({ currentIndex: index >= 0 ? index : 0, post, tag });
  },
}));

export default useModalStore;
