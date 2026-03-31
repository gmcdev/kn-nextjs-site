import { create } from 'zustand';

type DisplayMode = 'grid' | 'list';

const LS_DISPLAY_MODE = 'displayMode';

type SettingsState = {
  displayMode: DisplayMode;
};

type SettingsActions = {
  initDisplayMode: () => void;
  setDisplayMode: (mode: DisplayMode) => void;
};

const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  displayMode: 'grid',

  initDisplayMode: () => {
    try {
      const saved = localStorage.getItem(LS_DISPLAY_MODE);
      if (saved === 'grid' || saved === 'list') {
        set({ displayMode: saved });
      }
    } catch {
      // localStorage unavailable
    }
  },

  setDisplayMode: (mode) => {
    try {
      localStorage.setItem(LS_DISPLAY_MODE, mode);
    } catch {
      // localStorage unavailable
    }
    set({ displayMode: mode });
  },
}));

export default useSettingsStore;
