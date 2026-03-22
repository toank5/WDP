import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Image,
} from 'react-native'
import {
  Text,
  Card,
  Avatar,
  Button,
} from 'react-native-paper'
import { useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types'

type Props = NativeStackScreenProps<RootStackParamList, any>

export function AboutScreen({ navigation }: Props) {
  const theme = useTheme()

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroOverline}>ABOUT EYEWEAR</Text>
          <Text style={styles.heroTitle}>
            See World{' '}
            <Text style={[styles.heroHighlight, { color: '#93c5fd' }]}>
              Differently
            </Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Redefining how you buy glasses. Convenience, style, and clarity delivered to your door.
          </Text>
          <View style={styles.heroButtons}>
            <Button
              mode="contained"
              buttonColor="white"
              textColor={theme.colors.primary}
              onPress={() => navigation.goBack()}
              style={styles.heroButton}
            >
              Shop Now
            </Button>
            <Button
              mode="outlined"
              textColor="white"
              onPress={() => handleLinkPress('https://wdpglasses.com/virtual-tryon')}
              style={[styles.heroButton, styles.heroButtonOutlined]}
            >
              Try Virtual
            </Button>
          </View>
        </View>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/128/3416.png' }}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* Our Story Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.overline, { color: theme.colors.primary }]}>
            OUR STORY
          </Text>
          <Text style={styles.sectionTitle}>Why We Started EyeWear</Text>
        </View>
        <Card style={styles.storyCard}>
          <Text style={styles.storyText}>
            We've all been there—spending hours traveling to optical stores, waiting in line, only to find limited options and pushy salespeople. The frames you want are out of stock, and ones available don't quite fit your style.
          </Text>
          <Text style={[styles.storyText, styles.storyTextHighlight]}>
            We knew there had to be a better way.
          </Text>
          <Text style={styles.storyText}>
            EyeWear was born from a simple idea: what if you could browse hundreds of frames, try them on virtually, and get prescription glasses delivered to your door—all from comfort of your home?
          </Text>
          <Text style={styles.storyText}>
            Today, we're making that vision a reality. No more traffic. No more waiting. Just great glasses, exactly how you want them.
          </Text>
        </Card>
      </View>

      {/* Why Choose Us Section */}
      <View style={[styles.section, styles.greySection]}>
        <View style={[styles.sectionHeader, { alignItems: 'center' }]}>
          <Text style={[styles.overline, { color: theme.colors.primary }]}>
            WHY CHOOSE US
          </Text>
          <Text style={styles.sectionTitle}>The EyeWear Difference</Text>
          <Text style={styles.sectionSubtitle}>
            We're not just another online store. We're reimagining the entire experience of buying glasses.
          </Text>
        </View>

        {[
          {
            icon: '👓',
            title: 'Virtual Try-On',
            description: 'See how you look before you buy. Our advanced AR technology lets you try frames instantly from your device.',
          },
          {
            icon: '🛒',
            title: 'Wide Selection',
            description: 'Hundreds of frames, unlimited possibilities. From classic to trendy, find your perfect style.',
          },
          {
            icon: '👩‍⚕️',
            title: 'Prescription Experts',
            description: 'Our opticians verify every prescription for accuracy. Your vision is our priority.',
          },
          {
            icon: '💰',
            title: 'Transparent Pricing',
            description: 'No hidden fees, just fair prices. Quality eyewear at prices that make sense.',
          },
        ].map((feature, index) => (
          <Card key={index} style={styles.featureCard}>
            <View style={styles.featureContent}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Text style={styles.featureIconEmoji}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Our Technology Section */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { alignItems: 'center' }]}>
          <Text style={[styles.overline, { color: theme.colors.primary }]}>
            OUR TECHNOLOGY
          </Text>
          <Text style={styles.sectionTitle}>Innovation You Can See</Text>
          <Text style={styles.sectionSubtitle}>
            We leverage cutting-edge technology to give you the best online eyewear shopping experience.
          </Text>
        </View>

        {[
          {
            icon: '🎥',
            title: '3D Frame Viewing',
            description: 'Rotate and examine frames from every angle with our interactive 3D viewer.',
          },
          {
            icon: '📸',
            title: 'Virtual Try-On',
            description: 'Upload a selfie or use your camera to see how frames look on your face in real-time.',
          },
          {
            icon: '🔬',
            title: 'Prescription Lens Builder',
            description: 'Customize your lenses with coatings, materials, and tints tailored to your needs.',
          },
          {
            icon: '🏠',
            title: 'Home Delivery',
            description: 'Your complete glasses delivered to your doorstep. No more trips to store.',
          },
        ].map((tech, index) => (
          <Card key={index} style={styles.featureCard}>
            <View style={styles.featureContent}>
              <Text style={styles.techIconEmoji}>{tech.icon}</Text>
              <Text style={styles.featureTitle}>{tech.title}</Text>
              <Text style={styles.featureDescription}>{tech.description}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Our Values Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.primary }]}>
        <View style={[styles.sectionHeader, { alignItems: 'center' }]}>
          <Text style={styles.overlineLight}>
            OUR VALUES
          </Text>
          <Text style={styles.whiteSectionTitle}>What Drives Us</Text>
        </View>

        <View style={styles.valuesContainer}>
          {[
            { icon: '✓', title: 'Quality First', description: 'Premium materials and expert craftsmanship' },
            { icon: '♥', title: 'Customer Focused', description: 'Your satisfaction is our success' },
            { icon: '∞', title: 'Always Improving', description: 'Continuously enhancing our technology' },
          ].map((value, index) => (
            <View key={index} style={styles.valueItem}>
              <Avatar.Text
                size={64}
                label={value.icon}
                style={styles.valueAvatar}
                labelStyle={styles.valueAvatarLabel}
              />
              <Text style={styles.valueTitle}>{value.title}</Text>
              <Text style={styles.valueDescription}>
                {value.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Team Section */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { alignItems: 'center' }]}>
          <Text style={[styles.overline, { color: theme.colors.primary }]}>
            OUR TEAM
          </Text>
          <Text style={styles.sectionTitle}>Meet the Experts Behind EyeWear</Text>
          <Text style={styles.sectionSubtitle}>
            Our team of optometrists, designers, and engineers work together to bring you the best eyewear experience.
          </Text>
        </View>

        <View style={styles.teamContainer}>
          {[
            { name: 'Dr. Sarah Chen', role: 'Chief Optometrist', emoji: '👩‍⚕️' },
            { name: 'Marcus Williams', role: 'Head of Design', emoji: '🎨' },
            { name: 'Emily Rodriguez', role: 'Customer Experience Lead', emoji: '💬' },
          ].map((member, index) => (
            <Card key={index} style={styles.teamCard}>
              <View style={styles.teamContent}>
                <Avatar.Text
                  size={80}
                  label={member.emoji}
                  style={styles.teamAvatar}
                  labelStyle={styles.teamAvatarLabel}
                />
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
            </Card>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={[styles.section, styles.greySection]}>
        <Card style={[styles.ctaCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Join Thousands of Happy Customers</Text>
            <Text style={styles.ctaSubtitle}>
              Experience the future of eyewear shopping today.
            </Text>
            <Button
              mode="contained"
              buttonColor="white"
              textColor={theme.colors.primary}
              onPress={() => navigation.goBack()}
              style={styles.ctaButton}
            >
              Get Started
            </Button>
          </View>
        </Card>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 WDP Glasses Platform</Text>
        <Text style={styles.footerText}>All rights reserved</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  heroSection: {
    padding: 32,
    paddingTop: 48,
    paddingBottom: 64,
    minHeight: 300,
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
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    lineHeight: 40,
  },
  heroHighlight: {
    color: '#93c5fd',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  heroButton: {
    paddingHorizontal: 24,
  },
  heroButtonOutlined: {
    borderColor: 'white',
  },
  heroImage: {
    width: 120,
    height: 120,
    position: 'absolute',
    right: -20,
    top: -40,
    opacity: 0.1,
  },
  section: {
    padding: 24,
  },
  greySection: {
    backgroundColor: '#f1f5f9',
  },
  sectionHeader: {
    marginBottom: 24,
  },
  overline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  overlineLight: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  whiteSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    maxWidth: 600,
    textAlign: 'center',
  },
  storyCard: {
    padding: 16,
    borderRadius: 16,
  },
  storyText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  storyTextHighlight: {
    fontWeight: '600',
  },
  featureCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featureContent: {
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconEmoji: {
    fontSize: 36,
  },
  techIconEmoji: {
    fontSize: 48,
    marginBottom: 12,
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  valuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 24,
  },
  valueAvatar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 8,
  },
  valueAvatarLabel: {
    fontSize: 32,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  valueDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  teamContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  teamCard: {
    width: '30%',
    marginBottom: 16,
    borderRadius: 12,
  },
  teamContent: {
    padding: 16,
    alignItems: 'center',
  },
  teamAvatar: {
    backgroundColor: '#3b82f6',
    marginBottom: 12,
  },
  teamAvatarLabel: {
    fontSize: 40,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  memberRole: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  ctaCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaContent: {
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    paddingHorizontal: 32,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
})
