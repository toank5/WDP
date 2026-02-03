import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { Campaign, CardGiftcard } from '@mui/icons-material'

const PromotionsPage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Campaign sx={{ color: 'text.secondary' }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Promotion Management
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
        <CardGiftcard sx={{ fontSize: 48, color: 'divider', mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          No Active Campaigns
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure discount rules, product bundles, and special offers here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default PromotionsPage
