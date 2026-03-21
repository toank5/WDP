import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button as MuiButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { LocalShipping, Send } from '@mui/icons-material'
import { orderApi, Order, OrderStatus } from '@/lib/order-api'
import { toast } from 'sonner'

const ShippingPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [trackingByOrder, setTrackingByOrder] = useState<Record<string, string>>({})
  const [carrierByOrder, setCarrierByOrder] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const loadOrders = async () => {
    try {
      setLoading(true)
      const result = await orderApi.getOpsOrders({
        status: OrderStatus.PROCESSING,
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setOrders(result.orders)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load shipping queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const handleMarkShipped = async (order: Order) => {
    const trackingNumber = trackingByOrder[order._id]?.trim()
    const carrier = carrierByOrder[order._id]?.trim() || 'VNPost'

    if (!trackingNumber) {
      toast.error('Tracking number is required')
      return
    }

    try {
      await orderApi.markAsShipped(order._id, { trackingNumber, carrier })
      toast.success(`Order ${order.orderNumber} marked as shipped`)
      await loadOrders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark as shipped')
    }
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

      <Alert severity="info" sx={{ mb: 2 }}>
        Orders appear here when they are in PROCESSING and ready for packing/shipping.
      </Alert>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Tracking Number</TableCell>
              <TableCell>Carrier</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography sx={{ py: 2, textAlign: 'center' }}>
                    {loading ? 'Loading...' : 'No orders ready to ship.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.shippingAddress.fullName}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Enter tracking"
                      value={trackingByOrder[order._id] || ''}
                      onChange={(e) =>
                        setTrackingByOrder((prev) => ({ ...prev, [order._id]: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Carrier"
                      value={carrierByOrder[order._id] || 'VNPost'}
                      onChange={(e) =>
                        setCarrierByOrder((prev) => ({ ...prev, [order._id]: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end">
                      <MuiButton
                        variant="contained"
                        startIcon={<Send />}
                        onClick={() => handleMarkShipped(order)}
                      >
                        Mark as shipped
                      </MuiButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ShippingPage
