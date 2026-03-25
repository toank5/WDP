import React, { useEffect, useState } from 'react'
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
  IconButton,
  Collapse,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { ExpandMore, ExpandLess, Visibility } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LabJob, LabJobStatus, orderApi } from '@/lib/order-api'

interface LabJobWithExpanded extends LabJob {
  expanded?: boolean
}

export default function LabJobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<LabJobWithExpanded[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<LabJobStatus | ''>('')

  const load = async () => {
    try {
      setLoading(true)
      const data = await orderApi.getLabJobs(statusFilter || undefined)
      setJobs(data.map((job) => ({ ...job, expanded: false })))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load lab jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [statusFilter])

  const toggleExpanded = (id: string) => {
    setJobs((prev) =>
      prev.map((job) => (job._id === id ? { ...job, expanded: !job.expanded } : job))
    )
  }

  const updateStatus = async (id: string, status: LabJobStatus) => {
    try {
      await orderApi.updateLabJobStatus(id, { status })
      toast.success(`Updated to ${status}`)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  const viewOrder = (orderId: string) => {
    navigate(`/dashboard/orders?orderId=${orderId}`)
  }

  const getStatusColor = (status: LabJobStatus) => {
    switch (status) {
      case 'PENDING':
        return 'warning'
      case 'IN_PROGRESS':
        return 'info'
      case 'COMPLETED':
        return 'success'
      case 'ISSUE':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatPrescription = (job: LabJob) => {
    return {
      pd: job.pd ? `${job.pd}mm` : job.pdRight && job.pdLeft ? `R:${job.pdRight}mm L:${job.pdLeft}mm` : 'N/A',
      right: `SPH:${job.rightEye.sph} CYL:${job.rightEye.cyl} AXIS:${job.rightEye.axis} ADD:${job.rightEye.add}`,
      left: `SPH:${job.leftEye.sph} CYL:${job.leftEye.cyl} AXIS:${job.leftEye.axis} ADD:${job.leftEye.add}`,
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Lab Jobs
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LabJobStatus | '')}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={LabJobStatus.PENDING}>Pending</MenuItem>
              <MenuItem value={LabJobStatus.IN_PROGRESS}>In Progress</MenuItem>
              <MenuItem value={LabJobStatus.COMPLETED}>Completed</MenuItem>
              <MenuItem value={LabJobStatus.ISSUE}>Issue</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => void load()}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {jobs.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            No lab jobs found. Lab jobs are created when sales staff approve prescription items.
          </Typography>
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Frame</TableCell>
              <TableCell>Prescription</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ py: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">Loading...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Stack sx={{ py: 4 }} spacing={1} alignItems="center">
                    <Typography variant="body1" color="text.secondary">
                      No active lab jobs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lab jobs are created when sales approves prescription items
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const rx = formatPrescription(job)
                return (
                  <React.Fragment key={job._id}>
                    <TableRow hover>
                      <TableCell sx={{ width: 40 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpanded(job._id)}
                        >
                          {job.expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {job.orderNumber || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {job.orderId.slice(-8)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{job.customerName || '-'}</TableCell>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2">{job.frameName || '-'}</Typography>
                          {job.frameSku && (
                            <Typography variant="caption" color="text.secondary">
                              {job.frameSku}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          PD: {rx.pd}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(job.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="text"
                            color="info"
                            onClick={() => viewOrder(job.orderId)}
                            startIcon={<Visibility fontSize="small" />}
                          >
                            View Order
                          </Button>
                          {job.status === LabJobStatus.PENDING && (
                            <Button
                              size="small"
                              onClick={() => updateStatus(job._id, LabJobStatus.IN_PROGRESS)}
                            >
                              Start
                            </Button>
                          )}
                          {job.status === LabJobStatus.IN_PROGRESS && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => updateStatus(job._id, LabJobStatus.COMPLETED)}
                            >
                              Complete
                            </Button>
                          )}
                          {(job.status === LabJobStatus.PENDING ||
                            job.status === LabJobStatus.IN_PROGRESS) && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => updateStatus(job._id, LabJobStatus.ISSUE)}
                            >
                              Issue
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, border: 'none' }}>
                        <Collapse in={job.expanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                  Full Prescription Details
                                </Typography>
                                <Stack spacing={1}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      Right Eye (OD)
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {rx.right}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      Left Eye (OS)
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {rx.left}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                              {job.notes && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Notes
                                  </Typography>
                                  <Typography variant="body2">{job.notes}</Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
