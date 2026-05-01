import type { ReactNode } from 'react'

interface HeroBandProps {
  color: string
  /** Use true for light-bg bands (cream) — flips text and button styles */
  light?: boolean
  children: ReactNode
}

export default function HeroBand({ color, light = false, children }: HeroBandProps) {
  return (
    <div
      className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 relative px-8 md:px-10 pt-8 pb-10 mb-8"
      style={{ background: color, color: light ? '#181d26' : '#ffffff' }}
    >
      {children}
    </div>
  )
}
