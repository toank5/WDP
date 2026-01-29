import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    setOrders([{ id: 'o1', status: 'delivered', total: 200 }])
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Lịch sử đơn hàng</h1>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="p-3 border rounded-md flex justify-between">
            <Link to={`/orders/${o.id}`} className="font-medium text-blue-600">Đơn {o.id}</Link>
            <div className="text-sm text-slate-600">{o.status} — ${o.total}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrderHistoryPage
