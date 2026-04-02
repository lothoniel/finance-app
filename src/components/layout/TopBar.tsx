import { Sun, Moon, Menu } from 'lucide-react'
import { useStore } from '../../store'
import { useLocation } from 'react-router-dom'

interface TopBarProps {
  onMenuClick: () => void
}

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/cash-flow': 'Cash Flow',
  '/income': 'Income',
  '/expenses': 'Expenses',
  '/debt': 'Debt Payments',
  '/portfolio': 'Portfolio',
  '/shared-balance': 'Shared Balance',
  '/settings': 'Settings',
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { pathname } = useLocation()
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)

  const title = routeTitles[pathname] ?? 'Finance App'

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    updateSettings({ theme: newTheme })
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#1A1F2E] border-b border-gray-200 dark:border-[#2D3448] sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    </header>
  )
}
