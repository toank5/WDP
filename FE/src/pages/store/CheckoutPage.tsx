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
} from 'react-icons/fi'
import { cartApi, CartResponse } from '@/lib/cart-api'
import { orderApi, CheckoutRequest, OrderType, PaymentMethod } from '@/lib/order-api'
import { formatImageUrl } from '@/lib/product-api'

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

type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review'

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address')
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Shipping & Payment
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [paymentMethod] = useState<PaymentMethod>(PaymentMethod.VNPAY) // Only VNPAY for now

  // Order type (default to READY)
  const [orderType] = useState<OrderType>(OrderType.READY)

  // Notes
  const [notes, setNotes] = useState('')

  // Load cart on mount
  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const cartData = await cartApi.getCart()
      if (!cartData || cartData.items.length === 0) {
        navigate('/cart')
        return
      }
      setCart(cartData)
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
      setCurrentStep('shipping')
    }
  }

  const handleShippingNext = () => {
    setCurrentStep('payment')
  }

  const handlePaymentNext = () => {
    setCurrentStep('review')
  }

  const calculateShippingFee = () => {
    return shippingMethod === 'EXPRESS' ? 50000 : 30000
  }

  const calculateTax = (subtotal: number) => {
    return Math.round(subtotal * 0.1)
  }

  const handlePlaceOrder = async () => {
    if (!cart) return

    setProcessing(true)
    setError(null)

    try {
      const checkoutRequest: CheckoutRequest = {
        items: cart.items.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
          priceAtOrder: item.price || 0,
        })),
        shippingAddress,
        shippingMethod,
        payment: {
          method: paymentMethod,
        },
        orderType,
        notes: notes.trim() || undefined,
      }

      const response = await orderApi.checkout(checkoutRequest)

      // If VNPAY, redirect to payment
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl
      } else {
        // No payment URL, go to order success directly
        navigate(`/order-success/${response.order._id}`)
      }
    } catch (err) {
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

  if (!cart) {
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

  const subtotal = cart.subtotal || 0
  const shippingFee = calculateShippingFee()
  const tax = calculateTax(subtotal)
  const total = subtotal + shippingFee + tax

  // Step indicator
  const steps: { key: CheckoutStep; label: string; icon: React.ReactNode }[] = [
    { key: 'address', label: 'Address', icon: <FiMapPin /> },
    { key: 'shipping', label: 'Shipping', icon: <FiTruck /> },
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
                      Continue to Shipping
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 'shipping' && (
              <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FiTruck className="text-blue-600" />
                    Shipping Method
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      shippingMethod === 'STANDARD'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setShippingMethod('STANDARD')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            shippingMethod === 'STANDARD'
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {shippingMethod === 'STANDARD' && (
                            <FiCheck size={12} className="text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Standard Delivery</p>
                          <p className="text-sm text-slate-500">
                            Delivery in 3-5 business days
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{formatPrice(30000)}</p>
                    </div>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      shippingMethod === 'EXPRESS'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setShippingMethod('EXPRESS')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            shippingMethod === 'EXPRESS'
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {shippingMethod === 'EXPRESS' && (
                            <FiCheck size={12} className="text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Express Delivery</p>
                          <p className="text-sm text-slate-500">
                            Delivery in 1-2 business days
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{formatPrice(50000)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setCurrentStep('address')}
                      className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleShippingNext}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider rounded-[2px] transition-colors shadow-sm"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {currentStep === 'payment' && (
              <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FiCreditCard className="text-blue-600" />
                    Payment Method
                  </h2>
                </div>
                <div className="p-6 space-y-4">
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
                      onClick={() => setCurrentStep('shipping')}
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
                {/* Order Items */}
                <div className="bg-white border border-slate-300 rounded-[2px] shadow-sm overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-300 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-900">Order Items ({cart.items.length})</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {cart.items.map((item) => (
                      <div key={item._id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={formatImageUrl(item.productImage)}
                              alt={item.productName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {item.productName || 'Product'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.variantDetails?.size && `Size: ${item.variantDetails.size}`}
                            {item.variantDetails?.size && item.variantDetails?.color && ' | '}
                            {item.variantDetails?.color && `Color: ${item.variantDetails.color}`}
                          </p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-slate-900">
                          {formatPrice((item.price || 0) * item.quantity)}
                        </p>
                      </div>
                    ))}
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
                          {shippingMethod === 'STANDARD' ? 'Standard Delivery' : 'Express Delivery'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {shippingMethod === 'STANDARD'
                            ? '3-5 business days'
                            : '1-2 business days'}
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
                  <span className="uppercase">Subtotal ({cart.totalItems} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Shipping</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span className="uppercase">Est. Tax (10%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
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
