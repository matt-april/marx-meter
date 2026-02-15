import { create } from 'zustand';

interface UIState {
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  isSectionExpanded: (section: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
  expandedSections: new Set(['quickTake']),

  toggleSection: (section: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedSections);
      if (newExpanded.has(section)) {
        newExpanded.delete(section);
      } else {
        newExpanded.add(section);
      }
      return { expandedSections: newExpanded };
    });
  },

  isSectionExpanded: (section: string) => {
    return get().expandedSections.has(section);
  },
}));
