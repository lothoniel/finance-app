import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { useStore } from '../../store'

interface Props {
  content: string
  className?: string
}

export default function InfoTooltip({ content, className }: Props) {
  const enabled = useStore((s) => s.settings.showHelpTooltips ?? true)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (wrapperRef.current && wrapperRef.current.contains(target)) return
      if (popoverRef.current && popoverRef.current.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Measure the wrapper + popover, place the popover so it stays within the viewport.
  useLayoutEffect(() => {
    if (!open) return
    function computePos() {
      const w = wrapperRef.current
      const p = popoverRef.current
      if (!w || !p) return
      const wRect = w.getBoundingClientRect()
      const pWidth = p.offsetWidth
      const margin = 8
      const viewportW = window.innerWidth
      const iconCenterX = wRect.left + wRect.width / 2
      let left = iconCenterX - pWidth / 2
      if (left + pWidth > viewportW - margin) left = viewportW - pWidth - margin
      if (left < margin) left = margin
      setPos({ top: wRect.bottom + 6, left })
    }
    computePos()
    window.addEventListener('resize', computePos)
    window.addEventListener('scroll', computePos, true)
    return () => {
      window.removeEventListener('resize', computePos)
      window.removeEventListener('scroll', computePos, true)
    }
  }, [open, content])

  if (!enabled) return null

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex items-center ${className ?? ''}`}
    >
      <button
        type="button"
        aria-label="More info"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center text-[#9297a0] hover:text-[#41454d] dark:hover:text-[#e8eaf0] transition-colors cursor-help align-middle"
      >
        <Info className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              maxWidth: 320,
              visibility: pos ? 'visible' : 'hidden',
              zIndex: 60,
            }}
            className="px-3 py-2 rounded-[8px] border border-[#e8e8e8] dark:border-[#2d3347] bg-white dark:bg-[#1e2330] shadow-lg text-[12px] font-normal leading-relaxed text-[#181d26] dark:text-[#e8eaf0] normal-case tracking-normal whitespace-normal text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  )
}
