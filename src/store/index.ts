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
  MortgageConfig,
  MortgagePayment,
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
  mortgageConfig: MortgageConfig
  mortgagePayments: MortgagePayment[]
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
  updateMortgageConfig: (c: Partial<MortgageConfig>) => void
  addMortgagePayment: (p: MortgagePayment) => void
  updateMortgagePayment: (id: string, p: Partial<MortgagePayment>) => void
  deleteMortgagePayment: (id: string) => void
  importData: (data: Partial<AppState>) => void
  resetToDefaults: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...seedData,
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
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>
        const settings = (state.settings ?? {}) as Record<string, unknown>
        if (version < 2) {
          // Migrate creditCards from string[] to { name, icon, color }[]
          if (Array.isArray(settings.creditCards) && typeof settings.creditCards[0] === 'string') {
            settings.creditCards = (settings.creditCards as string[]).map((name) => ({ name, icon: 'CreditCard', color: '#6B3FA0' }))
          }
          // Migrate transferCategories from string[] to { name, icon, color }[]
          if (Array.isArray(settings.transferCategories) && typeof settings.transferCategories[0] === 'string') {
            const iconMap: Record<string, string> = { Household: 'Home', Rental: 'Building2', Others: 'Tag' }
            const colorMap: Record<string, string> = { Household: '#6366F1', Rental: '#14B8A6', Others: '#64748B' }
            settings.transferCategories = (settings.transferCategories as string[]).map((name) => ({
              name, icon: iconMap[name] ?? 'Tag', color: colorMap[name] ?? '#6B3FA0',
            }))
          }
        }
        if (version < 3) {
          // Add color field to existing { name, icon } objects missing color
          if (Array.isArray(settings.creditCards)) {
            settings.creditCards = (settings.creditCards as Record<string, string>[]).map((c) =>
              typeof c === 'string' ? { name: c, icon: 'CreditCard', color: '#6B3FA0' } : { color: '#6B3FA0', ...c }
            )
          }
          if (Array.isArray(settings.transferCategories)) {
            const colorMap: Record<string, string> = { Household: '#6366F1', Rental: '#14B8A6', Others: '#64748B' }
            settings.transferCategories = (settings.transferCategories as Record<string, string>[]).map((c) =>
              typeof c === 'string' ? { name: c, icon: 'Tag', color: '#6B3FA0' } : { color: colorMap[c.name] ?? '#6B3FA0', ...c }
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
        state.settings = settings
        return state
      },
    }
  )
)
