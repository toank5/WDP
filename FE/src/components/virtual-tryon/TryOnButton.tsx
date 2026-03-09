import { Button } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface TryOnButtonProps {
  productId: string;
  variantId: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function TryOnButton({
  productId,
  variantId,
  disabled = false,
  fullWidth = true,
  className,
}: TryOnButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to try-on page with product context
    navigate(`/virtual-tryon?productId=${encodeURIComponent(productId)}&variantId=${encodeURIComponent(variantId)}`);
  };

  return (
    <Button
      variant="contained"
      size="large"
      fullWidth={fullWidth}
      startIcon={<CameraAlt />}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      sx={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        py: 1.5,
        mb: 1.5,
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'none',
        '&:hover': {
          background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
          transform: 'scale(1.02)',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
        transition: 'transform 0.2s ease, background 0.2s ease',
      }}
    >
      Try On Virtually
    </Button>
  );
}
