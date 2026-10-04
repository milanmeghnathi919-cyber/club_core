import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Card = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] overflow-hidden transition-all duration-200',
          hover && 'hover:shadow-[0_12px_28px_-8px_rgba(27,77,46,0.12)] hover:border-slate-300 hover:-translate-y-0.5',
          className,
        ),
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className, title, subtitle, action }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'px-6 py-4.5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/40',
          className,
        ),
      )}
    >
      <div>
        {title && <h3 className="font-bold text-slate-900 text-base leading-snug font-display tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export const CardContent = ({ children, className }) => {
  return <div className={twMerge(clsx('p-6 text-slate-700', className))}>{children}</div>
}

export const CardFooter = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between',
          className,
        ),
      )}
    >
      {children}
    </div>
  )
}

export default Card
