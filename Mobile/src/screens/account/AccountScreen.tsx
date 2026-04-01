import React, { useMemo, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Surface, Avatar, IconButton, Button, Dialog, Portal, TouchableRipple, ActivityIndicator } from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NavigationProp } from '@react-navigation/native'
import type { MainTabParamList, RootStackParamList } from '../../types'
import { useAuthStore } from '../../store/auth-store'

type Props = {
  navigation: NavigationProp<MainTabParamList & RootStackParamList>
}

interface MenuItem {
  icon: string
  title: string
  subtitle?: string
  onPress: (navigation: NavigationProp<MainTabParamList & RootStackParamList>) => void
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Shopping',
    items: [
      {
        icon: 'receipt-text-outline',
        title: 'Orders',
        subtitle: 'View and track your purchases',
        onPress: (nav) => (nav as any).navigate('OrderHistory'),
      },
      {
        icon: 'undo-variant',
        title: 'Returns',
        subtitle: 'Start return requests from order details',
        onPress: (nav) => (nav as any).navigate('OrderHistory'),
      },
      {
        icon: 'heart-outline',
        title: 'Favorites',
        subtitle: 'Manage your wishlist items',
        onPress: (nav) => (nav as any).navigate('Favorites'),
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        icon: 'account-circle-outline',
        title: 'Profile & Personal Info',
        subtitle: 'Update your name, email, and phone',
        onPress: (nav) => (nav as any).navigate('ProfileSettings'),
      },
      {
        icon: 'map-marker-outline',
        title: 'Addresses',
        subtitle: 'Manage your delivery addresses',
        onPress: (nav) => (nav as any).navigate('AddressManagement'),
      },
      {
        icon: 'shield-lock-outline',
        title: 'Security',
        subtitle: 'Password and account security',
        onPress: (nav) => (nav as any).navigate('SecuritySettings'),
      },
    ],
  },
  {
    title: 'App & Support',
    items: [
      {
        icon: 'bell-outline',
        title: 'Notifications & Settings',
        subtitle: 'Control alerts and app preferences',
        onPress: (nav) => (nav as any).navigate('Settings'),
      },
      {
        icon: 'help-circle-outline',
        title: 'Help / Contact Support',
        subtitle: 'Get help from our support team',
        onPress: (nav) => (nav as any).navigate('Contact'),
      },
      {
        icon: 'information-outline',
        title: 'About / Legal',
        subtitle: 'App info, policies, and legal',
        onPress: (nav) => (nav as any).navigate('About'),
      },
    ],
  },
]

interface ProfileHeaderProps {
  user: any
  loading: boolean
  isAuthenticated: boolean
  navigation: NavigationProp<MainTabParamList & RootStackParamList>
}

