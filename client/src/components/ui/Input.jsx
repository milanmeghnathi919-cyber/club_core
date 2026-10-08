import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      className,
      containerClassName,
      id,
      type = 'text',
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={twMerge('flex flex-col gap-1.5 text-left', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={twMerge(
              clsx(
                'w-full rounded-xl border bg-[#12161D] px-3.5 py-2.5 text-sm text-white transition-all placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-inner',
                Icon ? 'pl-10' : 'pl-3.5',
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-white/15 focus:border-[#CCFF00] focus:ring-[#CCFF00]/25',
                className,
              ),
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-rose-400 font-semibold">{error}</span>}
        {!error && helperText && <span className="text-xs text-slate-400">{helperText}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
