import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  snapshotUrl: string;
  productName?: string;
  productUrl?: string;
}

export function ShareDialog({
  open,
  onClose,
  snapshotUrl,
  productName = 'Check out these glasses!',
  productUrl,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleNativeShare = async () => {
    if (navigator.share && productUrl) {
      try {
        await navigator.share({
          title: 'EyeWear Virtual Try-On',
          text: `I tried on ${productName} virtually and love it!`,
          url: productUrl,
        });
        onClose();
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    }
  };

  const handleCopyLink = async () => {
    if (productUrl) {
      try {
        await navigator.clipboard.writeText(productUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const handleSaveToDevice = () => {
    const link = document.createElement('a');
    link.href = snapshotUrl;
    link.download = `eyewear-tryon-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    if (!productUrl) return;

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(`I tried on ${productName} virtually!`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${productName} - ${productUrl}`)}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Share Your Look</Typography>
          <Box
            sx={{ cursor: 'pointer', p: 0.5 }}
            onClick={onClose}
          >
            <CloseIcon />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Share your virtual try-on look with friends or save it to your device.
          </Typography>
        </Alert>

        <Stack spacing={2}>
          {/* Native Share */}
          {navigator.share && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<ShareIcon />}
              onClick={handleNativeShare}
              sx={{ py: 1.5 }}
            >
              Share via...
            </Button>
          )}

          {/* Save to Device */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={handleSaveToDevice}
            sx={{ py: 1.5 }}
          >
            Save to Device
          </Button>

          {/* Social Share */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            Share on social media
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              sx={{ flex: 1, py: 1.5 }}
              onClick={() => handleSocialShare('facebook')}
              startIcon={<FacebookIcon />}
            >
              Facebook
            </Button>
            <Button
              variant="outlined"
              sx={{ flex: 1, py: 1.5 }}
              onClick={() => handleSocialShare('twitter')}
              startIcon={<TwitterIcon />}
            >
              Twitter
            </Button>
            <Button
              variant="outlined"
              sx={{ flex: 1, py: 1.5 }}
              onClick={() => handleSocialShare('whatsapp')}
              startIcon={<WhatsAppIcon />}
            >
              WhatsApp
            </Button>
          </Stack>

          {/* Copy Link */}
          {productUrl && (
            <Button
              variant="text"
              fullWidth
              startIcon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopyLink}
              sx={{ mt: 1 }}
            >
              {copied ? 'Link Copied!' : 'Copy Product Link'}
            </Button>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
