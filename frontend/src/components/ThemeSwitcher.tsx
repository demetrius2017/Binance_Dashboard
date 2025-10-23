import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { themeOptions } from '@/theme/presets'
import { useThemeStyles } from '@/theme/useThemeStyles'

export function ThemeSwitcher() {
  const { styles } = useThemeStyles()
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full p-1 backdrop-blur transition-all duration-300',
        styles.switcher,
      )}
    >
      {themeOptions.map((option) => {
        const isActive = option.id === theme
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            aria-pressed={isActive}
            title={option.description}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              isActive ? styles.switcherButtonActive : styles.switcherButton,
            )}
          >
            <span className="mr-1 text-[11px] font-bold">{option.order}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
