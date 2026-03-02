import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tab,
  Tabs,
  TextField,
  IconButton,
  Stack,
  LinearProgress,
  Card,
  CardMedia,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Image as ImageIcon,
  ViewInAr as ModelIcon,
} from '@mui/icons-material'
import { uploadImages2D, uploadImages3D } from '@/lib/media-api'

interface VariantMediaDialogProps {
  open: boolean
  onClose: () => void
  onSave: (images2D: string[], images3D: string[]) => void
  initialImages2D?: string[]
  initialImages3D?: string[]
  variantSku: string
}

function a11yProps(index: number) {
  return {
    id: `media-tab-${index}`,
    'aria-controls': `media-tabpanel-${index}`,
  }
}

export function VariantMediaDialog({
  open,
  onClose,
  onSave,
  initialImages2D = [],
  initialImages3D = [],
  variantSku,
}: VariantMediaDialogProps) {
  const [tabValue, setTabValue] = useState(0)
  const [images2D, setImages2D] = useState<string[]>(initialImages2D)
  const [images3D, setImages3D] = useState<string[]>(initialImages3D)
  const [isUploading, setIsUploading] = useState(false)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Add 2D images
  const handleAdd2DImages = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      try {
        setIsUploading(true)
        const newUrls = await uploadImages2D(Array.from(files))

        // Merge with existing images and deduplicate
        setImages2D((prev) => Array.from(new Set([...prev, ...newUrls])))
      } catch (error) {
        console.error('Failed to upload 2D images:', error)
        alert('Failed to upload images. Please try again.')
      } finally {
        setIsUploading(false)
        // Reset file input
        event.target.value = ''
      }
    },
    []
  )

  // Add 3D models
  const handleAdd3DModels = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      try {
        setIsUploading(true)
        const newUrls = await uploadImages3D(Array.from(files))

        // Merge with existing models and deduplicate
        setImages3D((prev) => Array.from(new Set([...prev, ...newUrls])))
      } catch (error) {
        console.error('Failed to upload 3D models:', error)
        alert('Failed to upload 3D models. Please try again.')
      } finally {
        setIsUploading(false)
        // Reset file input
        event.target.value = ''
      }
    },
    []
  )

  // Remove 2D image
  const handleRemove2D = useCallback((url: string) => {
    setImages2D((prev) => prev.filter((u) => u !== url))
  }, [])

  // Remove 3D model
  const handleRemove3D = useCallback((url: string) => {
    setImages3D((prev) => prev.filter((u) => u !== url))
  }, [])

  // Handle save
  const handleSave = useCallback(() => {
    onSave(images2D, images3D)
    onClose()
  }, [images2D, images3D, onSave, onClose])

  // Handle cancel - restore initial values
  const handleCancel = useCallback(() => {
    setImages2D(initialImages2D)
    setImages3D(initialImages3D)
    onClose()
  }, [initialImages2D, initialImages3D, onClose])

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">Variant Media</Typography>
            <Typography variant="body2" color="text.secondary">
              SKU: {variantSku}
            </Typography>
          </Box>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {isUploading && <LinearProgress />}

      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="2D Images" {...a11yProps(0)} icon={<ImageIcon />} iconPosition="start" />
          <Tab label="3D Models" {...a11yProps(1)} icon={<ModelIcon />} iconPosition="start" />
        </Tabs>

        {/* 2D Images Tab */}
        <Box role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && (
            <Stack spacing={2}>
              {/* Upload button */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<AddIcon />}
                disabled={isUploading}
                fullWidth
              >
                Add 2D Images
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleAdd2DImages}
                />
              </Button>

              {/* Existing images */}
              {images2D.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 2,
                  }}
                >
                  {images2D.map((url, index) => (
                    <Card key={index} variant="outlined">
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={url}
                          alt={`Variant image ${index + 1}`}
                          sx={{ objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemove2D(url)}
                          disabled={isUploading}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'grey.200' },
                          }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography>No 2D images yet</Typography>
                </Box>
              )}

              <Typography variant="body2" color="text.secondary">
                Total: {images2D.length} image(s)
              </Typography>
            </Stack>
          )}
        </Box>

        {/* 3D Models Tab */}
        <Box role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && (
            <Stack spacing={2}>
              {/* Upload button */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<AddIcon />}
                disabled={isUploading}
                fullWidth
              >
                Add 3D Models
                <input
                  type="file"
                  hidden
                  accept=".glb,.gltf,.usdz"
                  multiple
                  onChange={handleAdd3DModels}
                />
              </Button>

              {/* Existing models */}
              {images3D.length > 0 ? (
                <Stack spacing={1}>
                  {images3D.map((url, index) => (
                    <Card key={index} variant="outlined">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <ModelIcon color="primary" />
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                            {url.split('/').pop()}
                          </Typography>
                          <Chip
                            label="3D Model"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemove3D(url)}
                          disabled={isUploading}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary',
                  }}
                >
                  <ModelIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography>No 3D models yet</Typography>
                </Box>
              )}

              <Typography variant="body2" color="text.secondary">
                Total: {images3D.length} model(s)
              </Typography>
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isUploading}>
          Save Media
        </Button>
      </DialogActions>
    </Dialog>
  )
}
