import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  activatePolicy,
  deactivatePolicy,
  getPolicies,
  type AnyPolicy,
  type PolicyType,
} from '../../lib/policy-api'
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiFileText,
  FiFilter,
  FiInfo,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi'
import { toast } from 'sonner'

const POLICY_TYPE_META: Record<PolicyType, { label: string; accentClass: string }> = {
  return: { label: 'Return', accentClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  refund: { label: 'Refund', accentClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warranty: { label: 'Warranty', accentClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shipping: { label: 'Shipping', accentClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  prescription: { label: 'Prescription', accentClass: 'bg-violet-50 text-violet-700 border-violet-200' },
  cancellation: { label: 'Cancellation', accentClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  privacy: { label: 'Privacy', accentClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  terms: { label: 'Terms', accentClass: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
}

const POLICY_TYPES: PolicyType[] = [
  'return',
  'refund',
  'warranty',
  'shipping',
  'prescription',
  'cancellation',
  'privacy',
  'terms',
]

const PolicyListPage: React.FC = () => {
  const [policies, setPolicies] = useState<AnyPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<PolicyType | ''>('')

  const fetchPolicies = async () => {
    setLoading(true)
    try {
      const data = await getPolicies(filterType ? { type: filterType } : undefined)
      setPolicies(data)
    } catch (error) {
      console.error('Failed to fetch policies', error)
      toast.error('Failed to load policies')
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
        toast.success('Policy deactivated')
      } else {
        await activatePolicy(id)
        toast.success('Policy activated')
      }
      fetchPolicies()
    } catch (error) {
      console.error('Failed to toggle policy status', error)
      toast.error('Failed to update policy status')
    }
  }

  const filteredPolicies = useMemo(() => {
    const needle = searchText.trim().toLowerCase()

    if (!needle) {
      return policies
    }

    return policies.filter((policy) => {
      return (
        policy.title.toLowerCase().includes(needle) ||
        policy.summary.toLowerCase().includes(needle) ||
        policy.type.toLowerCase().includes(needle)
      )
    })
  }, [policies, searchText])

  const activeCount = filteredPolicies.filter((p) => p.isActive).length
  const inactiveCount = filteredPolicies.length - activeCount

  const latestEffectiveDate = useMemo(() => {
    if (filteredPolicies.length === 0) return '--'
    const latestDate = Math.max(...filteredPolicies.map((p) => new Date(p.effectiveFrom).getTime()))
    return new Date(latestDate).toLocaleDateString()
  }, [filteredPolicies])

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xs border border-slate-300 bg-white p-6 text-slate-900 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Operations Console</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">Policy Management</h1>
            <p className="text-sm text-slate-500">Manage versions, activation state, and policy types in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPolicies}
              className="inline-flex items-center gap-1.5 rounded-xs border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              to="/dashboard/policies/new"
              className="inline-flex items-center gap-1.5 rounded-xs bg-blue-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-400"
            >
              <FiPlus className="h-4 w-4" />
              New Policy
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xs border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-slate-500">
              <FiFileText className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Visible Policies</span>
            </div>
            <p className="mt-1 text-xl font-black">{filteredPolicies.length}</p>
          </div>
          <div className="rounded-xs border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <FiCheckCircle className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
            </div>
            <p className="mt-1 text-xl font-black">{activeCount}</p>
          </div>
          <div className="rounded-xs border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-slate-500">
              <FiClock className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Latest Effective</span>
            </div>
            <p className="mt-1 text-sm font-black">{latestEffectiveDate}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xs border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-lg">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full rounded-xs border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Search by title, summary, or type..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative">
                <FiFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  className="w-full rounded-xs border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as PolicyType | '')}
                >
                  <option value="">All Types</option>
                  {POLICY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {POLICY_TYPE_META[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xs border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <FiInfo className="h-4 w-4" />
                Inactive: {inactiveCount}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterType('')}
              className={`rounded-xs border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                filterType === ''
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {POLICY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-xs border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                  filterType === type
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {POLICY_TYPE_META[type].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-slate-100 bg-slate-50/50 py-20">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Policies...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xs border border-slate-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border-b border-slate-300 px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">Type</th>
                  <th className="border-b border-slate-300 px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">Version</th>
                  <th className="border-b border-slate-300 px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">Title</th>
                  <th className="border-b border-slate-300 px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">Status</th>
                  <th className="border-b border-slate-300 px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">Effective</th>
                  <th className="border-b border-slate-300 px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                      No policies found matching your selection.
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((policy) => (
                    <tr key={policy._id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex rounded-xs border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${POLICY_TYPE_META[policy.type].accentClass}`}
                        >
                          {POLICY_TYPE_META[policy.type].label}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600">v{policy.version}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-900">{policy.title}</td>
                      <td className="px-8 py-5">
                        {policy.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xs border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xs border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-500">
                        {new Date(policy.effectiveFrom).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/dashboard/policies/${policy._id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-xs border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 transition-colors hover:bg-indigo-100"
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleToggleActivate(policy._id, policy.isActive)}
                            className={
                              policy.isActive
                                ? 'inline-flex items-center gap-1.5 rounded-xs border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-rose-700 transition-colors hover:bg-rose-100'
                                : 'inline-flex items-center gap-1.5 rounded-xs border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700 transition-colors hover:bg-emerald-100'
                            }
                          >
                            {policy.isActive ? (
                              <>
                                <FiToggleRight className="h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <FiToggleLeft className="h-4 w-4" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
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
