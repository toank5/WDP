import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Divider,
  useTheme,
  Avatar,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  VisibilityOutlined,
  CheckCircle,
  RemoveRedEye as EyeIcon,
  Info as InfoIcon,
  Help as HelpIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { CreatePrescriptionRequest, prescriptionApi } from '@/lib/prescription-api'

// ==================== GENERATE OPTION ARRAYS ====================

const generateSPHOptions = (): string[] => {
  const options: string[] = []
  for (let i = -20; i <= 20; i += 0.25) {
    const value = i.toFixed(2)
    if (i >= 0) options.push('+' + value)
    else options.push(value)
  }
  return options
}

const generateCYLOptions = (): string[] => {
  const options: string[] = []
  for (let i = -10; i <= 10; i += 0.25) {
    const value = i.toFixed(2)
    if (i === 0) {
      options.push('0.00')
    } else if (i > 0) {
      options.push('+' + value)
    } else {
      options.push(value)
    }
  }
  return options
}

const generateAxisOptions = (): string[] => {
  return Array.from({ length: 180 }, (_, i) => String(i + 1))
}

const generateADDOptions = (): string[] => {
  const options: string[] = []
  for (let i = 50; i <= 400; i += 25) {
    options.push('+' + (i / 100).toFixed(2))
  }
  return options
}

const SPH_OPTIONS = generateSPHOptions()
const CYL_OPTIONS = generateCYLOptions()
const AXIS_OPTIONS = generateAxisOptions()
const ADD_OPTIONS = generateADDOptions()

interface PrescriptionFormData {
  name: string
  prescriptionDate: string
  rightEye: {
    sph?: string
    cyl?: string
    axis?: string
    add?: string
  }
  leftEye: {
    sph?: string
    cyl?: string
    axis?: string
    add?: string
  }
  pd: {
    left?: string
    right?: string
    total?: string
  }
  imageUrl?: string
}

const SectionHeader = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description?: string
}) => (
  <Stack spacing={1} sx={{ mb: 3 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
    </Stack>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ pl: 5 }}>
        {description}
      </Typography>
    )}
  </Stack>
)

