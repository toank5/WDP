import React, { useState } from 'react'
import { FiShield, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi'
import { toast } from 'sonner'
import { changePassword } from '@/lib/user-api'
import type { ChangePasswordRequest } from '@/lib/user-api'

export const SecurityCard: React.FC = () => {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    return passwordRegex.test(password)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword =
        'Password must be at least 8 characters with uppercase, lowercase, and number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await changePassword(formData)
      toast.success('Password changed successfully')
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({})
      setShowChangePassword(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
          <FiShield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Security</h3>
          <p className="text-sm text-slate-500">Manage your password and account security</p>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-6">
        {/* Current Password Status */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-900">Password</p>
            <p className="text-sm text-slate-500 mt-1">
              {"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
            </p>
          </div>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {showChangePassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {/* Change Password Form */}
        {showChangePassword && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, currentPassword: e.target.value })
                    delete errors.currentPassword
                  }}
                  className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${
                    errors.currentPassword ? 'border-red-300' : 'border-slate-300'
                  } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, newPassword: e.target.value })
                    delete errors.newPassword
                  }}
                  className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${
                    errors.newPassword ? 'border-red-300' : 'border-slate-300'
                  } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.new ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    delete errors.confirmPassword
                  }}
                  className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
                  } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.confirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false)
                  setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                  setErrors({})
                }}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Danger Zone */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-3">Danger Zone</p>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                toast.error('Account deletion requires confirmation from support')
              }
            }}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete Account
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Contact support to permanently delete your account and all data
          </p>
        </div>
      </div>
    </div>
  )
}
