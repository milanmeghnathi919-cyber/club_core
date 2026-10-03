import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Card = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden',
          hover && 'hover:shadow-md hover:border-slate-300 transition-all duration-200',
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
          'px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4',
          className,
        ),
      )}
    >
      <div>
        {title && <h3 className="font-bold text-slate-900 text-base leading-snug">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export const CardContent = ({ children, className }) => {
  return <div className={twMerge(clsx('p-5 text-slate-700', className))}>{children}</div>
}

export const CardFooter = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between',
          className,
        ),
      )}
    >
      {children}
    </div>
  )
}

export default Card
