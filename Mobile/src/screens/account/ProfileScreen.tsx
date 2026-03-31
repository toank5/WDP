import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  Card,
  TextInput,
  Button,
  ActivityIndicator,
  Avatar,
  Divider,
  IconButton,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'
import { getMyProfile, updateMyProfile, type UserProfile } from '../../services/user-api'
import { Loading } from '../../components/Loading'

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSettings'>

interface FormData {
  fullName: string
  phone: string
  dateOfBirth: string
}

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    dateOfBirth: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await getMyProfile()
      setProfile(data)
      setFormData({
        fullName: data.fullName,
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth || '',
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên')
      return
    }

    setSaving(true)
    try {
      const updated = await updateMyProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
      })
      setProfile(updated)
      Alert.alert('Thành công', 'Đã cập nhật thông tin hồ sơ')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Avatar */}
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={profile?.fullName?.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() || 'U'}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <Text style={styles.headerSubtitle}>
          Cập nhật thông tin hồ sơ của bạn
        </Text>
      </View>

      {/* Profile Form */}
      <Card style={styles.card}>
        <Card.Content>
          {/* Full Name */}
          <TextInput
            label="Họ tên"
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            mode="outlined"
            style={styles.input}
            error={!formData.fullName.trim()}
          />

          {/* Email (Read-only) */}
          <TextInput
            label="Email"
            value={profile?.email || ''}
            mode="outlined"
            disabled
            style={styles.input}
          />

          {/* Phone */}
          <TextInput
            label="Số điện thoại"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            placeholder="Nhập số điện thoại (tùy chọn)"
          />

          {/* Date of Birth */}
          <TextInput
            label="Ngày sinh"
            value={formData.dateOfBirth}
            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            mode="outlined"
            placeholder="YYYY-MM-DD (tùy chọn)"
            style={styles.input}
          />

          {/* Account Info */}
          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tham gia</Text>
            <Text style={styles.infoValue}>
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cập nhật lần cuối</Text>
            <Text style={styles.infoValue}>
              {profile?.updatedAt
                ? new Date(profile.updatedAt).toLocaleDateString('vi-VN')
                : 'N/A'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.saveButton}
        contentStyle={styles.buttonContent}
      >
        Lưu thay đổi
      </Button>
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
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  input: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 12,
  },
})
