import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CurrencyDisplay } from '../store/types'

type DateLocale = 'en' | 'es'
const dateLocale = (locale?: DateLocale) => (locale === 'es' ? { locale: es } : undefined)

export function formatMoney(amount: number, currency: CurrencyDisplay): string {
  return currency === 'USD' ? formatUSD(amount) : formatMXN(amount)
}

export function formatMoneyCompact(amount: number, currency: CurrencyDisplay): string {
  // MXN and USD share the same compact representation ($ + k/M suffix).
  // currency is accepted for API symmetry with formatMoney and future divergence.
  void currency
  return formatMXNCompact(amount)
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatMXNCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`
  }
  return `$${amount.toFixed(0)}`
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string, locale?: DateLocale): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy', dateLocale(locale))
  } catch {
    return dateStr
  }
}

export function formatMonthYear(dateStr: string, locale?: DateLocale): string {
  try {
    return format(parseISO(dateStr), 'MMMM yyyy', dateLocale(locale))
  } catch {
    return dateStr
  }
}

export function formatShortMonth(dateStr: string, locale?: DateLocale): string {
  try {
    return format(parseISO(dateStr), 'MMM yy', dateLocale(locale))
  } catch {
    return dateStr
  }
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
