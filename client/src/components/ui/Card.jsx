import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Card = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-[#111418] rounded-2xl border border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200 text-white',
          hover && 'hover:shadow-[0_12px_28px_-8px_rgba(204,255,0,0.15)] hover:border-[#CCFF00]/40 hover:-translate-y-0.5',
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
          'px-6 py-4.5 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]',
          className,
        ),
      )}
    >
      <div>
        {title && <h3 className="font-bold text-white text-base leading-snug font-display tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export const CardContent = ({ children, className }) => {
  return <div className={twMerge(clsx('p-6 text-slate-300', className))}>{children}</div>
}

export const CardFooter = ({ children, className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'px-6 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between',
          className,
        ),
      )}
    >
      {children}
    </div>
  )
}

export default Card
