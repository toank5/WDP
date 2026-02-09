import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CreditCard, MapPin, ReceiptText, Truck, RefreshCcw } from 'lucide-react'
import { getCurrentPolicies, Policy } from '../lib/policy-api'
const CheckoutPage: React.FC = () => {
  const [address, setAddress] = useState('')
  const [policies, setPolicies] = useState<Record<string, Policy> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getCurrentPolicies()
      .then(setPolicies)
      .catch((err) => console.error('Failed to fetch policies', err))
  }, [])

  const submit = () => {
    // placeholder: call checkout API
    navigate('/orders')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Shipping Address
            </h2>
            <textarea
              className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter your delivery address..."
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" /> Payment
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-600 italic text-sm">
              Payment processing integrated via backend.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Policy Summaries</h2>
            <div className="space-y-4">
              {['shipping', 'return', 'refund'].map((type) => {
                const policy = policies?.[type]
                if (!policy) return null
                return (
                  <div key={type} className="flex gap-3">
                    <div className="mt-1">
                      {type === 'shipping' && <Truck className="w-4 h-4 text-blue-600" />}
                      {type === 'return' && <RefreshCcw className="w-4 h-4 text-green-600" />}
                      {type === 'refund' && <ReceiptText className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm capitalize">{type} Policy</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{policy.summary}</p>
                      <Link
                        to={`/policies/${type}`}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Read full policy
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={submit}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
            disabled={!address}
          >
            Complete Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
