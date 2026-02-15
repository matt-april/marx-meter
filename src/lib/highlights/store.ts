import { create } from 'zustand';

interface HighlightsState {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
}

export const useHighlightsStore = create<HighlightsState>((set) => ({
  enabled: true,

  toggle: () => set((state) => ({ enabled: !state.enabled })),

  setEnabled: (enabled: boolean) => set({ enabled }),
}));
