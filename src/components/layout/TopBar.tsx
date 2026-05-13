import { Menu, PanelLeftClose, PanelLeftOpen, Sun, Moon } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../../store'

interface TopBarProps {
  onMenuClick: () => void
  onDesktopMenuClick: () => void
  desktopSidebarOpen: boolean
}

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/cash-flow': 'Cash Flow',
  '/income': 'Income',
  '/expenses': 'Expenses',
  '/debt': 'Debt Payments',
  '/portfolio': 'Portfolio',
  '/shared-balance': 'Shared Balance',
  '/mortgage': 'Mortgage',
  '/settings': 'Settings',
}

export default function TopBar({ onMenuClick, onDesktopMenuClick, desktopSidebarOpen }: TopBarProps) {
  const { pathname } = useLocation()
  const title = routeTitles[pathname] ?? 'Finance App'
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-[#1e2330] border-b border-[#e8e8e8] dark:border-[#2d3347] sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-[8px] text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <button
          onClick={onDesktopMenuClick}
          className="hidden lg:flex p-2 rounded-[8px] text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors"
          aria-label="Toggle sidebar"
        >
          {desktopSidebarOpen
            ? <PanelLeftClose className="w-4 h-4" />
            : <PanelLeftOpen className="w-4 h-4" />
          }
        </button>
        <h1 className="text-[15px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">{title}</h1>
      </div>
      <button
        onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
        className="p-2 rounded-[8px] text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors"
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  )
}
