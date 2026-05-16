import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, X, AlertCircle, Loader2, CheckSquare, Square, Plus } from 'lucide-react'
import Modal from '../ui/Modal'
import { useStore } from '../../store'
import { generateId } from '../../lib/id'
import { today } from '../../lib/formatters'
import { extractTransactionsFromScreenshots } from '../../lib/localOcr'
import { inputClass, primaryBtn, secondaryBtn } from '../../lib/styles'
import type { Expense } from '../../store/types'

interface Props {
  open: boolean
  onClose: () => void
}

interface ImageFile {
  file: File
  base64: string
  mediaType: string
  preview: string
}

interface ReviewRow {
  key: string
  include: boolean
  date: string
  description: string
  amount: string
  category: string
  paidBy: 'user1' | 'user2'
  shared: boolean
  isDuplicate: boolean
}

type Step = 'upload' | 'loading' | 'review' | 'done'

export default function ScreenshotImportModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const categories = useStore((s) => s.settings.expenseCategories)
  const user1Name = useStore((s) => s.settings.user1Name)
  const user2Name = useStore((s) => s.settings.user2Name)
  const addExpense = useStore((s) => s.addExpense)
  const expenses = useStore((s) => s.expenses)

  const [step, setStep] = useState<Step>('upload')
  const [progressMsg, setProgressMsg] = useState('')
  const [images, setImages] = useState<ImageFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [addedCount, setAddedCount] = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)

  function markDuplicates(newRows: ReviewRow[]): ReviewRow[] {
    return newRows.map((row, i) => {
      const amt = parseFloat(row.amount)
      if (!row.date || isNaN(amt)) return { ...row, isDuplicate: false }
      const inStore = expenses.some((e) => e.date === row.date && Math.abs(e.amount - amt) < 0.01)
      const inBatch = newRows.some((other, j) => j !== i && other.date === row.date && Math.abs(parseFloat(other.amount) - amt) < 0.01)
      return { ...row, isDuplicate: inStore || inBatch }
    })
  }

  function reset() {
    setStep('upload')
    setImages([])
    setError(null)
    setRows([])
    setActiveImage(0)
    setAddedCount(0)
    setProgressMsg('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function resolveMediaType(file: File): string {
    if (file.type && file.type !== 'application/octet-stream') return file.type
    const ext = file.name.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp',
    }
    return map[ext ?? ''] ?? 'image/jpeg'
  }

  async function fileToImageFile(file: File): Promise<ImageFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        resolve({
          file,
          base64: dataUrl.split(',')[1],
          mediaType: resolveMediaType(file),
          preview: dataUrl,
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i))
    const loaded = await Promise.all(arr.map(fileToImageFile))
    setImages((prev) => [...prev, ...loaded])
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    await addFiles(e.dataTransfer.files)
  }, [])

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setActiveImage((a) => Math.max(0, a === index ? 0 : a > index ? a - 1 : a))
  }

  function updateRow(key: string, patch: Partial<ReviewRow>) {
    setRows((prev) => {
      const updated = prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
      if ('date' in patch || 'amount' in patch) return markDuplicates(updated)
      return updated
    })
  }

  function addEmptyRow() {
    const empty: ReviewRow = {
      key: generateId(),
      include: true,
      date: today(),
      description: '',
      amount: '',
      category: categories[0]?.id ?? '',
      paidBy: 'user1',
      shared: true,
      isDuplicate: false,
    }
    setRows((prev) => [...prev, empty])
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  function toggleAll(include: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, include })))
  }

  async function extract() {
    if (images.length === 0) {
      setError(t('screenshotImport.error.selectOne'))
      return
    }
    setError(null)
    setProgressMsg('')
    setStep('loading')
    try {
      const { transactions, debugLines: dbg } = await extractTransactionsFromScreenshots(
        images.map((img) => ({ base64: img.base64, mediaType: img.mediaType })),
        categories,
        setProgressMsg,
      )

      if (transactions.length === 0) {
        const preview = dbg.slice(0, 15).join(' | ')
        setError(t('screenshotImport.error.noTransactions', { preview }))
        setStep('upload')
        return
      }

      const newRows: ReviewRow[] = transactions.map((tx) => ({
        key: generateId(),
        include: true,
        date: tx.date || today(),
        description: tx.description,
        amount: String(tx.amount),
        category: tx.suggestedCategoryId && categories.find((c) => c.id === tx.suggestedCategoryId)
          ? tx.suggestedCategoryId
          : categories[0]?.id ?? '',
        paidBy: 'user1',
        shared: true,
        isDuplicate: false,
      }))

      setRows(markDuplicates(newRows))
      setActiveImage(0)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('screenshotImport.error.unknown'))
      setStep('upload')
    }
  }

  function handleAddSelected() {
    const selected = rows.filter((r) => r.include)
    for (const row of selected) {
      const expense: Expense = {
        id: generateId(),
        date: row.date,
        description: row.description,
        amount: parseFloat(row.amount) || 0,
        category: row.category,
        paidBy: row.paidBy,
        shared: row.shared,
      }
      addExpense(expense)
    }
    setAddedCount(selected.length)
    setStep('done')
  }

  const selectedCount = rows.filter((r) => r.include).length
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Modal open={open} onClose={handleClose} title={t('screenshotImport.title')} size={step === 'review' ? 'xl' : 'lg'}>
      {/* ── Upload ── */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-[12px] p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              dragging
                ? 'border-[#181d26] bg-[#f0f2f5]'
                : 'border-[#e8e8e8] hover:border-[#181d26] hover:bg-[#f8fafc]'
            }`}
          >
            <Camera className="w-8 h-8 text-[#41454d]" />
            <p className="text-[13px] text-[#41454d] text-center">
              <span className="font-medium text-[#181d26]">{t('screenshotImport.dropzone.clickToSelect')}</span>{t('screenshotImport.dropzone.dragText')}
            </p>
            <p className="text-[11px] text-[#41454d]">{t('screenshotImport.dropzone.hint')}</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-[9/16] bg-gray-100 dark:bg-gray-800">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="space-y-1">
              <p className="flex items-start gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleClose} className={`flex-1 ${secondaryBtn}`}>
              {t('common.cancel')}
            </button>
            <button onClick={extract} disabled={images.length === 0}
              className={`flex-1 ${primaryBtn} disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>
              <Upload className="w-4 h-4" />
              {t('screenshotImport.buttons.extract')}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 text-[#181d26] animate-spin" />
          <p className="text-[13px] text-[#41454d]">{progressMsg || t('screenshotImport.loading.starting')}</p>
          <p className="text-[11px] text-[#41454d]">{t('screenshotImport.loading.hint')}</p>
        </div>
      )}

      {/* ── Review ── */}
      {step === 'review' && (
        <div className="flex gap-4 h-[68vh]">
          {/* Left: screenshot — fixed, never scrolls */}
          <div className="w-2/5 flex flex-col gap-2 shrink-0 overflow-hidden">
            <div className="flex-1 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-start justify-center min-h-0">
              <img
                src={images[activeImage]?.preview}
                alt="screenshot"
                className="w-full h-full object-contain max-h-[55vh]"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-10 h-14 rounded-[6px] overflow-hidden border-2 transition-colors ${
                      activeImage === i ? 'border-[#181d26]' : 'border-transparent hover:border-[#e8e8e8]'
                    }`}
                  >
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: editable transaction list — only the list inner div scrolls */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#181d26]">
                {rows.length === 1
                  ? t('screenshotImport.review.foundOne', { count: rows.length })
                  : t('screenshotImport.review.foundOther', { count: rows.length })}
              </span>
              <div className="flex gap-2 text-[11px] text-[#41454d]">
                <button onClick={() => toggleAll(true)} className="hover:text-[#181d26]">{t('screenshotImport.review.selectAll')}</button>
                <span>·</span>
                <button onClick={() => toggleAll(false)} className="hover:text-[#181d26]">{t('screenshotImport.review.none')}</button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {rows.map((row) => (
                <div
                  key={row.key}
                  className={`rounded-[8px] border p-3 space-y-2 transition-colors ${
                    row.include
                      ? 'border-[#181d26]/20 bg-[#f8fafc]'
                      : 'border-[#e8e8e8] opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateRow(row.key, { include: !row.include })} className="text-[#181d26] shrink-0">
                      {row.include ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-400" />}
                    </button>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.key, { date: e.target.value })}
                      className={inputClass}
                    />
                    <button onClick={() => removeRow(row.key)} className="text-gray-300 hover:text-red-400 shrink-0 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {row.isDuplicate && (
                    <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {t('screenshotImport.review.duplicateBanner')}
                    </p>
                  )}

                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(row.key, { description: e.target.value })}
                    placeholder={t('expenses.form.description')}
                    className={inputClass}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                      placeholder={t('expenses.form.amount')}
                      className={inputClass}
                    />
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(row.key, { category: e.target.value })}
                      className={inputClass}
                    >
                      {sortedCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={row.paidBy}
                      onChange={(e) => updateRow(row.key, { paidBy: e.target.value as 'user1' | 'user2' })}
                      className={`${inputClass} w-auto`}
                    >
                      <option value="user1">{user1Name}</option>
                      <option value="user2">{user2Name}</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-[13px] text-[#41454d] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.shared}
                        onChange={(e) => updateRow(row.key, { shared: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-[#e8e8e8] accent-[#181d26]"
                      />
                      {t('expenses.filters.shared')}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1 border-t border-[#e8e8e8]">
              <button onClick={addEmptyRow}
                className="flex items-center gap-1.5 border border-dashed border-[#e8e8e8] text-[#41454d] rounded-[8px] px-3 py-2 text-[13px] font-medium hover:border-[#181d26] hover:text-[#181d26] transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" />
                {t('screenshotImport.buttons.addRow')}
              </button>
              <button onClick={handleClose} className={secondaryBtn}>
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddSelected}
                disabled={selectedCount === 0}
                className={`flex-1 ${primaryBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {t('screenshotImport.buttons.addSelected', { count: selectedCount })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <div className="w-12 h-12 rounded-[12px] bg-[#eef8f4] flex items-center justify-center text-2xl text-[#2e7d65]">
            ✓
          </div>
          <div>
            <p className="font-medium text-[#181d26]">
              {addedCount === 0
                ? t('screenshotImport.done.noneAddedTitle')
                : addedCount === 1
                ? t('screenshotImport.done.addedOne', { count: addedCount })
                : t('screenshotImport.done.addedOther', { count: addedCount })}
            </p>
            <p className="text-[13px] text-[#41454d] mt-1">
              {addedCount > 0 ? t('screenshotImport.done.addedBody') : t('screenshotImport.done.noneSelectedBody')}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={reset} className={`flex-1 ${secondaryBtn}`}>
              {t('screenshotImport.buttons.importMore')}
            </button>
            <button onClick={handleClose} className={`flex-1 ${primaryBtn}`}>
              {t('screenshotImport.buttons.done')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
