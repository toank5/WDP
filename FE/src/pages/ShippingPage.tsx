import React, { useState } from 'react'
import { Box, Typography, Paper, TextField, Button as MuiButton, Grid } from '@mui/material'
import { LocalShipping, Send } from '@mui/icons-material'

const ShippingPage: React.FC = () => {
  const [tracking, setTracking] = useState('')

  const handleCreateLabel = () => {
    alert('Creating shipping label (placeholder)')
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShipping sx={{ color: 'text.secondary' }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Shipping & Logistics
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 4, maxWidth: 600 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}
              >
                Order Reference / Tracking Number
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g., ORD-7721-XP"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              sx={{ bgcolor: 'grey.50' }}
            />
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <MuiButton
              variant="contained"
              startIcon={<Send />}
              onClick={handleCreateLabel}
              sx={{ px: 4 }}
            >
              Generate Shipping Label
            </MuiButton>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default ShippingPage
