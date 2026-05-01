import type { ReactNode } from 'react'

interface SectionTitleProps {
  children: ReactNode
}

export default function SectionTitle({ children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0] whitespace-nowrap">{children}</span>
      <span className="flex-1 h-px bg-[#e8e8e8] dark:bg-[#2d3347]" />
    </div>
  )
}
