import { useUiStore } from '@/store/uiStore'
import { themeStyles } from './presets'

export function useThemeStyles() {
  const theme = useUiStore((state) => state.theme)
  return {
    theme,
    styles: themeStyles[theme],
  }
}
