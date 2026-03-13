import React from 'react'
import { FiUser } from 'react-icons/fi'
import type { UserProfile } from '@/lib/user-api'

interface ProfileSummaryProps {
  user: UserProfile | null
  loading?: boolean
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ user, loading }) => {
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format member since date
  const formatMemberSince = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {getInitials(user.fullName)}
          </div>
        )}

        {/* User Info */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
          <p className="text-slate-600 text-sm">{user.email}</p>
          <p className="text-slate-500 text-xs mt-1">
            Member since {formatMemberSince(user.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
