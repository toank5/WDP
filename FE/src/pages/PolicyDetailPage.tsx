import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPolicyByType, Policy, PolicyType } from '../lib/policy-api'

const PolicyDetailPage: React.FC = () => {
  const { type } = useParams<{ type: string }>()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (type) {
      setLoading(true)
      getPolicyByType(type as PolicyType)
        .then(setPolicy)
        .catch((err) => console.error('Failed to fetch policy', err))
        .finally(() => setLoading(false))
    }
  }, [type])

  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!policy) return <div className="p-10 text-center">Policy not found.</div>

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{policy.title}</h1>
        <p className="text-gray-500 mt-2">
          Effective Date: {new Date(policy.effectiveFrom).toLocaleDateString()} | Version: v
          {policy.version}
        </p>
      </div>

      <div className="prose max-w-none">
        {policy.bodyRichTextJson ? (
          <div className="italic text-gray-500">Rich text content rendering...</div>
        ) : (
          <div className="whitespace-pre-wrap">{policy.bodyPlainText}</div>
        )}
      </div>

      {policy.type === 'return' && (
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Key Policy Highlights</h2>
          <ul className="space-y-2">
            <li>
              <strong>Return Window (Frames):</strong> {policy.config.returnWindowDays?.framesOnly}{' '}
              days
            </li>
            <li>
              <strong>Return Window (Prescription):</strong>{' '}
              {policy.config.returnWindowDays?.prescriptionGlasses} days
            </li>
            <li>
              <strong>Restocking Fee:</strong> {policy.config.restockingFeePercent}%
            </li>
            <li>
              <strong>Return Shipping:</strong>{' '}
              {policy.config.customerPaysReturnShipping ? 'Customer pays' : 'Free'}
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default PolicyDetailPage
