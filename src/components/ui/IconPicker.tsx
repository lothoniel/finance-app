import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { renderIcon, ICON_OPTIONS } from '../../lib/iconRenderer'

interface Props {
  value: string
  onChange: (icon: string) => void
  color?: string
}

export default function IconPicker({ value, onChange, color }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 px-2 py-2 border border-gray-200 dark:border-[#2D3448] rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="w-5 h-5 flex items-center justify-center">
          {renderIcon(value, 'w-4 h-4', color)}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#2D3448] rounded-xl shadow-xl w-56 max-h-52 overflow-y-auto">
          <div className="grid grid-cols-7 gap-0.5">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                title={icon}
                onClick={() => { onChange(icon); setOpen(false) }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  value === icon
                    ? 'bg-[#7C3AED] text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {renderIcon(icon, 'w-3.5 h-3.5')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
