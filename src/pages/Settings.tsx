import { generateId } from '../lib/id'
import { useState, useRef } from 'react'
import { Trash2, Plus, RotateCcw, Download, Upload, AlertTriangle, Pencil, Pause, Play } from 'lucide-react'
import { useStore } from '../store'
import type { Category, CreditCard, TransferCategory } from '../store/types'
import SectionTitle from '../components/ui/SectionTitle'
import Modal from '../components/ui/Modal'
import { exportToExcel, exportToXML } from '../lib/exporters'
import { renderIcon } from '../lib/iconRenderer'
import { formatMXN } from '../lib/formatters'
import IconPicker from '../components/ui/IconPicker'
import { inputClass } from '../lib/styles'

const COLOR_OPTIONS = [
  '#F59E0B', '#3B82F6', '#6366F1', '#64748B', '#10B981', '#8B5CF6',
  '#EC4899', '#EF4444', '#F97316', '#06B6D4', '#A78BFA', '#84CC16',
  '#FBBF24', '#14B8A6', '#181d26', '#22C55E',
]

export default function Settings() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetToDefaults = useStore((s) => s.resetToDefaults)
  const importData = useStore((s) => s.importData)
  const recurringExpenses = useStore((s) => s.recurringExpenses)
  const updateRecurringExpense = useStore((s) => s.updateRecurringExpense)
  const deleteRecurringExpense = useStore((s) => s.deleteRecurringExpense)
  const store = useStore()

  const [user1, setUser1] = useState(settings.user1Name)
  const [user2, setUser2] = useState(settings.user2Name)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('Tag')
  const [newCatColor, setNewCatColor] = useState('#181d26')
  const [newCard, setNewCard] = useState('')
  const [newCardIcon, setNewCardIcon] = useState('CreditCard')
  const [newCardColor, setNewCardColor] = useState('#181d26')
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

  const fileRef = useRef<HTMLInputElement>(null)

  function showStatus(type: 'success' | 'error', message: string) {
    setActionStatus({ type, message })
    setTimeout(() => setActionStatus(null), 3000)
  }

  function saveNames() {
    updateSettings({ user1Name: user1, user2Name: user2 })
  }

  function addCategory() {
    if (!newCatName.trim()) return
    const cat: Category = { id: generateId(), name: newCatName.trim(), icon: newCatIcon, color: newCatColor }
    updateSettings({ expenseCategories: [...settings.expenseCategories, cat] })
    setNewCatName('')
  }

  function deleteCategory(id: string) {
    updateSettings({ expenseCategories: settings.expenseCategories.filter((c) => c.id !== id) })
  }

  function saveEditCat() {
    if (!editCat) return
    updateSettings({ expenseCategories: settings.expenseCategories.map((c) => (c.id === editCat.id ? editCat : c)) })
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
      recurringExpenses: store.recurringExpenses,
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
        if (data.settings?.creditCards && Array.isArray(data.settings.creditCards)) {
          data.settings.creditCards = data.settings.creditCards.map((c: unknown) =>
            typeof c === 'string' ? { name: c, icon: 'CreditCard', color: '#181d26' } : { color: '#181d26', ...(c as object) }
          )
        }
        if (data.settings?.transferCategories && Array.isArray(data.settings.transferCategories)) {
          const iconMap: Record<string, string> = { Household: 'Home', Rental: 'Building2', Others: 'Tag' }
          const colorMap: Record<string, string> = { Household: '#6366F1', Rental: '#14B8A6', Others: '#64748B' }
          data.settings.transferCategories = data.settings.transferCategories.map((c: unknown) =>
            typeof c === 'string'
              ? { name: c, icon: iconMap[c] ?? 'Tag', color: colorMap[c] ?? '#181d26' }
              : { color: colorMap[(c as { name: string }).name] ?? '#181d26', ...(c as object) }
          )
        }
        const filenameMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/)
        let backupDate: string = filenameMatch ? filenameMatch[1] : (data.exportedAt ?? '')
        if (!backupDate) {
          const now = new Date()
          backupDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        }
        const currentStore = useStore.getState()
        if (!data.mortgageConfig) data.mortgageConfig = currentStore.mortgageConfig
        if (!data.mortgagePayments) data.mortgagePayments = currentStore.mortgagePayments
        if (!data.mortgageContributions) data.mortgageContributions = currentStore.mortgageContributions
        if (!data.recurringExpenses) data.recurringExpenses = currentStore.recurringExpenses
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
      importData({ expenses: [], paychecks: [], manualTaxes: [], transfers: [], debtPayments: [], portfolios: [], investmentMovements: [], settlements: [], recurringExpenses: [] })
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
    }
  }

  const card = 'bg-white dark:bg-[#1e2330] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[10px]'
  const cardHeader = 'px-5 py-4 border-b border-[#e8e8e8] dark:border-[#2d3347] flex items-center justify-between'
  const cardTitle = 'text-[14px] font-semibold text-[#181d26] dark:text-[#e8eaf0]'
  const iconBtn = 'p-1.5 rounded-[6px] text-[#41454d] dark:text-[#9297a0] transition-colors'
  const modalInput = inputClass
  const modalLabel = 'block text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] mb-1'
  const modalBtn = 'flex-1 rounded-[8px] px-4 py-2.5 text-[13px] font-medium transition-colors'

  return (
    <div>
      <div className="space-y-6 max-w-4xl">
        {/* User Names */}
        <div>
          <SectionTitle>User Names</SectionTitle>
          <div className={card}>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={modalLabel}>User 1</label>
                  <input type="text" value={user1} onChange={(e) => setUser1(e.target.value)} onBlur={saveNames} className={modalInput} />
                </div>
                <div>
                  <label className={modalLabel}>User 2</label>
                  <input type="text" value={user2} onChange={(e) => setUser2(e.target.value)} onBlur={saveNames} className={modalInput} />
                </div>
              </div>
              <button onClick={saveNames} className="bg-[#181d26] text-white rounded-[8px] px-4 py-2 text-[13px] font-medium hover:bg-[#0d1218] transition-colors">
                Save Names
              </button>
            </div>
          </div>
        </div>

        {/* Recurring Expenses */}
        <div>
          <SectionTitle>Recurring Expenses</SectionTitle>
          <div className={card}>
            {recurringExpenses.length === 0 ? (
              <p className="text-center py-8 text-[13px] text-[#41454d] dark:text-[#9297a0]">No recurring expenses set up yet</p>
            ) : (
              <div className="divide-y divide-[#e8e8e8] dark:divide-[#2d3347]">
                {[...recurringExpenses].sort((a, b) => a.name.localeCompare(b.name)).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#181d26] dark:text-[#e8eaf0] truncate">{r.name}</p>
                      <p className="text-[11px] text-[#9297a0] mt-0.5">{r.category} · {r.frequency}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#181d26] dark:text-[#e8eaf0] tabular-nums">{formatMXN(r.amount)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] ${r.status === 'active' ? 'bg-[#eef8f4] text-[#2e7d65]' : 'bg-[#fef3c7] text-[#c8912a]'}`}>
                      {r.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => updateRecurringExpense(r.id, { status: r.status === 'active' ? 'paused' : 'active' })}
                      title={r.status === 'active' ? 'Pause' : 'Resume'}
                      className={`${iconBtn} hover:text-[#181d26] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b]`}
                    >
                      {r.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteRecurringExpense(r.id)}
                      className={`${iconBtn} hover:text-[#c0392b] hover:bg-[#fdecea]`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Categories */}
        <div>
          <SectionTitle>Transaction Categories</SectionTitle>
          <div className={card}>
            <div className={cardHeader}>
              <span className={cardTitle}>Expense Categories</span>
              <button onClick={resetToDefaults} className="flex items-center gap-1.5 text-[12px] text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0] transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />Reset to Defaults
              </button>
            </div>
            <div className="p-5 space-y-2">
              {[...settings.expenseCategories].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 py-1">
                  <span className="w-7 h-7 rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}18` }}>
                    {renderIcon(cat.icon, 'w-3.5 h-3.5', cat.color)}
                  </span>
                  <span className="text-[13px] text-[#181d26] dark:text-[#e8eaf0] flex-1">{cat.name}</span>
                  {cat.categoryGroup && (
                    <span className="text-[11px] text-[#41454d] dark:text-[#9297a0] hidden sm:inline">{cat.categoryGroup}</span>
                  )}
                  <button onClick={() => setEditCat({ ...cat })} className={`${iconBtn} hover:text-[#181d26] dark:hover:text-[#e8eaf0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b]`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className={`${iconBtn} hover:text-[#c0392b] hover:bg-[#fdecea]`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="border-t border-[#e8e8e8] dark:border-[#2d3347] pt-3 mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category name"
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    className="flex-1 min-w-[120px] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] text-[#181d26] dark:text-[#e8eaf0] dark:bg-[#252b3b] focus:outline-none focus:border-[#181d26]" />
                  <IconPicker value={newCatIcon} onChange={setNewCatIcon} color={newCatColor} />
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button key={c} onClick={() => setNewCatColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newCatColor === c ? 'ring-2 ring-offset-1 ring-[#41454d]' : ''}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <button onClick={addCategory} className="p-2 bg-[#181d26] text-white rounded-[6px] hover:bg-[#0d1218] transition-colors flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Cards + Transfer Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {/* Credit Cards */}
          <div>
            <SectionTitle>Credit Cards</SectionTitle>
            <div className={card}>
              <div className="p-5 space-y-2">
                {[...settings.creditCards].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <div key={c.name} className="flex items-center gap-3 py-1">
                    <span className="w-7 h-7 rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c.color}18` }}>
                      {renderIcon(c.icon, 'w-3.5 h-3.5', c.color)}
                    </span>
                    <span className="text-[13px] text-[#181d26] dark:text-[#e8eaf0] flex-1">{c.name}</span>
                    <button onClick={() => { setEditCard({ ...c }); setEditCardOriginalName(c.name) }} className={`${iconBtn} hover:text-[#181d26] dark:hover:text-[#e8eaf0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b]`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteCard(c.name)} className={`${iconBtn} hover:text-[#c0392b] hover:bg-[#fdecea]`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="border-t border-[#e8e8e8] dark:border-[#2d3347] pt-3 mt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="text" value={newCard} onChange={(e) => setNewCard(e.target.value)} placeholder="Card name"
                      onKeyDown={(e) => e.key === 'Enter' && addCard()}
                      className="flex-1 min-w-[100px] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] text-[#181d26] dark:text-[#e8eaf0] dark:bg-[#252b3b] focus:outline-none focus:border-[#181d26]" />
                    <IconPicker value={newCardIcon} onChange={setNewCardIcon} color={newCardColor} />
                    <div className="flex flex-wrap gap-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button key={c} onClick={() => setNewCardColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newCardColor === c ? 'ring-2 ring-offset-1 ring-[#41454d]' : ''}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <button onClick={addCard} className="p-2 bg-[#181d26] text-white rounded-[6px] hover:bg-[#0d1218] transition-colors flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Categories */}
          <div>
            <SectionTitle>Transfer Categories</SectionTitle>
            <div className={card}>
              <div className="p-5 space-y-2">
                {[...settings.transferCategories].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <div key={c.name} className="flex items-center gap-3 py-1">
                    <span className="w-7 h-7 rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${c.color}18` }}>
                      {renderIcon(c.icon, 'w-3.5 h-3.5', c.color)}
                    </span>
                    <span className="text-[13px] text-[#181d26] dark:text-[#e8eaf0] flex-1">{c.name}</span>
                    <button onClick={() => { setEditTransferCat({ ...c }); setEditTransferCatOriginalName(c.name) }} className={`${iconBtn} hover:text-[#181d26] dark:hover:text-[#e8eaf0] hover:bg-[#f0f2f5] dark:hover:bg-[#252b3b]`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteTransferCat(c.name)} className={`${iconBtn} hover:text-[#c0392b] hover:bg-[#fdecea]`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="border-t border-[#e8e8e8] dark:border-[#2d3347] pt-3 mt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="text" value={newTransferCat} onChange={(e) => setNewTransferCat(e.target.value)} placeholder="Category name"
                      onKeyDown={(e) => e.key === 'Enter' && addTransferCat()}
                      className="flex-1 min-w-[100px] border border-[#e8e8e8] dark:border-[#2d3347] rounded-[6px] px-3 py-2 text-[13px] text-[#181d26] dark:text-[#e8eaf0] dark:bg-[#252b3b] focus:outline-none focus:border-[#181d26]" />
                    <IconPicker value={newTransferCatIcon} onChange={setNewTransferCatIcon} color={newTransferCatColor} />
                    <div className="flex flex-wrap gap-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button key={c} onClick={() => setNewTransferCatColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${newTransferCatColor === c ? 'ring-2 ring-offset-1 ring-[#41454d]' : ''}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <button onClick={addTransferCat} className="p-2 bg-[#181d26] text-white rounded-[6px] hover:bg-[#0d1218] transition-colors flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <SectionTitle>Data Management</SectionTitle>
          <div className={card}>
            <div className="p-5">
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Export JSON', icon: Download, action: exportData },
                  { label: 'Export Excel', icon: Download, action: () => exportToExcel(getExportData()).then(() => showStatus('success', 'Excel exported')) },
                  { label: 'Export XML', icon: Download, action: () => { exportToXML(getExportData()); showStatus('success', 'XML exported') } },
                  { label: 'Import JSON', icon: Upload, action: () => fileRef.current?.click() },
                ].map(({ label, icon: Icon, action }) => (
                  <button key={label} onClick={action}
                    className="flex items-center gap-2 border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] rounded-[8px] px-4 py-2 text-[13px] font-medium hover:bg-[#f8fafc] dark:hover:bg-[#252b3b] transition-colors">
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
                <input ref={fileRef} type="file" accept=".json" onChange={importFile} className="hidden" />

                {actionStatus && (
                  <span className={`flex items-center gap-1.5 text-[13px] font-medium ${actionStatus.type === 'success' ? 'text-[#1a7a3c]' : 'text-[#c0392b]'}`}>
                    {actionStatus.type === 'success' ? '✓' : '✕'} {actionStatus.message}
                  </span>
                )}

                <button onClick={clearData}
                  className={`flex items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors ${
                    confirmClear ? 'bg-[#c0392b] text-white hover:bg-[#a93226]' : 'border border-[#fdecea] text-[#c0392b] hover:bg-[#fdecea]'
                  }`}>
                  <AlertTriangle className="w-4 h-4" />
                  {confirmClear ? 'Click again to confirm' : 'Clear All Data'}
                </button>
                {confirmClear && (
                  <button onClick={() => setConfirmClear(false)} className="text-[13px] text-[#41454d] hover:text-[#181d26]">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title="Edit Category">
        {editCat && (
          <div className="space-y-4">
            <div><label className={modalLabel}>Name</label>
              <input type="text" value={editCat.name} onChange={(e) => setEditCat({ ...editCat, name: e.target.value })} className={modalInput} /></div>
            <div><label className={modalLabel}>Icon</label>
              <IconPicker value={editCat.icon} onChange={(icon) => setEditCat({ ...editCat, icon })} color={editCat.color} /></div>
            <div><label className={modalLabel}>Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setEditCat({ ...editCat, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${editCat.color === c ? 'ring-2 ring-offset-2 ring-[#41454d]' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div><label className={modalLabel}>Monthly Budget (optional)</label>
              <input type="number" min="0" step="1" value={editCat.budget ?? ''} placeholder="0"
                onChange={(e) => setEditCat({ ...editCat, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                className={modalInput} />
              {editCat.budget && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <RotateCcw className="w-3 h-3 text-[#9297a0]" />
                    <span className="text-[12px] text-[#41454d] dark:text-[#9297a0]">Roll over unspent budget</span>
                  </div>
                  <div className="flex bg-[#f0f2f5] dark:bg-[#252b3b] rounded-[8px] p-0.5 gap-0.5">
                    {([undefined, 'month', 'year'] as const).map((mode) => (
                      <button
                        key={mode ?? 'off'}
                        onClick={() => setEditCat({ ...editCat, rollover: mode })}
                        className={`flex-1 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                          editCat.rollover === mode
                            ? 'bg-white dark:bg-[#1e2330] text-[#181d26] dark:text-[#e8eaf0] shadow-sm'
                            : 'text-[#41454d] dark:text-[#9297a0] hover:text-[#181d26] dark:hover:text-[#e8eaf0]'
                        }`}
                      >
                        {mode === undefined ? 'Off' : mode === 'month' ? 'Month' : 'Year'}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-[#9297a0] mt-1">
                    {!editCat.rollover && 'Each month starts fresh'}
                    {editCat.rollover === 'month' && 'Unused budget from last month carries over'}
                    {editCat.rollover === 'year' && 'Unused budget from all months this year carries over'}
                  </div>
                </div>
              )}
            </div>
            <div><label className={modalLabel}>Category Group (optional)</label>
              <input type="text" value={editCat.categoryGroup ?? ''} placeholder="e.g. Housing, Auto, Food & Dining"
                onChange={(e) => setEditCat({ ...editCat, categoryGroup: e.target.value || undefined })}
                className={modalInput} /></div>
            <div><label className={modalLabel}>Expense Type</label>
              <div className="flex gap-2">
                {(['fixed', 'variable'] as const).map((t) => (
                  <button key={t} onClick={() => setEditCat({ ...editCat, expenseType: editCat.expenseType === t ? undefined : t })}
                    className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium capitalize border transition-colors ${
                      editCat.expenseType === t
                        ? 'bg-[#181d26] text-white border-[#181d26]'
                        : 'border-[#e8e8e8] dark:border-[#2d3347] text-[#41454d] dark:text-[#9297a0] hover:border-[#181d26] dark:hover:border-[#e8eaf0]'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditCat(null)} className={`${modalBtn} border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]`}>Cancel</button>
              <button onClick={saveEditCat} className={`${modalBtn} bg-[#181d26] text-white hover:bg-[#0d1218]`}>Save</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Credit Card Modal */}
      <Modal open={!!editCard} onClose={() => setEditCard(null)} title="Edit Credit Card">
        {editCard && (
          <div className="space-y-4">
            <div><label className={modalLabel}>Name</label>
              <input type="text" value={editCard.name} onChange={(e) => setEditCard({ ...editCard, name: e.target.value })} className={modalInput} /></div>
            <div><label className={modalLabel}>Icon</label>
              <IconPicker value={editCard.icon} onChange={(icon) => setEditCard({ ...editCard, icon })} color={editCard.color} /></div>
            <div><label className={modalLabel}>Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setEditCard({ ...editCard, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${editCard.color === c ? 'ring-2 ring-offset-2 ring-[#41454d]' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditCard(null)} className={`${modalBtn} border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]`}>Cancel</button>
              <button onClick={saveEditCard} className={`${modalBtn} bg-[#181d26] text-white hover:bg-[#0d1218]`}>Save</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Transfer Category Modal */}
      <Modal open={!!editTransferCat} onClose={() => setEditTransferCat(null)} title="Edit Transfer Category">
        {editTransferCat && (
          <div className="space-y-4">
            <div><label className={modalLabel}>Name</label>
              <input type="text" value={editTransferCat.name} onChange={(e) => setEditTransferCat({ ...editTransferCat, name: e.target.value })} className={modalInput} /></div>
            <div><label className={modalLabel}>Icon</label>
              <IconPicker value={editTransferCat.icon} onChange={(icon) => setEditTransferCat({ ...editTransferCat, icon })} color={editTransferCat.color} /></div>
            <div><label className={modalLabel}>Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setEditTransferCat({ ...editTransferCat, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${editTransferCat.color === c ? 'ring-2 ring-offset-2 ring-[#41454d]' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditTransferCat(null)} className={`${modalBtn} border border-[#e8e8e8] dark:border-[#2d3347] text-[#181d26] dark:text-[#e8eaf0] hover:bg-[#f8fafc] dark:hover:bg-[#252b3b]`}>Cancel</button>
              <button onClick={saveEditTransferCat} className={`${modalBtn} bg-[#181d26] text-white hover:bg-[#0d1218]`}>Save</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
