import React, { useEffect, useState } from 'react'
import shopService from '@/service/shopService'
import { formatCurrency, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { ListOrdered, CheckCircle2, XCircle, ArrowRight, Clock, Store, Truck, Sparkles } from 'lucide-react'

export const OrdersAdmin = () => {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [, setUpdatingId] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await shopService.getOrders({
        status: statusFilter || undefined,
        limit: 50,
      })
      setOrders(res.items || [])
    } catch {
      toast.error('Failed to load shop orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await shopService.updateOrderStatus(orderId, newStatus)
      toast.success(`Order status updated to ${newStatus}`)
      fetchOrders()
    } catch (err) {
      toast.error(err.message || 'Status transition failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleMarkPaid = async (orderId) => {
    try {
      await shopService.payOrder(orderId, 'cash')
      toast.success('Order marked as paid')
      fetchOrders()
    } catch (err) {
      toast.error(err.message || 'Payment update failed')
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Order Fulfilment
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Shop Orders & Pickup Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage online member equipment orders and counter sales.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-colors max-w-xs"
        >
          <option value="" className="bg-[#111418] text-white">All Order Statuses</option>
          <option value="pending" className="bg-[#111418] text-white">Pending</option>
          <option value="confirmed" className="bg-[#111418] text-white">Confirmed</option>
          <option value="ready" className="bg-[#111418] text-white">Ready for Pickup</option>
          <option value="completed" className="bg-[#111418] text-white">Completed</option>
          <option value="cancelled" className="bg-[#111418] text-white">Cancelled</option>
        </select>
      </div>

      <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ListOrdered className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="font-black uppercase tracking-tight text-white">No orders found for this status</h4>
            <p className="text-xs text-slate-400">All member orders have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Order No & Date</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Fulfilment</th>
                  <th className="py-3.5 px-5">Total Amount</th>
                  <th className="py-3.5 px-5">Payment</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Progress Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {orders.map((o) => {
                  const isPending = o.status === 'pending'
                  const isConfirmed = o.status === 'confirmed'
                  const isReady = o.status === 'ready'
                  const isCompleted = o.status === 'completed'
                  const isUnpaid = o.paymentStatus === 'unpaid'

                  return (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-white block">{o.orderNo}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(o.createdAt)}</span>
                      </td>

                      <td className="py-3.5 px-5 font-bold text-white">
                        {o.customer?.name || 'Customer'}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 font-medium capitalize text-slate-300">
                          {o.fulfilment === 'delivery' ? (
                            <Truck className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Store className="w-3.5 h-3.5 text-[#CCFF00]" />
                          )}
                          {o.fulfilment?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-[#CCFF00] tabular-nums">
                        {formatCurrency(o.total)}
                      </td>

                      <td className="py-3.5 px-5">
                        {isUnpaid ? (
                          <button
                            onClick={() => handleMarkPaid(o.id)}
                            className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-[#CCFF00] hover:text-black transition-colors"
                            title="Click to mark paid cash"
                          >
                            Unpaid (Mark Paid)
                          </button>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                            Paid
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/10 text-slate-200">
                          {o.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              className="text-[11px] font-bold uppercase py-1.5 px-3 rounded-xl bg-white/5 hover:bg-[#CCFF00] hover:text-black text-white border border-white/10 transition-colors"
                              onClick={() => handleUpdateStatus(o.id, 'confirmed')}
                            >
                              Confirm
                            </button>
                          )}
                          {isConfirmed && (
                            <button
                              className="text-[11px] font-black uppercase py-1.5 px-3 rounded-xl bg-[#CCFF00] text-black shadow-md"
                              onClick={() => handleUpdateStatus(o.id, 'ready')}
                            >
                              Ready
                            </button>
                          )}
                          {isReady && (
                            <button
                              className="text-[11px] font-black uppercase py-1.5 px-3 rounded-xl bg-[#CCFF00] text-black shadow-md"
                              onClick={() => handleUpdateStatus(o.id, 'completed')}
                            >
                              Complete
                            </button>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] text-slate-500 font-bold uppercase">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersAdmin
