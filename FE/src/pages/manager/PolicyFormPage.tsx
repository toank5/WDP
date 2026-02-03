import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getPolicies, createPolicy, updatePolicy, Policy, PolicyType } from '../../lib/policy-api'
import {
  FiFileText,
  FiSettings,
  FiClock,
  FiTag,
  FiAlignLeft,
  FiArrowLeft,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
} from 'react-icons/fi'
import { toast } from 'sonner'

const PolicyFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const initialType = (queryParams.get('type') as PolicyType) || 'return'

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Policy>>({
    type: initialType,
    summary: '',
    bodyPlainText: '',
    bodyRichTextJson: null,
    effectiveFrom: new Date().toISOString().split('T')[0],
    config: {},
  })

  useEffect(() => {
    if (id) {
      setLoading(true)
      getPolicies()
        .then((policies) => {
          const policy = policies.find((p) => p._id === id)
          if (policy) {
            setFormData({
              ...policy,
              effectiveFrom: new Date(policy.effectiveFrom).toISOString().split('T')[0],
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (id) {
        await updatePolicy(id, formData)
        toast.success('Policy updated successfully')
      } else {
        await createPolicy(formData)
        toast.success('New policy version created')
      }
      navigate('/dashboard/policies')
    } catch (err) {
      console.error('Failed to save policy', err)
      toast.error('Failed to save policy. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderConfigFields = () => {
    const { type, config = {} } = formData

    // Return Policy Config
    if (type === 'return') {
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Return Configuration
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Frames Return Window (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.returnWindowDays?.framesOnly ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...config,
                      returnWindowDays: {
                        ...(config.returnWindowDays || {}),
                        framesOnly: parseInt(e.target.value) || 0,
                      },
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Prescription Glasses Return Window (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.returnWindowDays?.prescriptionGlasses ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...config,
                      returnWindowDays: {
                        ...(config.returnWindowDays || {}),
                        prescriptionGlasses: parseInt(e.target.value) || 0,
                      },
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Contact Lenses Return Window (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.returnWindowDays?.contactLenses ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: {
                      ...config,
                      returnWindowDays: {
                        ...(config.returnWindowDays || {}),
                        contactLenses: parseInt(e.target.value) || 0,
                      },
                    },
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Non-Returnable Categories
            </label>
            <input
              type="text"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={config.nonReturnableCategories?.join(', ') ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: {
                    ...config,
                    nonReturnableCategories: e.target.value
                      .split(',')
                      .map((s: string) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
              placeholder="e.g. Gift Cards, Clearance Items"
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
              Separate categories with commas.
            </p>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Restocking Fee (%)
            </label>
            <input
              type="number"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={config.restockingFeePercent ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...config, restockingFeePercent: parseInt(e.target.value) || 0 },
                })
              }
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
              Fee applied to the total refund amount for quality checks.
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="returnShipping"
                className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                checked={!!config.customerPaysReturnShipping}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, customerPaysReturnShipping: e.target.checked },
                  })
                }
              />
              <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
            </div>
            <label
              htmlFor="returnShipping"
              className="text-sm font-bold text-slate-700 cursor-pointer select-none"
            >
              Customer pays return shipping
            </label>
          </div>
        </div>
      )
    }

    // Warranty Policy Config
    if (type === 'warranty') {
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Warranty Configuration
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Frames Warranty (months)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.framesMonths ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, framesMonths: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Lenses Warranty (months)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.lensesMonths ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, lensesMonths: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="coversDefects"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!config.coversManufacturingDefects}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, coversManufacturingDefects: e.target.checked },
                    })
                  }
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="coversDefects"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Covers manufacturing defects
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="excludesScratches"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!config.excludesScratchesFromWear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, excludesScratchesFromWear: e.target.checked },
                    })
                  }
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="excludesScratches"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Excludes scratches from normal wear
              </label>
            </div>
          </div>
        </div>
      )
    }

    // Shipping Policy Config
    if (type === 'shipping') {
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Shipping Configuration
            </h3>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Default Carrier
            </label>
            <input
              type="text"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={config.defaultCarrier ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...config, defaultCarrier: e.target.value },
                })
              }
              placeholder="e.g., FedEx, UPS, USPS"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Standard Shipping Min (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.standardDaysMin ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, standardDaysMin: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Standard Shipping Max (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.standardDaysMax ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, standardDaysMax: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Express Shipping Min (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.expressDaysMin ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, expressDaysMin: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Express Shipping Max (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.expressDaysMax ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, expressDaysMax: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Free Shipping Minimum Amount ($)
            </label>
            <input
              type="number"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={config.freeShippingMinAmount ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...config, freeShippingMinAmount: parseInt(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>
      )
    }

    // Prescription Policy Config
    if (type === 'prescription') {
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Prescription Configuration
            </h3>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Max Prescription Age (months)
            </label>
            <input
              type="number"
              className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
              value={config.maxPrescriptionAgeMonths ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...config, maxPrescriptionAgeMonths: parseInt(e.target.value) || 0 },
                })
              }
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
              How old a prescription can be before it's considered expired
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="requirePD"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!config.requirePD}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, requirePD: e.target.checked },
                    })
                  }
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="requirePD"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Require Pupillary Distance (PD)
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="allowHighPower"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!config.allowHighPowerRange}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, allowHighPowerRange: e.target.checked },
                    })
                  }
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="allowHighPower"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow high power range prescriptions
              </label>
            </div>
          </div>
        </div>
      )
    }

    // Cancellation Policy Config
    if (type === 'cancellation') {
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Cancellation Configuration
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="cancelReady"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!config.allowCancelReadyBeforeShip}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...config, allowCancelReadyBeforeShip: e.target.checked },
                    })
                  }
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="cancelReady"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow cancel ready-to-ship orders before shipping
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="cancelPrescription"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!config.allowCancelPrescriptionBeforeProduction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...config,
                        allowCancelPrescriptionBeforeProduction: e.target.checked,
                      },
                    })
                  }
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="cancelPrescription"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow cancel prescription orders before production
              </label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="cancelPreorder"
                  className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                  checked={!!config.allowCancelPreorderBeforeSupplierConfirm}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: {
                        ...config,
                        allowCancelPreorderBeforeSupplierConfirm: e.target.checked,
                      },
                    })
                  }
                />
                <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
              </div>
              <label
                htmlFor="cancelPreorder"
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                Allow cancel preorders before supplier confirmation
              </label>
            </div>
          </div>
        </div>
      )
    }

    // Refund Policy Config
    if (type === 'refund') {
      return (
        <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-[2px] self-stretch">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
            <FiSettings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              Refund Configuration
            </h3>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mb-4">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="refundOriginal"
                className="peer h-6 w-6 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer appearance-none bg-slate-50 border-2 checked:bg-blue-600 checked:border-blue-600"
                checked={!!config.refundToOriginalMethodOnly}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, refundToOriginalMethodOnly: e.target.checked },
                  })
                }
              />
              <FiPlus className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white w-4 h-4 left-1 transition-opacity rotate-45" />
            </div>
            <label
              htmlFor="refundOriginal"
              className="text-sm font-bold text-slate-700 cursor-pointer"
            >
              Refund to original payment method only
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Expected Processing Min (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.expectedProcessingDaysMin ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, expectedProcessingDaysMin: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Expected Processing Max (days)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-300 rounded-[2px] px-3 py-2 outline-none focus:border-blue-700 text-sm"
                value={config.expectedProcessingDaysMax ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...config, expectedProcessingDaysMax: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
          </div>
        </div>
      )
    }

    // Privacy & Terms (no specific config)
    if (type === 'privacy' || type === 'terms') {
      return (
        <div className="p-8 text-center bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl">
          <FiAlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No additional configuration needed for {type} policy
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Just fill in the title, summary, and body text above
          </p>
        </div>
      )
    }

    return (
      <div className="p-12 text-center bg-slate-50/50 border border-slate-100 border-dashed rounded-[2rem] animate-in fade-in duration-700">
        <FiAlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">
          Configuration for {type} policy type
        </div>
      </div>
    )
  }

  if (loading && id) {
    return (
      <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-xl flex items-center justify-center z-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-50/50 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-blue-600 uppercase tracking-widest">
            WDP
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-slate-300 pb-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard/policies')}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-700 transition-colors"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Discard Draft
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              {id ? 'Modify Policy Version' : 'New Policy Version'}
            </h1>
          </div>
          <div className="p-3 bg-white border border-slate-300 rounded-[2px] shadow-sm">
            <FiFileText className="w-8 h-8 text-slate-500" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-300 px-6 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Primary Configuration
              </span>
            </div>
            <div className="p-6 md:p-8 space-y-8">
              {/* Type and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    <FiTag className="w-4 h-4 text-blue-500" />
                    Classification
                  </label>
                  <div className="relative">
                    <select
                      disabled={!!id}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 cursor-pointer appearance-none"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as PolicyType })
                      }
                    >
                      <option value="return">Return</option>
                      <option value="refund">Refund</option>
                      <option value="warranty">Warranty</option>
                      <option value="shipping">Shipping</option>
                      <option value="prescription">Prescription</option>
                      <option value="cancellation">Cancellation</option>
                      <option value="privacy">Privacy</option>
                      <option value="terms">Terms</option>
                    </select>
                    {!id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FiSettings className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    <FiClock className="w-4 h-4 text-blue-500" />
                    Deployment Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3 text-left">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  <span className="w-4 h-4 flex items-center justify-center bg-blue-500 text-[10px] text-white rounded-full font-black">
                    T
                  </span>
                  Official Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Transparency in Digital Commerce"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
                  This title is visible to all customers on the legal pages.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3 text-left">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  <FiAlignLeft className="w-4 h-4 text-blue-500" />
                  Executive Summary
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide a high-level overview that customers can quickly scan..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-slate-300 leading-relaxed"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    A brief TL;DR for mobile users.
                  </p>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {formData.summary?.length || 0} / 300
                  </div>
                </div>
              </div>

              {/* Content Tabs Concept */}
              <div className="space-y-6">
                <div className="flex items-center gap-6 border-b border-slate-50 pb-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 shrink-0"
                  >
                    Legal Document
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-slate-400 shrink-0 cursor-not-allowed"
                  >
                    Formatted Preview
                  </button>
                </div>

                <div className="space-y-3 text-left">
                  <textarea
                    required
                    rows={10}
                    placeholder="Draft the complete policy content. Use clear, unambiguous language..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-6 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300 leading-relaxed min-h-[320px]"
                    value={formData.bodyPlainText}
                    onChange={(e) => setFormData({ ...formData, bodyPlainText: e.target.value })}
                  />
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                      Sanitized Version Ready for Deployment
                    </p>
                  </div>
                </div>
              </div>

              {/* Config Fields Header */}
              <div className="pt-6">
                <div className="w-full h-px bg-slate-50 mb-10"></div>
                {renderConfigFields()}
              </div>

              {/* Actions */}
              <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-6 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/policies')}
                  className="w-full md:w-auto px-10 py-5 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-95"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-4 group"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Seal & Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PolicyFormPage
