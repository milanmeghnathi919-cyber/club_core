import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'lawn', // lawn | clay | secondary | outline | ghost | danger
      size = 'md', // sm | md | lg
      loading = false,
      disabled = false,
      type = 'button',
      icon: Icon,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg'

    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5 font-semibold',
    }

    const variantClasses = {
      lawn: 'bg-[#1B4D2E] hover:bg-[#153E24] text-white shadow-sm focus:ring-[#1B4D2E]',
      clay: 'bg-[#C85A32] hover:bg-[#AF4924] text-white shadow-sm focus:ring-[#C85A32]',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400',
      outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400',
      ghost: 'hover:bg-slate-100 text-slate-700 focus:ring-slate-300',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : Icon ? (
          <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