const EyeCard = ({
  label,
  color,
  children,
  avatarBg,
  eyeDirection,
}: {
  label: string
  color: string
  children: React.ReactNode
  avatarBg: string
  eyeDirection: 'left' | 'right'
}) => (
  <Card
    variant="outlined"
    sx={{
      height: '100%',
      bgcolor: '#fafbfc',
      border: '2px solid',
      borderColor: 'divider',
      transition: 'all 0.2s',
      '&:hover': { borderColor: color, boxShadow: `0 4px 20px ${color}22` },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Avatar sx={{ bgcolor: avatarBg, width: 48, height: 48 }}>
            <EyeIcon
              sx={{ fontSize: 28, transform: eyeDirection === 'left' ? 'scaleX(-1)' : 'none' }}
            />
          </Avatar>
          <Typography variant="h6" fontWeight={700} sx={{ color }}>
            {label}
          </Typography>
        </Stack>
        <Divider />
        {children}
      </Stack>
    </CardContent>
  </Card>
)

// ==================== PRESCRIPTION INPUT COMPONENT ====================

interface PrescriptionInputProps {
  label: string
  value: string
  onChange: (val: string) => void
  options: string[]
  unit?: string
  required?: boolean
}

const PrescriptionInput = ({
  label,
  value,
  onChange,
  options,
  unit,
  required = false,
}: PrescriptionInputProps) => (
  <FormControl fullWidth required={required}>
    <InputLabel shrink={false} sx={{ bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5 }}>
      {label} {unit && `(in ${unit})`}
    </InputLabel>
    <Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      displayEmpty
      sx={{
        height: 56,
        fontSize: '1.1rem',
        '& .MuiSelect-select': {
          height: 56,
          display: 'flex',
          alignItems: 'center',
          fontSize: '1.1rem',
        },
      }}
    >
      <MenuItem value="" sx={{ color: '#999', fontStyle: 'italic', fontSize: '1rem' }}>
        — Select —
      </MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt} value={opt} sx={{ fontSize: '1.1rem', py: 1 }}>
          {opt}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
)

export default function CreatePrescriptionPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [pdType, setPdType] = useState<'single' | 'dual'>('single')

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    defaultValues: {
      name: '',
      prescriptionDate: new Date().toISOString().split('T')[0],
      rightEye: {},
      leftEye: {},
      pd: {},
    },
  })

  const formValues = watch()

  const onSubmit = async (data: PrescriptionFormData) => {
    try {
      setSubmitting(true)

      const hasEyeData =
        Object.values(data.rightEye).some((v) => v !== '' && v !== undefined) ||
        Object.values(data.leftEye).some((v) => v !== '' && v !== undefined) ||
        Object.values(data.pd).some((v) => v !== '' && v !== undefined)

      if (!hasEyeData && !imageUrl) {
        toast.error('Please enter at least some prescription data or upload a prescription image.')
        return
      }

      const toNumber = (value: string | undefined): number | undefined => {
        if (value === '' || value === undefined) return undefined
        return parseFloat(value)
      }

      const request: CreatePrescriptionRequest = {
        name: data.name,
        prescriptionDate: data.prescriptionDate,
        rightEye: {
          sph: toNumber(data.rightEye.sph),
          cyl: toNumber(data.rightEye.cyl),
          axis: toNumber(data.rightEye.axis),
          add: toNumber(data.rightEye.add),
        },
        leftEye: {
          sph: toNumber(data.leftEye.sph),
          cyl: toNumber(data.leftEye.cyl),
          axis: toNumber(data.leftEye.axis),
          add: toNumber(data.leftEye.add),
        },
        pd: {
          left: toNumber(data.pd.left),
          right: toNumber(data.pd.right),
          total: toNumber(data.pd.total),
        },
        imageUrl: imageUrl || undefined,
      }

      await prescriptionApi.createPrescription(request)
      toast.success('Prescription saved successfully!')
      navigate('/account/prescriptions')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save prescription'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.')
      return
    }

    try {
      setUploading(true)
      const localUrl = URL.createObjectURL(file)
      setImageUrl(localUrl)
      toast.success('Image uploaded. Remember to save your prescription.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
  }

  const filledFieldsCount =
    Object.values(formValues.rightEye).filter(Boolean).length +
    Object.values(formValues.leftEye).filter(Boolean).length +
    Object.values(formValues.pd).filter(Boolean).length +
    (imageUrl ? 1 : 0)

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          {/* Header */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/account/prescriptions')}
                sx={{ color: 'text.primary' }}
              >
                Back
              </Button>
              <Divider orientation="vertical" flexItem />
              <Typography variant="h5" fontWeight={800}>
                Add New Prescription
              </Typography>
            </Stack>
            {filledFieldsCount > 0 && (
              <Chip
                icon={<CheckCircle sx={{ fontSize: 16 }} />}
                label={`${filledFieldsCount} field${filledFieldsCount > 1 ? 's' : ''} filled`}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Left Column - Main Form */}
              <Grid item xs={12} md={12}>
                <Stack spacing={3}>
                  {/* Basic Info */}
                  <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
                    <SectionHeader
                      icon={<VisibilityOutlined sx={{ fontSize: 24 }} />}
                      title="Prescription Information"
                    />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12}>
                        <Controller
                          name="name"
                          control={control}
                          rules={{ required: 'Name is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Prescription Name"
                              placeholder="e.g., Daily Glasses, Reading Glasses"
                              error={!!errors.name}
                              helperText={errors.name?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Controller
                          name="prescriptionDate"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="date"
                              label="Prescription Date"
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Eye Values */}
                  <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
                    <SectionHeader
                      icon={<VisibilityOutlined sx={{ fontSize: 24 }} />}
                      title="Prescription Values"
                      description="Enter the values from your prescription. Leave blank if not shown."
                    />

                    <Grid container spacing={2.5}>
                      {/* Right Eye */}
                      <Grid item xs={12} md={6}>
                        <EyeCard
                          label="Right Eye (OD)"
                          color="#1976d2"
                          avatarBg="#1976d215"
                          eyeDirection="right"
                        >
                          <Stack spacing={2}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Controller
                                  name="rightEye.sph"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="SPH"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={SPH_OPTIONS}
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Controller
                                  name="rightEye.cyl"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="CYL"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={CYL_OPTIONS}
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Controller
                                  name="rightEye.axis"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="Axis"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={AXIS_OPTIONS}
                                      unit="°"
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Controller
                                  name="rightEye.add"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="ADD"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={ADD_OPTIONS}
                                    />
                                  )}
                                />
                              </Grid>
                            </Grid>
                          </Stack>
                        </EyeCard>
                      </Grid>

                      {/* Left Eye */}
                      <Grid item xs={12} md={6}>
                        <EyeCard
                          label="Left Eye (OS)"
                          color="#2e7d32"
                          avatarBg="#2e7d3215"
                          eyeDirection="left"
                        >
                          <Stack spacing={2}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Controller
                                  name="leftEye.sph"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="SPH"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={SPH_OPTIONS}
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Controller
                                  name="leftEye.cyl"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="CYL"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={CYL_OPTIONS}
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Controller
                                  name="leftEye.axis"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="Axis"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={AXIS_OPTIONS}
                                      unit="°"
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Controller
                                  name="leftEye.add"
                                  control={control}
                                  render={({ field }) => (
                                    <PrescriptionInput
                                      label="ADD"
                                      value={field.value || ''}
                                      onChange={(val) => field.onChange(val)}
                                      options={ADD_OPTIONS}
                                    />
                                  )}
                                />
                              </Grid>
                            </Grid>
                          </Stack>
                        </EyeCard>
                      </Grid>
                    </Grid>

                    {/* PD Section with Toggle */}
                    <Box sx={{ mt: 4 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{ color: 'primary.main' }}
                          >
                            Pupillary Distance (PD)
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() =>
                              window.open(
                                'https://www.youtube.com/results?search_query=how+to+measure+pd+pupillary+distance',
                                '_blank'
                              )
                            }
                            sx={{ color: 'info.main' }}
                          >
                            <HelpIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        {/* PD Type Toggle */}
                        <ToggleButtonGroup
                          value={pdType}
                          exclusive
                          onChange={(e, newVal) => {
                            if (newVal) {
                              setPdType(newVal)
                              // Clear values when switching
                              if (newVal === 'single') {
                                // Keep total, clear individual
                              } else {
                                // Keep individual, clear total
                              }
                            }
                          }}
                          sx={{ mb: 2 }}
                        >
                          <ToggleButton value="single" sx={{ px: 3, py: 1 }}>
                            Single PD
                          </ToggleButton>
                          <ToggleButton value="dual" sx={{ px: 3, py: 1 }}>
                            Dual PD
                          </ToggleButton>
                        </ToggleButtonGroup>

                        {pdType === 'single' ? (
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Controller
                                name="pd.total"
                                control={control}
                                render={({ field }) => (
                                  <PrescriptionInput
                                    label="Total PD"
                                    value={field.value || ''}
                                    onChange={(val) => field.onChange(val)}
                                    options={Array.from({ length: 40 }, (_, i) => String(i + 25))}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box
                                sx={{ display: 'flex', alignItems: 'center', height: 56, px: 2 }}
                              >
                                <Alert severity="info" sx={{ width: '100%' }}>
                                  <Typography variant="body2">
                                    Example: 62 (total distance between pupils)
                                  </Typography>
                                </Alert>
                              </Box>
                            </Grid>
                          </Grid>
                        ) : (
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Controller
                                name="pd.right"
                                control={control}
                                render={({ field }) => (
                                  <PrescriptionInput
                                    label="Right PD"
                                    value={field.value || ''}
                                    onChange={(val) => field.onChange(val)}
                                    options={Array.from({ length: 20 }, (_, i) => String(i + 25))}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Controller
                                name="pd.left"
                                control={control}
                                render={({ field }) => (
                                  <PrescriptionInput
                                    label="Left PD"
                                    value={field.value || ''}
                                    onChange={(val) => field.onChange(val)}
                                    options={Array.from({ length: 20 }, (_, i) => String(i + 25))}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Alert severity="info" sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  Example: 31 / 31 (distance from center of nose to each pupil)
                                </Typography>
                              </Alert>
                            </Grid>
                          </Grid>
                        )}
                      </Stack>
                    </Box>
                  </Paper>
                </Stack>
              </Grid>

              {/* Right Column - Upload & Actions */}
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  {/* Upload Card */}
                  <Card variant="outlined" sx={{ position: 'sticky', top: 16 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2.5}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                            <CloudUploadIcon sx={{ fontSize: 22 }} />
                          </Avatar>
                          <Typography variant="h6" fontWeight={700}>
                            Prescription Image
                          </Typography>
                        </Stack>

                        <Alert severity="info" icon={<InfoIcon fontSize="small" />}>
                          <Typography variant="body2">
                            Upload a photo of your prescription for <strong>verification</strong>.
                            This helps us ensure accuracy and prevent errors.
                          </Typography>
                        </Alert>

                        {imageUrl ? (
                          <Box sx={{ position: 'relative' }}>
                            <img
                              src={imageUrl}
                              alt="Prescription"
                              style={{
                                width: '100%',
                                borderRadius: 8,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            />
                            <IconButton
                              onClick={handleRemoveImage}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': { bgcolor: 'grey.100' },
                              }}
                              size="small"
                            >
                              <DeleteIcon color="error" fontSize="small" />
                            </IconButton>
                            <Chip
                              label="Image uploaded"
                              color="success"
                              size="small"
                              sx={{ position: 'absolute', bottom: 8, left: 8 }}
                            />
                          </Box>
                        ) : (
                          <>
                            <input
                              accept="image/*"
                              id="image-upload"
                              type="file"
                              style={{ display: 'none' }}
                              onChange={handleImageUpload}
                            />
                            <label htmlFor="image-upload">
                              <Button
                                component="span"
                                variant="outlined"
                                fullWidth
                                startIcon={
                                  uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />
                                }
                                disabled={uploading}
                                sx={{
                                  py: 2,
                                  borderStyle: 'dashed',
                                  borderWidth: 2,
                                  minHeight: 100,
                                  flexDirection: 'column',
                                  bgcolor: 'action.hover',
                                }}
                              >
                                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                                  {uploading ? 'Uploading...' : 'Click or Drag Image Here'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  JPG, PNG supported
                                </Typography>
                              </Button>
                            </label>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ textAlign: 'center', mt: 1 }}
                            >
                              Optional but highly recommended for accuracy
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card variant="outlined">
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          fullWidth
                          disabled={submitting}
                          startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
                          sx={{ py: 1.5 }}
                        >
                          {submitting ? 'Saving...' : 'Save Prescription'}
                        </Button>
                        <Button
                          type="button"
                          variant="text"
                          fullWidth
                          onClick={() => navigate('/account/prescriptions')}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Stack>
      </Container>
    </Box>
  )
}
