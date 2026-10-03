import React, { useEffect, useState, useCallback } from 'react'
import barService from '@/service/barService'
import memberService from '@/service/memberService'
import { formatCurrency, formatTime, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Wine,
  Utensils,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  User,
  Coffee,
  X,
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const BarPos = () => {
  const toast = useToast()

  const [tables, setTables] = useState([])
  const [menu, setMenu] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeTab, setActiveTab] = useState(null)
  const [loading, setLoading] = useState(true)

  // Menu Category Filter
  const [selectedCategory, setSelectedCategory] = useState('')

  // New Tab Modal
  const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false)
  const [newTabGuestName, setNewTabGuestName] = useState('')
  const [newTabMemberQuery, setNewTabMemberQuery] = useState('')
  const [newTabMatchedMembers, setNewTabMatchedMembers] = useState([])
  const [newTabAttachedMember, setNewTabAttachedMember] = useState(null)

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
    } catch (err) {
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
        memberId: newTabAttachedMember?.id || undefined,
        guestName: newTabGuestName.trim() || undefined,
      })
      toast.success(`Tab opened on ${selectedTable.label}`)
      setIsOpenTabModalOpen(false)
      fetchTablesAndMenu()
      setActiveTab(res)
    } catch (err) {
      toast.error(err.message || 'Failed to open tab')
    }
  }

  const handleAddItemToTab = async () => {
    if (!activeTab || !selectedMenuItem) return

    try {
      const res = await barService.addTabItems(activeTab.id, [
        {
          menuItemId: selectedMenuItem.id,
          qty: itemQty,
          notes: itemNotes.trim() || undefined,
        },
      ])
      toast.success(`Sent ${selectedMenuItem.name} to kitchen/bar station`)
      setSelectedMenuItem(null)
      setItemNotes('')
      setItemQty(1)
      setActiveTab(res)
    } catch (err) {
      toast.error(err.message || 'Failed to add item to tab')
    }
  }

  const handleSettleTab = async () => {
    if (!activeTab) return
    setSettling(true)

    try {
      await barService.settleTab(activeTab.id, [
        {
          method: settleMethod,
          amount: activeTab.total,
        },
      ])
      toast.success(`Tab settled (${settleMethod.toUpperCase()})! Table freed.`)
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
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Bar & Lounge Food Bill', 105, 24, { align: 'center' })
    doc.text(`Tab No: ${activeTab.tabNo || activeTab.tab_no}`, 14, 34)
    doc.text(`Table: ${selectedTable?.label || 'Bar Table'}`, 14, 40)
    doc.text(`Guest/Member: ${activeTab.member?.fullName || activeTab.guestName || 'Walk-in'}`, 14, 46)

    const items = activeTab.items || []
    const rows = items.map((i) => [
      i.name_snapshot || i.name,
      i.qty,
      formatCurrency(i.unitPrice || i.unit_price),
      formatCurrency((i.unitPrice || i.unit_price) * i.qty),
    ])

    doc.autoTable({
      startY: 52,
      head: [['Menu Item', 'Qty', 'Unit Price', 'Line Total']],
      body: rows,
      theme: 'grid',
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Subtotal: ${formatCurrency(activeTab.subtotal)}`, 140, finalY)
    if (activeTab.discount > 0) {
      doc.text(`Member Discount: -${formatCurrency(activeTab.discount)}`, 140, finalY + 6)
    }
    doc.text(`Tax: ${formatCurrency(activeTab.taxAmount || activeTab.tax_amount)}`, 140, finalY + 12)
    doc.setFontSize(12)
    doc.text(`TOTAL: ${formatCurrency(activeTab.total)}`, 140, finalY + 20)

    doc.save(`Bill-${activeTab.tabNo || 'Tab'}.pdf`)
  }

  const filteredMenu = menu.filter((m) => {
    return !selectedCategory || m.category === selectedCategory
  })

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E] flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5" /> Artisan Café & Dining
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Club Café & Table POS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Touch-friendly café table map, live orders, barista and kitchen routing, and tender settlement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/staff/cafe/inventory">
            <Button variant="outline" size="sm" icon={Utensils} className="font-semibold">
              Café Inventory
            </Button>
          </Link>
          <Link to="/staff/bar/kitchen">
            <Button variant="lawn" size="sm" icon={Coffee} className="font-bold">
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
          <Card className="border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lounge & Courtside Table Floorplan
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Occupied
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
                          ? 'ring-2 ring-[#1B4D2E] border-[#1B4D2E] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${isOccupied ? 'bg-amber-50/70 border-amber-300' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{t.label}</span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isOccupied ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between items-end">
                        <span>{t.seats} Seats</span>
                        <span
                          className={`font-bold capitalize text-[10px] px-2 py-0.5 rounded-full ${
                            isOccupied ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-100 text-emerald-800'
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
            <Card className="border-slate-200 animate-in fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Add F&B Items to Table {selectedTable?.label}
                </span>

                <div className="flex items-center gap-1">
                  {['', 'food', 'drink', 'snack', 'dessert'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#1B4D2E] text-white font-bold'
                          : 'bg-white border text-slate-600 hover:bg-slate-50'
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
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:border-[#1B4D2E] hover:shadow-2xs text-left flex flex-col justify-between transition-all"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {m.station}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5">{m.name}</h4>
                      </div>
                      <span className="font-extrabold text-xs text-[#1B4D2E] mt-2 tabular-nums">
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
          <Card className="border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Active Bill
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedTable ? selectedTable.label : 'Select a Table'}
                </h3>
              </div>
              {activeTab && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {activeTab.tabNo || activeTab.tab_no}
                </span>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              {!activeTab ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Wine className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">No active tab selected</p>
                  <p className="text-[11px] text-slate-400">Click any table to open or view tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Guest / Member Info */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Customer</span>
                      <strong className="text-slate-900 font-bold">
                        {activeTab.member?.fullName || activeTab.guestName || 'Guest Walk-in'}
                      </strong>
                    </div>
                    {activeTab.discountPct > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {activeTab.discountPct}% Member Discount
                      </span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1 text-xs">
                    {(activeTab.items || []).map((i) => (
                      <div key={i.id} className="py-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {i.name_snapshot || i.name} × {i.qty}
                          </span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
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
                  <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="tabular-nums font-medium text-slate-900">
                        {formatCurrency(activeTab.subtotal)}
                      </span>
                    </div>
                    {activeTab.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Member Discount ({activeTab.discountPct}%):</span>
                        <span className="tabular-nums">-{formatCurrency(activeTab.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Tax (GST):</span>
                      <span className="tabular-nums font-medium text-slate-900">
                        {formatCurrency(activeTab.taxAmount || activeTab.tax_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span className="text-[#1B4D2E] tabular-nums">
                        {formatCurrency(activeTab.total)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      variant="lawn"
                      size="md"
                      onClick={() => setIsSettleModalOpen(true)}
                      className="flex-1 font-bold"
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
        <form onSubmit={handleOpenTab} className="space-y-4 py-2">
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
            <Button variant="lawn" type="submit" className="font-bold">
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
        <div className="space-y-4 py-2">
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
            <Button variant="lawn" onClick={handleAddItemToTab} className="font-bold">
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
        <div className="space-y-4 py-2 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>Payable Bill:</span>
              <span className="text-[#1B4D2E] tabular-nums">{formatCurrency(activeTab?.total || 0)}</span>
            </div>
            <p className="text-slate-500">Includes all kitchen dishes, energy beverages and GST tax.</p>
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
            <Button variant="lawn" loading={settling} onClick={handleSettleTab} className="font-bold">
              Confirm Settlement ({settleMethod.toUpperCase()})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default BarPos
