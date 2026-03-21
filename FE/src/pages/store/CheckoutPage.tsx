import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FiArrowLeft,
  FiMapPin,
  FiTruck,
  FiCreditCard,
  FiCheck,
  FiCheckCircle,
  FiShoppingBag,
  FiLock,
  FiLoader,
  FiAlertCircle,
  FiClock,
  FiEye,
} from 'react-icons/fi'
import { cartApi, normalizeCartItemPrice } from '@/lib/cart-api'
import { useCart, useCartStore } from '@/store/cart.store'
import { orderApi, CheckoutRequest, OrderType, PaymentMethod, ShippingMethod } from '@/lib/order-api'
import { formatImageUrl } from '@/lib/product-api'
import { useAuthStore } from '@/store/auth-store'
import { getPrescriptionLensFee, getShippingPolicyPricing } from '@/lib/policy-api'

// VND Price formatter
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price)
}

// Vietnamese provinces/cities list (common ones)
const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
]

interface ShippingAddress {
  fullName: string
  phone: string
  address: string
  city: string
  district: string
  ward?: string
  postalCode?: string
}

interface FormErrors {
  fullName?: string
  phone?: string
  address?: string
  city?: string
  district?: string
}

type CheckoutStep = 'address' | 'payment' | 'review'

interface ShippingPricingState {
  defaultCarrier: string
  standardDaysLabel: string
  expressDaysLabel: string
  standardShippingFee: number
  expressShippingFee: number
  freeShippingMinAmount: number
}

