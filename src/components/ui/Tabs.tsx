import type { ReactNode } from 'react'

interface TabItem {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-[#f0f2f5] rounded-[8px] p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors ${
            active === tab.id
              ? 'bg-white text-[#181d26] shadow-sm'
              : 'text-[#41454d] hover:text-[#181d26]'
          }`}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
