import { useState, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import {
  Camera,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ZoomIn,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  completeManufacturing,
  type PrescriptionManufacturingStatus,
} from '@/lib/staff-prescription-api'

interface PrescriptionData {
  pd: number
  sph: { right: number; left: number }
  cyl: { right: number; left: number }
  axis: { right: number; left: number }
  add: { right: number; left: number }
}

interface Props {
  orderId?: string
  itemIndex?: number
  prescriptionData?: PrescriptionData
  productName?: string
  productImage?: string
  manufacturingStatus?: PrescriptionManufacturingStatus
  onCompleted?: (data: PrescriptionManufacturingStatus) => void
}

const MANUFACTURING_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Manufacturing',
    color: 'warning' as const,
    icon: <Clock size={16} />,
  },
  COMPLETED: {
    label: 'Manufacturing Completed',
    color: 'success' as const,
    icon: <CheckCircle size={16} />,
  },
  FAILED: {
    label: 'Manufacturing Failed',
    color: 'error' as const,
    icon: <XCircle size={16} />,
  },
}

export function PrescriptionManufacturingCard({
  orderId,
  itemIndex,
  prescriptionData,
  productName,
  productImage,
  manufacturingStatus,
  onCompleted,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentStatus = manufacturingStatus?.manufacturingStatus || 'PENDING'

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || orderId === undefined || itemIndex === undefined) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    try {
      setUploading(true)
      const result = await completeManufacturing(orderId, itemIndex, file)
      toast.success('Manufacturing proof uploaded successfully')
      onCompleted?.({
        manufacturingProofUrl: result.manufacturingProofUrl,
        manufacturingStatus: result.manufacturingStatus,
        manufacturedAt: result.manufacturedAt,
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload manufacturing proof')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!prescriptionData) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No prescription data available for this item
      </Alert>
    )
  }

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          borderColor:
            currentStatus === 'COMPLETED'
              ? 'success.main'
              : currentStatus === 'FAILED'
                ? 'error.main'
                : 'warning.main',
        }}
      >
        <CardContent>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Prescription Manufacturing
              </Typography>
              {productName && (
                <Typography variant="body2" color="text.secondary">
                  {productName}
                </Typography>
              )}
            </Box>
            <Chip
              size="small"
              icon={MANUFACTURING_STATUS_CONFIG[currentStatus].icon}
              label={MANUFACTURING_STATUS_CONFIG[currentStatus].label}
              color={MANUFACTURING_STATUS_CONFIG[currentStatus].color}
            />
          </Stack>

          {/* Prescription Details */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'grey.50',
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Prescription Details
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  PD (Pupillary Distance)
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {prescriptionData.pd} mm
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    OD (Right Eye)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    SPH: {prescriptionData.sph.right} | CYL:{' '}
                    {prescriptionData.cyl.right}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    AXIS: {prescriptionData.axis.right}° | ADD:{' '}
                    {prescriptionData.add.right}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    OS (Left Eye)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    SPH: {prescriptionData.sph.left} | CYL:{' '}
                    {prescriptionData.cyl.left}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    AXIS: {prescriptionData.axis.left}° | ADD:{' '}
                    {prescriptionData.add.left}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {/* Manufacturing Proof Preview */}
          {manufacturingStatus?.manufacturingProofUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Manufacturing Proof
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 150,
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: 'grey.100',
                }}
              >
                <img
                  src={manufacturingStatus.manufacturingProofUrl}
                  alt="Manufacturing proof"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <ZoomIn size={20} />
                  </IconButton>
                </Box>
                {manufacturingStatus.manufacturedAt && (
                  <Chip
                    size="small"
                    label={new Date(manufacturingStatus.manufacturedAt).toLocaleDateString()}
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Info message when pending */}
          {currentStatus === 'PENDING' && !manufacturingStatus?.manufacturingProofUrl && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Upload a photo of the finished glasses to complete manufacturing
              </Typography>
            </Alert>
          )}
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          {currentStatus === 'PENDING' && orderId !== undefined && itemIndex !== undefined ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button
                variant="contained"
                startIcon={uploading ? <CircularProgress size={16} /> : <Camera size={16} />}
                onClick={handleFileSelect}
                disabled={uploading}
                fullWidth
              >
                {uploading ? 'Uploading...' : 'Upload Proof & Complete'}
              </Button>
            </>
          ) : currentStatus === 'COMPLETED' ? (
            <Button
              variant="outlined"
              startIcon={<Eye size={16} />}
              onClick={() => setPreviewOpen(true)}
              fullWidth
            >
              View Proof
            </Button>
          ) : null}
        </CardActions>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Manufacturing Proof</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <X size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {manufacturingStatus?.manufacturingProofUrl && (
            <Box
              component="img"
              src={manufacturingStatus.manufacturingProofUrl}
              alt="Manufacturing proof"
              sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
            />
          )}
          {manufacturingStatus?.manufacturedAt && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Completed on {new Date(manufacturingStatus.manufacturedAt).toLocaleString()}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
