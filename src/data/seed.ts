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
} from '../store/types'

export const defaultSettings: AppSettings = {
  user1Name: 'Lothoniel',
  user2Name: 'Partner',
  theme: 'light',
  expenseCategories: [
    { id: 'luz', name: 'Luz', icon: 'Zap', color: '#F59E0B' },
    { id: 'agua', name: 'Agua', icon: 'Droplets', color: '#3B82F6' },
    { id: 'cable', name: 'Cable', icon: 'Wifi', color: '#6366F1' },
    { id: 'uber', name: 'Uber', icon: 'Car', color: '#64748B' },
    { id: 'mandado', name: 'Mandado', icon: 'ShoppingCart', color: '#10B981' },
    { id: 'subscriptions', name: 'Subscriptions', icon: 'Play', color: '#8B5CF6' },
    { id: 'salidas', name: 'Salidas', icon: 'Utensils', color: '#EC4899' },
    { id: 'medicos', name: 'Medicos', icon: 'Heart', color: '#EF4444' },
    { id: 'misc-casa', name: 'Misc Casa', icon: 'Home', color: '#F97316' },
    { id: 'viajes', name: 'Viajes', icon: 'Plane', color: '#06B6D4' },
    { id: 'personal', name: 'Personal', icon: 'User', color: '#A78BFA' },
    { id: 'celular', name: 'Celular', icon: 'Phone', color: '#84CC16' },
    { id: 'gasolina', name: 'Gasolina', icon: 'Fuel', color: '#FBBF24' },
    { id: '149a', name: '149A', icon: 'Building2', color: '#14B8A6' },
  ],
  creditCards: [
    'Banorte Platinum',
    'Banamex Costco',
    'Banamex Oro',
    'Banamex Roja',
    'Cash',
  ],
  transferCategories: ['Household', 'Rental', 'Others'],
}

export const seedExpenses: Expense[] = []

export const seedPaychecks: Paycheck[] = []

export const seedManualTaxes: ManualTax[] = []

export const seedTransfers: Transfer[] = []

export const seedDebtPayments: DebtPayment[] = []

export const seedPortfolios: Portfolio[] = []

export const seedInvestmentMovements: InvestmentMovement[] = []

export const seedSettlements: Settlement[] = []

export const seedData = {
  settings: defaultSettings,
  expenses: seedExpenses,
  paychecks: seedPaychecks,
  manualTaxes: seedManualTaxes,
  transfers: seedTransfers,
  debtPayments: seedDebtPayments,
  portfolios: seedPortfolios,
  investmentMovements: seedInvestmentMovements,
  settlements: seedSettlements,
}
