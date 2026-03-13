import React, { useState, useEffect } from 'react'
import { FiMail, FiTag, FiBell } from 'react-icons/fi'
import { toast } from 'sonner'
import type { UserPreferences, UpdatePreferencesRequest } from '@/lib/user-api'
import { getMyPreferences, updateMyPreferences } from '@/lib/user-api'

interface PreferencesCardProps {
  initialPreferences?: UserPreferences
}

export const PreferencesCard: React.FC<PreferencesCardProps> = ({ initialPreferences }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    newsletterSubscribed: false,
    emailOffers: false,
    newCollectionAlerts: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getMyPreferences()
        setPreferences(prefs)
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }

    if (!initialPreferences) {
      loadPreferences()
    } else {
      setPreferences(initialPreferences)
    }
  }, [initialPreferences])

  const handleToggle = async (key: keyof UpdatePreferencesRequest) => {
    const newValue = !preferences[key as keyof UserPreferences]

    // Optimistic update
    setPreferences((prev) => ({
      ...prev,
      [key]: newValue,
    }))

    setIsLoading(true)
    try {
      const updated = await updateMyPreferences({ [key]: newValue })
      setPreferences(updated)
      toast.success('Preferences updated')
    } catch (error) {
      // Revert on error
      setPreferences((prev) => ({
        ...prev,
        [key]: !newValue,
      }))
      toast.error(error instanceof Error ? error.message : 'Failed to update preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const preferencesItems = [
    {
      key: 'newsletterSubscribed' as const,
      icon: FiMail,
      title: 'Newsletter Subscription',
      description: 'Receive our monthly newsletter with updates and promotions',
    },
    {
      key: 'emailOffers' as const,
      icon: FiTag,
      title: 'Email Offers',
      description: 'Get exclusive deals and discounts delivered to your inbox',
    },
    {
      key: 'newCollectionAlerts' as const,
      icon: FiBell,
      title: 'New Collection Alerts',
      description: 'Be the first to know when we add new products',
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Communication Preferences</h3>
        <p className="text-sm text-slate-500 mt-1">
          Choose what emails you'd like to receive from us
        </p>
      </div>

      <div className="p-6 space-y-4">
        {preferencesItems.map((item) => {
          const Icon = item.icon
          const isEnabled = preferences[item.key]

          return (
            <div
              key={item.key}
              className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className={`p-2.5 rounded-lg ${isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900">{item.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{item.description}</p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(item.key)}
                disabled={isLoading}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
