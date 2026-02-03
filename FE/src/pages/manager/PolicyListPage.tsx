import React, { useState, useEffect } from 'react'
import {
  getPolicies,
  activatePolicy,
  deactivatePolicy,
  Policy,
  PolicyType,
} from '../../lib/policy-api'
import { Link } from 'react-router-dom'
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiInfo } from 'react-icons/fi'

const PolicyListPage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<PolicyType | ''>('')

  const fetchPolicies = async () => {
    setLoading(true)
    try {
      const data = await getPolicies(filterType ? { type: filterType } : undefined)
      setPolicies(data)
    } catch (err) {
      console.error('Failed to fetch policies', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [filterType])

  const handleToggleActivate = async (id: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await deactivatePolicy(id)
      } else {
        await activatePolicy(id)
      }
      fetchPolicies()
    } catch (err) {
      console.error('Failed to toggle policy status', err)
    }
  }

  const policyTypes: PolicyType[] = [
    'return',
    'refund',
    'warranty',
    'shipping',
    'prescription',
    'cancellation',
    'privacy',
    'terms',
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
            Policy Management
          </h1>
          <p className="text-slate-500 text-sm">
            Manage and version store legal and service policies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <select
              className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none pr-10 cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PolicyType | '')}
            >
              <option value="">All Types</option>
              {policyTypes.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <FiInfo className="w-4 h-4" />
            </div>
          </div>
          <Link
            to="/dashboard/policies/new"
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-[2px] font-bold text-xs uppercase tracking-widest transition-all"
          >
            <FiPlus className="w-4 h-4" />
            Create New Policy
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border border-slate-100 border-dashed">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Loading Policies...
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 rounded-[2px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-300">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-300">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-300">
                    Effective
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-8 py-20 text-center text-slate-400 font-medium italic"
                    >
                      No policies found matching your selection.
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => (
                    <tr key={policy._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          {policy.type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-600">v{policy.version}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-900">{policy.title}</span>
                      </td>
                      <td className="px-8 py-5">
                        {policy.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg capitalize">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg capitalize">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-500">
                        {new Date(policy.effectiveFrom).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right space-x-3">
                        <Link
                          to={`/dashboard/policies/${policy._id}/edit`}
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleActivate(policy._id, policy.isActive)}
                          className={
                            policy.isActive
                              ? 'inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold text-sm transition-colors'
                              : 'inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors'
                          }
                        >
                          {policy.isActive ? (
                            <>
                              <FiToggleRight className="w-5 h-5" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <FiToggleLeft className="w-5 h-5" />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyListPage
