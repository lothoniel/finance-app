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
  desktopOpen: boolean
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

export default function Sidebar({ open, onClose, desktopOpen }: SidebarProps) {
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
          fixed top-0 left-0 z-30 h-full
          bg-white dark:bg-[#1A1F2E]
          border-r border-gray-200 dark:border-[#2D3448]
          flex flex-col overflow-hidden
          transition-[width,transform] duration-300
          w-60
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${desktopOpen ? 'lg:translate-x-0 lg:w-60' : 'lg:translate-x-0 lg:w-16'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-gray-100 dark:border-[#2D3448] py-5 transition-all duration-300 ${desktopOpen ? 'px-5 gap-3' : 'lg:justify-center lg:px-0 px-5 gap-3'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center shadow-[0_0_12px_#7C3AED44] flex-shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className={`text-lg font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
            FinanceApp
          </span>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${desktopOpen ? 'px-3' : 'lg:px-2 px-3'}`}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              title={!desktopOpen ? label : undefined}
              className={({ isActive }) =>
                `flex items-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                  desktopOpen ? 'gap-3 px-3' : 'lg:justify-center lg:px-0 gap-3 px-3'
                } ${
                  isActive
                    ? 'bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/15 dark:text-[#a78bfa]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E2235] hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* User names */}
        <div className={`py-4 border-t border-gray-100 dark:border-[#2D3448] transition-all duration-300 ${desktopOpen ? 'px-5' : 'lg:px-2 lg:flex lg:justify-center px-5'}`}>
          <div className={`flex items-center ${desktopOpen ? 'gap-2' : 'lg:justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-[#7C3AED]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#7C3AED] dark:text-[#a78bfa]">
                {user1Name.charAt(0)}
              </span>
            </div>
            <div className={`min-w-0 transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user1Name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user2Name}</p>
            </div>
          </div>
          {importedBackupDate && desktopOpen && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2D3448]">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Working on backup</p>
              <p className="text-[10px] font-medium text-[#7C3AED] dark:text-[#a78bfa] truncate">
                {formatDate(importedBackupDate.slice(0, 10))}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
