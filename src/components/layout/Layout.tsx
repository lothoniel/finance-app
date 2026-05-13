import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import QuickAdd from '../ui/QuickAdd'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-soft)' }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        desktopOpen={desktopSidebarOpen}
        onToggle={() => setDesktopSidebarOpen((v) => !v)}
      />

      {/* Mobile menu button — only visible on small screens */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-20 p-2 bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] text-[#41454d] dark:text-[#9297a0] shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className={`${desktopSidebarOpen ? 'lg:ml-[220px]' : 'lg:ml-[56px]'} transition-[margin] duration-300 min-h-screen`}>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <QuickAdd />
    </div>
  )
}
