import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all z-10 my-8`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              {title && <h3 className="text-lg font-bold text-slate-900 leading-snug font-display tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-slate-700">{children}</div>

        {/* Optional Footer */}
        {footer && <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
