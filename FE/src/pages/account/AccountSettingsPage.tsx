import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material'
import {
  Person,
  Lock,
  Notifications,
  Save,
  Cancel,
} from '@mui/icons-material'
import { accountApi, type UserProfile, type UserPreferences } from '@/lib/account-api'

export function AccountSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form state
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Notifications state
  const [notificationsSaving, setNotificationsSaving] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [notificationsSuccess, setNotificationsSuccess] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [profileData, preferencesData] = await Promise.all([
          accountApi.getProfile(),
          accountApi.getPreferences(),
        ])
        setProfile(profileData)
        setProfileForm({
          fullName: profileData.fullName,
          phone: profileData.phone || '',
        })
        setPreferences(preferencesData)
      } catch (error) {
        console.error('Failed to load account data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleProfileSave = async () => {
    if (!profile) return

    try {
      setProfileSaving(true)
      setProfileError(null)
      setProfileSuccess(false)

      const updated = await accountApi.updateProfile({
        fullName: profileForm.fullName,
        phone: profileForm.phone || undefined,
      })

      setProfile(updated)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    try {
      setPasswordSaving(true)
      setPasswordError(null)
      setPasswordSuccess(false)

      await accountApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })

      setPasswordSuccess(true)
      setShowPasswordForm(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleNotificationToggle = async (field: keyof UserPreferences, value: boolean) => {
    if (!preferences) return

    try {
      setNotificationsSaving(true)
      setNotificationsError(null)
      setNotificationsSuccess(false)

      const updated = await accountApi.updatePreferences({
        [field]: value,
      })

      setPreferences(updated)
      setNotificationsSuccess(true)
      setTimeout(() => setNotificationsSuccess(false), 3000)
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Failed to update preferences')
    } finally {
      setNotificationsSaving(false)
    }
  }

  const hasProfileChanges =
    profile &&
    (profileForm.fullName !== profile.fullName ||
      (profileForm.phone || '') !== (profile.phone || ''))

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Account Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Manage your profile, security, and preferences
      </Typography>

      <Stack spacing={3}>
        {/* Profile Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2 }}>
                <Person sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Profile
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Your basic information
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2.5}>
              <TextField
                label="Full Name"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                fullWidth
                size="small"
              />

              <TextField
                label="Email"
                value={profile?.email}
                disabled
                fullWidth
                size="small"
                helperText="Email cannot be changed"
              />

              <TextField
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                fullWidth
                size="small"
                placeholder="Optional"
              />
            </Stack>

            {profileError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {profileError}
              </Alert>
            )}

            {profileSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Profile updated successfully
              </Alert>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={profileSaving ? <CircularProgress size={16} /> : <Save />}
                onClick={handleProfileSave}
                disabled={!hasProfileChanges || profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 2 }}>
                <Lock sx={{ color: 'warning.dark' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Security
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Change your password
                </Typography>
              </Box>
            </Box>

            {!showPasswordForm ? (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  fullWidth
                  size="small"
                  helperText="Minimum 8 characters"
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  fullWidth
                  size="small"
                  error={!!passwordError && passwordForm.confirmPassword !== passwordForm.newPassword}
                />

                {passwordError && (
                  <Alert severity="error">{passwordError}</Alert>
                )}

                {passwordSuccess && (
                  <Alert severity="success">Password changed successfully</Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      setPasswordError(null)
                    }}
                    disabled={passwordSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={passwordSaving ? <CircularProgress size={16} /> : <Save />}
                    onClick={handlePasswordChange}
                    disabled={
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword ||
                      passwordSaving
                    }
                  >
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 2 }}>
                <Notifications sx={{ color: 'info.dark' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Notifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Email preferences
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Order & Shipping Updates
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Required for order tracking
                  </Typography>
                </Box>
                <Switch checked={true} disabled />
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Product News & Offers
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Marketing emails and promotions
                  </Typography>
                </Box>
                <Switch
                  checked={preferences?.emailOffers ?? false}
                  onChange={(e) => handleNotificationToggle('emailOffers', e.target.checked)}
                  disabled={notificationsSaving}
                />
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Important Alerts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Security and account notifications
                  </Typography>
                </Box>
                <Switch
                  checked={preferences?.newCollectionAlerts ?? false}
                  onChange={(e) => handleNotificationToggle('newCollectionAlerts', e.target.checked)}
                  disabled={notificationsSaving}
                />
              </Box>
            </Stack>

            {notificationsError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {notificationsError}
              </Alert>
            )}

            {notificationsSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Preferences updated successfully
              </Alert>
            )}

            {notificationsSaving && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