const DEFAULT_SHIPPING_PRICING: ShippingPricingState = {
  defaultCarrier: 'Default Carrier',
  standardDaysLabel: '3-5 business days',
  expressDaysLabel: '1-2 business days',
  standardShippingFee: 30000,
  expressShippingFee: 50000,
  freeShippingMinAmount: 0,
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use useCart() hook for reactive cart state and dynamic discount calculation
  const cartState = useCart()
  // Destructure what we need
  const { items, totalItems, subtotal, appliedPromotion, discountAmount, totalAfterDiscount } = cartState

  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    postalCode: '',
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Payment
  const [paymentMethod] = useState<PaymentMethod>(PaymentMethod.VNPAY) // Only VNPAY for now
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(ShippingMethod.STANDARD)
  const [shippingPricing, setShippingPricing] = useState<ShippingPricingState>(DEFAULT_SHIPPING_PRICING)

  // Order type (default to READY)
  const [orderType] = useState<OrderType>(OrderType.READY)

  // Notes
  const [notes, setNotes] = useState('')
  const [prescriptionLensFee, setPrescriptionLensFee] = useState(0)

  // Load cart on mount - only if authenticated
  useEffect(() => {
    const authState = useAuthStore.getState()
    if (!authState.isAuthenticated) {
      navigate('/login')
      return
    }
    loadCart()
  }, [])

  useEffect(() => {
    const fetchPrescriptionPolicy = async () => {
      try {
        const fee = await getPrescriptionLensFee()
        setPrescriptionLensFee(fee)
      } catch {
        setPrescriptionLensFee(0)
      }
    }

    fetchPrescriptionPolicy()
  }, [])

  useEffect(() => {
    const fetchShippingPolicy = async () => {
      try {
        const pricing = await getShippingPolicyPricing()
        setShippingPricing(pricing)
      } catch {
        setShippingPricing(DEFAULT_SHIPPING_PRICING)
      }
    }

    fetchShippingPolicy()
  }, [])

  const loadCart = async () => {
    try {
      // The cart store automatically handles migration from localStorage to backend
      // and loads the cart from the appropriate source
      const cartStore = useCartStore.getState()

      // Log initial state before load
      console.log('[CheckoutPage] Initial cart state:', {
        itemsCount: cartStore.items.length,
        appliedPromotion: cartStore.appliedPromotion,
        _hydrated: cartStore._hydrated,
      })

      // Check for guest cart items that need to be synced to database
      const guestCartKey = 'guest_cart'
      const guestCartData = localStorage.getItem(guestCartKey)
      const hasGuestCart = guestCartData && JSON.parse(guestCartData).length > 0

      if (hasGuestCart) {
        console.log('[CheckoutPage] Found guest cart, migrating to user cart...')
        // Import migrateGuestCartToUserCart dynamically to avoid circular deps
        const { migrateGuestCartToUserCart } = await import('@/store/cart.store')
        await migrateGuestCartToUserCart()
        console.log('[CheckoutPage] Guest cart migration complete')
      }

      // Force reload cart from database to get authoritative state
      // This ensures we have the latest cart state from the server
      await cartStore.loadCart()

      // Wait for hydration if not already hydrated
      let attempts = 0
      let currentStore = useCartStore.getState()
      while (!currentStore._hydrated && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 50))
        currentStore = useCartStore.getState()
        attempts++
      }

      // Log the state for debugging after load and hydration
      console.log('[CheckoutPage] Cart state after load:', {
        items: currentStore.items.length,
        appliedPromotion: currentStore.appliedPromotion,
        promotionCode: currentStore.appliedPromotion?.code,
        promotionType: currentStore.appliedPromotion?.type,
        promotionValue: currentStore.appliedPromotion?.value,
        _hydrated: currentStore._hydrated,
        localStorageRaw: localStorage.getItem('wdp-cart-store'),
      })

      // Also check raw localStorage for debugging
      try {
        const rawStore = localStorage.getItem('wdp-cart-store')
        if (rawStore) {
          const parsed = JSON.parse(rawStore)
          console.log('[CheckoutPage] Raw localStorage data:', {
            hasAppliedPromotion: !!parsed.state?.appliedPromotion,
            appliedPromotion: parsed.state?.appliedPromotion,
          })
        }
      } catch (e) {
        console.error('[CheckoutPage] Failed to parse localStorage:', e)
      }

      // Check if cart is empty
      if (currentStore.items.length === 0) {
        navigate('/cart')
        return
      }
    } catch (err) {
      console.error('Failed to load cart:', err)
      setError('Failed to load cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateAddress = (): boolean => {
    const errors: FormErrors = {}

    if (!shippingAddress.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10,11}$/.test(shippingAddress.phone.replace(/\s/g, ''))) {
      errors.phone = 'Invalid phone number'
    }
    if (!shippingAddress.address.trim()) {
      errors.address = 'Address is required'
    }
    if (!shippingAddress.city) {
      errors.city = 'City is required'
    }
    if (!shippingAddress.district.trim()) {
      errors.district = 'District is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddressNext = () => {
    if (validateAddress()) {
      setCurrentStep('payment')
    }
  }

  const handlePaymentNext = () => {
    setCurrentStep('review')
  }

  const calculateShippingFee = () => {
    if (shippingPricing.freeShippingMinAmount > 0 && totalAfterDiscount >= shippingPricing.freeShippingMinAmount) {
      return 0
    }

    return shippingMethod === ShippingMethod.EXPRESS
      ? shippingPricing.expressShippingFee
      : shippingPricing.standardShippingFee
  }

  const handlePlaceOrder = async () => {
    // Cart is now from the store, check if items exist
    if (items.length === 0) {
      console.error('No cart items found')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Get fresh cart state at checkout time to ensure we have the latest promotion
      const cartStore = useCartStore.getState()
      const currentAppliedPromotion = cartStore.appliedPromotion

      console.log('[CheckoutPage] === PRE-CHECKOUT STATE ===')
      console.log('[CheckoutPage] Cart store state:', {
        itemsCount: cartStore.items.length,
        subtotal: cartStore.subtotal,
        appliedPromotion: cartStore.appliedPromotion,
        _hydrated: cartStore._hydrated,
      })
      console.log('[CheckoutPage] Applied promotion details:', {
        code: currentAppliedPromotion?.code,
        name: currentAppliedPromotion?.name,
        type: currentAppliedPromotion?.type,
        value: currentAppliedPromotion?.value,
        discountAmount: currentAppliedPromotion?.discountAmount,
      })
      console.log('[CheckoutPage] Dynamic discount from useCart():', {
        discountAmount: cartState.discountAmount,
        totalAfterDiscount: cartState.totalAfterDiscount,
      })

      const checkoutRequest: CheckoutRequest = {
        items: items.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
          priceAtOrder: normalizeCartItemPrice(item),
        })),
        shippingAddress,
        shippingMethod,
        payment: {
          method: paymentMethod,
        },
        orderType,
        notes: notes.trim() || undefined,
        promotionCode: currentAppliedPromotion?.code,
      }

      // Debug: Log checkout request
      console.log('[CheckoutPage] === SENDING CHECKOUT REQUEST ===')
      console.log('[CheckoutPage] Full request:', checkoutRequest)
      console.log('[CheckoutPage] Promotion code in request:', checkoutRequest.promotionCode)

      const response = await orderApi.checkout(checkoutRequest)

      // Debug: Log response
      console.log('[CheckoutPage] === CHECKOUT RESPONSE ===')
      console.log('[CheckoutPage] Full response:', response)
      console.log('[CheckoutPage] Order promotion details:', {
        orderId: response.order._id,
        promotionId: response.order.promotionId,
        promotionCode: response.order.promotionCode,
        promotionDiscount: response.order.promotionDiscount,
        totalAmount: response.order.totalAmount,
        subtotal: response.order.subtotal,
      })

      // If VNPAY, redirect to payment
      if (response.paymentUrl) {
        // Clear promotion before redirecting to payment
        useCartStore.getState().clearPromotionCode()
        window.location.href = response.paymentUrl
      } else {
        // No payment URL, go to order success directly
        // Clear promotion before navigating to success page
        useCartStore.getState().clearPromotionCode()
        navigate(`/order-success/${response.order._id}`)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      const message = err instanceof Error ? err.message : 'Failed to place order'
      setError(message)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Cart is now from the store - check if items exist
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FiShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Your cart is empty</p>
          <Link
            to="/products"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const shippingFee = calculateShippingFee()
  const prescriptionItemsCount = items.reduce(
    (sum, item) => sum + (item.requiresPrescription ? item.quantity : 0),
    0
  )
  const prescriptionLensFeeTotal = prescriptionItemsCount * prescriptionLensFee
  // Use the dynamically calculated discount from useCart() hook
  // This automatically recalculates based on promotion type (percentage or fixed)
  const total = totalAfterDiscount + shippingFee

  // Step indicator
  const steps: { key: CheckoutStep; label: string; icon: React.ReactNode }[] = [
    { key: 'address', label: 'Address', icon: <FiMapPin /> },
    { key: 'payment', label: 'Payment', icon: <FiCreditCard /> },
    { key: 'review', label: 'Review', icon: <FiCheck /> },
  ]

  const getStepIndex = (step: CheckoutStep) => steps.findIndex((s) => s.key === step)
  const currentStepIndex = getStepIndex(currentStep)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-100 border-b border-slate-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/cart"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
          >
            <FiArrowLeft /> Back to Cart
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Checkout
          </h1>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Checkout Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {index < currentStepIndex ? <FiCheck size={16} /> : step.icon}
                  </div>
                  <span
                    className={`text-xs font-semibold mt-2 ${
                      index <= currentStepIndex ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Step 1: Shipping Address */}
            {currentStep === 'address' && (
              <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FiMapPin className="text-blue-600" />
                    Shipping Address
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-2 border rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          formErrors.fullName ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="Enter your full name"
                        value={shippingAddress.fullName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                        }
                      />
                      {formErrors.fullName && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`w-full px-4 py-2 border rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          formErrors.phone ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="e.g., 0912345678"
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, phone: e.target.value })
                        }
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 border rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        formErrors.address ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="Street address, house number, etc."
                      value={shippingAddress.address}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, address: e.target.value })
                      }
                    />
                    {formErrors.address && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        City/Province <span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full px-4 py-2 border rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          formErrors.city ? 'border-red-300' : 'border-slate-300'
                        }`}
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                      >
                        <option value="">Select city/province</option>
                        {PROVINCES.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                      {formErrors.city && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-2 border rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          formErrors.district ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="Enter district"
                        value={shippingAddress.district}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, district: e.target.value })
                        }
                      />
                      {formErrors.district && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.district}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        Ward (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Enter ward"
                        value={shippingAddress.ward}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, ward: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                        Postal Code (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Enter postal code"
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleAddressNext}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors shadow-sm"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 'payment' && (
              <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FiCreditCard className="text-blue-600" />
                    Payment Method
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShippingMethod(ShippingMethod.STANDARD)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setShippingMethod(ShippingMethod.STANDARD)
                        }
                      }}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        shippingMethod === ShippingMethod.STANDARD
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            shippingMethod === ShippingMethod.STANDARD
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-400 bg-white'
                          }`}>
                            {shippingMethod === ShippingMethod.STANDARD ? <FiCheck size={12} className="text-white" /> : null}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Standard Delivery</p>
                            <p className="text-sm text-slate-500">{shippingPricing.standardDaysLabel}</p>
                          </div>
                        </div>
                        <p className="font-bold text-slate-900">{formatPrice(shippingPricing.standardShippingFee)}</p>
                      </div>
                    </div>

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShippingMethod(ShippingMethod.EXPRESS)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setShippingMethod(ShippingMethod.EXPRESS)
                        }
                      }}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        shippingMethod === ShippingMethod.EXPRESS
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            shippingMethod === ShippingMethod.EXPRESS
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-400 bg-white'
                          }`}>
                            {shippingMethod === ShippingMethod.EXPRESS ? <FiCheck size={12} className="text-white" /> : null}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Express Delivery</p>
                            <p className="text-sm text-slate-500">{shippingPricing.expressDaysLabel}</p>
                          </div>
                        </div>
                        <p className="font-bold text-slate-900">{formatPrice(shippingPricing.expressShippingFee)}</p>
                      </div>
                    </div>

                    {shippingPricing.freeShippingMinAmount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <p className="text-xs text-emerald-800">
                          Free shipping for orders from {formatPrice(shippingPricing.freeShippingMinAmount)}.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                        <FiCheck size={12} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">VNPay - Electronic Payment</p>
                        <p className="text-sm text-slate-500">
                          Pay securely using your bank account, credit card, or mobile wallet
                          through VNPay
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 ml-8 flex items-center gap-2 text-sm text-slate-600">
                      <FiLock size={14} />
                      <span>Secure payment powered by VNPay</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You will be redirected to VNPay secure payment
                      gateway after completing your order. Multiple payment options are available
                      including Internet Banking, Credit/Debit Cards, and Mobile Wallets.
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setCurrentStep('address')}
                      className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePaymentNext}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors shadow-sm"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                {/* Order Items - Detailed List */}
                <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-900">Order Items ({items.length})</h2>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {items.map((item) => {
                      // Get the actual price value using type-safe normalization
                      const itemPrice = normalizeCartItemPrice(item)
                      const lineTotal = itemPrice * item.quantity
                      const isPreorder = item.variantDetails?.isPreorder || false

                      return (
                        <div key={item._id} className="p-6">
                          <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.productImage ? (
                                <img
                                  src={formatImageUrl(item.productImage)}
                                  alt={item.productName}
                                  className="w-full h-full object-contain p-2"
                                />
                              ) : (
                                <span className="text-3xl">📦</span>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-bold text-slate-900 text-lg mb-1">
                                    {item.productName || 'Product'}
                                  </h3>

                                  {/* Badges */}
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {isPreorder && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
                                        <FiClock size={12} />
                                        Pre-order
                                      </span>
                                    )}
                                  </div>

                                  {/* Variant Details */}
                                  {item.variantDetails && (
                                    <div className="text-sm text-slate-600 space-y-1">
                                      {item.variantDetails.size && (
                                        <p>Size: <span className="font-medium text-slate-800">{item.variantDetails.size}</span></p>
                                      )}
                                      {item.variantDetails.color && (
                                        <p>Color: <span className="font-medium text-slate-800">{item.variantDetails.color}</span></p>
                                      )}
                                    </div>
                                  )}

                                  {item.requiresPrescription && item.typedPrescription && (
                                    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-slate-700">
                                      <p className="mb-1 font-semibold text-blue-900">Typed prescription</p>
                                      <p>
                                        OD: SPH {item.typedPrescription.rightEye.sph}, CYL {item.typedPrescription.rightEye.cyl}, AXIS {item.typedPrescription.rightEye.axis}, ADD {item.typedPrescription.rightEye.add}
                                      </p>
                                      <p>
                                        OS: SPH {item.typedPrescription.leftEye.sph}, CYL {item.typedPrescription.leftEye.cyl}, AXIS {item.typedPrescription.leftEye.axis}, ADD {item.typedPrescription.leftEye.add}
                                      </p>
                                      {item.typedPrescription.pd !== undefined && <p>PD: {item.typedPrescription.pd}</p>}
                                      {item.typedPrescription.pdRight !== undefined && <p>PD Right: {item.typedPrescription.pdRight}</p>}
                                      {item.typedPrescription.pdLeft !== undefined && <p>PD Left: {item.typedPrescription.pdLeft}</p>}
                                      {item.typedPrescription.notesFromCustomer && (
                                        <p>Note: {item.typedPrescription.notesFromCustomer}</p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Price & Quantity */}
                                <div className="text-right">
                                  <p className="text-lg font-bold text-blue-700">
                                    {formatPrice(lineTotal)}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {formatPrice(itemPrice)} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FiMapPin className="text-blue-600" />
                      Shipping Address
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="font-bold text-slate-900">{shippingAddress.fullName}</p>
                    <p className="text-sm text-slate-600">{shippingAddress.phone}</p>
                    <p className="text-sm text-slate-600 mt-2">
                      {shippingAddress.address}, {shippingAddress.ward ? `${shippingAddress.ward}, ` : ''}
                      {shippingAddress.district}, {shippingAddress.city}
                      {shippingAddress.postalCode && ` (${shippingAddress.postalCode})`}
                    </p>
                  </div>
                </div>

                {/* Shipping & Payment */}
                <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-900">Shipping & Payment</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <FiTruck className="text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">
                          {shippingMethod === ShippingMethod.EXPRESS ? 'Express Delivery' : 'Standard Delivery'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {shippingMethod === ShippingMethod.EXPRESS ? shippingPricing.expressDaysLabel : shippingPricing.standardDaysLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiCreditCard className="text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">VNPay</p>
                        <p className="text-sm text-slate-500">Electronic payment</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                    <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                      <h2 className="text-lg font-bold text-slate-900">Order Notes</h2>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-slate-600">{notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('payment')}
                    className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={processing}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiLock size={14} />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden sticky top-20">
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Order Summary
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Subtotal ({totalItems} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedPromotion && (
                  <div className="flex justify-between text-xs font-semibold text-green-600">
                    <span className="uppercase">
                      Discount ({appliedPromotion.code})
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Shipping</span>
                  <span className={shippingFee === 0 ? 'text-green-600 font-medium' : 'text-slate-700'}>
                    {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                  </span>
                </div>
                {prescriptionItemsCount > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span className="uppercase">Prescription lens fee (included)</span>
                    <span>{formatPrice(prescriptionLensFeeTotal)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold uppercase text-slate-900 tracking-wider">
                    Total
                  </span>
                  <span className="text-xl font-bold text-blue-700">{formatPrice(total)}</span>
                </div>

                {/* Order Notes Input */}
                {currentStep !== 'review' && (
                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-[2px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      placeholder="Any special instructions..."
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                  <FiCheckCircle className="text-slate-300" /> Secure Payment
                  <br />
                  <FiCheckCircle className="text-slate-300" /> SSL Encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
