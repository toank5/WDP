import { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { VirtualTryOnSuspense } from '@/components/virtual-tryon/VirtualTryOnSuspense';

// Lazy load Virtual Try-On for better performance
const VirtualTryOnView = lazy(() =>
  import('@/components/virtual-tryon/VirtualTryOnView').then(m => ({
    default: m.VirtualTryOnView
  }))
);

const VirtualTryOnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const variantId = searchParams.get('variantId');

  // If no product/variant provided, show a placeholder
  if (!productId || !variantId) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            Virtual Try-On
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please select a product from the store to try on virtually.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Navigate to any eyewear product page and click &quot;Try On Virtually&quot;.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <VirtualTryOnSuspense>
      <VirtualTryOnView />
    </VirtualTryOnSuspense>
  );
};

export default VirtualTryOnPage;
