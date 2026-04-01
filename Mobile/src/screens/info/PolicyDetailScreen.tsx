import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import {
  Text,
  Surface,
  useTheme,
  IconButton,
  Divider,
  List,
} from 'react-native-paper'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

/**
 * PolicyDetailScreen - Policy pages display
 *
 * Checklist:
 * - Displays shipping policy
 * - Displays return policy
 * - Displays privacy policy
 * - Displays terms of service
 * - Handles loading states
 * - Handles error states
 * - Scrollable content
 * - Back navigation
 */
interface PolicyDetailScreenProps {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{
    PolicyDetail: {
      type: 'shipping' | 'return' | 'privacy' | 'terms'
    }
  }>
}

type PolicyType = 'shipping' | 'return' | 'privacy' | 'terms'

interface PolicySection {
  title: string
  content: string | string[]
}

// Static policy content (in production, this would come from API)
const POLICY_CONTENT: Record<PolicyType, { title: string; sections: PolicySection[] }> = {
  shipping: {
    title: 'Chính sách vận chuyển',
    sections: [
      {
        title: 'Phí vận chuyển',
        content: [
          'Miễn phí vận chuyển cho đơn hàng từ 500.000đ',
          'Phí vận chuyển tiêu chuẩn: 30.000đ',
          'Phi vận chuyển hỏa tốc: 50.000đ',
        ],
      },
      {
        title: 'Thời gian giao hàng',
        content: [
          'Nội thành Hà Nội/TP.HCM: 1-2 ngày làm việc',
          'Các tỉnh thành khác: 3-5 ngày làm việc',
          'Đơn hàng có kính theo đơn: 5-7 ngày làm việc',
        ],
      },
      {
        title: 'Theo dõi đơn hàng',
        content: 'Bạn sẽ nhận được thông tin vận chuyển qua email và SMS khi đơn hàng được gửi đi. Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi".',
      },
      {
        title: 'Điều khoản giao hàng',
        content: [
          'Chúng tôi chỉ giao hàng trong giờ hành chính (8:00 - 18:00)',
          'Vui lòng cung cấp số điện thoại chính xác để shipper liên hệ',
          'Kiểm tra hàng trước khi nhận và thanh toán (đối với COD)',
        ],
      },
    ],
  },
  return: {
    title: 'Chính sách đổi trả',
    sections: [
      {
        title: 'Điều kiện đổi trả',
        content: [
          'Sản phẩm chưa qua sử dụng',
          'Vẫn còn tem mác và nguyên vẹn',
          'Trong vòng 30 ngày kể từ ngày nhận hàng',
          'Hộp đóng gói còn nguyên vẹn',
        ],
      },
      {
        title: 'Lý do đổi trả được chấp nhận',
        content: [
          'Sai sản phẩm so với đơn đặt hàng',
          'Sản phẩm bị lỗi hoặc bị hỏng',
          'Lỗi sản xuất',
          'Kích thước không phù hợp',
          'Đổi ý (chỉ áp dụng đổi size, không hoàn tiền)',
        ],
      },
      {
        title: 'Quy trình đổi trả',
        content: [
          '1. Gửi yêu cầu đổi trả trong ứng dụng',
          '2. Chờ xác nhận từ bộ phận CSKH (trong 24h)',
          '3. Gửi sản phẩm về địa chỉ được cung cấp',
          '4. Nhận sản phẩm mới hoặc hoàn tiền sau 3-5 ngày',
        ],
      },
      {
        title: 'Chi phí đổi trả',
        content: 'Miễn phí vận chuyển cho các sản phẩm bị lỗi hoặc sai. Đổi vì lý do cá nhân sẽ chịu phí vận chuyển một chiều.',
      },
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật',
    sections: [
      {
        title: 'Thông tin thu thập',
        content: 'Chúng tôi thu thập thông tin cá nhân bao gồm: tên, email, số điện thoại, địa chỉ giao hàng, thông tin thị lực (cho đơn kính) để xử lý đơn hàng.',
      },
      {
        title: 'Mục đích sử dụng',
        content: 'Thông tin của bạn được sử dụng để: xử lý đơn hàng, giao hàng, hỗ trợ khách hàng, gửi thông tin khuyến mãi, cải thiện dịch vụ.',
      },
      {
        title: 'Bảo mật thông tin',
        content: [
          'Mật khẩu được mã hóa',
          'Thông tin thanh toán không được lưu trữ',
          'Chỉ nhân viên có thẩm quyền mới được truy cập',
          'Không chia sẻ thông tin với bên thứ ba',
        ],
      },
      {
        title: 'Quyền của khách hàng',
        content: 'Bạn có quyền: truy cập thông tin cá nhân, yêu cầu chỉnh sửa hoặc xóa thông tin, từ chối nhận email marketing.',
      },
    ],
  },
  terms: {
    title: 'Điều khoản sử dụng',
    sections: [
      {
        title: 'Chấp nhận điều khoản',
        content: 'Bằng cách sử dụng dịch vụ của EyeWear, bạn đồng ý tuân thủ các điều khoản và điều kiện này.',
      },
      {
        title: 'Đơn hàng và thanh toán',
        content: [
          'Giá cả có thể thay đổi mà không báo trước',
          'Chúng tôi có quyền hủy đơn hàng nếu sản phẩm hết hàng',
          'Thanh toán phải được hoàn tất trước khi giao hàng (không phải COD)',
        ],
      },
      {
        title: 'Sản phẩm và dịch vụ',
        content: 'Chúng tôi cam kết cung cấp sản phẩm chính hãng với chất lượng tốt nhất. Mọi hình ảnh sản phẩm đều là hình ảnh thật.',
      },
      {
        title: 'Hạn chế trách nhiệm',
        content: 'EyeWear không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng sản phẩm không đúng cách hoặc do sự cố khách quan.',
      },
    ],
  },
}

export const PolicyDetailScreen: React.FC<PolicyDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme()

  const policyType = route.params?.type || 'shipping'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const policy = POLICY_CONTENT[policyType]

  useEffect(() => {
    // Set header title
    navigation.setOptions({
      title: policy.title,
      headerShown: true,
    })
  }, [navigation, policy.title])

  const renderContent = (content: string | string[]) => {
    if (Array.isArray(content)) {
      return content.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text variant="bodyMedium" style={styles.listItemText}>
            {item}
          </Text>
        </View>
      ))
    }
    return (
      <Text variant="bodyMedium" style={styles.textContent}>
        {content}
      </Text>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <IconButton icon="alert-circle" size={64} iconColor="#f44336" />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Không thể tải chính sách
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerText}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              {policy.title}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {policy.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {section.title}
            </Text>
            <Divider style={styles.sectionDivider} />
            <View style={styles.sectionContent}>
              {renderContent(section.content)}
            </View>
          </View>
        ))}

        {/* Contact Support */}
        <Surface style={styles.supportCard} elevation={1}>
          <View style={styles.supportRow}>
            <IconButton
              icon="headphones"
              size={24}
              iconColor={theme.colors.primary}
            />
            <View style={styles.supportContent}>
              <Text variant="titleSmall" style={styles.supportTitle}>
                Cần hỗ trợ?
              </Text>
              <Text variant="bodySmall" style={styles.supportText}>
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi
              </Text>
            </View>
          </View>
          <List.Item
            title="Hotline"
            description="1900 xxxx"
            left={() => <List.Icon icon="phone" />}
          />
          <List.Item
            title="Email"
            description="support@eyewear.com"
            left={() => <List.Icon icon="email" />}
          />
        </Surface>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  header: {
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  sectionDivider: {
    marginBottom: 12,
  },
  sectionContent: {},
  textContent: {
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    marginRight: 8,
    color: '#1976d2',
  },
  listItemText: {
    flex: 1,
    lineHeight: 22,
  },
  supportCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  supportText: {
    opacity: 0.8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.6,
  },
})
