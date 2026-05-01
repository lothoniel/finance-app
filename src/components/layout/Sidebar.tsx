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
} from 'lucide-react'
import { useStore } from '../../store'

interface SidebarProps {
  open: boolean
  onClose: () => void
  desktopOpen: boolean
}

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/cash-flow', label: 'Cash Flow', icon: TrendingUp },
      { to: '/income', label: 'Income', icon: DollarSign },
      { to: '/expenses', label: 'Expenses', icon: CreditCard },
      { to: '/debt', label: 'Debt', icon: BadgeAlert },
    ],
  },
  {
    label: 'Assets',
    items: [
      { to: '/mortgage', label: 'Mortgage', icon: Home },
      { to: '/portfolio', label: 'Portfolio', icon: BarChart2 },
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

export default function Sidebar({ open, onClose, desktopOpen }: SidebarProps) {
  const user1Name = useStore((s) => s.settings.user1Name)
  const importedBackupDate = useStore((s) => s.importedBackupDate)
  const backupLabel = importedBackupDate ? `Backup ${importedBackupDate}` : 'No backup loaded'

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
        {/* Logo */}
        <div className={`flex items-center border-b border-[#e8e8e8] dark:border-[#2d3347] py-[22px] transition-all duration-300 ${desktopOpen ? 'px-6 gap-3' : 'lg:justify-center lg:px-0 px-6 gap-3'}`}>
          <img src="/icon-light.png" className="w-9 h-9 rounded-[10px] flex-shrink-0 dark:hidden" />
          <img src="/icon-dark.png" className="w-9 h-9 rounded-[10px] flex-shrink-0 hidden dark:block" />
          <span className={`text-[15px] font-semibold text-[#181d26] dark:text-[#e8eaf0] whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
            MyFinance
          </span>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-5 overflow-y-auto space-y-5 ${desktopOpen ? 'px-3' : 'lg:px-2 px-3'}`}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className={`text-[10px] font-semibold uppercase text-[#41454d]/60 dark:text-[#9297a0]/60 px-3 mb-1 tracking-wider whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:h-0 lg:overflow-hidden'}`}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    title={!desktopOpen ? label : undefined}
                    className={({ isActive }) =>
                      `flex items-center py-[10px] rounded-[8px] text-[13px] font-medium transition-colors ${
                        desktopOpen ? 'gap-3 px-3' : 'lg:justify-center lg:px-0 gap-3 px-3'
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
                        <span className={`whitespace-nowrap transition-opacity duration-200 ${desktopOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                          {label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className={`py-4 border-t border-[#e8e8e8] dark:border-[#2d3347] transition-all duration-300 ${desktopOpen ? 'px-5' : 'lg:px-2 lg:flex lg:justify-center px-5'}`}>
          <div className={`flex items-center gap-3 ${desktopOpen ? '' : 'lg:justify-center'}`}>
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
        </div>
      </aside>
    </>
  )
}
