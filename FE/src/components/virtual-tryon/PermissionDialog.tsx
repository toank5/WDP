import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
} from '@mui/material';
import {
  CameraAlt,
  Block,
  Info as InfoIcon,
} from '@mui/icons-material';

interface PermissionDialogProps {
  open: boolean;
  error: string | null;
  isUnsupported: boolean;
  onRequestPermission: () => void;
  onDemoMode: () => void;
  onClose: () => void;
}

export function PermissionDialog({
  open,
  error,
  isUnsupported,
  onRequestPermission,
  onDemoMode,
  onClose,
}: PermissionDialogProps) {
  const showPermissionGuide = !isUnsupported && (!error || error.includes('denied'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        }
      }}
    >
      <DialogTitle textAlign="center" sx={{ pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {isUnsupported ? (
            <Block
              sx={{
                fontSize: 64,
                color: 'error.main',
              }}
            />
          ) : (
            <CameraAlt
              sx={{
                fontSize: 64,
                color: error ? 'error.main' : 'primary.main',
              }}
            />
          )}
          <Typography variant="h5" component="div">
            {isUnsupported
              ? 'Camera Not Available'
              : error
              ? 'Camera Access Required'
              : 'Enable Camera Access'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isUnsupported ? (
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
            Your device doesn't support camera access or the camera is not available.
          </Typography>
        ) : error ? (
          <>
            <Typography color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              {error}
            </Typography>

            {showPermissionGuide && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" component="div">
                  <strong>How to Enable:</strong>
                  <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li>Click the lock/info icon in your address bar</li>
                    <li>Find &quot;Camera&quot; permission</li>
                    <li>Change to &quot;Allow&quot;</li>
                    <li>Refresh the page</li>
                  </ol>
                </Typography>
              </Alert>
            )}
          </>
        ) : (
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
            To use the Virtual Try-On feature, we need access to your camera.
            Your camera is only used locally to overlay glasses on your face.
            No photos are stored or shared without your permission.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2, pt: 0 }}>
        <Stack spacing={1} sx={{ width: '100%' }}>
          {!isUnsupported && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={onRequestPermission}
              sx={{ py: 1.5 }}
            >
              {error ? 'I&apos;ve Enabled Camera - Retry' : 'Allow Camera Access'}
            </Button>
          )}

          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={onDemoMode}
            sx={{ py: 1.5 }}
          >
            Try Demo Mode (No Camera)
          </Button>

          <Button
            variant="text"
            size="large"
            fullWidth
            onClick={onClose}
            sx={{ py: 1.5 }}
          >
            Return to Store
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
