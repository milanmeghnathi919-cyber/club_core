import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 5000),
    warning: (msg) => addToast(msg, 'warning', 4500),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast floating container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bg = 'bg-slate-900 text-white border-slate-800'
          let Icon = Info
          if (t.type === 'success') {
            bg = 'bg-[#1B4D2E] text-white border-emerald-800'
            Icon = CheckCircle2
          } else if (t.type === 'error') {
            bg = 'bg-rose-900 text-white border-rose-800'
            Icon = AlertCircle
          } else if (t.type === 'warning') {
            bg = 'bg-amber-800 text-white border-amber-700'
            Icon = AlertTriangle
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm font-medium transition-all transform translate-y-0 opacity-100 ${bg}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5 text-current opacity-90" />
              <div className="flex-1 text-xs sm:text-sm leading-snug">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-white/60 hover:text-white shrink-0 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      warning: (msg) => console.warn('Toast warning:', msg),
      info: (msg) => console.log('Toast info:', msg),
    }
  }
  return context
}

export default useToast
