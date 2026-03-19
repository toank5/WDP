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
} from '@mui/material'
import { toast } from 'sonner'
import { LabJob, LabJobStatus, orderApi } from '@/lib/order-api'

export default function LabJobsPage() {
  const [jobs, setJobs] = useState<LabJob[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await orderApi.getLabJobs()
      setJobs(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load lab jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const updateStatus = async (id: string, status: LabJobStatus) => {
    try {
      await orderApi.updateLabJobStatus(id, { status })
      toast.success(`Updated to ${status}`)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Lab Jobs
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Frame</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">Loading...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography sx={{ py: 2, textAlign: 'center' }}>No active lab jobs.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job._id}>
                  <TableCell>{job.orderNumber || job.orderId}</TableCell>
                  <TableCell>{job.customerName || '-'}</TableCell>
                  <TableCell>{job.frameName || job.frameSku || '-'}</TableCell>
                  <TableCell>
                    <Chip label={job.status} size="small" color={job.status === LabJobStatus.COMPLETED ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {job.status === LabJobStatus.PENDING && (
                        <Button size="small" onClick={() => updateStatus(job._id, LabJobStatus.IN_PROGRESS)}>
                          Start
                        </Button>
                      )}
                      {job.status === LabJobStatus.IN_PROGRESS && (
                        <Button size="small" variant="contained" onClick={() => updateStatus(job._id, LabJobStatus.COMPLETED)}>
                          Complete
                        </Button>
                      )}
                      {(job.status === LabJobStatus.PENDING || job.status === LabJobStatus.IN_PROGRESS) && (
                        <Button size="small" color="error" onClick={() => updateStatus(job._id, LabJobStatus.ISSUE)}>
                          Issue
                        </Button>
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
