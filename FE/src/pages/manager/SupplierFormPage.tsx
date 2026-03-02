import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Stack,
  Container,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material'
import {
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import {
  getSupplierById,
  createSupplier,
  updateSupplier,
  type Supplier,
  type CreateSupplierPayload,
  type UpdateSupplierPayload,
  SupplierStatus,
} from '@/lib/supplier-api'

export function SupplierFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  // State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [supplier, setSupplier] = useState<Supplier | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [currency, setCurrency] = useState('VND')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState<SupplierStatus>(SupplierStatus.ACTIVE)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  // Show snackbar
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  // Load supplier for edit
  const loadSupplier = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await getSupplierById(id)
      setSupplier(data)

      // Populate form
      setCode(data.code)
      setName(data.name)
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setTaxCode(data.taxCode || '')
      setCurrency(data.currency || 'VND')
      setAddressLine1(data.addressLine1 || '')
      setAddressLine2(data.addressLine2 || '')
      setCity(data.city || '')
      setState(data.state || '')
      setPostalCode(data.postalCode || '')
      setCountry(data.country || '')
      setStatus(data.status || SupplierStatus.ACTIVE)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load supplier'
      showSnackbar(message, 'error')
      navigate('/manager/suppliers')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, showSnackbar])

  useEffect(() => {
    if (isEdit) {
      loadSupplier()
    }
  }, [isEdit, loadSupplier])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!code.trim()) {
      newErrors.code = 'Code is required'
    } else if (!/^[A-Z0-9-]+$/.test(code.toUpperCase())) {
      newErrors.code = 'Code must contain only letters, numbers, and hyphens'
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)

      const payload: CreateSupplierPayload | UpdateSupplierPayload = {
        code: code.toUpperCase(),
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
        currency: currency.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        country: country.trim() || undefined,
        status,
      }

      if (isEdit && id) {
        await updateSupplier(id, payload as UpdateSupplierPayload)
        showSnackbar('Supplier updated successfully', 'success')
      } else {
        await createSupplier(payload as CreateSupplierPayload)
        showSnackbar('Supplier created successfully', 'success')
        // Reset form on create
        if (!isEdit) {
          navigate(`/manager/suppliers`)
        }
      }

      // Navigate back to list after successful save
      setTimeout(() => {
        navigate('/manager/suppliers')
      }, 500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save supplier'
      showSnackbar(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box my={3}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <BusinessIcon fontSize="large" color="primary" />
            <Box flex={1}>
              <Typography variant="h4" fontWeight={600}>
                {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEdit ? 'Update supplier information' : 'Create a new supplier for your business'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/manager/suppliers')}
            >
              Back to List
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Basic Information */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Supplier Code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      error={Boolean(errors.code)}
                      helperText={errors.code || 'Unique code (e.g., ACME)'}
                      disabled={isEdit}
                      placeholder="ACME"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Supplier Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={Boolean(errors.name)}
                      helperText={errors.name || 'Official business name'}
                      placeholder="Acme Eyewear Supplies"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={Boolean(errors.email)}
                      helperText={errors.email}
                      placeholder="contact@acme.com"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1-555-123-4567"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Finance Information */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Finance Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tax Code / VAT Number"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="123456789"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Default Currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="VND"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Address Line 1"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </Grid>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Address Line 2"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Suite 100"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ho Chi Minh City"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="State/Province"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="HCM"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="700000"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Vietnam"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Status */}
            {isEdit && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Status
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={status === SupplierStatus.ACTIVE}
                        onChange={(e) => setStatus(e.target.checked ? SupplierStatus.ACTIVE : SupplierStatus.INACTIVE)}
                        color="success"
                      />
                    }
                    label={status === SupplierStatus.ACTIVE ? 'Active - Available for selection' : 'Inactive - Hidden from lists'}
                  />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/manager/suppliers')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  )
}
