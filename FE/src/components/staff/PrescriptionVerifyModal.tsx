import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  TextField,
  Chip,
  IconButton,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Grid,
} from '@mui/material'
import {
  X,
  Phone,
  Mail,
  Clock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  verifyPrescription,
  requestUpdate,
  type PrescriptionData,
  type OrderAwaitingVerification,
} from '@/lib/staff-prescription-api'

interface Props {
  open: boolean
  order: OrderAwaitingVerification | null
  onClose: () => void
  onVerified: () => void
}

const PRESCRIPTION_TYPES = ['Single Vision', 'Bifocal', 'Progressive']
const UPDATE_REASONS = [
  'Image Blurry',
  'PD Missing',
  'Values Unclear',
  'Prescription Expired',
  'Other',
]

export function PrescriptionVerifyModal({ open, order, onClose, onVerified }: Props) {
  const [editedData, setEditedData] = useState<PrescriptionData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [updateReason, setUpdateReason] = useState('')
  const [updateNote, setUpdateNote] = useState('')
  const [imageZoom, setImageZoom] = useState(1)
  const [imageRotation, setImageRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [showPrescriptionValues, setShowPrescriptionValues] = useState(true)

  useEffect(() => {
    if (order?.prescriptionData) {
      setEditedData(order.prescriptionData)
    }
  }, [order])

  useEffect(() => {
    if (editedData && order?.prescriptionData) {
      setHasChanges(JSON.stringify(editedData) !== JSON.stringify(order.prescriptionData))
    }
  }, [editedData, order])

  const handleVerify = async () => {
    if (!order) return
    try {
      await verifyPrescription(order.orderId, order.orderItemId, {
        rightEye: editedData
          ? {
              sph: editedData.sph.right,
              cyl: editedData.cyl.right,
              axis: editedData.axis.right,
              add: editedData.add.right,
            }
          : undefined,
        leftEye: editedData
          ? {
              sph: editedData.sph.left,
              cyl: editedData.cyl.left,
              axis: editedData.axis.left,
              add: editedData.add.left,
            }
          : undefined,
        pd: editedData ? { total: editedData.pd } : undefined,
      })
      toast.success('Prescription verified and sent to manufacturing')
      onVerified()
    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
    }
  }

  const handleRequestUpdate = async () => {
    if (!order) return
    try {
      await requestUpdate(order.orderId, order.orderItemId, {
        reason: updateNote || updateReason,
        reasonCategory: updateReason,
      })
      toast.success('Update request sent to customer')
      setUpdateDialogOpen(false)
      onVerified()
    } catch (err: any) {
      toast.error(err.message || 'Failed to send update request')
    }
  }

  const updateValue = (eye: 'right' | 'left', field: keyof Omit<PrescriptionData, 'pd'>, value: number) => {
    if (!editedData) return
    setEditedData({
      ...editedData,
      [field]: { ...(editedData[field] as Record<string, number>), [eye]: value },
    })
  }

  const renderField = (
    label: string,
    value: number | undefined,
    eye: 'right' | 'left',
    field: keyof Omit<PrescriptionData, 'pd'>
  ) => (
    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <TextField
        type="number"
        size="small"
        value={value ?? ''}
        onChange={(e) => updateValue(eye, field, parseFloat(e.target.value) || 0)}
        inputProps={{
          step: 0.25,
          min: field === 'axis' ? 0 : -20,
          max: field === 'axis' ? 180 : 10,
        }}
        sx={{ width: 70, '& input': { textAlign: 'center' } }}
      />
    </Box>
  )

  if (!order) return null

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              #{order.orderNumber}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Clock size={14} />
                <Typography variant="caption">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </Typography>
              </Stack>
              <Chip
                label={order.prescriptionStatus.replace(/_/g, ' ')}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Stack>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <X size={24} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* Customer Info */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {order.customerName}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  {order.customerPhone && (
                    <Button
                      size="small"
                      startIcon={<Phone size={14} />}
                      href={`tel:${order.customerPhone}`}
                    >
                      {order.customerPhone}
                    </Button>
                  )}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  {order.productName}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Grid container sx={{ height: 'calc(90vh - 200px)' }}>
            {/* Left: Prescription Data */}
            <Grid
              size={{ xs: 12, md: 7 }}
              sx={{ borderRight: 1, borderColor: 'divider', overflow: 'auto', p: 3 }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Prescription Data
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowPrescriptionValues(!showPrescriptionValues)}
                >
                  {showPrescriptionValues ? <Eye size={16} /> : <EyeOff size={16} />}
                </IconButton>
              </Stack>

              {hasChanges && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You have unsaved changes
                </Alert>
              )}

              {/* Prescription Type */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Prescription Type</InputLabel>
                <Select defaultValue="Single Vision" label="Prescription Type">
                  {PRESCRIPTION_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {showPrescriptionValues && editedData ? (
                <>
                  {/* Right Eye */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="primary.main"
                      gutterBottom
                    >
                      OD - Right Eye
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        {renderField('SPH', editedData.sph.right, 'right', 'sph')}
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {renderField('CYL', editedData.cyl.right, 'right', 'cyl')}
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {renderField('AXIS', editedData.axis.right, 'right', 'axis')}
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {renderField('ADD', editedData.add.right, 'right', 'add')}
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Left Eye */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="primary.main"
                      gutterBottom
                    >
                      OS - Left Eye
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        {renderField('SPH', editedData.sph.left, 'left', 'sph')}
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {renderField('CYL', editedData.cyl.left, 'left', 'cyl')}
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {renderField('AXIS', editedData.axis.left, 'left', 'axis')}
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        {renderField('ADD', editedData.add.left, 'left', 'add')}
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* PD */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      PD - Pupillary Distance
                    </Typography>
                    <Box
                      sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, display: 'inline-block' }}
                    >
                      <TextField
                        type="number"
                        size="small"
                        label="Total PD"
                        value={editedData.pd ?? ''}
                        onChange={(e) =>
                          setEditedData({ ...editedData, pd: parseFloat(e.target.value) || 0 })
                        }
                        inputProps={{ step: 0.5, min: 20, max: 80 }}
                        sx={{ width: 100 }}
                      />
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Box sx={{ mb: 1, opacity: 0.5 }}>
                    <EyeOff size={48} />
                  </Box>
                  <Typography>Prescription values hidden</Typography>
                </Box>
              )}
            </Grid>

            {/* Right: Prescription Image */}
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{
                bgcolor: 'grey.900',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Image Controls */}
              <Box sx={{ p: 1, bgcolor: 'grey.800', display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
                  sx={{ color: 'white' }}
                >
                  <ZoomOut size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
                  sx={{ color: 'white' }}
                >
                  <ZoomIn size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  sx={{ color: 'white' }}
                >
                  <RotateCw size={16} />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{ color: 'grey.400', ml: 'auto', display: 'flex', alignItems: 'center' }}
                >
                  {Math.round(imageZoom * 100)}%
                </Typography>
              </Box>

              {/* Image */}
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1,
                  overflow: 'hidden',
                }}
              >
                {order.prescriptionUrl ? (
                  <Box
                    component="img"
                    src={order.prescriptionUrl}
                    alt="Prescription"
                    sx={{
                      maxWidth: '90%',
                      maxHeight: '90%',
                      objectFit: 'contain',
                      transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                      transition: 'transform 0.2s',
                      filter: `brightness(${brightness}%)`,
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: 'grey.500' }}>
                    No prescription image uploaded
                  </Typography>
                )}
              </Box>

              {/* Brightness Control */}
              <Box sx={{ p: 1, bgcolor: 'grey.800' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ color: 'grey.400' }}>
                    <Sun size={16} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'grey.400', minWidth: 60 }}>
                    Brightness
                  </Typography>
                  <Slider
                    size="small"
                    value={brightness}
                    onChange={(_, v) => setBrightness(v as number)}
                    min={50}
                    max={150}
                    sx={{ color: 'grey.400', flex: 1 }}
                  />
                  <Typography variant="caption" sx={{ color: 'grey.400', minWidth: 35 }}>
                    {brightness}%
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setUpdateDialogOpen(true)} color="warning" variant="outlined">
            Request Update
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleVerify} variant="contained" color="success">
            Verify & Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Request Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Customer Update</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Reason"
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
            >
              {UPDATE_REASONS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              multiline
              rows={3}
              fullWidth
              label="Additional Note (Optional)"
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRequestUpdate}
            variant="contained"
            disabled={!updateReason && !updateNote}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
