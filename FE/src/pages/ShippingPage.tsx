import React, { useState } from 'react'
import { Truck, Send } from 'lucide-react'

const ShippingPage: React.FC = () => {
  const [tracking, setTracking] = useState('')

  const create = () => {
    alert('Tạo vận đơn (placeholder)')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Shipping / Tracking</h1>
      <input
        className="border p-2 mb-4 w-full"
        placeholder="Mã đơn / tracking"
        value={tracking}
        onChange={e => setTracking(e.target.value)}
      />
      <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded">Tạo vận đơn</button>
    </div>
  )
}

export default ShippingPage
