import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedData, defaultSettings } from '../data/seed'
import type {
  AppSettings,
  Expense,
  Paycheck,
  ManualTax,
  Transfer,
  DebtPayment,
  Portfolio,
  InvestmentMovement,
  Settlement,
  CashEntry,
  MortgageConfig,
  MortgagePayment,
  MortgageContribution,
  RecurringExpense,
} from './types'

interface AppState {
  settings: AppSettings
  expenses: Expense[]
  paychecks: Paycheck[]
  manualTaxes: ManualTax[]
  transfers: Transfer[]
  debtPayments: DebtPayment[]
  portfolios: Portfolio[]
  investmentMovements: InvestmentMovement[]
  settlements: Settlement[]
  cashEntries: CashEntry[]
  mortgageConfig: MortgageConfig
  mortgagePayments: MortgagePayment[]
  mortgageContributions: MortgageContribution[]
  recurringExpenses: RecurringExpense[]
  importedBackupDate: string | null
  // Actions
  updateSettings: (s: Partial<AppSettings>) => void
  addExpense: (e: Expense) => void
  updateExpense: (id: string, e: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addPaycheck: (p: Paycheck) => void
  updatePaycheck: (id: string, p: Partial<Paycheck>) => void
  deletePaycheck: (id: string) => void
  addManualTax: (t: ManualTax) => void
  deleteManualTax: (id: string) => void
  addTransfer: (t: Transfer) => void
  updateTransfer: (id: string, t: Partial<Transfer>) => void
  deleteTransfer: (id: string) => void
  addDebtPayment: (d: DebtPayment) => void
  updateDebtPayment: (id: string, d: Partial<DebtPayment>) => void
  deleteDebtPayment: (id: string) => void
  addPortfolio: (p: Portfolio) => void
  updatePortfolio: (id: string, p: Partial<Portfolio>) => void
  deletePortfolio: (id: string) => void
  addInvestmentMovement: (m: InvestmentMovement) => void
  updateInvestmentMovement: (id: string, m: Partial<InvestmentMovement>) => void
  deleteInvestmentMovement: (id: string) => void
  addSettlement: (s: Settlement) => void
  deleteSettlement: (id: string) => void
  addCashEntry: (c: CashEntry) => void
  deleteCashEntry: (id: string) => void
  updateMortgageConfig: (c: Partial<MortgageConfig>) => void
  addMortgagePayment: (p: MortgagePayment) => void
  updateMortgagePayment: (id: string, p: Partial<MortgagePayment>) => void
  deleteMortgagePayment: (id: string) => void
  addMortgageContribution: (c: MortgageContribution) => void
  updateMortgageContribution: (id: string, c: Partial<MortgageContribution>) => void
  deleteMortgageContribution: (id: string) => void
  addRecurringExpense: (r: RecurringExpense) => void
  updateRecurringExpense: (id: string, r: Partial<RecurringExpense>) => void
  deleteRecurringExpense: (id: string) => void
  updateSharedExpensesSplitRatio: (ratio: number, fromDate?: string) => void
  importData: (data: Partial<AppState>) => void
  resetToDefaults: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...seedData,
      cashEntries: [],
      mortgageContributions: [],
      recurringExpenses: [],
      importedBackupDate: null,

      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      addExpense: (e) =>
        set((state) => ({ expenses: [...state.expenses, e] })),

      updateExpense: (id, e) =>
        set((state) => ({
          expenses: state.expenses.map((x) => (x.id === id ? { ...x, ...e } : x)),
        })),

      deleteExpense: (id) =>
        set((state) => ({ expenses: state.expenses.filter((x) => x.id !== id) })),

      addPaycheck: (p) =>
        set((state) => ({ paychecks: [...state.paychecks, p] })),

      updatePaycheck: (id, p) =>
        set((state) => ({
          paychecks: state.paychecks.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),

      deletePaycheck: (id) =>
        set((state) => ({ paychecks: state.paychecks.filter((x) => x.id !== id) })),

      addManualTax: (t) =>
        set((state) => ({ manualTaxes: [...state.manualTaxes, t] })),

      deleteManualTax: (id) =>
        set((state) => ({ manualTaxes: state.manualTaxes.filter((x) => x.id !== id) })),

      addTransfer: (t) =>
        set((state) => ({ transfers: [...state.transfers, t] })),

      updateTransfer: (id, t) =>
        set((state) => ({
          transfers: state.transfers.map((x) => (x.id === id ? { ...x, ...t } : x)),
        })),

      deleteTransfer: (id) =>
        set((state) => ({ transfers: state.transfers.filter((x) => x.id !== id) })),

      addDebtPayment: (d) =>
        set((state) => ({ debtPayments: [...state.debtPayments, d] })),

      updateDebtPayment: (id, d) =>
        set((state) => ({
          debtPayments: state.debtPayments.map((x) => (x.id === id ? { ...x, ...d } : x)),
        })),

      deleteDebtPayment: (id) =>
        set((state) => ({ debtPayments: state.debtPayments.filter((x) => x.id !== id) })),

      addPortfolio: (p) =>
        set((state) => ({ portfolios: [...state.portfolios, p] })),

      updatePortfolio: (id, p) =>
        set((state) => ({
          portfolios: state.portfolios.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),

      deletePortfolio: (id) =>
        set((state) => ({ portfolios: state.portfolios.filter((x) => x.id !== id) })),

      addInvestmentMovement: (m) =>
        set((state) => ({ investmentMovements: [...state.investmentMovements, m] })),

      updateInvestmentMovement: (id, m) =>
        set((state) => ({
          investmentMovements: state.investmentMovements.map((x) => (x.id === id ? { ...x, ...m } : x)),
        })),

      deleteInvestmentMovement: (id) =>
        set((state) => ({
          investmentMovements: state.investmentMovements.filter((x) => x.id !== id),
        })),

      addSettlement: (s) =>
        set((state) => ({ settlements: [...state.settlements, s] })),

      deleteSettlement: (id) =>
        set((state) => ({ settlements: state.settlements.filter((s) => s.id !== id) })),

      addCashEntry: (c) =>
        set((state) => ({ cashEntries: [...state.cashEntries, c] })),

      deleteCashEntry: (id) =>
        set((state) => ({ cashEntries: state.cashEntries.filter((c) => c.id !== id) })),

      updateMortgageConfig: (c) =>
        set((state) => ({ mortgageConfig: { ...state.mortgageConfig, ...c } })),

      addMortgagePayment: (p) =>
        set((state) => ({ mortgagePayments: [...state.mortgagePayments, p] })),

      updateMortgagePayment: (id, p) =>
        set((state) => ({
          mortgagePayments: state.mortgagePayments.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),

      deleteMortgagePayment: (id) =>
        set((state) => ({ mortgagePayments: state.mortgagePayments.filter((x) => x.id !== id) })),

      addMortgageContribution: (c) =>
        set((state) => ({ mortgageContributions: [...state.mortgageContributions, c] })),

      updateMortgageContribution: (id, c) =>
        set((state) => ({
          mortgageContributions: state.mortgageContributions.map((x) => (x.id === id ? { ...x, ...c } : x)),
        })),

      deleteMortgageContribution: (id) =>
        set((state) => ({ mortgageContributions: state.mortgageContributions.filter((x) => x.id !== id) })),

      addRecurringExpense: (r) =>
        set((state) => ({ recurringExpenses: [...state.recurringExpenses, r] })),

      updateRecurringExpense: (id, r) =>
        set((state) => ({
          recurringExpenses: state.recurringExpenses.map((x) => (x.id === id ? { ...x, ...r } : x)),
        })),

      deleteRecurringExpense: (id) =>
        set((state) => ({ recurringExpenses: state.recurringExpenses.filter((x) => x.id !== id) })),

      updateSharedExpensesSplitRatio: (ratio, fromDate) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.shared && (!fromDate || e.date >= fromDate) ? { ...e, splitRatio: ratio } : e
          ),
        })),

      importData: (data) =>
        set((state) => ({
          ...state,
          ...data,
          importedBackupDate: (data as Record<string, unknown>).exportedAt as string ?? null,
        })),

      resetToDefaults: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            expenseCategories: defaultSettings.expenseCategories,
            creditCards: defaultSettings.creditCards,
            transferCategories: defaultSettings.transferCategories,
          },
        })),
    }),
    {
      name: 'finance-app-v1',
      version: 12,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>
        const settings = (state.settings ?? {}) as Record<string, unknown>
        if (version < 2) {
          // Migrate creditCards from string[] to { name, icon, color }[]
          if (Array.isArray(settings.creditCards) && typeof settings.creditCards[0] === 'string') {
            settings.creditCards = (settings.creditCards as string[]).map((name) => ({ name, icon: 'CreditCard', color: '#7C3AED' }))
          }
          // Migrate transferCategories from string[] to { name, icon, color }[]
          if (Array.isArray(settings.transferCategories) && typeof settings.transferCategories[0] === 'string') {
            const iconMap: Record<string, string> = { Household: 'Home', Rental: 'Building2', Others: 'Tag' }
            const colorMap: Record<string, string> = { Household: '#6366F1', Rental: '#14B8A6', Others: '#64748B' }
            settings.transferCategories = (settings.transferCategories as string[]).map((name) => ({
              name, icon: iconMap[name] ?? 'Tag', color: colorMap[name] ?? '#7C3AED',
            }))
          }
        }
        if (version < 3) {
          // Add color field to existing { name, icon } objects missing color
          if (Array.isArray(settings.creditCards)) {
            settings.creditCards = (settings.creditCards as Record<string, string>[]).map((c) =>
              typeof c === 'string' ? { name: c, icon: 'CreditCard', color: '#7C3AED' } : { color: '#7C3AED', ...c }
            )
          }
          if (Array.isArray(settings.transferCategories)) {
            const colorMap: Record<string, string> = { Household: '#6366F1', Rental: '#14B8A6', Others: '#64748B' }
            settings.transferCategories = (settings.transferCategories as Record<string, string>[]).map((c) =>
              typeof c === 'string' ? { name: c, icon: 'Tag', color: '#7C3AED' } : { color: colorMap[c.name] ?? '#7C3AED', ...c }
            )
          }
        }
        if (version < 4) {
          if (!state.mortgageConfig) {
            state.mortgageConfig = {
              principal: 2700000, interestRate: 9.51, termMonths: 240,
              startDate: '2025-05-19', minimumPayment: 26500,
            }
          }
          if (!state.mortgagePayments) {
            state.mortgagePayments = []
          }
        }
        if (version < 5) {
          if (!state.cashEntries) {
            state.cashEntries = []
          }
        }
        if (version < 6) {
          if (!state.mortgageContributions) {
            state.mortgageContributions = []
          }
        }
        if (version < 9) {
          state.mortgageContributions = [
            { id: 'mc-001', date: '2025-05-01', by: 'Jorge', description: 'Carta promesa', amount: 150000 },
            { id: 'mc-002', date: '2025-05-01', by: 'Caro',  description: 'Boleta Aviso', amount: 1419 },
            { id: 'mc-003', date: '2025-05-15', by: 'Jorge', description: 'Enganche', amount: 80205.10 },
            { id: 'mc-004', date: '2025-05-15', by: 'Caro',  description: 'Enganche', amount: 230205.10 },
            { id: 'mc-005', date: '2025-05-24', by: 'Jorge', description: 'Mensualidad May 25', amount: 16000 },
            { id: 'mc-006', date: '2025-05-24', by: 'Caro',  description: 'Mensualidad May 25', amount: 16000 },
            { id: 'mc-007', date: '2025-06-04', by: 'Jorge', description: 'Anticipo Herrero', amount: 3350 },
            { id: 'mc-008', date: '2025-06-04', by: 'Caro',  description: 'Anticipo Herrero', amount: 3350 },
            { id: 'mc-009', date: '2025-06-30', by: 'Jorge', description: 'Mensualidad Junio 25', amount: 16000 },
            { id: 'mc-010', date: '2025-06-30', by: 'Caro',  description: 'Mensualidad Junio 25', amount: 16000 },
            { id: 'mc-011', date: '2025-07-30', by: 'Jorge', description: 'Mensualidad Julio 25', amount: 16000 },
            { id: 'mc-012', date: '2025-07-30', by: 'Caro',  description: 'Mensualidad Julio 25', amount: 16000 },
            { id: 'mc-013', date: '2025-08-28', by: 'Jorge', description: 'Mensualidad Agosto 25', amount: 16000 },
            { id: 'mc-014', date: '2025-08-29', by: 'Caro',  description: 'Mensualidad Agosto 25', amount: 16000 },
            { id: 'mc-015', date: '2025-09-30', by: 'Jorge', description: 'Mensualidad Sep 25', amount: 16000 },
            { id: 'mc-016', date: '2025-09-30', by: 'Caro',  description: 'Mensualidad Sep 25', amount: 16000 },
            { id: 'mc-017', date: '2025-09-30', by: 'Papa',  description: 'Mensualidad Sep 25', amount: 12000 },
            { id: 'mc-018', date: '2025-10-30', by: 'Jorge', description: 'Mensualidad Oct 25', amount: 16000 },
            { id: 'mc-019', date: '2025-10-30', by: 'Caro',  description: 'Mensualidad Oct 25', amount: 16000 },
            { id: 'mc-020', date: '2025-10-30', by: 'Papa',  description: 'Mensualidad Oct 25', amount: 12300 },
            { id: 'mc-021', date: '2025-11-12', by: 'Papa',  description: 'Abono Nov 25', amount: 55834 },
            { id: 'mc-022', date: '2025-11-12', by: 'Caro',  description: 'Mensualidad Nov 25', amount: 16000 },
            { id: 'mc-023', date: '2025-12-01', by: 'Jorge', description: 'Mensualidad Nov 25', amount: 16000 },
            { id: 'mc-024', date: '2025-12-30', by: 'Caro',  description: 'Mensualidad Dic 25', amount: 16000 },
            { id: 'mc-025', date: '2025-12-30', by: 'Jorge', description: 'Mensualidad Dic 25', amount: 16000 },
            { id: 'mc-026', date: '2026-01-30', by: 'Caro',  description: 'Mensualidad Ene 26', amount: 16000 },
            { id: 'mc-027', date: '2026-01-30', by: 'Jorge', description: 'Mensualidad Ene 26', amount: 16000 },
            { id: 'mc-028', date: '2026-02-09', by: 'Renta', description: 'Abono a capital de la Renta Feb', amount: 16000 },
            { id: 'mc-029', date: '2026-02-28', by: 'Jorge', description: 'Mensualidad Feb 26', amount: 16000 },
            { id: 'mc-030', date: '2026-03-01', by: 'Caro',  description: 'Mensualidad Feb 26', amount: 16000 },
            { id: 'mc-031', date: '2026-03-01', by: 'Renta', description: 'Abono a capital de la Renta Mar', amount: 16000 },
            { id: 'mc-032', date: '2026-04-01', by: 'Jorge', description: 'Mensualidad Mar 26', amount: 16000 },
            { id: 'mc-033', date: '2026-04-01', by: 'Caro',  description: 'Mensualidad Mar 26', amount: 16000 },
            { id: 'mc-034', date: '2026-04-01', by: 'Renta', description: 'Abono a capital de la Renta Abr', amount: 16000 },
            { id: 'mc-035', date: '2026-04-01', by: 'Papa',  description: 'Abono Mar 26', amount: 10666 },
          ]
        }
        if (version < 10) {
          // Fix minimumPayment: was set to total Pago Manual (26500) which includes
          // Seguros BANORTE (~717.16) + Admin (299). Only the P+I portion should be stored
          // so that autoExtraCapital and monthsRemaining calculations are correct.
          // Correct P+I = 26192.69 - 717.16 - 299 = 25176.53 (240-month schedule at 9.51%)
          const mc = state.mortgageConfig as Record<string, unknown> | undefined
          if (mc) {
            mc.minimumPayment = 25176.53
            mc.startDate = '2025-04-04'
            mc.termMonths = 240
            mc.principal = 2700000
            mc.interestRate = 9.51
          }
        }
        if (version < 11) {
          if (!state.recurringExpenses) {
            state.recurringExpenses = []
          }
        }
        if (version < 12) {
          if (typeof settings.splitRatio !== 'number') {
            settings.splitRatio = 0.5
          }
          if (Array.isArray(state.expenses)) {
            state.expenses = (state.expenses as Record<string, unknown>[]).map((e) =>
              e.shared && e.splitRatio === undefined ? { ...e, splitRatio: 0.5 } : e
            )
          }
        }
        state.settings = settings
        return state
      },
    }
  )
)
