import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import {
  Text,
  Surface,
  useTheme,
  Switch,
  List,
  Divider,
  Button,
} from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/auth-store'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  getMyPreferences,
  updateMyPreferences,
  updateMyProfile,
  deleteMyAccount,
} from '../../services/user-api'

/**
 * SettingsScreen - Account preferences and settings
 *
 * Checklist:
 * - Notification preferences (order updates, promotions)
 * - Privacy settings
 * - Language preferences
 * - Currency settings
 * - Password change link
 * - Privacy policy link
 * - Terms of service link
 * - Contact support link
 * - About app info
 * - Logout button
 */
interface SettingsScreenProps {
  navigation: any
}

interface NotificationPreferences {
  orderUpdates: boolean
  promotions: boolean
  newProducts: boolean
  newsletter: boolean
}

interface Settings {
  notifications: NotificationPreferences
  language: string
  currency: string
}

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' },
]

const CURRENCIES = [
  { code: 'VND', name: 'Việt Nam Đồng (₫)', symbol: '₫' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
]

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const theme = useTheme()
  const { logout, user } = useAuthStore()

  const [settings, setSettings] = useState<Settings>({
    notifications: {
      orderUpdates: true,
      promotions: true,
      newProducts: false,
      newsletter: false,
    },
    language: 'vi',
    currency: 'VND',
  })

  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getMyPreferences()
        setSettings((prev) => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            orderUpdates: prefs.emailOffers,
            promotions: prefs.newsletterSubscribed,
            newsletter: prefs.newsletterSubscribed,
            newProducts: prefs.newCollectionAlerts,
          },
        }))
      } catch (error) {
        console.error('Load preferences error:', error)
      }
    }

    loadPreferences()
  }, [])

  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    const nextValue = !settings.notifications[key]

    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: nextValue,
      },
    }))

    try {
      await updateMyPreferences({
        emailOffers:
          key === 'orderUpdates'
            ? nextValue
            : settings.notifications.orderUpdates,
        newsletterSubscribed:
          key === 'promotions' || key === 'newsletter'
            ? nextValue
            : settings.notifications.promotions,
        newCollectionAlerts:
          key === 'newProducts'
            ? nextValue
            : settings.notifications.newProducts,
      })
    } catch (error) {
      console.error('Update preferences error:', error)
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt thông báo')
    }
  }

  const handleLanguageChange = () => {
    Alert.alert(
      'Ngôn ngữ',
      'Chọn ngôn ngữ',
      LANGUAGES.map((lang) => ({
        text: lang.name,
        onPress: () => {
          setSettings({ ...settings, language: lang.code })
          updateMyProfile({ preferredLanguage: lang.code }).catch((error) => {
            console.error('Update language error:', error)
          })
        },
      }))
    )
  }

  const handleCurrencyChange = () => {
    Alert.alert(
      'Tiền tệ',
      'Chọn đơn vị tiền tệ',
      CURRENCIES.map((curr) => ({
        text: curr.name,
        onPress: () => {
          setSettings({ ...settings, currency: curr.code })
          updateMyProfile({ preferredCurrency: curr.code }).catch((error) => {
            console.error('Update currency error:', error)
          })
        },
      }))
    )
  }

  const handleChangePassword = () => {
    navigation.navigate('SecuritySettings' as never)
  }

  const handlePrivacyPolicy = () => {
    navigation.navigate('PolicyDetail' as never, {
      type: 'privacy',
    })
  }

  const handleTermsOfService = () => {
    navigation.navigate('PolicyDetail' as never, {
      type: 'terms',
    })
  }

  const handleContactSupport = () => {
    navigation.navigate('Contact' as never)
  }

  const handleAbout = () => {
    navigation.navigate('About' as never)
  }

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            logout()
          },
        },
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tài khoản',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyAccount()
              logout()
            } catch (error) {
              console.error('Delete account error:', error)
              Alert.alert('Lỗi', 'Không thể xóa tài khoản lúc này')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Cài đặt
          </Text>
        </View>
      </Surface>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Thông báo
          </Text>

          <List.Item
            title="Cập nhật đơn hàng"
            description="Nhận thông báo khi trạng thái đơn hàng thay đổi"
            left={(props) => (
              <List.Icon
                {...props}
                icon={() => <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.primary} />}
              />
            )}
            right={() => (
              <Switch
                value={settings.notifications.orderUpdates}
                onValueChange={() => handleNotificationToggle('orderUpdates')}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Khuyến mãi"
            description="Nhận thông tin về mã giảm giá và ưu đãi"
            left={(props) => (
              <List.Icon
                {...props}
                icon={() => <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.colors.primary} />}
              />
            )}
            right={() => (
              <Switch
                value={settings.notifications.promotions}
                onValueChange={() => handleNotificationToggle('promotions')}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Sản phẩm mới"
            description="Nhận thông báo về sản phẩm mới"
            left={(props) => (
              <List.Icon
                {...props}
                icon="new-box"
                color={theme.colors.primary}
              />
            )}
            right={() => (
              <Switch
                value={settings.notifications.newProducts}
                onValueChange={() => handleNotificationToggle('newProducts')}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Bản tin"
            description="Nhận email bản tin từ chúng tôi"
            left={(props) => (
              <List.Icon
                {...props}
                icon="email"
                color={theme.colors.primary}
              />
            )}
            right={() => (
              <Switch
                value={settings.notifications.newsletter}
                onValueChange={() => handleNotificationToggle('newsletter')}
              />
            )}
          />
        </Surface>

        {/* Preferences Section */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Tùy chỉnh
          </Text>

          <List.Item
            title="Ngôn ngữ"
            description={LANGUAGES.find((l) => l.code === settings.language)?.name}
            left={(props) => <List.Icon {...props} icon="translate" />}
            onPress={handleLanguageChange}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />

          <Divider />

          <List.Item
            title="Tiền tệ"
            description={CURRENCIES.find((c) => c.code === settings.currency)?.name}
            left={(props) => <List.Icon {...props} icon="cash" />}
            onPress={handleCurrencyChange}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* Security Section */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Bảo mật
          </Text>

          <List.Item
            title="Đổi mật khẩu"
            description="Thay đổi mật khẩu đăng nhập"
            left={(props) => (
              <List.Icon
                {...props}
                icon={() => <MaterialCommunityIcons name="lock-outline" size={24} color={theme.colors.primary} />}
              />
            )}
            onPress={handleChangePassword}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />

          <Divider />

          <List.Item
            title="Chính sách bảo mật"
            description="Xem cách chúng tôi bảo vệ thông tin của bạn"
            left={(props) => (
              <List.Icon
                {...props}
                icon={() => <MaterialCommunityIcons name="eye-outline" size={24} color={theme.colors.primary} />}
              />
            )}
            onPress={handlePrivacyPolicy}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* Support Section */}
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Hỗ trợ
          </Text>

          <List.Item
            title="Điều khoản sử dụng"
            left={(props) => (
              <List.Icon
                {...props}
                icon="file-document"
                color={theme.colors.primary}
              />
            )}
            onPress={handleTermsOfService}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />

          <Divider />

          <List.Item
            title="Liên hệ hỗ trợ"
            description="Cần giúp đỡ? Liên hệ với chúng tôi"
            left={(props) => (
              <List.Icon
                {...props}
                icon={() => <MaterialCommunityIcons name="message-outline" size={24} color={theme.colors.primary} />}
              />
            )}
            onPress={handleContactSupport}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />

          <Divider />

          <List.Item
            title="Về ứng dụng"
            description="Phiên bản và thông tin ứng dụng"
            left={(props) => (
              <List.Icon
                {...props}
                icon={() => <MaterialCommunityIcons name="information-outline" size={24} color={theme.colors.primary} />}
              />
            )}
            onPress={handleAbout}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* Danger Zone */}
        <Surface style={[styles.section, styles.dangerSection]} elevation={1}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
          >
            Đăng xuất
          </Button>

          <Button
            mode="text"
            onPress={handleDeleteAccount}
            textColor="#f44336"
            style={styles.deleteAccountButton}
          >
            Xóa tài khoản
          </Button>
        </Surface>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text variant="bodySmall" style={styles.versionText}>
            EyeWear Mobile v1.0.0
          </Text>
          <Text variant="bodySmall" style={styles.versionText}>
            © {new Date().getFullYear()} EyeWear. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
  },
  headerContent: {
    padding: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  dangerSection: {
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    marginBottom: 8,
  },
  deleteAccountButton: {
    marginTop: 8,
  },
  versionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    opacity: 0.6,
    marginBottom: 4,
  },
})
