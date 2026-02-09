import React from 'react'
import { Box, Typography, Paper, Grid } from '@mui/material'
import { Assessment, TrendingUp, ShowChart, Leaderboard } from '@mui/icons-material'

const AnalyticsPage: React.FC = () => {
  const stats = [
    {
      label: 'Monthly Revenue',
      value: '$45,200',
      icon: <TrendingUp color="primary" />,
      change: '+12.5%',
    },
    {
      label: 'New Customers',
      value: '128',
      icon: <Leaderboard color="secondary" />,
      change: '+5.2%',
    },
    {
      label: 'Completion Rate',
      value: '94.2%',
      icon: <ShowChart sx={{ color: '#10b981' }} />,
      change: '+2.1%',
    },
  ]

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assessment sx={{ color: 'text.secondary' }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Business Intelligence
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
                >
                  {stat.label}
                </Typography>
                {stat.icon}
              </Box>
              <Typography variant="h2">{stat.value}</Typography>
              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600, mt: 1 }}>
                {stat.change}{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  vs last month
                </Typography>
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ mt: 3, p: 4, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" gutterBottom>
          Detailed Performance Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualization charts and granular data export functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default AnalyticsPage
