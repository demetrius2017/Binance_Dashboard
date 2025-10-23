import { create } from 'zustand'

export type ThemeId = 'classic' | 'neon' | 'carbon'

interface UiState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'classic',
  setTheme: (theme) => set({ theme }),
}))
