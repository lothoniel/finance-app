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
  deleteInvestmentMovement: (id: string) => void
  addSettlement: (s: Settlement) => void
  importData: (data: Partial<AppState>) => void
  resetToDefaults: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...seedData,

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

      deleteInvestmentMovement: (id) =>
        set((state) => ({
          investmentMovements: state.investmentMovements.filter((x) => x.id !== id),
        })),

      addSettlement: (s) =>
        set((state) => ({ settlements: [...state.settlements, s] })),

      importData: (data) =>
        set((state) => ({ ...state, ...data })),

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
    }
  )
)
