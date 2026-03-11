import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { Search, Eye, RefreshCw, XCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { prescriptionApi, type Prescription } from '@/lib/prescription-api'
import { PrescriptionViewModal } from '@/components/staff/PrescriptionViewModal'
import { formatDateTime } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function PrescriptionManagementPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterVerified, setFilterVerified] = useState<string>('all')

  const fetchPrescriptions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await prescriptionApi.getMyPrescriptions({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        isVerified: filterVerified === 'all' ? undefined : filterVerified,
      })
      setPrescriptions(response.prescriptions || [])
      setTotal(response.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prescriptions')
      setPrescriptions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [page, rowsPerPage, search, filterVerified])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(0)
  }

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setModalOpen(true)
  }

  const handleVerified = async (id: string) => {
    try {
      await prescriptionApi.verifyPrescription(id, true, 'Verified by staff')
      toast.success('Prescription verified successfully')
      setModalOpen(false)
      fetchPrescriptions()
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify prescription')
    }
  }

  const handleRejected = async (id: string) => {
    try {
      await prescriptionApi.verifyPrescription(id, false, 'Rejected by staff - needs update')
      toast.success('Prescription marked as pending')
      setModalOpen(false)
      fetchPrescriptions()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject prescription')
    }
  }

  const handleManufacturingCompleted = async () => {
    // Refresh the selected prescription and list
    if (selectedPrescription) {
      try {
        const updated = await prescriptionApi.getPrescriptionById(selectedPrescription._id)
        setSelectedPrescription(updated)
        fetchPrescriptions()
      } catch (err) {
        console.error('Failed to refresh prescription:', err)
      }
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Prescription Management</Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage customer prescription profiles
          </Typography>
        </Box>
        <Stack direction="row" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={filterVerified}
            exclusive
            onChange={(_, newValue) => { if (newValue) { setFilterVerified(newValue); setPage(0) } }}
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="false">Pending</ToggleButton>
            <ToggleButton value="true">Verified</ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={fetchPrescriptions} disabled={loading}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </IconButton>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper>
        {/* Search */}
        <Box p={2} borderBottom={1} borderColor="divider">
          <TextField
            fullWidth
            placeholder="Search by prescription name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handleSearch} variant="contained" size="small">Search</Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Prescription Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Eye Data</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
              ) : prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" gap={1}>
                      <XCircle size={40} sx={{ color: 'text.secondary' }} />
                      <Typography color="text.secondary">{search ? 'No prescriptions found' : 'No prescriptions found'}</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((prescription) => (
                  <TableRow key={prescription._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{prescription.name}</Typography>
                      {prescription.imageUrl && (
                        <Typography variant="caption" color="primary.main">Has Image</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prescription.prescriptionDate
                          ? new Date(prescription.prescriptionDate).toLocaleDateString()
                          : '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prescription.isVerified ? 'Verified' : 'Pending'}
                        color={prescription.isVerified ? 'success' : 'warning'}
                        size="small"
                        icon={prescription.isVerified ? <CheckCircle size={14} /> : <Clock size={14} />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        R: {prescription.rightEye?.sph ?? '--'} | L: {prescription.leftEye?.sph ?? '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(prescription.createdAt), { addSuffix: true })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Eye size={14} />}
                        onClick={() => handleView(prescription)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* Modal */}
      <PrescriptionViewModal
        open={modalOpen}
        prescription={selectedPrescription}
        onClose={() => { setModalOpen(false); setSelectedPrescription(null) }}
        onVerified={handleVerified}
        onRejected={handleRejected}
        onManufacturingCompleted={handleManufacturingCompleted}
      />
    </Container>
  )
}
