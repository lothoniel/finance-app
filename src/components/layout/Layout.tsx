import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import QuickAdd from '../ui/QuickAdd'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-soft)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} desktopOpen={desktopSidebarOpen} />

      <div className={`${desktopSidebarOpen ? 'lg:ml-[220px]' : 'lg:ml-[56px]'} transition-[margin] duration-300 flex flex-col min-h-screen`}>
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          onDesktopMenuClick={() => setDesktopSidebarOpen((v) => !v)}
          desktopSidebarOpen={desktopSidebarOpen}
        />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <QuickAdd />
    </div>
  )
}
