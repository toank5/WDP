import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Badge,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as VerifiedIcon,
  CheckCircle,
  HourglassEmpty as PendingIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  VisibilityOutlined,
  RemoveRedEye as EyeIcon,
  ContentCut as GlassesIcon,
  Help as HelpIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { toast } from 'sonner'
import { prescriptionApi, type Prescription, type CreatePrescriptionRequest, type UpdatePrescriptionRequest } from '@/lib/prescription-api'
import { uploadImages2D } from '@/lib/media-api'
import { formatDateTime } from '@/lib/utils'
import { useForm, Controller } from 'react-hook-form'

const VERIFICATION_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  true: 'success',
  false: 'warning',
}

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
  rightSph?: string
  rightCyl?: string
  rightAxis?: string
  rightAdd?: string
  leftSph?: string
  leftCyl?: string
  leftAxis?: string
  leftAdd?: string
  pdRight?: string
  pdLeft?: string
  pdTotal?: string
}

// Prescription Card Component with Hover Effect
interface PrescriptionCardProps {
  prescription: Prescription
  onEdit: (prescription: Prescription) => void
  onDelete: (id: string) => void
}

function PrescriptionCard({ prescription, onEdit, onDelete }: PrescriptionCardProps) {
  const theme = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  const hasRightData = prescription.rightEye && (
    prescription.rightEye.sph !== undefined ||
    prescription.rightEye.cyl !== undefined ||
    prescription.rightEye.axis !== undefined ||
    prescription.rightEye.add !== undefined
  )

  const hasLeftData = prescription.leftEye && (
    prescription.leftEye.sph !== undefined ||
    prescription.leftEye.cyl !== undefined ||
    prescription.leftEye.axis !== undefined ||
    prescription.leftEye.add !== undefined
  )

  const hasPdData = prescription.pd && (
    prescription.pd.left !== undefined ||
    prescription.pd.right !== undefined ||
    prescription.pd.total !== undefined
  )

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: prescription.isVerified ? 'success.main' : 'divider',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: `0 12px 40px ${prescription.isVerified ? theme.palette.success.main + '22' : theme.palette.primary.main + '22'}`,
          borderColor: prescription.isVerified ? 'success.main' : 'primary.main',
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Verification Badge - positioned outside the card content */}
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          left: 12,
          zIndex: 10,
        }}
      >
        <Chip
          label={prescription.isVerified ? 'Verified' : 'Pending'}
          color={prescription.isVerified ? 'success' : 'warning'}
          size="small"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            height: 22,
            px: 1,
            borderRadius: 1,
          }}
        />
      </Box>

      <Box sx={{ p: 3, pt: 2 }}>
        {/* Icon Area / Image Preview */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 120,
            bgcolor: prescription.isVerified ? 'success.50' : 'primary.50',
            borderRadius: 2,
            mb: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {prescription.imageUrl ? (
            <>
              <Box
                component="img"
                src={prescription.imageUrl}
                alt="Prescription"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Dark overlay on hover */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}
              />
            </>
          ) : (
            <>
              {/* Decorative background */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: prescription.isVerified ? 'success.main' : 'primary.main',
                  opacity: 0.1,
                  top: -20,
                  right: -20,
                }}
              />
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: prescription.isVerified ? 'success.main' : 'primary.main',
                  boxShadow: `0 8px 24px ${prescription.isVerified ? theme.palette.success.main : theme.palette.primary.main}33`,
                }}
              >
                <VisibilityOutlined sx={{ fontSize: 32 }} />
              </Avatar>
            </>
          )}

          {/* Hover overlay with quick actions */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          >
            <Button
              size="small"
              variant="contained"
              onClick={() => onEdit(prescription)}
              disabled={prescription.isVerified}
              sx={{ minWidth: 80, bgcolor: 'white', color: 'text.primary', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(prescription._id)
              }}
              sx={{ minWidth: 80, borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Name */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, minHeight: 28 }}>
          {prescription.name}
        </Typography>

        {/* Quick preview - shown when not hovered */}
        <Stack
          spacing={1}
          sx={{
            opacity: isHovered ? 0 : 1,
            transition: 'opacity 0.3s',
            minHeight: 60,
            pointerEvents: isHovered ? 'none' : 'auto',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {hasRightData && hasLeftData ? (
              <>
                Right: SPH {prescription.rightEye?.sph ?? '—'}, Left: SPH {prescription.leftEye?.sph ?? '—'}
              </>
            ) : hasPdData ? (
              <>PD: {prescription.pd.total ?? prescription.pd.right ?? prescription.pd.left}</>
            ) : prescription.imageUrl ? (
              <>Image uploaded</>
            ) : (
              <>Click to view details</>
            )}
          </Typography>
        </Stack>

        {/* Detailed view - shown on hover */}
        <Box
          sx={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: isHovered ? 'auto' : 'none',
            minHeight: 80,
          }}
        >
          <Divider />
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>RIGHT EYE</Typography>
              <Stack spacing={0.25}>
                <Typography variant="body2" fontSize="0.75rem">
                  SPH: {prescription.rightEye?.sph ?? '—'} | CYL: {prescription.rightEye?.cyl ?? '—'}
                </Typography>
                <Typography variant="body2" fontSize="0.75rem">
                  Axis: {prescription.rightEye?.axis ?? '—'} | ADD: {prescription.rightEye?.add ?? '—'}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>LEFT EYE</Typography>
              <Stack spacing={0.25}>
                <Typography variant="body2" fontSize="0.75rem">
                  SPH: {prescription.leftEye?.sph ?? '—'} | CYL: {prescription.leftEye?.cyl ?? '—'}
                </Typography>
                <Typography variant="body2" fontSize="0.75rem">
                  Axis: {prescription.leftEye?.axis ?? '—'} | ADD: {prescription.leftEye?.add ?? '—'}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          {hasPdData && (
            <Typography variant="body2" fontSize="0.75rem" sx={{ mt: 0.5 }}>
              PD: L={prescription.pd.left ?? '—'} R={prescription.pd.right ?? '—'} T={prescription.pd.total ?? '—'}
            </Typography>
          )}
          {prescription.imageUrl && (
            <Chip size="small" label="Image uploaded" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} />
          )}
        </Box>

        {/* Date */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {formatDateTime(prescription.createdAt)}
        </Typography>
      </Box>
    </Card>
  )
}

