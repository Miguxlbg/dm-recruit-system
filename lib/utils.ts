import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function initials(name = '') { return name.split(' ').filter(Boolean).slice(0,2).map((part) => part[0]).join('').toUpperCase() || 'DM' }
export function formatDate(value?: string, locale = 'pt-BR') { if (!value) return '—'; return new Intl.DateTimeFormat(locale).format(new Date(`${value.slice(0,10)}T12:00:00`)) }
