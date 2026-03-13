import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Divider,
  Grid,
  Alert,
} from '@mui/material'
import { X, ZoomIn, ZoomOut, RotateCw, Sun, Contrast, CheckCircle, XCircle } from 'lucide-react'
import { type Prescription } from '@/lib/prescription-api'
import { formatDateTime } from '@/lib/utils'
import { PrescriptionManufacturingCard } from './PrescriptionManufacturingCard'
import { toast } from 'sonner'
import { prescriptionApi } from '@/lib/prescription-api'

interface Props {
  open: boolean
  prescription: Prescription | null
  onClose: () => void
  onVerified?: (id: string) => void
  onRejected?: (id: string) => void
  onManufacturingCompleted?: () => void
}

export function PrescriptionViewModal({ open, prescription, onClose, onVerified, onRejected, onManufacturingCompleted }: Props) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)

  const handleVerify = () => {
    if (prescription && onVerified) {
      onVerified(prescription._id)
    }
  }

  const handleReject = () => {
    if (prescription && onRejected) {
      onRejected(prescription._id)
    }
  }

  const handleManufacturingCompleted = async () => {
    try {
      // Refresh the prescription data
      if (prescription) {
        const updated = await prescriptionApi.getPrescriptionById(prescription._id)
        // Update the parent's prescription reference
        onManufacturingCompleted?.()
      }
    } catch (error) {
      console.error('Failed to refresh prescription:', error)
    }
  }

  if (!prescription) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{prescription.name}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Added {formatDateTime(prescription.createdAt)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><X size={24} /></IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          {/* Left: Prescription Data */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ p: 3, overflow: 'auto', maxHeight: '70vh' }}>
            {/* Status */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={prescription.isVerified ? 'Verified' : 'Pending Verification'}
                  color={prescription.isVerified ? 'success' : 'warning'}
                  icon={prescription.isVerified ? <CheckCircle size={16} /> : undefined}
                  sx={{ fontWeight: 600 }}
                />
                {prescription.verifiedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Verified {formatDateTime(prescription.verifiedAt)}
                  </Typography>
                )}
              </Stack>
              {prescription.verificationNotes && (
                <Paper sx={{ mt: 2, p: 2, bgcolor: 'info.50' }}>
                  <Typography variant="caption" color="text.secondary">Notes: </Typography>
                  <Typography variant="body2">{prescription.verificationNotes}</Typography>
                </Paper>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>Prescription Details</Typography>

            {prescription.prescriptionDate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body1">{new Date(prescription.prescriptionDate).toLocaleDateString()}</Typography>
              </Box>
            )}

            {/* Right Eye */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary.main" gutterBottom>Right Eye (OD)</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">SPH</Typography><Typography variant="body1">{prescription.rightEye?.sph ?? '--'}</Typography></Grid>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">CYL</Typography><Typography variant="body1">{prescription.rightEye?.cyl ?? '--'}</Typography></Grid>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">AXIS</Typography><Typography variant="body1">{prescription.rightEye?.axis ?? '--'}</Typography></Grid>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">ADD</Typography><Typography variant="body1">{prescription.rightEye?.add ?? '--'}</Typography></Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Left Eye */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="primary.main" gutterBottom>Left Eye (OS)</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">SPH</Typography><Typography variant="body1">{prescription.leftEye?.sph ?? '--'}</Typography></Grid>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">CYL</Typography><Typography variant="body1">{prescription.leftEye?.cyl ?? '--'}</Typography></Grid>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">AXIS</Typography><Typography variant="body1">{prescription.leftEye?.axis ?? '--'}</Typography></Grid>
                <Grid size={{ xs: 3 }}><Typography variant="caption" color="text.secondary">ADD</Typography><Typography variant="body1">{prescription.leftEye?.add ?? '--'}</Typography></Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* PD */}
            {prescription.pd && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Pupillary Distance</Typography>
                <Grid container spacing={2}>
                  {prescription.pd.right !== undefined && <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary">Right</Typography><Typography variant="body1">{prescription.pd.right}</Typography></Grid>}
                  {prescription.pd.left !== undefined && <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary">Left</Typography><Typography variant="body1">{prescription.pd.left}</Typography></Grid>}
                  {prescription.pd.total !== undefined && <Grid size={{ xs: 4 }}><Typography variant="caption" color="text.secondary">Total</Typography><Typography variant="body1">{prescription.pd.total}</Typography></Grid>}
                </Grid>
              </Box>
            )}

            {/* Manufacturing Proof Section - only show for verified prescriptions */}
            {prescription.isVerified && (
              <Box sx={{ mt: 3 }}>
                <PrescriptionManufacturingCard
                  prescriptionId={prescription._id}
                  prescriptionData={prescription.pd ? {
                    pd: prescription.pd.total ?? prescription.pd.right ?? prescription.pd.left ?? 0,
                    sph: {
                      right: prescription.rightEye?.sph ?? 0,
                      left: prescription.leftEye?.sph ?? 0,
                    },
                    cyl: {
                      right: prescription.rightEye?.cyl ?? 0,
                      left: prescription.leftEye?.cyl ?? 0,
                    },
                    axis: {
                      right: prescription.rightEye?.axis ?? 0,
                      left: prescription.leftEye?.axis ?? 0,
                    },
                    add: {
                      right: prescription.rightEye?.add ?? 0,
                      left: prescription.leftEye?.add ?? 0,
                    },
                  } : undefined}
                  manufacturingStatus={prescription.manufacturingStatus ? {
                    manufacturingProofUrl: prescription.manufacturingProofUrl,
                    manufacturingStatus: prescription.manufacturingStatus,
                    manufacturedAt: prescription.manufacturedAt,
                  } : undefined}
                  onCompleted={handleManufacturingCompleted}
                />
              </Box>
            )}
          </Grid>

          {/* Right: Image Viewer */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ bgcolor: 'grey.900', p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>Prescription Image</Typography>

            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
              <Button size="small" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} sx={{ color: 'white', bgcolor: 'grey.800', minWidth: 36 }}>
                <ZoomOut size={14} />
              </Button>
              <Button size="small" onClick={() => setZoom(z => Math.min(3, z + 0.25))} sx={{ color: 'white', bgcolor: 'grey.800', minWidth: 36 }}>
                <ZoomIn size={14} />
              </Button>
              <Button size="small" onClick={() => setRotation(r => (r + 90) % 360)} sx={{ color: 'white', bgcolor: 'grey.800', minWidth: 36 }}>
                <RotateCw size={14} />
              </Button>
              <Typography variant="caption" sx={{ color: 'grey.400', ml: 'auto', display: 'flex', alignItems: 'center' }}>
                {Math.round(zoom * 100)}%
              </Typography>
            </Box>

            {/* Image */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'black', borderRadius: 1, overflow: 'hidden', mb: 1 }}>
              {prescription.imageUrl ? (
                <Box
                  component="img"
                  src={prescription.imageUrl}
                  alt="Prescription"
                  sx={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain', transform: `scale(${zoom}) rotate(${rotation}deg)`, filter: `brightness(${brightness}%)` }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'grey.500' }}>No image</Typography>
              )}
            </Box>

            {/* Brightness */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ color: 'grey.400' }}>
                <Sun size={14} />
              </Box>
              <Typography variant="caption" sx={{ color: 'grey.400', minWidth: 50 }}>Brightness</Typography>
              <Box sx={{ flex: 1 }}>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'grey.400', minWidth: 30 }}>{brightness}%</Typography>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {!prescription.isVerified ? (
          <>
            <Button
              onClick={handleReject}
              variant="outlined"
              color="error"
              startIcon={<XCircle size={16} />}
            >
              Reject
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleVerify}
              variant="contained"
              color="success"
              startIcon={<CheckCircle size={16} />}
            >
              Verify Prescription
            </Button>
          </>
        ) : (
          <>
            <Box sx={{ flex: 1 }} />
            <Button onClick={onClose}>Close</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
