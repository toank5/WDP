import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Image,
} from 'react-native'
import {
  Text,
  Card,
  TextInput,
  Button,
  List,
  Divider,
  Avatar,
  IconButton,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'

type Props = NativeStackScreenProps<RootStackParamList, any>

interface FormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const CONTACT_INFO = {
  address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
  phone: '1900 1234',
  email: 'support@wdpglasses.com',
  workingHours: 'Thứ 2 - CN: 8:00 - 21:00',
}

const SUBJECT_OPTIONS = [
  'Vấn đề đơn hàng',
  'Câu hỏi về đơn thuốc',
  'Hỏi về sản phẩm',
  'Đổi trả hàng',
  'Hợp tác',
  'Khác',
]

const SOCIAL_LINKS = [
  { icon: 'facebook', url: 'https://facebook.com/wdpglasses', color: '#1877F2' },
  { icon: 'instagram', url: 'https://instagram.com/wdpglasses', color: '#E4405F' },
  { icon: 'twitter', url: 'https://twitter.com/wdpglasses', color: '#1DA1F2' },
  { icon: 'youtube', url: 'https://youtube.com/wdpglasses', color: '#FF0000' },
]

const QUICK_LINKS = [
  { label: 'Hướng dẫn đo mắt', route: 'PrescriptionList' },
  { label: 'Mua gọng kính', route: 'HomeTab' },
  { label: 'Chính sách đổi trả', url: 'https://wdpglasses.com/return-policy' },
  { label: 'Thông tin vận chuyển', url: 'https://wdpglasses.com/shipping' },
]

export function ContactScreen({ navigation }: Props) {
  const theme = useTheme()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên của bạn'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên phải có ít nhất 2 ký tự'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Vui lòng chọn chủ đề'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Vui lòng nhập nội dung tin nhắn'
    } else if (formData.message.length < 10) {
      newErrors.message = 'Nội dung phải có ít nhất 10 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // TODO: Implement actual contact form submission API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      Alert.alert(
        'Thành công',
        'Đã gửi tin nhắn của bạn. Chúng tôi sẽ phản hồi sớm nhất có thể!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      console.error('Failed to submit contact form:', error)
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    )
  }

  const handlePhonePress = () => {
    Linking.openURL(`tel:${CONTACT_INFO.phone}`).catch((err) =>
      console.error('Failed to open phone:', err)
    )
  }

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${CONTACT_INFO.email}`).catch((err) =>
      console.error('Failed to open email:', err)
    )
  }

  const handleMapPress = () => {
    const address = encodeURIComponent(CONTACT_INFO.address)
    Linking.openURL(`https://maps.google.com/?q=${address}`).catch((err) =>
      console.error('Failed to open map:', err)
    )
  }

  const handleSocialPress = (url: string) => {
    handleLinkPress(url)
  }

  const InfoItem = ({ icon, label, value, onPress }: {
    icon: string
    label: string
    value: string
    onPress?: () => void
  }) => (
    <View style={styles.infoRow}>
      <Avatar.Text
        size={48}
        label={icon}
        style={[styles.infoIcon, { backgroundColor: `${theme.colors.primary}15` }]}
        labelStyle={styles.infoIconLabel}
      />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, onPress && styles.infoValueLink]}
          onPress={onPress}
        >
          {value}
        </Text>
      </View>
    </View>
  )

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroOverline}>GET IN TOUCH</Text>
          <Text style={styles.heroTitle}>We're Here to Help</Text>
          <Text style={styles.heroSubtitle}>
            Choose the best way to reach us. We typically respond within 24 hours.
          </Text>
        </View>
      </View>

      {/* Contact Info Card */}
      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
            <Text style={styles.cardSubtitle}>
              Liên hệ với chúng tôi qua bất kỳ kênh nào
            </Text>
          </View>

          <Divider style={styles.cardDivider} />

          <View style={styles.cardContent}>
            <InfoItem
              icon="📍"
              label="Địa chỉ"
              value={CONTACT_INFO.address}
              onPress={handleMapPress}
            />
            <Divider />
            <InfoItem
              icon="📞"
              label="Điện thoại"
              value={CONTACT_INFO.phone}
              onPress={handlePhonePress}
            />
            <Divider />
            <InfoItem
              icon="✉️"
              label="Email"
              value={CONTACT_INFO.email}
              onPress={handleEmailPress}
            />
            <Divider />
            <InfoItem
              icon="⏰"
              label="Giờ làm việc"
              value={CONTACT_INFO.workingHours}
            />

            {/* Social Media */}
            <View style={styles.socialSection}>
              <Text style={styles.socialTitle}>Theo dõi chúng tôi</Text>
              <View style={styles.socialButtons}>
                {SOCIAL_LINKS.map((social, index) => (
                  <IconButton
                    key={index}
                    icon={social.icon}
                    size={28}
                    mode="contained"
                    style={[styles.socialButton, { backgroundColor: `${social.color}20` }]}
                    iconColor={social.color}
                    onPress={() => handleSocialPress(social.url)}
                  />
                ))}
              </View>
            </View>

            {/* Quick Links */}
            <View style={styles.quickLinksSection}>
              <Text style={styles.quickLinksTitle}>Liên kết nhanh</Text>
              <View style={styles.quickLinks}>
                {QUICK_LINKS.map((link, index) => (
                  <Button
                    key={index}
                    mode="text"
                    onPress={() => {
                      if (link.url) {
                        handleLinkPress(link.url)
                      } else if (link.route) {
                        navigation.navigate(link.route as any)
                      }
                    }}
                    style={styles.quickLinkButton}
                  >
                    {link.label}
                  </Button>
                ))}
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Contact Form Card */}
      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Gửi tin nhắn</Text>
            <Text style={styles.cardSubtitle}>
              Điền form dưới đây và chúng tôi sẽ phản hồi sớm nhất có thể
            </Text>
          </View>

          <Divider style={styles.cardDivider} />

          <View style={styles.cardContent}>
            <TextInput
              label="Họ tên"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text })
                setErrors({ ...errors, name: '' })
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text })
                setErrors({ ...errors, email: '' })
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!errors.email}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
              label="Số điện thoại (tùy chọn)"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              label="Chủ đề"
              value={formData.subject}
              onChangeText={(text) => {
                setFormData({ ...formData, subject: text })
                setErrors({ ...errors, subject: '' })
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.subject}
            />
            {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}

            <TextInput
              label="Nội dung"
              value={formData.message}
              onChangeText={(text) => {
                setFormData({ ...formData, message: text })
                setErrors({ ...errors, message: '' })
              }}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, styles.textArea]}
              error={!!errors.message}
            />
            {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}

            <View style={styles.submitSection}>
              <Text style={styles.submitInfo}>
                Về các vấn đề khẩn cấp, vui lòng gọi cho chúng tôi tại{' '}
                <Text style={styles.submitHighlight}>{CONTACT_INFO.phone}</Text>
              </Text>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
              >
                {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </Button>
            </View>
          </View>
        </Card>
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        <Card style={styles.mapCard}>
          <View style={styles.mapContainer}>
            <Text style={styles.mapLabel}>📍 {CONTACT_INFO.address}</Text>
          </View>
        </Card>
      </View>

      {/* FAQ Card */}
      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Câu hỏi thường gặp</Text>
          </View>

          <Divider style={styles.cardDivider} />

          <View style={styles.cardContent}>
            <List.Item
              title="Làm thế nào để theo dõi đơn hàng?"
              description="Bạn có thể xem trạng thái đơn hàng trong mục Lịch sử đơn hàng"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => navigation.navigate('OrderHistory' as any)}
            />
            <Divider />
            <List.Item
              title="Chính sách đổi trả?"
              description="Đổi trả trong vòng 30 ngày với điều kiện áp dụng"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => handleLinkPress('https://wdpglasses.com/return-policy')}
            />
            <Divider />
            <List.Item
              title="Cách thức thanh toán?"
              description="Thanh toán qua VNPay hoặc COD khi nhận hàng"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 200,
  },
  heroContent: {
    maxWidth: 600,
  },
  heroOverline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
    textAlign: 'center',
  },
  cardContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  cardDivider: {
    marginVertical: 16,
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoIconLabel: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  infoValueLink: {
    color: '#3b82f6',
  },
  socialSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  socialButton: {
    margin: 0,
  },
  quickLinksSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  quickLinksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickLinkButton: {
    padding: 0,
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    height: 120,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 8,
    marginLeft: 12,
  },
  submitSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitInfo: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  submitHighlight: {
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
  mapSection: {
    padding: 16,
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 300,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
})
