import React, { useEffect, useState } from 'react'
import shopService from '@/service/shopService'
import { formatCurrency, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ListOrdered, CheckCircle2, XCircle, ArrowRight, Clock, Store, Truck } from 'lucide-react'

export const OrdersAdmin = () => {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Order Fulfilment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Shop Orders & Pickup Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage online member equipment orders and counter sales.
          </p>
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="All Order Statuses"
          className="text-xs py-1.5 max-w-xs"
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready for Pickup</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ListOrdered className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700">No orders found for this status</h4>
            <p className="text-xs text-slate-400">All member orders have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order No & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Fulfilment</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Progress Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const isPending = o.status === 'pending'
                  const isConfirmed = o.status === 'confirmed'
                  const isReady = o.status === 'ready'
                  const isCompleted = o.status === 'completed'
                  const isUnpaid = o.paymentStatus === 'unpaid'

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{o.orderNo}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(o.createdAt)}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {o.customer?.name || 'Customer'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-medium capitalize text-slate-700">
                          {o.fulfilment === 'delivery' ? (
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Store className="w-3.5 h-3.5 text-[#1B4D2E]" />
                          )}
                          {o.fulfilment?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(o.total)}
                      </td>

                      <td className="py-3 px-4">
                        {isUnpaid ? (
                          <button
                            onClick={() => handleMarkPaid(o.id)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 hover:bg-emerald-100 hover:text-emerald-800"
                            title="Click to mark paid cash"
                          >
                            Unpaid (Mark Paid)
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Paid
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge status={o.status}>{o.status}</Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] py-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                              onClick={() => handleUpdateStatus(o.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                          )}
                          {isConfirmed && (
                            <Button
                              variant="lawn"
                              size="sm"
                              className="text-[11px] py-1"
                              onClick={() => handleUpdateStatus(o.id, 'ready')}
                            >
                              Ready
                            </Button>
                          )}
                          {isReady && (
                            <Button
                              variant="lawn"
                              size="sm"
                              className="text-[11px] py-1 bg-emerald-700 hover:bg-emerald-800"
                              onClick={() => handleUpdateStatus(o.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] text-slate-400 font-medium">Done</span>
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
      </Card>
    </div>
  )
}

export default OrdersAdmin
