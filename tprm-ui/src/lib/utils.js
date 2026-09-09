import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function fmt(n, digits = 2) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(digits)
}

export function fmtCurrency(n) {
  if (!n) return '—'
  return '$' + Number(n).toLocaleString()
}

export function scoreColor(n) {
  if (n == null) return 'text-gray-400'
  if (n >= 4.5) return 'text-green-600'
  if (n >= 4.0) return 'text-green-500'
  if (n >= 3.5) return 'text-blue-600'
  if (n >= 3.0) return 'text-orange-500'
  return 'text-red-600'
}

export function scoreBg(n) {
  if (n == null) return 'bg-gray-100'
  if (n >= 4.5) return 'bg-green-50'
  if (n >= 4.0) return 'bg-green-50'
  if (n >= 3.5) return 'bg-blue-50'
  if (n >= 3.0) return 'bg-orange-50'
  return 'bg-red-50'
}

export const RISK_COLORS = {
  'Very High': { text: 'text-red-700',    bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700 border-red-200' },
  'High':      { text: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Moderate':  { text: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'Low':       { text: 'text-green-600',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700 border-green-200' },
  'Very Low':  { text: 'text-green-500',  bg: 'bg-green-50',  badge: 'bg-green-50 text-green-600 border-green-100' },
}
