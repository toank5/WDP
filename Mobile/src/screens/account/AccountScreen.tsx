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
  onPress: () => void
  showChevron?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  {
    icon: 'account-edit',
    title: 'Thông tin cá nhân',
    subtitle: 'Cập nhật tên, email, số điện thoại',
    onPress: () => {},
    showChevron: true,
  },
  {
    icon: 'map-marker',
    title: 'Địa chỉ giao hàng',
    subtitle: 'Quản lý địa chỉ giao hàng mặc định',
    onPress: () => {},
    showChevron: true,
  },
  {
    icon: 'heart',
    title: 'Danh sách yêu thích',
    subtitle: 'Xem các sản phẩm đã lưu',
    onPress: () => {},
    showChevron: true,
  },
  {
    icon: 'receipt',
    title: 'Lịch sử đơn hàng',
    subtitle: 'Xem và theo dõi đơn hàng',
    onPress: () => {},
    showChevron: true,
  },
  {
    icon: 'bell',
    title: 'Thông báo',
    subtitle: 'Quản lý thông báo của bạn',
    onPress: () => {},
    showChevron: true,
  },
  {
    icon: 'shield-lock',
    title: 'Bảo mật',
    subtitle: 'Thay đổi mật khẩu và cài đặt bảo mật',
    onPress: () => {},
    showChevron: true,
  },
  {
    icon: 'help-circle',
    title: 'Trợ giúp & Hỗ trợ',
    subtitle: 'Câu hỏi thường gặp và liên hệ',
    onPress: () => {},
    showChevron: true,
  },
  {
    icon: 'information',
    title: 'Về chúng tôi',
    subtitle: 'Thông tin về công ty',
    onPress: () => {},
    showChevron: true,
  },
]

interface ProfileCardProps {
  user: any
  onEditProfile: () => void
}

function ProfileCard({ user, onEditProfile }: ProfileCardProps) {
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
          <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
        <IconButton
          icon="pencil"
          size={20}
          onPress={onEditProfile}
          style={styles.editButton}
          iconColor={theme.colors.primary}
        />
      </View>
    </Card>
  )
}

function MenuItemComponent({ item }: { item: MenuItem }) {
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
      onPress={item.onPress}
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
      <ProfileCard user={user} onEditProfile={() => console.log('Navigate to edit profile')} />

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <View key={index}>
            <MenuItemComponent item={item} />
            {index < MENU_ITEMS.length - 1 && <Divider />}
          </View>
        ))}
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
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
        Đăng xuất
      </Button>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>Xác nhận đăng xuất</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              Hủy
            </Button>
            <Button
              onPress={handleLogout}
              textColor={theme.colors.error}
            >
              Đăng xuất
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
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  avatar: {
    backgroundColor: '#3b82f6',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
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
