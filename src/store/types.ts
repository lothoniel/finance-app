export interface Category {
  id: string
  name: string
  icon: string // lucide icon name
  color: string
  budget?: number
}

export interface Expense {
  id: string
  date: string // YYYY-MM-DD
  description: string
  amount: number
  category: string
  paidBy: 'user1' | 'user2'
  shared: boolean
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
  type: 'DEPOSIT' | 'GAIN' | 'WITHDRAWAL'
  amount: number
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

export interface AppSettings {
  user1Name: string
  user2Name: string
  theme: 'light' | 'dark'
  expenseCategories: Category[]
  creditCards: CreditCard[]
  transferCategories: TransferCategory[]
}
