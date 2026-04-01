import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button as MuiButton,
  Chip,
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
        showAll: true,
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setOrders(
        result.orders.filter((order) =>
          [OrderStatus.READY_TO_SHIP, OrderStatus.SHIPPED].includes(order.orderStatus)
        )
      )
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

  const handleMarkDelivered = async (order: Order) => {
    try {
      await orderApi.confirmReceipt(order._id)
      toast.success(`Order ${order.orderNumber} marked as delivered`)
      await loadOrders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark as delivered')
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
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tracking Number</TableCell>
              <TableCell>Carrier</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography sx={{ py: 2, textAlign: 'center' }}>
                    {loading ? 'Loading...' : 'No orders in shipping queue.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.shippingAddress.fullName}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={order.orderStatus === OrderStatus.SHIPPED ? 'info' : 'warning'}
                      label={order.orderStatus}
                    />
                  </TableCell>
                  <TableCell>
                    {order.orderStatus === OrderStatus.READY_TO_SHIP ? (
                      <TextField
                        size="small"
                        placeholder="Enter tracking"
                        value={trackingByOrder[order._id] || ''}
                        onChange={(e) =>
                          setTrackingByOrder((prev) => ({ ...prev, [order._id]: e.target.value }))
                        }
                      />
                    ) : (
                      <Typography variant="body2">
                        {order.tracking?.trackingNumber || '--'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.orderStatus === OrderStatus.READY_TO_SHIP ? (
                      <TextField
                        size="small"
                        placeholder="Carrier"
                        value={carrierByOrder[order._id] || 'VNPost'}
                        onChange={(e) =>
                          setCarrierByOrder((prev) => ({ ...prev, [order._id]: e.target.value }))
                        }
                      />
                    ) : (
                      <Typography variant="body2">{order.tracking?.carrier || '--'}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end">
                      {order.orderStatus === OrderStatus.READY_TO_SHIP ? (
                        <MuiButton
                          variant="contained"
                          startIcon={<Send />}
                          onClick={() => handleMarkShipped(order)}
                        >
                          Mark as shipped
                        </MuiButton>
                      ) : (
                        <MuiButton
                          variant="contained"
                          color="success"
                          onClick={() => handleMarkDelivered(order)}
                        >
                          Mark as delivered
                        </MuiButton>
                      )}
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
