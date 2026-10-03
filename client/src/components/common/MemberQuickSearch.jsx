import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import memberService from '@/service/memberService'
import { Search, User, Loader2, X, Phone } from 'lucide-react'

export const MemberQuickSearch = ({ placeholder = 'Search member by name, phone or code (Ctrl+K)...' }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await memberService.lookupMembers(query.trim())
        setResults(data)
        setOpen(true)
      } catch (err) {
        console.error('Member lookup error:', err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (member) => {
    setOpen(false)
    setQuery('')
    navigate(`/staff/members/${member.id}`)
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 pl-9 pr-9 py-1.5 rounded-lg border border-transparent focus:border-[#1B4D2E] focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setOpen(false)
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> Searching members...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No matching members found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelect(m)}
                className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#1B4D2E]/10 text-[#1B4D2E] flex items-center justify-center font-bold text-xs shrink-0">
                    {m.fullName?.charAt(0) || 'M'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{m.fullName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-600">{m.memberCode}</span>
                      {m.phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" /> {m.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {m.membership && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0 uppercase">
                    {m.membership.planName || m.membership.planCode || 'Member'}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default MemberQuickSearch
