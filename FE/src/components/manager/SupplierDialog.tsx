import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Grid,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  InputAdornment,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Payments as PaymentsIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import {
  createSupplier,
  updateSupplier,
  getSupplierById,
  type Supplier,
  type CreateSupplierPayload,
  type UpdateSupplierPayload,
  SupplierStatus,
} from '@/lib/supplier-api'

interface SupplierDialogProps {
  open: boolean
  onClose: () => void
  onSave?: () => void
  supplierId?: string | null
}

// Vietnamese phone regex: starts with 0, followed by 9-10 digits (common formats)
const VIETNAMESE_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/

const isValidVietnamesePhone = (phone: string): boolean => {
  // Remove spaces, dashes, dots for validation
  const cleaned = phone.replace(/[\s\.\-]/g, '')
  return VIETNAMESE_PHONE_REGEX.test(cleaned)
}

export function SupplierDialog({ open, onClose, onSave, supplierId }: SupplierDialogProps) {
  const isEdit = Boolean(supplierId)

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
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('Vietnam')
  const [status, setStatus] = useState<SupplierStatus>(SupplierStatus.ACTIVE)

  // Accordion states
  const [basicExpanded, setBasicExpanded] = useState(true)
  const [contactExpanded, setContactExpanded] = useState(false)
  const [financeExpanded, setFinanceExpanded] = useState(false)
  const [addressExpanded, setAddressExpanded] = useState(false)
  const [statusExpanded, setStatusExpanded] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form
  const resetForm = useCallback(() => {
    setCode('')
    setName('')
    setEmail('')
    setPhone('')
    setTaxCode('')
    setAddressLine1('')
    setAddressLine2('')
    setCity('')
    setState('')
    setPostalCode('')
    setCountry('Vietnam')
    setStatus(SupplierStatus.ACTIVE)
    setErrors({})
    setSupplier(null)
    // Reset accordions for new supplier
    setBasicExpanded(true)
    setContactExpanded(false)
    setFinanceExpanded(false)
    setAddressExpanded(false)
    setStatusExpanded(false)
  }, [])

  // Close dialog
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  // Load supplier for edit
  const loadSupplier = useCallback(async () => {
    if (!supplierId) return

    try {
      setLoading(true)
      const data = await getSupplierById(supplierId)
      setSupplier(data)

      // Populate form
      setCode(data.code)
      setName(data.name)
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setTaxCode(data.taxCode || '')
      setAddressLine1(data.addressLine1 || '')
      setAddressLine2(data.addressLine2 || '')
      setCity(data.city || '')
      setState(data.state || '')
      setPostalCode(data.postalCode || '')
      setCountry(data.country || 'Vietnam')
      setStatus(data.status || SupplierStatus.ACTIVE)

      // Expand accordions for edit if they have data
      setContactExpanded(!!(data.email || data.phone))
      setFinanceExpanded(!!(data.taxCode))
      setAddressExpanded(!!(data.addressLine1 || data.city))
      setStatusExpanded(true)
    } catch {
      handleClose()
    } finally {
      setLoading(false)
    }
  }, [supplierId, handleClose])

  useEffect(() => {
    if (open && supplierId) {
      loadSupplier()
    } else if (open && !supplierId) {
      resetForm()
    }
  }, [open, supplierId, loadSupplier, resetForm])

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

    if (phone && !isValidVietnamesePhone(phone)) {
      newErrors.phone = 'Invalid Vietnamese phone number (e.g., 0912345678, 0321234567)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/[^\d+]/g, '')
    return cleaned
  }

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    // Clear error when user starts typing
    if (errors.phone) {
      setErrors({ ...errors, phone: '' })
    }
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
        currency: 'VND',
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        country: country.trim() || undefined,
        status,
      }

      if (isEdit && supplierId) {
        await updateSupplier(supplierId, payload as UpdateSupplierPayload)
      } else {
        await createSupplier(payload as CreateSupplierPayload)
      }

      onSave?.()
      handleClose()
    } catch {
      // Could add error handling here
    } finally {
      setSaving(false)
    }
  }

  const requiredFieldsComplete = code.trim() && name.trim()

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2,
              p: 1,
              display: 'flex',
            }}
          >
            <BusinessIcon />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={600}>
              {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit ? 'Update supplier information' : 'Create a new supplier for your business'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {/* Basic Information - Always Expanded */}
            <Accordion
              expanded={basicExpanded}
              onChange={(_, expanded) => setBasicExpanded(expanded)}
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ cursor: 'pointer' }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{ pointerEvents: 'none' }}
                >
                  <InfoIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Basic Information
                  </Typography>
                  <Chip
                    label="Required"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', pointerEvents: 'none' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Supplier Code"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase())
                        if (errors.code) setErrors({ ...errors, code: '' })
                      }}
                      error={Boolean(errors.code)}
                      helperText={errors.code || 'Unique identifier (e.g., ACME, SUP-001)'}
                      disabled={isEdit}
                      placeholder="ACME"
                      autoFocus={!isEdit}
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Supplier Name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (errors.name) setErrors({ ...errors, name: '' })
                      }}
                      error={Boolean(errors.name)}
                      helperText={errors.name || 'Official business name'}
                      placeholder="Acme Eyewear Supplies"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Contact Information */}
            <Accordion
              expanded={contactExpanded}
              onChange={(_, expanded) => setContactExpanded(expanded)}
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ cursor: 'pointer' }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{ pointerEvents: 'none' }}
                >
                  <EmailIcon color="action" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Contact Information
                  </Typography>
                  <Chip
                    label="Optional"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', pointerEvents: 'none' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors({ ...errors, email: '' })
                      }}
                      error={Boolean(errors.email)}
                      helperText={errors.email || 'Contact email address'}
                      placeholder="contact@acme.com"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Number (Vietnamese)"
                      value={phone}
                      onChange={handlePhoneChange}
                      error={Boolean(errors.phone)}
                      helperText={errors.phone || 'Format: 0912345678 or 0321234567'}
                      placeholder="0912345678"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    {phone && !errors.phone && (
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          icon={<PhoneIcon sx={{ fontSize: 14 }} />}
                          label={isValidVietnamesePhone(phone) ? 'Valid VN number' : 'May not be a valid VN number'}
                          size="small"
                          color={isValidVietnamesePhone(phone) ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Finance Information */}
            <Accordion
              expanded={financeExpanded}
              onChange={(_, expanded) => setFinanceExpanded(expanded)}
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ cursor: 'pointer' }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{ pointerEvents: 'none' }}
                >
                  <PaymentsIcon color="action" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Finance Information
                  </Typography>
                  <Chip
                    label="Optional"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', pointerEvents: 'none' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tax Code / VAT Number"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="123456789"
                      helperText="Business tax identification number"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Address Information */}
            <Accordion
              expanded={addressExpanded}
              onChange={(_, expanded) => setAddressExpanded(expanded)}
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ cursor: 'pointer' }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{ pointerEvents: 'none' }}
                >
                  <LocationOnIcon color="action" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Address
                  </Typography>
                  <Chip
                    label="Optional"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', pointerEvents: 'none' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address Line 1"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </Grid>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address Line 2"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Suite 100, Floor 5"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="City / Province"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ho Chi Minh City"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="District"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="District 1"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="700000"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Vietnam"
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="Vietnam">Vietnam</option>
                      <option value="China">China</option>
                      <option value="Thailand">Thailand</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Other">Other</option>
                    </TextField>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Status - Only for edit */}
            {isEdit && (
              <Accordion
                expanded={statusExpanded}
                onChange={(_, expanded) => setStatusExpanded(expanded)}
                elevation={0}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    sx={{ pointerEvents: 'none' }}
                  >
                    <InfoIcon color="action" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Status
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={status === SupplierStatus.ACTIVE}
                          onChange={(e) => setStatus(e.target.checked ? SupplierStatus.ACTIVE : SupplierStatus.INACTIVE)}
                          color="success"
                        />
                      }
                      label={
                        <Box sx={{ ml: 1 }}>
                          {status === SupplierStatus.ACTIVE ? (
                            <Chip
                              label="Active - Available for selection"
                              color="success"
                              size="small"
                              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />}
                            />
                          ) : (
                            <Chip
                              label="Inactive - Hidden from lists"
                              color="default"
                              size="small"
                            />
                          )}
                        </Box>
                      }
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                      Inactive suppliers won't appear in dropdown selections
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            <Divider />

            {/* Form validation hint */}
            {!requiredFieldsComplete && (
              <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ mt: 1 }}>
                <Typography variant="caption">
                  Please fill in the required fields (Code and Name) to save
                </Typography>
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={handleClose}
          disabled={saving || loading}
          size="medium"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={saving || loading || !requiredFieldsComplete}
          size="medium"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
