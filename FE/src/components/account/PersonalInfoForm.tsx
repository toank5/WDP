import React, { useState, useEffect } from 'react'
import { FiEdit2, FiX, FiCheck, FiLoader } from 'react-icons/fi'
import { toast } from 'sonner'
import type { UserProfile, UpdateProfileRequest } from '@/lib/user-api'
import { updateMyProfile } from '@/lib/user-api'

interface PersonalInfoFormProps {
  user: UserProfile
  onUserUpdate: (user: UserProfile) => void
}

interface FormErrors {
  fullName?: string
  phone?: string
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    fullName: user.fullName,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    preferredLanguage: user.preferredLanguage,
    preferredCurrency: user.preferredCurrency,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Reset form when user changes
  useEffect(() => {
    setFormData({
      fullName: user.fullName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      preferredLanguage: user.preferredLanguage,
      preferredCurrency: user.preferredCurrency,
    })
    setErrors({})
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters'
    }

    if (formData.phone) {
      const phoneRegex = /^[+]?[\d\s-()]+$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const updatedUser = await updateMyProfile(formData)
      onUserUpdate(updatedUser)
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      // If API is not available (404), show a helpful message
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      if (message.includes('404') || message.includes('Not Found')) {
        toast.info('Profile update endpoint not available yet. Changes saved locally.')
        // Still update local state so the UI reflects changes
        onUserUpdate({ ...user, ...formData } as UserProfile)
        setIsEditing(false)
      } else {
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      fullName: user.fullName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      preferredLanguage: user.preferredLanguage,
      preferredCurrency: user.preferredCurrency,
    })
    setErrors({})
    setIsEditing(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
              placeholder="Enter your full name"
            />
          ) : (
            <p className="text-slate-900">{user.fullName}</p>
          )}
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
          <div className="flex items-center gap-2">
            <p className="text-slate-900">{user.email}</p>
            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
              Primary
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Contact support to change your email address
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number <span className="text-slate-400">(Optional)</span>
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value || undefined })}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                errors.phone ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
              placeholder="+84 123 456 789"
            />
          ) : (
            <p className={user.phone ? 'text-slate-900' : 'text-slate-400 italic'}>
              {user.phone || 'Not provided'}
            </p>
          )}
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Date of Birth <span className="text-slate-400">(Optional)</span>
          </label>
          {isEditing ? (
            <input
              type="date"
              value={formatDate(formData.dateOfBirth)}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value || undefined })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          ) : (
            <p className={user.dateOfBirth ? 'text-slate-900' : 'text-slate-400 italic'}>
              {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
            </p>
          )}
        </div>

        {/* Language & Currency Preferences (Row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preferred Language <span className="text-slate-400">(Optional)</span>
            </label>
            {isEditing ? (
              <select
                value={formData.preferredLanguage || 'en'}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value || undefined })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            ) : (
              <p className={user.preferredLanguage ? 'text-slate-900' : 'text-slate-400 italic'}>
                {user.preferredLanguage === 'vi' ? 'Tiếng Việt' : user.preferredLanguage === 'en' ? 'English' : 'Not set'}
              </p>
            )}
          </div>

          {/* Preferred Currency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preferred Currency <span className="text-slate-400">(Optional)</span>
            </label>
            {isEditing ? (
              <select
                value={formData.preferredCurrency || 'VND'}
                onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value || undefined })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
              >
                <option value="VND">VND (₫)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            ) : (
              <p className={user.preferredCurrency ? 'text-slate-900' : 'text-slate-400 italic'}>
                {user.preferredCurrency || 'Not set'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
