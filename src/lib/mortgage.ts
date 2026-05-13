import { sortByDateAsc } from './filters'
import type { MortgageConfig, MortgagePayment } from '../store/types'

/** Months remaining given current balance, annual rate, and monthly payment */
export function monthsRemaining(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): number {
  const r = annualRate / 100 / 12
  if (monthlyPayment <= balance * r) return Infinity // payment doesn't cover interest
  return -Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r)
}

/** Total interest paid over n months starting from balance */
export function totalInterestRemaining(
  balance: number,
  annualRate: number,
  months: number
): number {
  const r = annualRate / 100 / 12
  const payment = (balance * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  return payment * months - balance
}

/** Monthly payment for a given principal, rate, and term */
export function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

export interface BalancePoint {
  label: string
  original: number
  actual: number | null
}

/**
 * Build two balance series starting from the mortgage startDate:
 *  - "original": pure amortization with no extra deposits
 *  - "actual": using real payment log (null for future months not yet paid)
 *
 * Returns one point per month from month 0 to the longer of original/actual payoff.
 */
export function buildBalanceSeries(
  config: MortgageConfig,
  payments: MortgagePayment[]
): BalancePoint[] {
  const { principal, interestRate, termMonths, startDate } = config
  const r = interestRate / 100 / 12
  const payment = calcMonthlyPayment(principal, interestRate, termMonths)

  // Sort payments by date
  const sorted = sortByDateAsc(payments)

  const start = new Date(startDate)
  const points: BalancePoint[] = []

  // Build original schedule
  let origBalance = principal
  const origSchedule: number[] = [origBalance]
  for (let i = 0; i < termMonths; i++) {
    const interest = origBalance * r
    const capitalPaid = Math.min(payment - interest, origBalance)
    origBalance = Math.max(0, origBalance - capitalPaid)
    origSchedule.push(origBalance)
    if (origBalance === 0) break
  }

  // Build actual series month by month
  // We track actual balance by replaying sorted payments
  // For each calendar month slot we either use the payment's balanceAfter or project forward
  const totalMonths = Math.max(origSchedule.length, termMonths)

  let actualBalance: number | null = principal
  let paymentIdx = 0

  for (let m = 0; m < totalMonths; m++) {
    const date = new Date(start.getFullYear(), start.getMonth() + m, 1)
    const label = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })

    const orig = origSchedule[m] ?? 0

    // Check if any payments fall in this month
    let usedPaymentBalance: number | null = null
    while (paymentIdx < sorted.length) {
      const p = sorted[paymentIdx]
      const pDate = new Date(p.date)
      if (
        pDate.getFullYear() === date.getFullYear() &&
        pDate.getMonth() === date.getMonth()
      ) {
        usedPaymentBalance = p.balanceAfter
        paymentIdx++
      } else if (p.date < date.toISOString().slice(0, 7) + '-32') {
        paymentIdx++
      } else {
        break
      }
    }

    if (usedPaymentBalance !== null) {
      actualBalance = usedPaymentBalance
    } else if (actualBalance !== null && m > 0) {
      // No payment this month — project forward with minimum payment
      const interest = actualBalance * r
      const capitalPaid = Math.min(payment - interest, actualBalance)
      actualBalance = Math.max(0, actualBalance - capitalPaid)
    }

    // Check if we've paid off on both tracks
    const actualPoint = actualBalance !== null && actualBalance > 0
      ? actualBalance
      : actualBalance === 0 ? 0 : null

    points.push({ label, original: orig, actual: actualPoint })

    if (orig === 0 && (actualBalance === null || actualBalance === 0)) break
  }

  return points
}
