import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  useTheme,
  Paper,
  Grid,
} from '@mui/material'
import {
  LocationOn,
  Phone,
  Email,
  AccessTime,
  Send,
  Facebook,
  Instagram,
  Twitter,
  YouTube,
  AttachFile,
} from '@mui/icons-material'
import { toast } from 'sonner'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

const CONTACT_INFO = {
  address: '123 Vision Street, District 1, Ho Chi Minh City, Vietnam',
  phone: '+84 1900 1234',
  email: 'support@eyewear.com',
  workingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
}

const SUBJECT_OPTIONS = [
  'Order Issue',
  'Prescription Question',
  'Product Inquiry',
  'Returns & Refunds',
  'Partnership',
  'Other',
]

export default function ContactPage() {
  const theme = useTheme()
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Subject validation
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject'
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Log form data (replace with actual API call)
      console.log('Contact Form Submitted:', {
        ...formData,
        attachment: attachment?.name,
      })

      // Success
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.')

      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' })
      setAttachment(null)
      setErrors({})
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ContactFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name?: string; value: unknown }) => {
    const value = typeof e === 'string' ? e : e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed')
        return
      }
      setAttachment(file)
      toast.success(`File selected: ${file.name}`)
    }
  }

  const InfoItem = ({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: string }) => (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          bgcolor: `${theme.palette.primary.main}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{ fontWeight: 500, ...(link && { color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }) }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}dd 0%, ${theme.palette.primary.dark}dd 100%)`,
          color: 'white',
          py: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
            top: -100,
            right: -100,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={2} sx={{ textAlign: 'center' }}>
            <Typography
              variant="overline"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                letterSpacing: 3,
              }}
            >
              GET IN TOUCH
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              We're Here to Help
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
              Choose the best way to reach us. We typically respond within 24 hours.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: -8, md: -12 }, position: 'relative', zIndex: 2, mb: 8 }}>
        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={3}>
              <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reach out to us through any of these channels
                    </Typography>
                  </Box>

                  <Divider />

                  <Stack spacing={4}>
                    <InfoItem icon={<LocationOn />} label="Address" value={CONTACT_INFO.address} />
                    <InfoItem
                      icon={<Phone />}
                      label="Phone"
                      value={CONTACT_INFO.phone}
                      link
                    />
                    <InfoItem
                      icon={<Email />}
                      label="Email"
                      value={CONTACT_INFO.email}
                      link
                    />
                    <InfoItem icon={<AccessTime />} label="Working Hours" value={CONTACT_INFO.workingHours} />
                  </Stack>

                  <Divider />

                  {/* Social Media */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Follow Us
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {[
                        { icon: <Facebook />, color: '#1877F2' as const },
                        { icon: <Instagram />, color: '#E4405F' as const },
                        { icon: <Twitter />, color: '#1DA1F2' as const },
                        { icon: <YouTube />, color: '#FF0000' as const },
                      ].map((social, index) => (
                        <Avatar
                          key={index}
                          sx={{
                            bgcolor: `${social.color}15`,
                            color: social.color,
                            width: 40,
                            height: 40,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: social.color,
                              color: 'white',
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          {social.icon}
                        </Avatar>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Quick Links */}
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Quick Links
                  </Typography>
                  <Stack spacing={1}>
                    <Typography component="a" href="/prescription" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      Prescription Guide
                    </Typography>
                    <Typography component="a" href="/store" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      Shop Frames
                    </Typography>
                    <Typography component="a" href="/policies/returns" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      Returns & Refunds
                    </Typography>
                    <Typography component="a" href="/policies/shipping" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      Shipping Info
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          {/* Contact Form */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, height: '100%' }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Send Us a Message
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </Typography>
                </Box>

                <Divider />

                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    {/* Name & Email */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={formData.name}
                          onChange={handleInputChange('name')}
                          error={!!errors.name}
                          helperText={errors.name}
                          disabled={submitting}
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange('email')}
                          error={!!errors.email}
                          helperText={errors.email}
                          disabled={submitting}
                          size="small"
                          required
                        />
                      </Grid>
                    </Grid>

                    {/* Subject */}
                    <FormControl fullWidth size="small" error={!!errors.subject}>
                      <InputLabel>Subject *</InputLabel>
                      <Select
                        value={formData.subject}
                        label="Subject *"
                        onChange={(e) => handleInputChange('subject')(e)}
                        disabled={submitting}
                        required
                      >
                        {SUBJECT_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.subject && <Typography variant="caption" color="error">{errors.subject}</Typography>}
                    </FormControl>

                    {/* Message */}
                    <TextField
                      fullWidth
                      label="Your Message"
                      multiline
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      error={!!errors.message}
                      helperText={errors.message || 'Please provide as much detail as possible'}
                      disabled={submitting}
                      required
                    />

                    {/* Attachment */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        disabled={submitting}
                        startIcon={<AttachFile />}
                      >
                        {attachment ? 'Change File' : 'Attach File (Optional)'}
                        <input type="file" hidden onChange={handleFileChange} accept="image/*,.pdf" />
                      </Button>
                      {attachment && (
                        <Typography variant="body2" color="primary.main">
                          {attachment.name}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Max 5MB (JPG, PNG, PDF)
                      </Typography>
                    </Stack>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                      sx={{ py: 1.5 }}
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </Button>

                    {/* Info */}
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        For urgent matters, please call us at{' '}
                        <Box component="span" sx={{ fontWeight: 600 }}>
                          {CONTACT_INFO.phone}
                        </Box>
                      </Typography>
                    </Alert>
                  </Stack>
                </form>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Map Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Paper
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            height: { xs: 300, md: 400 },
            position: 'relative',
          }}
        >
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=106.65,10.75,106.70,10.80&layer=mapnik&marker=10.7769,106.7009"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            title="Store Location"
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              bgcolor: 'background.paper',
              px: 2,
              py: 1,
              borderRadius: 1,
              boxShadow: 2,
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              📍 {CONTACT_INFO.address}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
