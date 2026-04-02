import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useStore } from '../../store'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import QuickAdd from '../ui/QuickAdd'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const theme = useStore((s) => s.settings.theme)

  // Apply theme class on mount and when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0F1117]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-60 flex flex-col min-h-screen">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <QuickAdd />
    </div>
  )
}
