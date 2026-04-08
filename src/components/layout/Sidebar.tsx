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
  Wallet,
  Home,
} from 'lucide-react'
import { useStore } from '../../store'
import { formatDate } from '../../lib/formatters'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/cash-flow', label: 'Cash Flow', icon: TrendingUp },
  { to: '/income', label: 'Income', icon: DollarSign },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/debt', label: 'Debt', icon: BadgeAlert },
  { to: '/mortgage', label: 'Mortgage', icon: Home },
  { to: '/portfolio', label: 'Portfolio', icon: BarChart2 },
  { to: '/shared-balance', label: 'Shared Balance', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const importedBackupDate = useStore((s) => s.importedBackupDate)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-60
          bg-white dark:bg-[#1A1F2E]
          border-r border-gray-200 dark:border-[#2D3448]
          flex flex-col
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-[#2D3448]">
          <div className="w-9 h-9 rounded-xl bg-[#6B3FA0] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            FinanceApp
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#6B3FA0] text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User names */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#2D3448]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#6B3FA0]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[#6B3FA0]">
                {user1Name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user1Name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user2Name}</p>
            </div>
          </div>
          {importedBackupDate && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2D3448]">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Working on backup</p>
              <p className="text-[10px] font-medium text-[#6B3FA0] truncate">
                {formatDate(importedBackupDate.slice(0, 10))}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
