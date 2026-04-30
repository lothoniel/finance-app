import { generateId } from '../lib/id'
import { useState, useRef } from 'react'
import { Trash2, Plus, Sun, Moon, RotateCcw, Download, Upload, AlertTriangle, Pencil } from 'lucide-react'
import { useStore } from '../store'
import type { Category, CreditCard, TransferCategory } from '../store/types'
import Modal from '../components/ui/Modal'
import { exportToExcel, exportToXML } from '../lib/exporters'
import { renderIcon } from '../lib/iconRenderer'
import IconPicker from '../components/ui/IconPicker'

const COLOR_OPTIONS = [
  '#F59E0B', '#3B82F6', '#6366F1', '#64748B', '#10B981', '#8B5CF6',
  '#EC4899', '#EF4444', '#F97316', '#06B6D4', '#A78BFA', '#84CC16',
  '#FBBF24', '#14B8A6', '#7C3AED', '#22C55E',
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
  const [newCatColor, setNewCatColor] = useState('#7C3AED')
  const [newCard, setNewCard] = useState('')
  const [newCardIcon, setNewCardIcon] = useState('CreditCard')
  const [newCardColor, setNewCardColor] = useState('#7C3AED')
  const [newTransferCat, setNewTransferCat] = useState('')
  const [newTransferCatIcon, setNewTransferCatIcon] = useState('Tag')
  const [newTransferCatColor, setNewTransferCatColor] = useState('#6366F1')
  const [confirmClear, setConfirmClear] = useState(false)
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [editCard, setEditCard] = useState<CreditCard | null>(null)
  const [editCardOriginalName, setEditCardOriginalName] = useState<string>('')
  const [editTransferCat, setEditTransferCat] = useState<TransferCategory | null>(null)
  const [editTransferCatOriginalName, setEditTransferCatOriginalName] = useState<string>('')

  function showStatus(type: 'success' | 'error', message: string) {
    setActionStatus({ type, message })
    setTimeout(() => setActionStatus(null), 3000)
  }
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
    updateSettings({ creditCards: [...settings.creditCards, { name: newCard.trim(), icon: newCardIcon, color: newCardColor }] })
    setNewCard('')
  }

  function deleteCard(name: string) {
    updateSettings({ creditCards: settings.creditCards.filter((c) => c.name !== name) })
  }

  function saveEditCard() {
    if (!editCard) return
    updateSettings({ creditCards: settings.creditCards.map((c) => c.name === editCardOriginalName ? editCard : c) })
    setEditCard(null)
  }

  function addTransferCat() {
    if (!newTransferCat.trim()) return
    updateSettings({ transferCategories: [...settings.transferCategories, { name: newTransferCat.trim(), icon: newTransferCatIcon, color: newTransferCatColor }] })
    setNewTransferCat('')
  }

  function deleteTransferCat(name: string) {
    updateSettings({ transferCategories: settings.transferCategories.filter((c) => c.name !== name) })
  }

  function saveEditTransferCat() {
    if (!editTransferCat) return
    updateSettings({ transferCategories: settings.transferCategories.map((c) => c.name === editTransferCatOriginalName ? editTransferCat : c) })
    setEditTransferCat(null)
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
      cashEntries: store.cashEntries,
      mortgageConfig: store.mortgageConfig,
      mortgagePayments: store.mortgagePayments,
      mortgageContributions: store.mortgageContributions,
      settings: store.settings,
    }
  }

  function exportData() {
    const now = new Date()
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const data = { exportedAt: localDate, ...getExportData() }
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
        // Normalize creditCards: string[] → { name, icon, color }[]
        if (data.settings?.creditCards && Array.isArray(data.settings.creditCards)) {
          data.settings.creditCards = data.settings.creditCards.map((c: unknown) =>
            typeof c === 'string' ? { name: c, icon: 'CreditCard', color: '#7C3AED' } : { color: '#7C3AED', ...(c as object) }
          )
        }
        // Normalize transferCategories: string[] → { name, icon, color }[]
        if (data.settings?.transferCategories && Array.isArray(data.settings.transferCategories)) {
          const iconMap: Record<string, string> = { Household: 'Home', Rental: 'Building2', Others: 'Tag' }
          const colorMap: Record<string, string> = { Household: '#6366F1', Rental: '#14B8A6', Others: '#64748B' }
          data.settings.transferCategories = data.settings.transferCategories.map((c: unknown) =>
            typeof c === 'string'
              ? { name: c, icon: iconMap[c] ?? 'Tag', color: colorMap[c] ?? '#7C3AED' }
              : { color: colorMap[(c as { name: string }).name] ?? '#7C3AED', ...(c as object) }
          )
        }
        const filenameMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/)
        let backupDate: string = filenameMatch ? filenameMatch[1] : (data.exportedAt ?? '')
        if (!backupDate) {
          const now = new Date()
          backupDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        }
        // If the backup predates mortgage support, preserve current mortgage data
        const currentStore = useStore.getState()
        if (!data.mortgageConfig) data.mortgageConfig = currentStore.mortgageConfig
        if (!data.mortgagePayments) data.mortgagePayments = currentStore.mortgagePayments
        if (!data.mortgageContributions) data.mortgageContributions = currentStore.mortgageContributions
        localStorage.setItem('finance-app-backup-date', backupDate)
        window.dispatchEvent(new Event('financeAppBackupImported'))
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

  const sectionClass = 'bg-white dark:bg-[#1A1F2E] rounded-2xl border border-gray-200 dark:border-[#2D3448] shadow-sm'
  const sectionHeader = 'px-5 py-4 border-b border-gray-100 dark:border-[#2D3448] bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl'
  const inputClass = 'border border-gray-200 dark:border-[#2D3448] rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* User Names + Theme side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
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
            className="bg-[#7C3AED] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#6d28d9] transition-colors"
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
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
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
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                : 'border-gray-200 dark:border-[#2D3448] text-gray-600 dark:text-gray-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
        </div>
      </div>
      </div>{/* end grid: User Names + Theme */}

      {/* Expense Categories */}
      <div className={sectionClass}>
        <div className={`${sectionHeader} flex items-center justify-between`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Categories</h3>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#7C3AED] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
        </div>
        <div className="p-5 space-y-3">
          {[...settings.expenseCategories].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                {renderIcon(cat.icon, 'w-4 h-4', cat.color)}
              </span>
              <span className="text-sm text-gray-900 dark:text-white flex-1">{cat.name}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={cat.budget ?? ''}
                placeholder="Budget"
                onChange={(e) => {
                  const budget = e.target.value ? parseFloat(e.target.value) : undefined
                  updateSettings({ expenseCategories: settings.expenseCategories.map((c) => c.id === cat.id ? { ...c, budget } : c) })
                }}
                className="w-24 border border-gray-200 dark:border-[#2D3448] rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
              <button
                onClick={() => setEditCat({ ...cat })}
                className="p-1.5 text-gray-400 hover:text-[#7C3AED] transition-colors"
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

          <div className="border-t border-gray-100 dark:border-[#2D3448] pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name"
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                className={`${inputClass} flex-1 min-w-[120px]`}
              />
              <IconPicker value={newCatIcon} onChange={setNewCatIcon} color={newCatColor} />
              <div className="flex flex-wrap gap-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newCatColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={addCategory}
                className="p-2 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6d28d9] transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Cards + Transfer Categories side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
      {/* Credit Cards */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Credit Cards</h3>
        </div>
        <div className="p-5 space-y-3">
          {[...settings.creditCards].sort((a, b) => a.name.localeCompare(b.name)).map((card) => (
            <div key={card.name} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${card.color}20` }}>
                {renderIcon(card.icon, 'w-4 h-4', card.color)}
              </span>
              <span className="text-sm text-gray-900 dark:text-white flex-1">{card.name}</span>
              <button
                onClick={() => { setEditCard({ ...card }); setEditCardOriginalName(card.name) }}
                className="p-1.5 text-gray-400 hover:text-[#7C3AED] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteCard(card.name)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="border-t border-gray-100 dark:border-[#2D3448] pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={newCard}
                onChange={(e) => setNewCard(e.target.value)}
                placeholder="Card name"
                onKeyDown={(e) => e.key === 'Enter' && addCard()}
                className={`${inputClass} flex-1 min-w-[120px]`}
              />
              <IconPicker value={newCardIcon} onChange={setNewCardIcon} color={newCardColor} />
              <div className="flex flex-wrap gap-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewCardColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newCardColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={addCard}
                className="p-2 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6d28d9] transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Categories */}
      <div className={sectionClass}>
        <div className={sectionHeader}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transfer Categories</h3>
        </div>
        <div className="p-5 space-y-3">
          {[...settings.transferCategories].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                {renderIcon(cat.icon, 'w-4 h-4', cat.color)}
              </span>
              <span className="text-sm text-gray-900 dark:text-white flex-1">{cat.name}</span>
              <button
                onClick={() => { setEditTransferCat({ ...cat }); setEditTransferCatOriginalName(cat.name) }}
                className="p-1.5 text-gray-400 hover:text-[#7C3AED] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteTransferCat(cat.name)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="border-t border-gray-100 dark:border-[#2D3448] pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={newTransferCat}
                onChange={(e) => setNewTransferCat(e.target.value)}
                placeholder="Category name"
                onKeyDown={(e) => e.key === 'Enter' && addTransferCat()}
                className={`${inputClass} flex-1 min-w-[120px]`}
              />
              <IconPicker value={newTransferCatIcon} onChange={setNewTransferCatIcon} color={newTransferCatColor} />
              <div className="flex flex-wrap gap-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTransferCatColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newTransferCatColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={addTransferCat}
                className="p-2 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6d28d9] transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>{/* end grid: Credit Cards + Transfer Categories */}

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
              onClick={() => exportToExcel(getExportData()).then(() => showStatus('success', 'Excel exported successfully'))}
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
              <IconPicker value={editCat.icon} onChange={(icon) => setEditCat({ ...editCat, icon })} color={editCat.color} />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Budget (optional)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={editCat.budget ?? ''}
                onChange={(e) => setEditCat({ ...editCat, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0"
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditCat(null)}
                className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium">
                Cancel
              </button>
              <button onClick={saveEditCat}
                className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium">
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Credit Card Modal */}
      <Modal open={!!editCard} onClose={() => setEditCard(null)} title="Edit Credit Card">
        {editCard && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={editCard.name}
                onChange={(e) => setEditCard({ ...editCard, name: e.target.value })}
                className={`${inputClass} w-full`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
              <IconPicker value={editCard.icon} onChange={(icon) => setEditCard({ ...editCard, icon })} color={editCard.color} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditCard({ ...editCard, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${editCard.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditCard(null)}
                className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium">
                Cancel
              </button>
              <button onClick={saveEditCard}
                className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium">
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Transfer Category Modal */}
      <Modal open={!!editTransferCat} onClose={() => setEditTransferCat(null)} title="Edit Transfer Category">
        {editTransferCat && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={editTransferCat.name}
                onChange={(e) => setEditTransferCat({ ...editTransferCat, name: e.target.value })}
                className={`${inputClass} w-full`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
              <IconPicker value={editTransferCat.icon} onChange={(icon) => setEditTransferCat({ ...editTransferCat, icon })} color={editTransferCat.color} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditTransferCat({ ...editTransferCat, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${editTransferCat.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditTransferCat(null)}
                className="flex-1 border border-gray-200 dark:border-[#2D3448] text-gray-700 dark:text-gray-300 rounded-full px-4 py-2.5 text-sm font-medium">
                Cancel
              </button>
              <button onClick={saveEditTransferCat}
                className="flex-1 bg-[#7C3AED] text-white rounded-full px-4 py-2.5 text-sm font-medium">
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
