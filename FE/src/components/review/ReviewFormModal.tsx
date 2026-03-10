import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Rating,
  TextField,
  IconButton,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material'
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material'
import { reviewApi, type CreateReviewRequest } from '@/lib/review-api'
import { toast } from 'sonner'

interface ReviewFormModalProps {
  open: boolean
  onClose: () => void
  productId: string
  productName: string
  productImage?: string
  orderId: string
  variantSku?: string
  orderNumber: string
  onReviewSubmitted?: () => void
}

export function ReviewFormModal({
  open,
  onClose,
  productId,
  productName,
  productImage,
  orderId,
  variantSku,
  orderNumber,
  onReviewSubmitted,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    rating?: string
    comment?: string
  }>({})

  const resetForm = () => {
    setRating(0)
    setHoverRating(0)
    setTitle('')
    setComment('')
    setImages([])
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (rating === 0) {
      newErrors.rating = 'Please select a rating'
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const reviewData: CreateReviewRequest = {
        productId,
        orderId,
        variantSku,
        rating,
        comment: comment.trim(),
        title: title.trim() || undefined,
        images,
      }

      await reviewApi.createReview(reviewData)

      toast.success('Review submitted successfully! Thank you for your feedback.')
      resetForm()
      onReviewSubmitted?.()
      handleClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit review'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check max 3 images
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed')
      return
    }

    setUploading(true)

    try {
      const filesArray = Array.from(files)

      // Validate file types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      const validFiles = filesArray.filter((file) => allowedTypes.includes(file.type))

      if (validFiles.length !== filesArray.length) {
        toast.error('Only JPG, PNG, and WEBP images are allowed')
      }

      if (validFiles.length === 0) {
        return
      }

      // Validate file sizes (max 5MB each)
      const maxSize = 5 * 1024 * 1024
      const sizeValidFiles = validFiles.filter((file) => file.size <= maxSize)

      if (sizeValidFiles.length !== validFiles.length) {
        toast.error('Each image must be less than 5MB')
      }

      if (sizeValidFiles.length === 0) {
        return
      }

      // Upload images
      const uploadedUrls = await reviewApi.uploadReviewImages(sizeValidFiles)
      setImages((prev) => [...prev, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload images'
      toast.error(message)
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ px: 4, pt: 4, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Write a Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order #{orderNumber}
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} sx={{ alignSelf: 'flex-start' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={3}>
          {/* Product Info */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              borderRadius: 3,
            }}
          >
            {productImage ? (
              <Avatar
                src={productImage}
                alt={productName}
                sx={{ width: 64, height: 64, bgcolor: 'grey.100' }}
                variant="rounded"
              />
            ) : (
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                👓
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {productName}
              </Typography>
              {variantSku && (
                <Typography variant="caption" color="text.secondary">
                  Variant: {variantSku}
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Rating */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Overall Rating *
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating
                value={rating}
                precision={1}
                onChange={(_, newValue) => {
                  setRating(newValue || 0)
                  if (errors.rating) {
                    setErrors((prev) => ({ ...prev, rating: undefined }))
                  }
                }}
                onChangeActive={(_, newHoverValue) => {
                  setHoverRating(newHoverValue || 0)
                }}
                icon={<StarIcon fontSize="inherit" sx={{ color: 'warning.main' }} />}
                emptyIcon={<StarBorderIcon fontSize="inherit" sx={{ color: 'warning.main' }} />}
                sx={{
                  fontSize: '2.5rem',
                  '& .MuiRating-icon': {
                    mr: 0.5,
                  },
                }}
              />
              <Typography variant="body1" color="text.secondary">
                {hoverRating > 0 ? hoverRating : rating} / 5
              </Typography>
            </Box>
            {errors.rating && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.rating}
              </Typography>
            )}
          </Box>

          {/* Title (Optional) */}
          <Box>
            <TextField
              fullWidth
              label="Review Title (Optional)"
              placeholder="Summarize your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              inputProps={{ maxLength: 200 }}
              helperText={`${title.length}/200`}
            />
          </Box>

          {/* Comment */}
          <Box>
            <TextField
              fullWidth
              label="Your Review *"
              placeholder="Tell us about your experience with this product. What did you like or dislike? (minimum 10 characters)"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                if (errors.comment) {
                  setErrors((prev) => ({ ...prev, comment: undefined }))
                }
              }}
              error={!!errors.comment}
              helperText={errors.comment || `${comment.length}/1000`}
              inputProps={{ maxLength: 1000 }}
            />
          </Box>

          {/* Image Upload */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Photos (Optional)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Share up to 3 photos of you wearing the glasses (JPG, PNG, WEBP, max 5MB each)
            </Typography>

            {/* Uploaded Images */}
            {images.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {images.map((url, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <Avatar
                      src={url}
                      alt={`Review image ${index + 1}`}
                      variant="rounded"
                      sx={{ width: '100%', height: '100%' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      disabled={uploading || submitting}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                        width: 28,
                        height: 28,
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {/* Upload Button */}
            {images.length < 3 && (
              <Button
                component="label"
                variant="outlined"
                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                disabled={uploading || submitting}
                sx={{ borderRadius: 2 }}
              >
                {images.length === 0 ? 'Upload Photos' : 'Add More Photos'}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading || submitting}
                />
              </Button>
            )}
          </Box>

          {/* Info Alert */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="caption">
              Your review will be published immediately and marked as a verified purchase since
              you ordered this product.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
        <Button onClick={handleClose} disabled={submitting} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || uploading}
          startIcon={submitting ? <CircularProgress size={16} /> : <StarIcon />}
          sx={{ borderRadius: 2 }}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
