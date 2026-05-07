import { useMemo } from 'react'
import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  CreditCard,
  BadgeAlert,
  BarChart2,
  Users,
  Settings,
  Home,
  Landmark,
  FileText,
  Wallet,
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useStore } from '../../store'
import { filterByPeriod } from '../../lib/filters'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  end?: boolean
  badge?: string
}

interface SidebarProps {
  open: boolean
  onClose: () => void
  desktopOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ open, onClose, desktopOpen, onToggle }: SidebarProps) {
  const user1Name = useStore((s) => s.settings.user1Name)
  const importedBackupDate = useStore((s) => s.importedBackupDate)
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)
  const expenses = useStore((s) => s.expenses)
  const expenseCategories = useStore((s) => s.settings.expenseCategories)
  const backupLabel = importedBackupDate
    ? `Backup ${format(parseISO(importedBackupDate), 'MMM d')}`
    : 'No backup'

  const overBudgetCount = useMemo(() => {
    const now = new Date()
    const currPeriod = { year: now.getFullYear(), month: now.getMonth() + 1 }
    const monthExpenses = filterByPeriod(expenses, 'month', currPeriod)
    return expenseCategories.filter((cat) => {
      if (!cat.budget || cat.budget <= 0) return false
      const spent = monthExpenses
        .filter((e) => e.category === cat.id)
        .reduce((s, e) => s + e.amount, 0)
      return spent > cat.budget
    }).length
  }, [expenses, expenseCategories])

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Overview',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/net-worth', label: 'Net Worth', icon: Landmark },
        { to: '/reports', label: 'Reports', icon: FileText },
      ],
    },
    {
      label: 'Money',
      items: [
        { to: '/expenses', label: 'Expenses', icon: CreditCard, badge: overBudgetCount > 0 ? (`${overBudgetCount} over` as const) : undefined },
        { to: '/budget', label: 'Budget', icon: Wallet },
        { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
        { to: '/income', label: 'Income', icon: DollarSign },
        { to: '/cash-flow', label: 'Cash Flow', icon: TrendingUp },
      ],
    },
    {
      label: 'Planning',
      items: [
        { to: '/portfolio', label: 'Investments', icon: BarChart2 },
        { to: '/debt', label: 'Debt', icon: BadgeAlert },
        { to: '/mortgage', label: 'Mortgage', icon: Home },
        { to: '/shared-balance', label: 'Shared Balance', icon: Users },
      ],
    },
    {
      label: 'System',
      items: [
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ]

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full
          bg-white dark:bg-[#1e2330] border-r border-[#e8e8e8] dark:border-[#2d3347]
          flex flex-col overflow-hidden
          transition-[width,transform] duration-300
          w-[220px]
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${desktopOpen ? 'lg:translate-x-0 lg:w-[220px]' : 'lg:translate-x-0 lg:w-[56px]'}
        `}
      >
        {/* Logo + sidebar toggle */}
        <div className={`flex items-center border-b border-[#e8e8e8] dark:border-[#2d3347] transition-all duration-300 ${desktopOpen ? 'flex-row justify-between px-4 py-[18px]' : 'lg:flex-col lg:py-3 lg:gap-1 lg:px-0 flex-row px-4 py-[18px] gap-3'}`}>
          <div className="flex items-center gap-3">
            <img src="/icon-light.png" className="w-9 h-9 rounded-[10px] flex-shrink-0 dark:hidden" />
            <img src="/icon-dark.png" className="w-9 h-9 rounded-[10px] flex-shrink-0 hidden dark:block" />
            <span className={`text-[15px] font-semibold text-[#181d26] dark:text-[#e8eaf0] whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              MyFinance
            </span>
          </div>
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#41454d] dark:hover:text-[#e8eaf0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {desktopOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-5 overflow-y-auto space-y-5 ${desktopOpen ? 'px-3' : 'lg:px-2 px-3'}`}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className={`text-[10px] font-semibold uppercase text-[#41454d]/60 dark:text-[#9297a0]/60 px-3 mb-1 tracking-wider whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:h-0 lg:overflow-hidden'}`}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    title={!desktopOpen ? label : undefined}
                    className={({ isActive }) =>
                      `flex items-center py-[10px] rounded-[8px] text-[13px] font-medium transition-colors ${
                        desktopOpen ? 'gap-3 px-3' : 'lg:justify-center lg:px-0 lg:gap-0 gap-3 px-3'
                      } ${
                        isActive
                          ? 'bg-[#f8fafc] dark:bg-[#252b3b] text-[#181d26] dark:text-[#e8eaf0] font-semibold'
                          : 'text-[#333840] dark:text-[#c4c8d0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className="flex-shrink-0"
                          style={{ width: 15, height: 15, color: isActive ? '#181d26' : '#9297a0' }}
                        />
                        <span className={`flex-1 whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                          {label}
                        </span>
                        {badge && desktopOpen && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                              badge === 'new'
                                ? 'bg-[#f0f2f5] dark:bg-[#252b3b] text-[#41454d] dark:text-[#9297a0]'
                                : 'bg-[#fff1ec] text-[#aa2d00]'
                            }`}
                          >
                            {badge === 'new' ? 'NEW' : badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer + dark mode toggle */}
        <div className={`py-4 border-t border-[#e8e8e8] dark:border-[#2d3347] transition-all duration-300 ${desktopOpen ? 'px-5' : 'lg:px-2 px-5'}`}>
          <div className={`flex items-center gap-3 ${desktopOpen ? 'justify-between' : 'lg:flex-col lg:items-center lg:gap-2'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#f0f2f5] dark:bg-[#252b3b] flex items-center justify-center flex-shrink-0">
                <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0]">
                  {user1Name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={`min-w-0 transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                <p className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] truncate">{user1Name}</p>
                <p className="text-[11px] text-[#41454d] dark:text-[#9297a0] truncate">{backupLabel}</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
              className="p-1.5 rounded-[6px] text-[#9297a0] hover:text-[#41454d] dark:hover:text-[#e8eaf0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors flex-shrink-0"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
