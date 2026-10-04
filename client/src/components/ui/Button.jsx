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
      'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl active:scale-[0.98] cursor-pointer'

    const sizeClasses = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-4.5 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5 font-bold',
    }

    const variantClasses = {
      lawn: 'bg-[#1B4D2E] hover:bg-[#143B23] text-white shadow-xs hover:shadow-md hover:shadow-[#1B4D2E]/20 focus:ring-[#1B4D2E] border border-[#143B23]/40',
      clay: 'bg-[#C85A32] hover:bg-[#B54D27] text-white shadow-xs hover:shadow-md hover:shadow-[#C85A32]/20 focus:ring-[#C85A32] border border-[#B54D27]/40',
      secondary: 'bg-slate-100 hover:bg-slate-200/90 text-slate-800 focus:ring-slate-400 border border-slate-200/80',
      outline: 'border border-slate-300/90 hover:bg-slate-50 text-slate-700 hover:text-slate-900 focus:ring-[#1B4D2E] hover:border-slate-400',
      ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus:ring-slate-300',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-md hover:shadow-rose-600/20 focus:ring-rose-500 border border-rose-700/30',
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
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : Icon ? (
          <Icon className={clsx('shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
