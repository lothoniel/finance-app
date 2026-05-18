export interface Category {
  id: string
  name: string
  icon: string // lucide icon name
  color: string
  budget?: number
  rollover?: 'month' | 'year'
  categoryGroup?: string // e.g. 'Housing', 'Auto', 'Food & Dining'
  expenseType?: 'fixed' | 'variable'
}

export interface Expense {
  id: string
  date: string // YYYY-MM-DD
  description: string
  amount: number
  category: string
  paidBy: 'user1' | 'user2'
  shared: boolean
  splitRatio?: number // user1's proportion (0–1); undefined falls back to settings default
  subCategory?: string
}

export interface Paycheck {
  id: string
  date: string
  usdAmount: number | null
  exchangeRate: number | null
  mxnAmount: number
  grossAmount?: number
}

export interface ManualTax {
  id: string
  date: string
  description: string
  amount: number
}

export interface Transfer {
  id: string
  date: string
  category: string // 'Household' | 'Rental' | 'Others' or custom
  description: string
  amount: number
}

export interface DebtPayment {
  id: string
  date: string
  card: string
  description: string
  amount: number
}

export interface Portfolio {
  id: string
  name: string
  type: string
  apy: number
  balance: number
  updatedDate: string
  renewsDate: string
}

export interface InvestmentMovement {
  id: string
  date: string
  portfolioId: string
  description: string
  type: 'DEPOSIT' | 'GAIN' | 'WITHDRAWAL' | 'TRANSFER'
  amount: number
  destinationPortfolioId?: string
}

export interface Settlement {
  id: string
  date: string
  amount: number
  paidBy: 'user1' | 'user2'
  description: string
}

export interface CashEntry {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  paidBy: 'user1' | 'user2' // who gave the cash
  note: string
}

export interface CreditCard {
  name: string
  icon: string
  color: string
}

export interface TransferCategory {
  name: string
  icon: string
  color: string
  budget?: number // monthly amount; falls back to 6-month average when undefined
}

export interface MortgageConfig {
  principal: number
  interestRate: number  // annual %
  termMonths: number
  startDate: string     // YYYY-MM-DD
  minimumPayment: number
}

export interface MortgagePayment {
  id: string
  date: string          // YYYY-MM-DD
  totalPaid: number
  extraCapital: number
  balanceAfter: number
  note?: string
}

export interface MortgageContribution {
  id: string
  date: string        // YYYY-MM-DD
  by: string          // free-text name, e.g. "Jorge", "Caro", "Papa"
  description: string
  amount: number
}

export interface RecurringExpense {
  id: string
  name: string
  amount: number
  category: string
  frequency: 'monthly' | 'bimonthly' | 'annual'
  lastDate: string // YYYY-MM-DD — next date is calculated from this
  status: 'active' | 'paused'
}

export interface SidebarItemConfig {
  path: string
  hidden: boolean
}

export interface SidebarGroupConfig {
  label: string
  items: SidebarItemConfig[]
}

export interface SidebarConfig {
  groups: SidebarGroupConfig[]
  showGroupLabels: boolean
}

export type Language = 'en' | 'es'
export type CurrencyDisplay = 'MXN' | 'USD'

export interface AppSettings {
  user1Name: string
  user2Name: string
  theme: 'light' | 'dark'
  expenseCategories: Category[]
  creditCards: CreditCard[]
  transferCategories: TransferCategory[]
  anthropicApiKey?: string
  splitRatio: number // user1's proportion of shared expenses (0–1, default 0.5)
  sidebarConfig?: SidebarConfig
  language: Language
  currencyDisplay: CurrencyDisplay
  paycheckMonthlyBudget?: number // monthly target; falls back to 6-month average when undefined
  showHelpTooltips?: boolean // when undefined or true, help tooltips render; false hides them globally
}