function ProfileHeader({ user, loading, isAuthenticated, navigation }: ProfileHeaderProps) {
  const theme = useTheme()

  const initials = useMemo(() => {
    const fullName = user?.fullName?.trim()
    if (fullName) {
      const parts = fullName.split(' ').filter(Boolean)
      const first = parts[0]?.[0] || ''
      const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : ''
      return `${first}${last}`.toUpperCase() || 'U'
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }, [user])

  return (
    <Surface style={styles.profileCard} elevation={1}>
      <View style={styles.profileContent}>
        <Avatar.Text
          size={62}
          label={initials}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          {loading ? (
            <View style={styles.profileLoading}>
              <ActivityIndicator size="small" />
              <Text style={styles.profileLoadingText}>Loading account...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{user?.fullName || (isAuthenticated ? 'User' : 'Guest')}</Text>
              <Text style={styles.userEmail}>{user?.email || (isAuthenticated ? 'No email available' : 'Please sign in to continue')}</Text>
            </>
          )}
        </View>

        {isAuthenticated ? (
          <Button
            mode="outlined"
            compact
            icon="pencil-outline"
            style={styles.editProfileButton}
            onPress={() => (navigation as any).navigate('ProfileSettings')}
          >
            Edit
          </Button>
        ) : null}
      </View>
    </Surface>
  )
}

function SettingsRow({ item, navigation, isLast }: { item: MenuItem; navigation: NavigationProp<MainTabParamList & RootStackParamList>; isLast: boolean }) {
  const theme = useTheme()

  return (
    <TouchableRipple onPress={() => item.onPress(navigation)} borderless={false}>
      <View style={[styles.rowContainer, !isLast && styles.rowDivider]}>
        <View style={styles.rowLeft}>
          <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
            <IconButton icon={item.icon} size={18} iconColor={theme.colors.primary} style={styles.rowIcon} />
          </View>

          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            {!!item.subtitle && <Text style={styles.rowSubtitle}>{item.subtitle}</Text>}
          </View>
        </View>

        <IconButton icon="chevron-right" size={18} iconColor={theme.colors.onSurfaceDisabled} style={styles.rowChevron} />
      </View>
    </TouchableRipple>
  )
}

export function AccountScreen({ navigation }: Props) {
  const theme = useTheme()
  const { user, logout, _hydrated, isAuthenticated } = useAuthStore()
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setLogoutDialogVisible(false)
      ;(navigation as any).reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader user={user} loading={!_hydrated} isAuthenticated={isAuthenticated} navigation={navigation} />

      {isAuthenticated ? (
        MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Surface style={styles.sectionCard} elevation={1}>
              {section.items.map((item, index) => (
                <SettingsRow
                  key={item.title}
                  item={item}
                  navigation={navigation}
                  isLast={index === section.items.length - 1}
                />
              ))}
            </Surface>
          </View>
        ))
      ) : (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Welcome</Text>
          <Surface style={styles.guestCard} elevation={1}>
            <Text style={styles.guestTitle}>You are signed out</Text>
            <Text style={styles.guestSubtitle}>Sign in to view orders, addresses, favorites, and account settings.</Text>
            <View style={styles.guestActions}>
              <Button
                mode="contained"
                onPress={() => (navigation as any).reset({ index: 0, routes: [{ name: 'Auth' }] })}
                style={styles.guestActionButton}
              >
                Login
              </Button>
              <Button
                mode="outlined"
                onPress={() => (navigation as any).reset({ index: 0, routes: [{ name: 'Auth' }] })}
                style={styles.guestActionButton}
              >
                Register
              </Button>
            </View>
          </Surface>
        </View>
      )}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appCopyright}>© 2026 Glasses Platform</Text>
      </View>

      {isAuthenticated ? (
        <Surface style={styles.logoutCard} elevation={1}>
          <TouchableRipple onPress={() => setLogoutDialogVisible(true)} borderless={false}>
            <View style={styles.logoutRow}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconWrap, styles.logoutIconWrap]}>
                  <IconButton icon="logout" size={18} iconColor={theme.colors.error} style={styles.rowIcon} />
                </View>
                <Text style={styles.logoutText}>Log out</Text>
              </View>
              <IconButton icon="chevron-right" size={18} iconColor={theme.colors.error} style={styles.rowChevron} />
            </View>
          </TouchableRipple>
        </Surface>
      ) : null}

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>Confirm sign out</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Are you sure you want to sign out of your account?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={handleLogout}
              textColor={theme.colors.error}
            >
              Sign out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    backgroundColor: '#2563eb',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  editProfileButton: {
    borderRadius: 999,
  },
  profileLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileLoadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  guestCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  guestSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
  },
  guestActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  guestActionButton: {
    flex: 1,
    borderRadius: 10,
  },
  rowContainer: {
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIcon: {
    margin: 0,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  rowChevron: {
    margin: 0,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  appVersion: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#94a3b8',
  },
  logoutCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  logoutRow: {
    minHeight: 64,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutIconWrap: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
  dialogText: {
    fontSize: 16,
    color: '#475569',
  },
})
