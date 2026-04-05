import { generateId } from '../lib/id'
import { useState, useRef } from 'react'
import { Trash2, Plus, Sun, Moon, RotateCcw, Download, Upload, AlertTriangle } from 'lucide-react'
import { useStore } from '../store'
import type { Category } from '../store/types'
import Modal from '../components/ui/Modal'
import { exportToExcel, exportToXML } from '../lib/exporters'

const ICON_OPTIONS = [
  'Zap', 'Droplets', 'Wifi', 'Car', 'ShoppingCart', 'Play', 'Utensils', 'Heart',
  'Home', 'Plane', 'User', 'Phone', 'Fuel', 'Building2', 'Tag', 'Star',
  'Coffee', 'Music', 'Book', 'Dumbbell',
]

const COLOR_OPTIONS = [
  '#F59E0B', '#3B82F6', '#6366F1', '#64748B', '#10B981', '#8B5CF6',
  '#EC4899', '#EF4444', '#F97316', '#06B6D4', '#A78BFA', '#84CC16',
  '#FBBF24', '#14B8A6', '#6B3FA0', '#22C55E',
]

export default function Settings() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetToDefaults = useStore((s) => s.resetToDefaults)
  const importData = useStore((s) => s.importData)
  const store = useStore()

  const [user1, setUser1] = useState(settings.user1Name)
  const [user2, setUser2] = useState(settings.user2Name)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('Tag')
  const [newCatColor, setNewCatColor] = useState('#6B3FA0')
  const [newCard, setNewCard] = useState('')
  const [newTransferCat, setNewTransferCat] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showStatus(type: 'success' | 'error', message: string) {
    setActionStatus({ type, message })
    setTimeout(() => setActionStatus(null), 3000)
  }
  const [editCat, setEditCat] = useState<Category | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function saveNames() {
    updateSettings({ user1Name: user1, user2Name: user2 })
  }

  function addCategory() {
    if (!newCatName.trim()) return
    const cat: Category = {
      id: generateId(),
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
    }
    updateSettings({ expenseCategories: [...settings.expenseCategories, cat] })
    setNewCatName('')
  }

  function deleteCategory(id: string) {
    updateSettings({ expenseCategories: settings.expenseCategories.filter((c) => c.id !== id) })
  }

  function saveEditCat() {
    if (!editCat) return
    updateSettings({
      expenseCategories: settings.expenseCategories.map((c) => (c.id === editCat.id ? editCat : c)),
    })
    setEditCat(null)
  }

  function addCard() {
    if (!newCard.trim()) return
    updateSettings({ creditCards: [...settings.creditCards, newCard.trim()] })
    setNewCard('')
  }

  function deleteCard(card: string) {
    updateSettings({ creditCards: settings.creditCards.filter((c) => c !== card) })
  }

  function addTransferCat() {
    if (!newTransferCat.trim()) return
    updateSettings({ transferCategories: [...settings.transferCategories, newTransferCat.trim()] })
    setNewTransferCat('')
  }

  function deleteTransferCat(cat: string) {
    updateSettings({ transferCategories: settings.transferCategories.filter((c) => c !== cat) })
  }

  function getExportData() {
    return {
      expenses: store.expenses,
      paychecks: store.paychecks,
      manualTaxes: store.manualTaxes,
      transfers: store.transfers,
      debtPayments: store.debtPayments,
      portfolios: store.portfolios,
      investmentMovements: store.investmentMovements,
      settlements: store.settlements,
    }
  }

  function exportData() {
    const data = { settings: store.settings, ...getExportData() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-app-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showStatus('success', 'JSON exported successfully')
  }

  function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        importData(data)
        showStatus('success', 'Data imported successfully')
      } catch {
        showStatus('error', 'Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function clearData() {
    if (confirmClear) {
      importData({
        expenses: [],
        paychecks: [],
        manualTaxes: [],
        transfers: [],
        debtPayments: [],
        portfolios: [],
        investmentMovements: [],
        settlements: [],
      })
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
    }
  }

  const sectionClass = 'bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm overflow-hidden'
  const sectionHeader = 'px-5 py-4 border-b border-gray-100 dark:border-[#2D3448] bg-gray-50 dark:bg-gray-800/50'
  const inputClass = 'border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6B3FA0]'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* User Names */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">User Names</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User 1 Name</label>
              <input
                type="text"
                value={user1}
                onChange={(e) => setUser1(e.target.value)}
                onBlur={saveNames}
                className={`${inputClass} w-full`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User 2 Name</label>
              <input
                type="text"
                value={user2}
                onChange={(e) => setUser2(e.target.value)}
                onBlur={saveNames}
                className={`${inputClass} w-full`}
              />
            </div>
          </div>
          <button
            onClick={saveNames}
            className="bg-[#6B3FA0] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#5a3490] transition-colors"
          >
            Save Names
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Theme</h3>
        </div>
        <div className="p-5 flex gap-3">
          <button
            onClick={() => {
              updateSettings({ theme: 'light' })
              document.documentElement.classList.remove('dark')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              settings.theme === 'light'
                ? 'bg-[#6B3FA0] text-white border-[#6B3FA0]'
                : 'border-gray-200 dark:border-[#2D3448] text-gray-600 dark:text-gray-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
          <button
            onClick={() => {
              updateSettings({ theme: 'dark' })
              document.documentElement.classList.add('dark')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              settings.theme === 'dark'
                ? 'bg-[#6B3FA0] text-white border-[#6B3FA0]'
                : 'border-gray-200 dark:border-[#2D3448] text-gray-600 dark:text-gray-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
        </div>
      </div>

      {/* Expense Categories */}
      <div className={sectionClass}>
        <div className={`${sectionHeader} flex items-center justify-between`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Categories</h3>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#6B3FA0] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
        </div>
        <div className="p-5 space-y-3">
          {settings.expenseCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-sm text-gray-900 dark:text-white flex-1">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat.icon}</span>
              <button
                onClick={() => setEditCat({ ...cat })}
                className="p-1.5 text-gray-400 hover:text-[#6B3FA0] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="border-t border-gray-100 dark:border-[#2D3448] pt-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name"
                className={`${inputClass} flex-1`}
              />
              <select value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className={inputClass}>
                {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
              </select>
              <div className="flex items-center gap-1">
                {COLOR_OPTIONS.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={`w-5 h-5 rounded-full ${newCatColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={addCategory}
                className="p-2 bg-[#6B3FA0] text-white rounded-xl hover:bg-[#5a3490] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Cards */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Credit Cards</h3>
        </div>
        <div className="p-5 space-y-3">
          {settings.creditCards.map((card) => (
            <div key={card} className="flex items-center justify-between">
              <span className="text-sm text-gray-900 dark:text-white">{card}</span>
              <button
                onClick={() => deleteCard(card)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 border-t border-gray-100 dark:border-[#2D3448] pt-3">
            <input
              type="text"
              value={newCard}
              onChange={(e) => setNewCard(e.target.value)}
              placeholder="Card name"
              onKeyDown={(e) => e.key === 'Enter' && addCard()}
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={addCard}
              className="p-2 bg-[#6B3FA0] text-white rounded-xl hover:bg-[#5a3490] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Categories */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transfer Categories</h3>
        </div>
        <div className="p-5 space-y-3">
          {settings.transferCategories.map((cat) => (
            <div key={cat} className="flex items-center justify-between">
              <span className="text-sm text-gray-900 dark:text-white">{cat}</span>
              <button
                onClick={() => deleteTransferCat(cat)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 border-t border-gray-100 dark:border-[#2D3448] pt-3">
            <input
              type="text"
              value={newTransferCat}
              onChange={(e) => setNewTransferCat(e.target.value)}
              placeholder="Category name"
              onKeyDown={(e) => e.key === 'Enter' && addTransferCat()}
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={addTransferCat}
              className="p-2 bg-[#6B3FA0] text-white rounded-xl hover:bg-[#5a3490] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Data Management</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportData}
              className="flex items-center gap-2 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => { exportToExcel(getExportData()); showStatus('success', 'Excel exported successfully') }}
              className="flex items-center gap-2 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={() => { exportToXML(getExportData()); showStatus('success', 'XML exported successfully') }}
              className="flex items-center gap-2 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export XML
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={importFile}
              className="hidden"
            />
            {actionStatus && (
              <span className={`flex items-center gap-1.5 text-sm font-medium ${actionStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {actionStatus.type === 'success' ? '✓' : '✕'} {actionStatus.message}
              </span>
            )}
            <button
              onClick={clearData}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                confirmClear
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {confirmClear ? 'Click again to confirm' : 'Clear All Data'}
            </button>
            {confirmClear && (
              <button
                onClick={() => setConfirmClear(false)}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Category">
        {editCat && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={editCat.name}
                onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                className={`${inputClass} w-full`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
              <select
                value={editCat.icon}
                onChange={(e) => setEditCat({ ...editCat, icon: e.target.value })}
                className={`${inputClass} w-full`}
              >
                {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditCat({ ...editCat, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${editCat.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditCat(null)}
                className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium">
                Cancel
              </button>
              <button onClick={saveEditCat}
                className="flex-1 bg-[#6B3FA0] text-white rounded-full px-4 py-2.5 text-sm font-medium">
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