export default function PrescriptionsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [pdType, setPdType] = useState<'single' | 'dual'>('single')

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    defaultValues: {
      name: '',
    },
  })

  const isEditMode = editingId !== null

  useEffect(() => {
    void loadPrescriptions()

    if (searchParams.get('create') === 'true') {
      openCreateModal()
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const loadPrescriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await prescriptionApi.getMyPrescriptions({ limit: 100 })
      setPrescriptions(response.prescriptions)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load prescriptions'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!prescriptionToDelete) return

    try {
      setDeleting(true)
      await prescriptionApi.deletePrescription(prescriptionToDelete)
      toast.success('Prescription deleted successfully')
      setDeleteDialogOpen(false)
      setPrescriptionToDelete(null)
      await loadPrescriptions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete prescription'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (id: string) => {
    setPrescriptionToDelete(id)
    setDeleteDialogOpen(true)
  }

  const openCreateModal = () => {
    setEditingId(null)
    reset()
    setImageUrl(null)
    setImageFile(null)
    setPdType('single')
    setCreateModalOpen(true)
  }

  const handleCreatePrescription = async (data: PrescriptionFormData) => {
    try {
      setSubmitting(true)

      const toNumber = (value: string | undefined): number | undefined => {
        if (value === '' || value === undefined) return undefined
        return parseFloat(value)
      }

      // Upload image if a new file is selected
      let uploadedImageUrl: string | undefined = undefined
      if (imageFile) {
        try {
          const urls = await uploadImages2D([imageFile])
          uploadedImageUrl = urls[0]
        } catch (uploadError) {
          const message = uploadError instanceof Error ? uploadError.message : 'Failed to upload image'
          toast.error(message)
          // Continue without image if upload fails
        }
      } else if (imageUrl) {
        // Keep existing image URL if no new file is selected
        uploadedImageUrl = imageUrl
      }

      if (isEditMode && editingId) {
        // Update existing prescription
        const updateRequest: UpdatePrescriptionRequest = {
          name: data.name,
          rightEye: {
            sph: toNumber(data.rightSph),
            cyl: toNumber(data.rightCyl),
            axis: toNumber(data.rightAxis),
            add: toNumber(data.rightAdd),
          },
          leftEye: {
            sph: toNumber(data.leftSph),
            cyl: toNumber(data.leftCyl),
            axis: toNumber(data.leftAxis),
            add: toNumber(data.leftAdd),
          },
          pd: {
            left: toNumber(data.pdLeft),
            right: toNumber(data.pdRight),
            total: toNumber(data.pdTotal),
          },
          imageUrl: uploadedImageUrl,
        }

        await prescriptionApi.updatePrescription(editingId, updateRequest)
        toast.success('Prescription updated successfully!')
      } else {
        // Create new prescription
        const request: CreatePrescriptionRequest = {
          name: data.name,
          prescriptionDate: new Date().toISOString(),
          rightEye: {
            sph: toNumber(data.rightSph),
            cyl: toNumber(data.rightCyl),
            axis: toNumber(data.rightAxis),
            add: toNumber(data.rightAdd),
          },
          leftEye: {
            sph: toNumber(data.leftSph),
            cyl: toNumber(data.leftCyl),
            axis: toNumber(data.leftAxis),
            add: toNumber(data.leftAdd),
          },
          pd: {
            left: toNumber(data.pdLeft),
            right: toNumber(data.pdRight),
            total: toNumber(data.pdTotal),
          },
          imageUrl: uploadedImageUrl,
        }

        await prescriptionApi.createPrescription(request)
        toast.success('Prescription saved successfully!')
      }

      setCreateModalOpen(false)
      reset()
      setImageUrl(null)
      setImageFile(null)
      setEditingId(null)
      await loadPrescriptions()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save prescription'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setCreateModalOpen(false)
    reset()
    setImageUrl(null)
    setImageFile(null)
    setEditingId(null)
  }

  const openEditModal = (prescription: Prescription) => {
    setEditingId(prescription._id)
    setImageFile(null) // Reset file when editing

    // Populate form with existing data
    setValue('name', prescription.name || '')

    const formatValue = (val: number | undefined): string => {
      if (val === undefined) return ''
      if (val > 0) return '+' + val.toFixed(2)
      return val.toFixed(2)
    }

    setValue('rightSph', formatValue(prescription.rightEye?.sph))
    setValue('rightCyl', formatValue(prescription.rightEye?.cyl))
    setValue('rightAxis', prescription.rightEye?.axis?.toString() || '')
    setValue('rightAdd', prescription.rightEye?.add ? '+' + prescription.rightEye.add.toFixed(2) : '')

    setValue('leftSph', formatValue(prescription.leftEye?.sph))
    setValue('leftCyl', formatValue(prescription.leftEye?.cyl))
    setValue('leftAxis', prescription.leftEye?.axis?.toString() || '')
    setValue('leftAdd', prescription.leftEye?.add ? '+' + prescription.leftEye.add.toFixed(2) : '')

    // Set PD type and values
    if (prescription.pd?.total) {
      setPdType('single')
      setValue('pdTotal', prescription.pd.total.toString())
      setValue('pdRight', '')
      setValue('pdLeft', '')
    } else {
      setPdType('dual')
      setValue('pdTotal', '')
      setValue('pdRight', prescription.pd?.right?.toString() || '')
      setValue('pdLeft', prescription.pd?.left?.toString() || '')
    }

    setImageUrl(prescription.imageUrl || null)
    setCreateModalOpen(true)
  }

  const SimpleSelect = ({
    label,
    value,
    onChange,
    options,
    unit = '',
  }: {
    label: string
    value: string
    onChange: (val: string) => void
    options: string[]
    unit?: string
  }) => (
    <Box>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
        {label} {unit && `(in ${unit})`}
      </Typography>
      <FormControl fullWidth>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          sx={{
            height: 48,
            bgcolor: 'background.paper',
            '& .MuiSelect-select': {
              height: 48,
              display: 'flex',
              alignItems: 'center',
              color: value ? 'text.primary' : 'text.secondary',
              fontSize: '1.1rem',
              pl: 1.5,
            },
          }}
        >
          <MenuItem value="" sx={{ color: '#999', fontStyle: 'italic', fontSize: '1rem' }}>
            — Select —
          </MenuItem>
          {options.map((v) => (
            <MenuItem key={v} value={v} sx={{ fontSize: '1.1rem', py: 1 }}>
              {v}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <VisibilityOutlined sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                My Prescriptions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your saved prescriptions for faster checkout
              </Typography>
            </Box>
          </Stack>
          <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={openCreateModal} sx={{ px: 3, py: 1.5 }}>
            Add New
          </Button>
        </Stack>

        {error ? (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={48} />
          </Box>
        ) : prescriptions.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 10, textAlign: 'center', borderRadius: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <VisibilityOutlined sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              No prescriptions yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              Save your prescription details to make checkout faster. Our opticians will verify your prescription for accuracy.
            </Typography>
            <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={openCreateModal}>
              Add Your First Prescription
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {prescriptions.map((prescription) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={prescription._id}>
                <PrescriptionCard
                  prescription={prescription}
                  onEdit={openEditModal}
                  onDelete={openDeleteDialog}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Prescription</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this prescription? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Prescription Modal */}
      <Dialog
        open={createModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {isEditMode ? <EditIcon /> : <AddIcon />}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                {isEditMode ? 'Edit Prescription' : 'Add New Prescription'}
              </Typography>
            </Stack>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleCreatePrescription)}>
          <DialogContent dividers>
            <Stack spacing={3}>
              {/* Name */}
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Prescription Name"
                    placeholder="e.g., Daily Glasses"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    size="small"
                  />
                )}
              />

              {/* Eye Values */}
              <Paper variant="outlined" sx={{ p: 3, bgcolor: '#fafbfc' }}>
                <Grid container spacing={3}>
                  {/* Right Eye */}
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                        <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                          <EyeIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1976d2' }}>
                          Right Eye (OD)
                        </Typography>
                      </Stack>
                      <Divider />
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Controller name="rightSph" control={control} render={({ field }) => <SimpleSelect label="SPH" value={field.value || ''} onChange={(v) => field.onChange(v)} options={SPH_OPTIONS} />} />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller name="rightCyl" control={control} render={({ field }) => <SimpleSelect label="CYL" value={field.value || ''} onChange={(v) => field.onChange(v)} options={CYL_OPTIONS} />} />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller name="rightAxis" control={control} render={({ field }) => <SimpleSelect label="Axis" value={field.value || ''} onChange={(v) => field.onChange(v)} options={AXIS_OPTIONS} unit="°" />} />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller name="rightAdd" control={control} render={({ field }) => <SimpleSelect label="ADD" value={field.value || ''} onChange={(v) => field.onChange(v)} options={ADD_OPTIONS} />} />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Grid>

                  {/* Left Eye */}
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                        <Avatar sx={{ bgcolor: '#2e7d32', width: 32, height: 32 }}>
                          <EyeIcon sx={{ fontSize: 20, transform: 'scaleX(-1)' }} />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e7d32' }}>
                          Left Eye (OS)
                        </Typography>
                      </Stack>
                      <Divider />
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Controller name="leftSph" control={control} render={({ field }) => <SimpleSelect label="SPH" value={field.value || ''} onChange={(v) => field.onChange(v)} options={SPH_OPTIONS} />} />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller name="leftCyl" control={control} render={({ field }) => <SimpleSelect label="CYL" value={field.value || ''} onChange={(v) => field.onChange(v)} options={CYL_OPTIONS} />} />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller name="leftAxis" control={control} render={({ field }) => <SimpleSelect label="Axis" value={field.value || ''} onChange={(v) => field.onChange(v)} options={AXIS_OPTIONS} unit="°" />} />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller name="leftAdd" control={control} render={({ field }) => <SimpleSelect label="ADD" value={field.value || ''} onChange={(v) => field.onChange(v)} options={ADD_OPTIONS} />} />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              {/* PD Section with Toggle */}
              <Box sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'primary.main' }}>
                      Pupillary Distance (PD)
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => window.open('https://www.youtube.com/results?search_query=how+to+measure+pd+pupillary+distance', '_blank')}
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
                      }
                    }}
                    sx={{ mb: 2 }}
                    size="small"
                  >
                    <ToggleButton value="single" sx={{ px: 2, py: 0.5 }}>
                      Single PD
                    </ToggleButton>
                    <ToggleButton value="dual" sx={{ px: 2, py: 0.5 }}>
                      Dual PD
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {pdType === 'single' ? (
                    <Controller
                      name="pdTotal"
                      control={control}
                      render={({ field }) => (
                        <Box>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                            Total PD
                          </Typography>
                          <FormControl fullWidth>
                            <Select
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              displayEmpty
                              sx={{
                                height: 48,
                                bgcolor: 'background.paper',
                                '& .MuiSelect-select': {
                                  height: 48,
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: field.value ? 'text.primary' : 'text.secondary',
                                  fontSize: '1.1rem',
                                  pl: 1.5,
                                },
                              }}
                            >
                              <MenuItem value="" sx={{ color: '#999', fontStyle: 'italic', fontSize: '1rem' }}>
                                — Select —
                              </MenuItem>
                              {Array.from({ length: 40 }, (_, i) => String(i + 25)).map((val) => (
                                <MenuItem key={val} value={val} sx={{ fontSize: '1.1rem', py: 1 }}>
                                  {val}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    />
                  ) : (
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Controller
                          name="pdRight"
                          control={control}
                          render={({ field }) => (
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                                Right PD
                              </Typography>
                              <FormControl fullWidth>
                                <Select
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  displayEmpty
                                  sx={{
                                    height: 48,
                                    bgcolor: 'background.paper',
                                    '& .MuiSelect-select': {
                                      height: 48,
                                      display: 'flex',
                                      alignItems: 'center',
                                      color: field.value ? 'text.primary' : 'text.secondary',
                                      fontSize: '1.1rem',
                                      pl: 1.5,
                                    },
                                  }}
                                >
                                  <MenuItem value="" sx={{ color: '#999', fontStyle: 'italic', fontSize: '1rem' }}>
                                    — Select —
                                  </MenuItem>
                                  {Array.from({ length: 20 }, (_, i) => String(i + 25)).map((val) => (
                                    <MenuItem key={val} value={val} sx={{ fontSize: '1.1rem', py: 1 }}>
                                      {val}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          )}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Controller
                          name="pdLeft"
                          control={control}
                          render={({ field }) => (
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                                Left PD
                              </Typography>
                              <FormControl fullWidth>
                                <Select
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  displayEmpty
                                  sx={{
                                    height: 48,
                                    bgcolor: 'background.paper',
                                    '& .MuiSelect-select': {
                                      height: 48,
                                      display: 'flex',
                                      alignItems: 'center',
                                      color: field.value ? 'text.primary' : 'text.secondary',
                                      fontSize: '1.1rem',
                                      pl: 1.5,
                                    },
                                  }}
                                >
                                  <MenuItem value="" sx={{ color: '#999', fontStyle: 'italic', fontSize: '1rem' }}>
                                    — Select —
                                  </MenuItem>
                                  {Array.from({ length: 20 }, (_, i) => String(i + 25)).map((val) => (
                                    <MenuItem key={val} value={val} sx={{ fontSize: '1.1rem', py: 1 }}>
                                      {val}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          )}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {pdType === 'single' && (
                    <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ mt: 1 }}>
                      <Typography variant="body2" fontSize="0.9rem">
                        Example: 62 (total distance between pupils)
                      </Typography>
                    </Alert>
                  )}

                  {pdType === 'dual' && (
                    <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ mt: 1 }}>
                      <Typography variant="body2" fontSize="0.9rem">
                        Example: 31 / 31 (distance from center of nose to each pupil)
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Box>

              {/* Prescription Image Upload */}
              <Box>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CloudUploadIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'primary.main' }}>
                      Prescription Image (Optional)
                    </Typography>
                  </Stack>

                  <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ mt: 1 }}>
                    <Typography variant="body2" fontSize="0.9rem">
                      Uploading your prescription image is <strong>recommended</strong> for faster verification. Our opticians can verify your prescription more accurately with an image.
                    </Typography>
                  </Alert>

                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: imageUrl ? 'success.main' : 'divider',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      bgcolor: imageUrl ? 'success.50' : 'background.default',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                      },
                    }}
                    onClick={() => document.getElementById('modal-upload')?.click()}
                  >
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      id="modal-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image too large (max 5MB)')
                            return
                          }
                          setImageFile(file)
                          setImageUrl(URL.createObjectURL(file))
                        }
                      }}
                    />
                    {!imageUrl ? (
                      <Stack spacing={1} alignItems="center">
                        <Avatar sx={{ bgcolor: 'action.hover', width: 48, height: 48, mb: 1 }}>
                          <CloudUploadIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          Click to upload or drag and drop
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PNG, JPG, WebP up to 5MB
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack spacing={2} alignItems="center">
                        <Box
                          component="img"
                          src={imageUrl}
                          alt="Prescription preview"
                          sx={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 16 }} />}
                          label="Image uploaded successfully"
                          color="success"
                          variant="filled"
                          onDelete={(e) => {
                            e.stopPropagation()
                            setImageUrl(null)
                            setImageFile(null)
                          }}
                          deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                        />
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : (isEditMode ? <EditIcon /> : <AddIcon />)}>
              {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Prescription' : 'Save Prescription')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}
