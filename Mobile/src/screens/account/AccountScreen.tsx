import React, { useCallback } from 'react'
import { View, StyleSheet, ScrollView, Image } from 'react-native'
import {
  Text,
  Button,
  Surface,
  useTheme,
  Avatar,
  IconButton,
  Divider,
  List,
} from 'react-native-paper'
import { useAuthStore } from '../../store/auth-store'
import { useCartStore } from '../../store/cart-store'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

interface MenuItem {
  id: string
  title: string
  icon: string
  description?: string
  badge?: number
  route?: string
  onPress?: () => void
}

/**
 * AccountScreen - User account home screen
 *
 * Features:
 * - Display user profile
 * - Menu options (orders, prescriptions, addresses, settings, logout)
 * - Logout functionality
 */
export const AccountScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation() as NativeStackNavigationProp<any>
  const { user, logout } = useAuthStore()
  const { itemCount } = useCartStore()

  const menuItems: MenuItem[] = React.useMemo(() => {
    return [
      {
        id: 'orders',
        title: 'Đơn hàng của tôi',
        icon: 'package-variant-closed',
        description: 'Xem lịch sử và trạng thái đơn hàng',
        route: 'OrderHistory',
      },
      {
        id: 'prescriptions',
        title: 'Đơn kính của tôi',
        icon: 'clipboard-text',
        description: 'Quản lý các đơn kính đã lưu',
        route: 'PrescriptionList',
      },
      {
        id: 'addresses',
        title: 'Sổ địa chỉ',
        icon: 'map-marker',
        description: 'Quản lý địa chỉ giao hàng',
        route: 'AddressManagement',
      },
      {
        id: 'settings',
        title: 'Cài đặt tài khoản',
        icon: 'cog',
        description: 'Chỉnh sửa thông tin cá nhân',
        route: 'ProfileSettings',
      },
      {
        id: 'about',
        title: 'Về chúng tôi',
        icon: 'information',
        description: 'Thông tin về ứng dụng',
        route: 'About',
      },
      {
        id: 'contact',
        title: 'Liên hệ',
        icon: 'email',
        description: 'Gửi phản hồi hoặc hỗ trợ',
        route: 'Contact',
      },
      {
        id: 'logout',
        title: 'Đăng xuất',
        icon: 'logout',
        description: 'Thoát khỏi tài khoản',
        onPress: handleLogout,
      },
    ]
  }, [user])

  const handleMenuPress = useCallback((item: MenuItem) => {
    if (item.onPress) {
      item.onPress()
    } else if (item.route) {
      navigation.navigate(item.route as never)
    }
  }, [navigation])

  const handleLogout = useCallback(() => {
    // Clear cart on logout
    // TODO: Add logout confirmation dialog

    // Perform logout
    logout()

    // Navigate to Store
    navigation.navigate('Store' as never)
  }, [logout, navigation])

  const handleProfilePress = useCallback(() => {
    navigation.navigate('ProfileSettings' as never)
  }, [navigation])

  const handleOrderHistoryPress = useCallback(() => {
    navigation.navigate('OrderHistory' as never)
  }, [navigation])

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Tài khoản
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <Surface style={styles.profileCard} elevation={1}>
          <View style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={user?.name?.charAt(0) || 'U'}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="titleLarge" style={styles.userName}>
                {user?.name || 'Người dùng'}
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {user?.email || 'email@example.com'}
              </Text>
              <Text variant="bodySmall" style={styles.memberSince}>
                Thành viên từ: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleProfilePress}
            style={styles.editProfileButton}
            contentStyle={styles.editProfileButtonContent}
            icon="pencil"
          >
            Chỉnh sửa hồ sơ
          </Button>
        </Surface>

        {/* Quick Actions */}
        <Surface style={styles.quickActionsCard} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Hành động nhanh
          </Text>

          <View style={styles.quickActionsRow}>
            <View style={styles.quickAction}>
              <IconButton
                icon="package-variant-closed"
                size={28}
                onPress={handleOrderHistoryPress}
                style={styles.quickActionIcon}
              />
              <Text variant="bodySmall" style={styles.quickActionLabel}>
                Đơn hàng
              </Text>
            </View>

            <View style={styles.quickAction}>
              <IconButton
                icon="cart"
                size={28}
                onPress={() => navigation.navigate('Cart' as never)}
                style={styles.quickActionIcon}
              />
              <Text variant="bodySmall" style={styles.quickActionLabel}>
                Giỏ hàng
                {itemCount > 0 && (
                  <Text style={styles.quickActionBadge}>{itemCount}</Text>
                )}
              </Text>
            </View>

            <View style={styles.quickAction}>
              <IconButton
                icon="heart"
                size={28}
                onPress={() => navigation.navigate('Favorites' as never)}
                style={styles.quickActionIcon}
              />
              <Text variant="bodySmall" style={styles.quickActionLabel}>
                Yêu thích
              </Text>
            </View>

            <View style={styles.quickAction}>
              <IconButton
                icon="help-circle"
                size={28}
                onPress={() => navigation.navigate('Contact' as never)}
                style={styles.quickActionIcon}
              />
              <Text variant="bodySmall" style={styles.quickActionLabel}>
                Hỗ trợ
              </Text>
            </View>
          </View>
        </Surface>

        {/* Menu Items */}
        <Surface style={styles.menuCard} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Cài đặt
          </Text>

          {menuItems.map((item) => (
            <List.Item
              key={item.id}
              title={item.title}
              description={item.description}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={item.icon}
                  color={
                    item.id === 'logout'
                      ? theme.colors.error
                      : theme.colors.primary
                  }
                />
              )}
              right={(props) =>
                item.badge ? (
                  <Text style={styles.badge}>{item.badge}</Text>
                ) : (
                  <List.Icon {...props} icon="chevron-right" />
                )
              }
              onPress={() => handleMenuPress(item)}
              style={
                item.id === 'logout'
                  ? styles.logoutItem
                  : styles.menuItem
              }
              titleStyle={
                item.id === 'logout'
                  ? styles.logoutTitle
                  : styles.menuTitle
              }
            />
          ))}
        </Surface>

        {/* App Info */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Thông tin ứng dụng
          </Text>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Phiên bản:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              1.0.0
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Xây dựng:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              WDP Team
            </Text>
          </View>

          <Button
            mode="text"
            onPress={() => navigation.navigate('About' as never)}
            style={styles.moreInfoButton}
          >
            Xem thêm thông tin
          </Button>
        </Surface>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    opacity: 0.8,
    marginBottom: 4,
  },
  memberSince: {
    opacity: 0.6,
    fontSize: 12,
  },
  editProfileButton: {
    borderRadius: 8,
  },
  editProfileButtonContent: {
    paddingVertical: 8,
  },
  quickActionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  quickActionBadge: {
    backgroundColor: theme => theme.colors.error,
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 4,
  },
  menuTitle: {
    fontWeight: '500',
  },
  logoutItem: {
    backgroundColor: '#ffebee',
    paddingVertical: 4,
  },
  logoutTitle: {
    color: '#c62828',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#e53935',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: '500',
  },
  moreInfoButton: {
    marginTop: 8,
  },
})
