import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import {
  Text,
  Card,
  List,
  Divider,
  Avatar,
  IconButton,
  Button,
  Dialog,
  Portal,
} from 'react-native-paper'
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
  showChevron?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  {
    icon: 'account-edit',
    title: 'Profile',
    subtitle: 'Update your name, email, and phone',
    onPress: (nav) => (nav as any).navigate('ProfileSettings'),
    showChevron: true,
  },
  {
    icon: 'map-marker',
    title: 'Shipping address',
    subtitle: 'Manage your default delivery addresses',
    onPress: (nav) => (nav as any).navigate('AddressManagement'),
    showChevron: true,
  },
  {
    icon: 'heart',
    title: 'Favorites',
    subtitle: 'View your saved products',
    onPress: (nav) => (nav as any).navigate('Favorites'),
    showChevron: true,
  },
  {
    icon: 'receipt',
    title: 'Order history',
    subtitle: 'View and track your orders',
    onPress: (nav) => (nav as any).navigate('OrderHistory'),
    showChevron: true,
  },
  {
    icon: 'shield-lock',
    title: 'Security',
    subtitle: 'Change password and security settings',
    onPress: (nav) => (nav as any).navigate('SecuritySettings'),
    showChevron: true,
  },
  {
    icon: 'help-circle',
    title: 'Help & Support',
    subtitle: 'FAQs and contact options',
    onPress: (nav) => (nav as any).navigate('Contact'),
    showChevron: true,
  },
  {
    icon: 'information',
    title: 'About Us',
    subtitle: 'Company information',
    onPress: (nav) => (nav as any).navigate('About'),
    showChevron: true,
  },
]

interface ProfileCardProps {
  user: any
  navigation: NavigationProp<MainTabParamList & RootStackParamList>
}

function ProfileCard({ user, navigation }: ProfileCardProps) {
  const theme = useTheme()

  return (
    <Card style={styles.profileCard}>
      <View style={styles.profileContent}>
        <Avatar.Text
          size={60}
          label={user?.fullName?.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || 'U'}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
        <IconButton
          icon="pencil"
          size={20}
          onPress={() => (navigation as any).navigate('ProfileSettings')}
          style={styles.editButton}
          iconColor={theme.colors.primary}
        />
      </View>
    </Card>
  )
}

function MenuItemComponent({ item, navigation }: { item: MenuItem; navigation: NavigationProp<MainTabParamList & RootStackParamList> }) {
  const theme = useTheme()

  return (
    <List.Item
      title={item.title}
      description={item.subtitle}
      left={(props) => (
        <List.Icon
          {...props}
          icon={item.icon}
          color={theme.colors.primary}
        />
      )}
      right={(props) =>
        item.showChevron ? (
          <List.Icon {...props} icon="chevron-right" />
        ) : null
      }
      onPress={() => item.onPress(navigation)}
      style={styles.menuItem}
      titleStyle={styles.menuItemTitle}
      descriptionStyle={styles.menuItemDescription}
    />
  )
}

export function AccountScreen({ navigation }: Props) {
  const theme = useTheme()
  const { user, logout } = useAuthStore()
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false)

  const handleLogout = () => {
    logout()
    setLogoutDialogVisible(false)
    // Navigation will be handled by auth state change
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <ProfileCard user={user} navigation={navigation} />

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <View key={index}>
            <MenuItemComponent item={item} navigation={navigation} />
            {index < MENU_ITEMS.length - 1 && <Divider />}
          </View>
        ))}
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appCopyright}>© 2026 Glasses Platform</Text>
      </View>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={() => setLogoutDialogVisible(true)}
        style={styles.logoutButton}
        icon="logout"
        textColor={theme.colors.error}
      >
        Sign out
      </Button>

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
    backgroundColor: '#d1fae5',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#d1fae5',
  },
  avatar: {
    backgroundColor: '#6366f1',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  editButton: {
    margin: 0,
  },
  menuCard: {
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 4,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
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
  logoutButton: {
    marginBottom: 24,
    borderRadius: 12,
  },
  dialogText: {
    fontSize: 16,
    color: '#475569',
  },
})
