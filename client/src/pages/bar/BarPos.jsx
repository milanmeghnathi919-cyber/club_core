import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import barService from '@/service/barService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import {
  Wine,
  Utensils,
  Printer,
  Coffee,
  Clock,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const BarPos = () => {
  const toast = useToast()

  const [tables, setTables] = useState([])
  const [menu, setMenu] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeTab, setActiveTab] = useState(null)
  const [, setLoading] = useState(true)

  // Menu Category Filter
  const [selectedCategory, setSelectedCategory] = useState('')

  // New Tab Modal
  const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false)
  const [newTabGuestName, setNewTabGuestName] = useState('')
  const [, setNewTabAttachedMember] = useState(null)

  // Item Add Notes Modal
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [itemNotes, setItemNotes] = useState('')
  const [itemQty, setItemQty] = useState(1)

  // Settle Modal
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false)
  const [settleMethod, setSettleMethod] = useState('upi')
  const [settling, setSettling] = useState(false)

  const fetchTablesAndMenu = useCallback(async () => {
    try {
      const [tbls, mnu] = await Promise.all([barService.getTables(), barService.getMenu()])
      setTables(tbls || [])
      setMenu(mnu || [])
    } catch {
      toast.error('Failed to load bar tables')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTablesAndMenu()
  }, [fetchTablesAndMenu])

  const loadActiveTab = async (tabId) => {
    try {
      const tab = await barService.getTabById(tabId)
      setActiveTab(tab)
    } catch {
      toast.error('Failed to load active tab')
    }
  }

  const handleTableClick = (table) => {
    setSelectedTable(table)
    const tabId = table.current_tab_id || table.currentTabId
    if (table.status === 'occupied' && tabId) {
      loadActiveTab(tabId)
    } else {
      setActiveTab(null)
      setNewTabGuestName('')
      setNewTabAttachedMember(null)
      setIsOpenTabModalOpen(true)
    }
  }

  const handleOpenTab = async (e) => {
    e.preventDefault()
    if (!selectedTable) return

    try {
      const res = await barService.openTab({
        tableId: selectedTable.id,
        guestName: newTabGuestName || undefined,
      })
      toast.success(`Tab opened on ${selectedTable.label}!`)
      setIsOpenTabModalOpen(false)
      loadActiveTab(res.id)
      fetchTablesAndMenu()
    } catch (err) {
      toast.error(err.message || 'Failed to open tab')
    }
  }

  const handleAddItemToTab = async () => {
    if (!activeTab || !selectedMenuItem) return

    try {
      await barService.addItemToTab(activeTab.id, {
        menuItemId: selectedMenuItem.id,
        qty: itemQty,
        notes: itemNotes.trim() || undefined,
      })
      toast.success(`Added ${selectedMenuItem.name} to table bill!`)
      setSelectedMenuItem(null)
      loadActiveTab(activeTab.id)
    } catch (err) {
      toast.error(err.message || 'Failed to add item')
    }
  }

  const handleSettleTab = async () => {
    if (!activeTab) return
    setSettling(true)
    try {
      await barService.settleTab(activeTab.id, {
        paymentMethod: settleMethod,
      })
      toast.success(`Table ${selectedTable?.label} settled via ${settleMethod.toUpperCase()}!`)
      setIsSettleModalOpen(false)
      setActiveTab(null)
      setSelectedTable(null)
      fetchTablesAndMenu()
    } catch (err) {
      toast.error(err.message || 'Failed to settle tab')
    } finally {
      setSettling(false)
    }
  }

  const handlePrintBarReceipt = () => {
    if (!activeTab) return
    try {
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text('Bar & Lounge Food Bill', 105, 24, { align: 'center' })
      doc.text(`Tab No: ${activeTab.tabNo || activeTab.tab_no || 'Tab'}`, 14, 34)
      doc.text(`Table: ${selectedTable?.label || 'Bar Table'}`, 14, 40)
      doc.text(`Guest/Member: ${activeTab.member?.fullName || activeTab.guestName || 'Walk-in'}`, 14, 46)

      const items = activeTab.items || []
      const rows = items.map((i) => [
        i.name_snapshot || i.name,
        i.qty,
        formatCurrency(i.unitPrice || i.unit_price),
        formatCurrency((i.unitPrice || i.unit_price) * i.qty),
      ])

      autoTable(doc, {
        startY: 52,
        head: [['Menu Item', 'Qty', 'Unit Price', 'Line Total']],
        body: rows,
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 52) + 10
      doc.text(`Subtotal: ${formatCurrency(activeTab.subtotal)}`, 140, finalY)
      if (activeTab.discount > 0) {
        doc.text(`Member Discount: -${formatCurrency(activeTab.discount)}`, 140, finalY + 6)
      }
      doc.text(`Tax: ${formatCurrency(activeTab.taxAmount || activeTab.tax_amount)}`, 140, finalY + 12)
      doc.setFontSize(12)
      doc.text(`TOTAL: ${formatCurrency(activeTab.total)}`, 140, finalY + 20)

      doc.save(`Bill-${activeTab.tabNo || activeTab.tab_no || 'Tab'}.pdf`)
      toast.success('Bar Bill PDF downloaded')
    } catch (err) {
      console.error('Bar bill PDF error:', err)
      toast.error('Failed to generate Bill PDF')
    }
  }

  const filteredMenu = menu.filter((m) => {
    return !selectedCategory || m.category === selectedCategory
  })

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black flex items-center gap-1.5 w-fit">
            <Coffee className="w-3.5 h-3.5 text-black" /> Artisan Café & Dining POS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">
            Club Café & Table POS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Touch-friendly table floorplan, live orders, barista and kitchen routing, and tender settlement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/staff/cafe/inventory">
            <Button variant="outline" size="sm" icon={Utensils} className="font-semibold">
              Café Inventory
            </Button>
          </Link>
          <Link to="/staff/bar/kitchen">
            <Button variant="volt" size="sm" icon={Coffee} className="font-bold">
              Kitchen & Barista KDS
            </Button>
          </Link>
          <Link to="/staff/bar/summary">
            <Button variant="outline" size="sm" icon={Clock}>
              Daily Register
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Table Map & Menu Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* 8-Table Floor Map */}
          <Card className="border-white/10 bg-[#111418]">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Lounge & Courtside Table Floorplan
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#CCFF00] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]" /> Free
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Occupied
                </span>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tables.map((t) => {
                  const isOccupied = t.status === 'occupied'
                  const isSelected = selectedTable?.id === t.id

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTableClick(t)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'ring-2 ring-[#CCFF00] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                          : 'border-white/10 hover:border-white/20'
                      } ${isOccupied ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30' : 'bg-[#0D1117] hover:bg-white/5'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-white">{t.label}</span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isOccupied ? 'bg-amber-400' : 'bg-[#CCFF00]'
                          }`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between items-end">
                        <span>{t.seats} Seats</span>
                        <span
                          className={`font-black capitalize text-[10px] px-2 py-0.5 rounded-full ${
                            isOccupied ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Menu Catalog Picker (Visible when a tab is active) */}
          {activeTab && (
            <Card className="border-white/10 bg-[#111418] animate-in fade-in">
              <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Add F&B Items to Table {selectedTable?.label}
                </span>

                <div className="flex items-center gap-1">
                  {['', 'food', 'drink', 'snack', 'dessert'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-black capitalize transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#CCFF00] text-black font-bold'
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat || 'All Items'}
                    </button>
                  ))}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredMenu.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMenuItem(m)
                        setItemQty(1)
                        setItemNotes('')
                      }}
                      className="p-3 rounded-xl border border-white/10 bg-[#0D1117] hover:border-[#CCFF00] hover:shadow-2xs text-left flex flex-col justify-between transition-all group"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {m.station}
                        </span>
                        <h4 className="font-bold text-xs text-white group-hover:text-[#CCFF00] line-clamp-1 mt-0.5">{m.name}</h4>
                      </div>
                      <span className="font-mono font-black text-xs text-[#CCFF00] mt-2 tabular-nums">
                        {formatCurrency(m.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Active Tab Receipt Sheet */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-[#111418]">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active Bill
                </span>
                <h3 className="font-bold text-white text-sm">
                  {selectedTable ? selectedTable.label : 'Select a Table'}
                </h3>
              </div>
              {activeTab && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#CCFF00] text-black font-black">
                  {activeTab.tabNo || activeTab.tab_no}
                </span>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              {!activeTab ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <Wine className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No active tab selected</p>
                  <p className="text-[11px] text-slate-400">Click any table to open or view tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Guest / Member Info */}
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Customer</span>
                      <strong className="text-white font-bold">
                        {activeTab.member?.fullName || activeTab.guestName || 'Guest Walk-in'}
                      </strong>
                    </div>
                    {activeTab.discountPct > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#CCFF00]/20 text-[#CCFF00] font-black text-[10px]">
                        {activeTab.discountPct}% Member Discount
                      </span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-white/5 max-h-56 overflow-y-auto pr-1 text-xs">
                    {(activeTab.items || []).map((i) => (
                      <div key={i.id} className="py-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            {i.name_snapshot || i.name} × {i.qty}
                          </span>
                          <span className="font-mono font-bold text-[#CCFF00] tabular-nums">
                            {formatCurrency((i.unitPrice || i.unit_price) * i.qty)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 italic">{i.notes || 'No notes'}</span>
                          <Badge status={i.kitchenStatus || i.kitchen_status}>
                            {i.kitchenStatus || i.kitchen_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bill Totals */}
                  <div className="pt-3 border-t border-white/10 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="tabular-nums font-mono font-medium text-white">
                        {formatCurrency(activeTab.subtotal)}
                      </span>
                    </div>
                    {activeTab.discount > 0 && (
                      <div className="flex justify-between text-[#CCFF00] font-bold">
                        <span>Member Discount ({activeTab.discountPct}%):</span>
                        <span className="tabular-nums font-mono">-{formatCurrency(activeTab.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Tax (GST):</span>
                      <span className="tabular-nums font-mono font-medium text-white">
                        {formatCurrency(activeTab.taxAmount || activeTab.tax_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10">
                      <span>Total Amount:</span>
                      <span className="text-[#CCFF00] font-mono tabular-nums font-black text-base">
                        {formatCurrency(activeTab.total)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      variant="volt"
                      size="md"
                      onClick={() => setIsSettleModalOpen(true)}
                      className="flex-1 font-black"
                    >
                      Settle Bill
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      icon={Printer}
                      onClick={handlePrintBarReceipt}
                      title="Print Food Bill"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Open New Tab Modal */}
      <Modal
        isOpen={isOpenTabModalOpen}
        onClose={() => setIsOpenTabModalOpen(false)}
        title="Open Table Tab"
        subtitle={`Assign tab for ${selectedTable?.label}`}
      >
        <form onSubmit={handleOpenTab} className="space-y-4 py-2 font-sans">
          <Input
            label="Guest Name"
            placeholder="e.g. Rahul Verma"
            value={newTabGuestName}
            onChange={(e) => setNewTabGuestName(e.target.value)}
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpenTabModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" className="font-bold">
              Open Tab on {selectedTable?.label}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Item Notes Modal */}
      <Modal
        isOpen={!!selectedMenuItem}
        onClose={() => setSelectedMenuItem(null)}
        title={`Add ${selectedMenuItem?.name}`}
        subtitle={`Unit Rate: ${formatCurrency(selectedMenuItem?.price || 0)}`}
      >
        <div className="space-y-4 py-2 font-sans">
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={itemQty}
            onChange={(e) => setItemQty(parseInt(e.target.value, 10) || 1)}
          />

          <Input
            label="Special Preparation Notes"
            placeholder="e.g. Less sugar, extra spicy, gluten free..."
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setSelectedMenuItem(null)}>
              Cancel
            </Button>
            <Button variant="volt" onClick={handleAddItemToTab} className="font-bold">
              Send to Station
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settle Tab Modal */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title="Settle Tab & Free Table"
        subtitle={`Table: ${selectedTable?.label} • Total Due: ${formatCurrency(activeTab?.total || 0)}`}
      >
        <div className="space-y-4 py-2 text-xs font-sans">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between text-base font-bold text-white">
              <span>Payable Bill:</span>
              <span className="text-[#CCFF00] font-mono font-black tabular-nums">{formatCurrency(activeTab?.total || 0)}</span>
            </div>
            <p className="text-slate-400">Includes all kitchen dishes, energy beverages and GST tax.</p>
          </div>

          <Select
            label="Tender Method *"
            value={settleMethod}
            onChange={(e) => setSettleMethod(e.target.value)}
          >
            <option value="upi">UPI / Instant QR Payment</option>
            <option value="card">Credit / Debit Card Terminal</option>
            <option value="cash">Cash Tender</option>
          </Select>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsSettleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" loading={settling} onClick={handleSettleTab} className="font-black">
              Confirm Settlement ({settleMethod.toUpperCase()})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default BarPos
