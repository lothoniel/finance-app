import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff } from 'lucide-react'
import type { SidebarConfig, SidebarGroupConfig, SidebarItemConfig } from '../../store/types'
import Modal from '../ui/Modal'

// Mirrors DEFAULT_NAV_GROUPS from Sidebar.tsx — used to build initial config and for reset
export const DEFAULT_SIDEBAR_GROUPS: { label: string; items: { path: string }[] }[] = [
  {
    label: 'Overview',
    items: [
      { path: '/' },
      { path: '/net-worth' },
      { path: '/reports' },
    ],
  },
  {
    label: 'Money',
    items: [
      { path: '/expenses' },
      { path: '/budget' },
      { path: '/transactions' },
      { path: '/income' },
      { path: '/cash-flow' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { path: '/portfolio' },
      { path: '/debt' },
      { path: '/mortgage' },
      { path: '/shared-balance' },
    ],
  },
]

export function buildDefaultSidebarConfig(): SidebarConfig {
  return {
    showGroupLabels: true,
    groups: DEFAULT_SIDEBAR_GROUPS.map((g) => ({
      label: g.label,
      items: g.items.map((i) => ({ path: i.path, hidden: false })),
    })),
  }
}

// Labels for display in the customizer
const PATH_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/net-worth': 'Net Worth',
  '/reports': 'Reports',
  '/expenses': 'Expenses',
  '/budget': 'Budget',
  '/transactions': 'Transactions',
  '/income': 'Income',
  '/cash-flow': 'Cash Flow',
  '/portfolio': 'Investments',
  '/debt': 'Debt',
  '/mortgage': 'Mortgage',
  '/shared-balance': 'Shared Balance',
}

interface SortableItemProps {
  id: string
  item: SidebarItemConfig
  onToggleHidden: () => void
}

function SortableItem({ id, item, onToggleHidden }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-1.5 px-2 rounded-[6px] ${item.hidden ? 'opacity-40' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[#9297a0] hover:text-[#41454d] dark:hover:text-[#c4c8d0] cursor-grab active:cursor-grabbing p-0.5"
        tabIndex={-1}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="flex-1 text-[13px] text-[#333840] dark:text-[#c4c8d0]">
        {PATH_LABELS[item.path] ?? item.path}
      </span>
      <button
        onClick={onToggleHidden}
        className="p-1 rounded text-[#9297a0] hover:text-[#41454d] dark:hover:text-[#c4c8d0] transition-colors"
        title={item.hidden ? 'Show in sidebar' : 'Hide from sidebar'}
      >
        {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

interface SortableGroupProps {
  id: string
  group: SidebarGroupConfig
  onItemsChange: (items: SidebarItemConfig[]) => void
}

function SortableGroup({ id, group, onItemsChange }: SortableGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = group.items.findIndex((i) => i.path === active.id)
    const newIndex = group.items.findIndex((i) => i.path === over.id)
    onItemsChange(arrayMove(group.items, oldIndex, newIndex))
  }

  function toggleItem(path: string) {
    onItemsChange(group.items.map((i) => (i.path === path ? { ...i, hidden: !i.hidden } : i)))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-[#e8e8e8] dark:border-[#2d3347] rounded-[8px] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f8fafc] dark:bg-[#252b3b]">
        <button
          {...attributes}
          {...listeners}
          className="text-[#9297a0] hover:text-[#41454d] dark:hover:text-[#c4c8d0] cursor-grab active:cursor-grabbing p-0.5"
          tabIndex={-1}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#41454d]/60 dark:text-[#9297a0]/60">
          {group.label}
        </span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleItemDragEnd}
      >
        <SortableContext
          items={group.items.map((i) => i.path)}
          strategy={verticalListSortingStrategy}
        >
          <div className="px-2 py-1.5 space-y-0.5">
            {group.items.map((item) => (
              <SortableItem
                key={item.path}
                id={item.path}
                item={item}
                onToggleHidden={() => toggleItem(item.path)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  currentConfig: SidebarConfig | undefined
  onSave: (config: SidebarConfig) => void
}

export default function SidebarCustomizer({ open, onClose, currentConfig, onSave }: Props) {
  const [draft, setDraft] = useState<SidebarConfig>(() =>
    currentConfig ?? buildDefaultSidebarConfig(),
  )

  useEffect(() => {
    if (open) setDraft(currentConfig ?? buildDefaultSidebarConfig())
  }, [open, currentConfig])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = draft.groups.findIndex((g) => g.label === active.id)
    const newIndex = draft.groups.findIndex((g) => g.label === over.id)
    setDraft((d) => ({ ...d, groups: arrayMove(d.groups, oldIndex, newIndex) }))
  }

  function updateGroupItems(label: string, items: SidebarItemConfig[]) {
    setDraft((d) => ({
      ...d,
      groups: d.groups.map((g) => (g.label === label ? { ...g, items } : g)),
    }))
  }

  function handleSave() {
    onSave(draft)
    onClose()
  }

  function handleReset() {
    setDraft(buildDefaultSidebarConfig())
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize Sidebar"
    >
      <div className="space-y-4">
        {/* Group labels toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-[8px] border border-[#e8e8e8] dark:border-[#2d3347]">
          <span className="text-[13px] text-[#333840] dark:text-[#c4c8d0]">Show group labels</span>
          <button
            onClick={() => setDraft((d) => ({ ...d, showGroupLabels: !d.showGroupLabels }))}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              draft.showGroupLabels ? 'bg-[#181d26] dark:bg-[#e8eaf0]' : 'bg-[#d1d5db] dark:bg-[#3d4459]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#181d26] shadow transition-transform ${
                draft.showGroupLabels ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sortable groups */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleGroupDragEnd}
        >
          <SortableContext
            items={draft.groups.map((g) => g.label)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {draft.groups.map((group) => (
                <SortableGroup
                  key={group.label}
                  id={group.label}
                  group={group}
                  onItemsChange={(items) => updateGroupItems(group.label, items)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            className="text-[13px] text-[#9297a0] hover:text-[#41454d] dark:hover:text-[#c4c8d0] transition-colors"
          >
            Reset to default
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[13px] rounded-[6px] border border-[#e8e8e8] dark:border-[#2d3347] text-[#41454d] dark:text-[#9297a0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-[13px] rounded-[6px] bg-[#181d26] dark:bg-[#e8eaf0] text-white dark:text-[#181d26] hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
