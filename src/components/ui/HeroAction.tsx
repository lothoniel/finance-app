import type { ReactNode } from 'react'

interface HeroActionProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'primary' | 'ghost-dark'
}

export default function HeroAction({ children, onClick, variant = 'ghost' }: HeroActionProps) {
  const styles = {
    ghost: {
      background: 'rgba(255,255,255,0.15)',
      color: '#ffffff',
      border: '1px solid rgba(255,255,255,0.30)',
    },
    primary: {
      background: '#ffffff',
      color: '#181d26',
      border: '1px solid transparent',
    },
    'ghost-dark': {
      background: 'rgba(0,0,0,0.07)',
      color: '#181d26',
      border: '1px solid rgba(0,0,0,0.12)',
    },
  }

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-opacity hover:opacity-80"
      style={styles[variant]}
    >
      {children}
    </button>
  )
}
