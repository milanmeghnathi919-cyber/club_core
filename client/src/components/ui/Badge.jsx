import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getStatusBadgeColor } from '@/utils/format'

export const Badge = ({ children, status, variant, className }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200/80'

  if (status) {
    colorClass = getStatusBadgeColor(status)
  } else if (variant === 'clay') {
    colorClass = 'bg-[#C85A32]/10 text-[#C85A32] border-[#C85A32]/25 shadow-2xs'
  } else if (variant === 'lawn') {
    colorClass = 'bg-[#1B4D2E]/10 text-[#1B4D2E] border-[#1B4D2E]/25 shadow-2xs'
  } else if (variant === 'gold') {
    colorClass = 'bg-amber-100 text-amber-900 border-amber-300/80 shadow-2xs'
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wider uppercase select-none',
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
