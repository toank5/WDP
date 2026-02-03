import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button as MuiButton,
} from '@mui/material'
import { ShoppingCart, Visibility } from '@mui/icons-material'

const StaffOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    setOrders([
      {
        id: 'ORD-001',
        customer: 'Nguyen Van A',
        date: '2026-02-01',
        total: '$120.00',
        status: 'pending',
      },
      {
        id: 'ORD-002',
        customer: 'Tran Thi B',
        date: '2026-02-02',
        total: '$85.00',
        status: 'shipped',
      },
    ])
  }, [])

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCart sx={{ color: 'text.secondary' }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Order Management
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.total}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <MuiButton
                    component={Link}
                    to={`/dashboard/orders/${order.id}`}
                    size="small"
                    startIcon={<Visibility />}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Details
                  </MuiButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default StaffOrdersPage
