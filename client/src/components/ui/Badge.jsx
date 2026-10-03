import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getStatusBadgeColor } from '@/utils/format'

export const Badge = ({ children, status, variant, className }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200'

  if (status) {
    colorClass = getStatusBadgeColor(status)
  } else if (variant === 'clay') {
    colorClass = 'bg-[#C85A32]/10 text-[#C85A32] border-[#C85A32]/20'
  } else if (variant === 'lawn') {
    colorClass = 'bg-[#1B4D2E]/10 text-[#1B4D2E] border-[#1B4D2E]/20'
  } else if (variant === 'gold') {
    colorClass = 'bg-amber-100 text-amber-800 border-amber-300'
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider',
          colorClass,
          className,
        ),
      )}
    >
      {children}
    </span>
  )
}

export default Badge
