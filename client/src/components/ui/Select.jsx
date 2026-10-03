import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Select = React.forwardRef(
  (
    {
      label,
      error,
      options = [],
      children,
      className,
      containerClassName,
      id,
      placeholder = 'Select option...',
      ...props
    },
    ref,
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={twMerge('flex flex-col gap-1.5 text-left', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={twMerge(
            clsx(
              'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-[#1B4D2E] focus:ring-[#1B4D2E]/20',
              className,
            ),
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
      </div>
    )
  },
)

Select.displayName = 'Select'
export default Select
