import { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
} from '@mui/material'
import { toast } from 'sonner'
import {
  orderApi,
  Order,
  PrescriptionReviewStatus,
} from '@/lib/order-api'

export default function StaffPrescriptionsPage() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = async () => {
    try {
      setLoading(true)
      const data = await orderApi.getPrescriptionQueue(PrescriptionReviewStatus.PENDING_REVIEW)
      setOrders(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleReview = async (orderItemId: string, status: PrescriptionReviewStatus.APPROVED | PrescriptionReviewStatus.REJECTED) => {
    try {
      const note = notes[orderItemId]
      await orderApi.reviewPrescription(orderItemId, { status, note })
      toast.success(`Prescription ${status.toLowerCase()}`)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    }
  }

  const rows = orders.flatMap((order) =>
    order.items
      .filter((item) => item.requiresPrescription)
      .map((item) => ({ order, item })),
  )

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Prescription Review Queue
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Frame</TableCell>
              <TableCell>Rx</TableCell>
              <TableCell>Staff note</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">Loading...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography sx={{ py: 2, textAlign: 'center' }}>
                    No pending prescriptions.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ order, item }) => (
                <TableRow key={item.itemId || item._id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.shippingAddress.fullName}</TableCell>
                  <TableCell>{item.productName || item.variantSku || 'Item'}</TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Chip size="small" label={item.prescriptionReviewStatus || 'PENDING_REVIEW'} color="warning" />
                      {item.typedPrescription && (
                        <Typography variant="caption" color="text.secondary">
                          OD SPH {item.typedPrescription.rightEye.sph} / OS SPH {item.typedPrescription.leftEye.sph}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Optional note"
                      value={notes[item.itemId || item._id] || ''}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [item.itemId || item._id]: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleReview(item.itemId || item._id, PrescriptionReviewStatus.REJECTED)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleReview(item.itemId || item._id, PrescriptionReviewStatus.APPROVED)}
                      >
                        Approve
                      </Button>
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
