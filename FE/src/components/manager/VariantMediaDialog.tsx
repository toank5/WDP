import { useState, useCallback, useEffect } from 'react'
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
  IconButton,
  Stack,
  Card,
  CardMedia,
  Chip,
  Alert,
} from '@mui/material'
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Image as ImageIcon,
  ViewInAr as ModelIcon,
} from '@mui/icons-material'

interface VariantMediaDialogProps {
  open: boolean
  onClose: () => void
  onSave: (images2DUrls: string[], images3DUrls: string[], images2DFiles: File[], images3DFiles: File[]) => void
  initialImages2DUrls?: string[]
  initialImages3DUrls?: string[]
  initialImages2DFiles?: File[]
  initialImages3DFiles?: File[]
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
  initialImages2DUrls = [],
  initialImages3DUrls = [],
  initialImages2DFiles = [],
  initialImages3DFiles = [],
  variantSku,
}: VariantMediaDialogProps) {
  const [tabValue, setTabValue] = useState(0)
  const [images2DUrls, setImages2DUrls] = useState<string[]>(initialImages2DUrls)
  const [images3DUrls, setImages3DUrls] = useState<string[]>(initialImages3DUrls)
  const [images2DFiles, setImages2DFiles] = useState<File[]>(initialImages2DFiles)
  const [images3DFiles, setImages3DFiles] = useState<File[]>(initialImages3DFiles)
  const [validationError, setValidationError] = useState<string | null>(null)

  // File size limits (in bytes)
  const MAX_2D_SIZE = 10 * 1024 * 1024 // 10MB
  const MAX_3D_SIZE = 10 * 1024 * 1024 // 10MB (Cloudinary limit)

  // Reset state when dialog opens with new variant data
  useEffect(() => {
    if (open) {
      setTabValue(0)
      setImages2DUrls([...initialImages2DUrls])
      setImages3DUrls([...initialImages3DUrls])
      setImages2DFiles([...initialImages2DFiles])
      setImages3DFiles([...initialImages3DFiles])
      setValidationError(null)
    }
  }, [open, initialImages2DUrls, initialImages3DUrls, initialImages2DFiles, initialImages3DFiles])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    setValidationError(null)
  }

  // Add 2D image files (no upload, just store in state)
  const handleAdd2DImages = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setValidationError(null)

    const newFiles = Array.from(files)
    // Validate file sizes
    const oversizedFiles = newFiles.filter((file) => file.size > MAX_2D_SIZE)
    if (oversizedFiles.length > 0) {
      setValidationError(
        `The following 2D image(s) exceed the 10MB limit: ${oversizedFiles.map((f) => f.name).join(', ')}`
      )
      return
    }

    setImages2DFiles((prev) => [...prev, ...newFiles])

    // Reset file input
    event.target.value = ''
  }, [])

  // Add 3D model files (no upload, just store in state)
  const handleAdd3DModels = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setValidationError(null)

    const newFiles = Array.from(files)
    // Validate file sizes
    const oversizedFiles = newFiles.filter((file) => file.size > MAX_3D_SIZE)
    if (oversizedFiles.length > 0) {
      setValidationError(
        `The following 3D model(s) exceed the 10MB limit: ${oversizedFiles.map((f) => f.name).join(', ')}`
      )
      return
    }

    setImages3DFiles((prev) => [...prev, ...newFiles])

    // Reset file input
    event.target.value = ''
  }, [])

  // Remove 2D image URL
  const handleRemove2DUrl = useCallback((url: string) => {
    setImages2DUrls((prev) => prev.filter((u) => u !== url))
  }, [])

  // Remove 2D image file
  const handleRemove2DFile = useCallback((index: number) => {
    setImages2DFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Remove 3D model URL
  const handleRemove3DUrl = useCallback((url: string) => {
    setImages3DUrls((prev) => prev.filter((u) => u !== url))
  }, [])

  // Remove 3D model file
  const handleRemove3DFile = useCallback((index: number) => {
    setImages3DFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Handle save - pass both URLs and files back to parent
  const handleSave = useCallback(() => {
    onSave(images2DUrls, images3DUrls, images2DFiles, images3DFiles)
    onClose()
  }, [images2DUrls, images3DUrls, images2DFiles, images3DFiles, onSave, onClose])

  // Handle cancel - restore initial values
  const handleCancel = useCallback(() => {
    setImages2DUrls(initialImages2DUrls)
    setImages3DUrls(initialImages3DUrls)
    setImages2DFiles(initialImages2DFiles)
    setImages3DFiles(initialImages3DFiles)
    onClose()
  }, [initialImages2DUrls, initialImages3DUrls, initialImages2DFiles, initialImages3DFiles, onClose])

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

      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="2D Images" {...a11yProps(0)} icon={<ImageIcon />} iconPosition="start" />
          <Tab label="3D Models" {...a11yProps(1)} icon={<ModelIcon />} iconPosition="start" />
        </Tabs>

        {/* Validation error alert */}
        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setValidationError(null)}>
            {validationError}
          </Alert>
        )}

        {/* 2D Images Tab */}
        <Box role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && (
            <Stack spacing={2}>
              {/* Upload button */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<AddIcon />}
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

              {/* Existing URLs */}
              {images2DUrls.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'success.main' }}>
                    Uploaded Images ({images2DUrls.length})
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: 2,
                    }}
                  >
                    {images2DUrls.map((url, index) => (
                      <Card key={`url-${index}`} variant="outlined">
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="120"
                            image={url}
                            alt={`Variant image ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                          />
                          <Chip
                            label="Uploaded"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              left: 4,
                              height: 20,
                              bgcolor: 'success.main',
                              color: 'white',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemove2DUrl(url)}
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
                </Box>
              )}

              {/* Pending files */}
              {images2DFiles.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'info.main' }}>
                    Pending Upload ({images2DFiles.length})
                  </Typography>
                  <Stack spacing={1}>
                    {images2DFiles.map((file, index) => (
                      <Card key={`file-${index}`} variant="outlined" sx={{ bgcolor: 'info.lighter' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <ImageIcon color="info" />
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {file.name}
                            </Typography>
                            <Chip
                              label={`${(file.size / 1024).toFixed(1)}KB`}
                              size="small"
                              color="info"
                              variant="filled"
                            />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemove2DFile(index)}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {images2DUrls.length === 0 && images2DFiles.length === 0 && (
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
                Total: {images2DUrls.length + images2DFiles.length} image(s) ({images2DUrls.length} uploaded, {images2DFiles.length} pending)
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
                fullWidth
              >
                Add 3D Models
                <input
                  type="file"
                  hidden
                  accept=".glb,.gltf,.obj,.usdz"
                  multiple
                  onChange={handleAdd3DModels}
                />
              </Button>

              {/* Existing URLs */}
              {images3DUrls.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'success.main' }}>
                    Uploaded Models ({images3DUrls.length})
                  </Typography>
                  <Stack spacing={1}>
                    {images3DUrls.map((url, index) => (
                      <Card key={`url-${index}`} variant="outlined" sx={{ bgcolor: 'success.lighter' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <ModelIcon color="success" />
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {url.split('/').pop()}
                            </Typography>
                            <Chip label="Uploaded" size="small" color="success" variant="filled" />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemove3DUrl(url)}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Pending files */}
              {images3DFiles.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'info.main' }}>
                    Pending Upload ({images3DFiles.length})
                  </Typography>
                  <Stack spacing={1}>
                    {images3DFiles.map((file, index) => (
                      <Card key={`file-${index}`} variant="outlined" sx={{ bgcolor: 'info.lighter' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <ModelIcon color="info" />
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {file.name}
                            </Typography>
                            <Chip
                              label={`${(file.size / 1024 / 1024).toFixed(1)}MB`}
                              size="small"
                              color="info"
                              variant="filled"
                            />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemove3DFile(index)}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {images3DUrls.length === 0 && images3DFiles.length === 0 && (
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
                Total: {images3DUrls.length + images3DFiles.length} model(s) ({images3DUrls.length} uploaded, {images3DFiles.length} pending)
              </Typography>
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Media
        </Button>
      </DialogActions>
    </Dialog>
  )
}
