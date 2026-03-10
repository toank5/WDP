import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { prescriptionApi, type Prescription, type EyeData, type PDData, type UpdatePrescriptionRequest } from '@/lib/prescription-api'

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

const SPH_OPTIONS = Array.from({ length: 161 }, (_, i) => {
  const value = (i - 80) / 4
  return value.toFixed(2)
})

const CYL_OPTIONS = Array.from({ length: 81 }, (_, i) => {
  const value = (i - 40) / 4
  return value.toFixed(2)
})

const AXIS_OPTIONS = Array.from({ length: 181 }, (_, i) => i.toString())

const ADD_OPTIONS = Array.from({ length: 41 }, (_, i) => {
  const value = (i * 0.25).toFixed(2)
  return value
})

const PD_OPTIONS = Array.from({ length: 41 }, (_, i) => {
  const value = (20 + i * 1.5).toFixed(1)
  return value
})

const toString = (value: number | undefined): string | undefined => {
  if (value === undefined) return undefined
  return value.toString()
}

export default function EditPrescriptionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
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

  useEffect(() => {
    void loadPrescription()
  }, [id])

  const loadPrescription = async () => {
    if (!id) {
      setError('Prescription ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const prescription = await prescriptionApi.getPrescriptionById(id)

      // Check if prescription is verified
      if (prescription.isVerified) {
        toast.error('Cannot edit a verified prescription')
        navigate('/account/prescriptions')
        return
      }

      setImageUrl(prescription.imageUrl || null)

      reset({
        name: prescription.name,
        prescriptionDate: prescription.prescriptionDate
          ? new Date(prescription.prescriptionDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        rightEye: {
          sph: toString(prescription.rightEye?.sph),
          cyl: toString(prescription.rightEye?.cyl),
          axis: toString(prescription.rightEye?.axis),
          add: toString(prescription.rightEye?.add),
        },
        leftEye: {
          sph: toString(prescription.leftEye?.sph),
          cyl: toString(prescription.leftEye?.cyl),
          axis: toString(prescription.leftEye?.axis),
          add: toString(prescription.leftEye?.add),
        },
        pd: {
          left: toString(prescription.pd?.left),
          right: toString(prescription.pd?.right),
          total: toString(prescription.pd?.total),
        },
        imageUrl: prescription.imageUrl,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load prescription'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PrescriptionFormData) => {
    if (!id) return

    try {
      setSubmitting(true)

      const toNumber = (value: string | undefined): number | undefined => {
        if (value === '' || value === undefined) return undefined
        return parseFloat(value)
      }

      const request: UpdatePrescriptionRequest = {
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

      await prescriptionApi.updatePrescription(id, request)
      toast.success('Prescription updated successfully!')
      navigate('/account/prescriptions')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update prescription'
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading prescription...
            </Typography>
          </Stack>
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/account/prescriptions')}>
          Back to Prescriptions
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/account/prescriptions')}
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight={700}>
            Edit Prescription
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Prescription Information
              </Typography>
              <Grid container spacing={2}>
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

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Upload Prescription Image
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a clear photo of your paper prescription for manual verification by our opticians.
              </Typography>

              {imageUrl ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={imageUrl}
                    alt="Prescription"
                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1 }}
                  />
                  <IconButton
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'grey.200' },
                    }}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <input
                    accept="image/*"
                    id="prescription-image-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="prescription-image-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                      disabled={uploading}
                      sx={{ minWidth: 200 }}
                    >
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                  </label>
                </Box>
              )}

              <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => <input type="hidden" {...field} value={imageUrl || ''} />}
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Enter Prescription Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Leave fields blank if not available on your prescription.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Right Eye (OD)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Controller
                        name="rightEye.sph"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="SPH (Sphere)"
                            placeholder="+1.00 / -2.50"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="rightEye.cyl"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="CYL (Cylinder)"
                            placeholder="-0.50 / -1.25"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="rightEye.axis"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Axis (0-180)"
                            placeholder="90"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="rightEye.add"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="ADD (Addition)"
                            placeholder="+1.00 / +2.00"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Left Eye (OS)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Controller
                        name="leftEye.sph"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="SPH (Sphere)"
                            placeholder="+1.00 / -2.50"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="leftEye.cyl"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="CYL (Cylinder)"
                            placeholder="-0.50 / -1.25"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="leftEye.axis"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Axis (0-180)"
                            placeholder="90"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="leftEye.add"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="ADD (Addition)"
                            placeholder="+1.00 / +2.00"
                            inputProps={{
                              style: {
                                fontSize: '1.1rem',
                                padding: '12px 14px',
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: 56,
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '1.1rem !important',
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                  Pupillary Distance (PD)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Controller
                      name="pd.left"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Left PD</InputLabel>
                          <Select {...field} label="Left PD" defaultValue="">
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {PD_OPTIONS.map((value) => (
                              <MenuItem key={value} value={value}>
                                {value}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Controller
                      name="pd.right"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Right PD</InputLabel>
                          <Select {...field} label="Right PD" defaultValue="">
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {PD_OPTIONS.map((value) => (
                              <MenuItem key={value} value={value}>
                                {value}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Controller
                      name="pd.total"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Total PD</InputLabel>
                          <Select {...field} label="Total PD" defaultValue="">
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {PD_OPTIONS.map((value) => (
                              <MenuItem key={value} value={value}>
                                {value}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/account/prescriptions')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
                sx={{ minWidth: 150 }}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
