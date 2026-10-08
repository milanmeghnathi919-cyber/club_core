import React from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { ArrowLeft, Zap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090B0E] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full rounded-3xl bg-[#111418] border border-white/10 p-8 sm:p-10 shadow-2xl text-center space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center mx-auto shadow-xl">
          <Zap className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-5xl font-black text-[#CCFF00] tracking-tight block">404</span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Court Not Found</h1>
          <p className="text-xs text-slate-400">
            The requested page or resource doesn&apos;t exist or has been relocated within the club facilities.
          </p>
        </div>

        <Link to="/" className="block">
          <Button variant="volt" size="md" icon={ArrowLeft} className="w-full font-black uppercase text-xs">
            Return to Clubhouse
          </Button>
        </Link>
      </div>
    </div>
  )
}