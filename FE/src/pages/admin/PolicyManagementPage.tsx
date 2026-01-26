import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  createPolicy,
  deletePolicy,
  getAllPolicies,
  updatePolicy,
  type CreatePolicyPayload,
  type UpdatePolicyPayload,
  type Policy,
} from '@/lib/policy-api'

type PolicyFormData = {
  type: 'RETURN' | 'WARRANTY' | 'PROMOTION'
  config: string // JSON string
}

const POLICY_TYPES = ['RETURN', 'WARRANTY', 'PROMOTION'] as const

export function PolicyManagementPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PolicyFormData>({
    type: 'RETURN',
    config: '{}',
  })
  const [configError, setConfigError] = useState<string | null>(null)

  const loadPolicies = async () => {
    try {
      setLoading(true)
      const data = await getAllPolicies()
      setPolicies(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load policies'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPolicies()
  }, [])

  const validateConfig = (configStr: string): boolean => {
    try {
      JSON.parse(configStr)
      setConfigError(null)
      return true
    } catch (err) {
      setConfigError('Invalid JSON format')
      return false
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateConfig(formData.config)) {
      return
    }

    try {
      const payload: CreatePolicyPayload = {
        type: formData.type,
        config: JSON.parse(formData.config),
      }
      await createPolicy(payload)
      toast.success('Policy created successfully')
      setIsCreating(false)
      setFormData({ type: 'RETURN', config: '{}' })
      loadPolicies()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create policy'
      toast.error(message)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPolicy) return

    if (!validateConfig(formData.config)) {
      return
    }

    try {
      const payload: UpdatePolicyPayload = {
        type: formData.type,
        config: JSON.parse(formData.config),
      }
      await updatePolicy(editingPolicy._id, payload)
      toast.success('Policy updated successfully')
      setEditingPolicy(null)
      setFormData({ type: 'RETURN', config: '{}' })
      loadPolicies()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update policy'
      toast.error(message)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return

    try {
      await deletePolicy(deleteConfirmId)
      toast.success('Policy deleted successfully')
      setDeleteConfirmOpen(false)
      setDeleteConfirmId(null)
      loadPolicies()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete policy'
      toast.error(message)
    }
  }

  const startEdit = (policy: Policy) => {
    setEditingPolicy(policy)
    setFormData({
      type: policy.type,
      config: JSON.stringify(policy.config, null, 2),
    })
    setIsCreating(false)
  }

  const cancelForm = () => {
    setIsCreating(false)
    setEditingPolicy(null)
    setFormData({ type: 'RETURN', config: '{}' })
    setConfigError(null)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Policy Management
          </Typography>
          <Typography color="text.secondary">
            Manage system policies (Return, Warranty, Promotion)
          </Typography>
        </Box>
        {!isCreating && !editingPolicy && (
          <Button variant="contained" onClick={() => setIsCreating(true)}>
            Create New Policy
          </Button>
        )}
      </Box>

      {(isCreating || editingPolicy) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
            </Typography>
            <Box component="form" onSubmit={editingPolicy ? handleUpdate : handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Policy Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  label="Policy Type"
                >
                  {POLICY_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Configuration (JSON)"
                required
                multiline
                rows={8}
                value={formData.config}
                onChange={(e) => {
                  setFormData({ ...formData, config: e.target.value })
                  setConfigError(null)
                }}
                error={!!configError}
                helperText={configError || 'Enter valid JSON configuration'}
                placeholder='{"key": "value"}'
                fullWidth
                sx={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained">
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </Button>
                <Button variant="outlined" onClick={cancelForm}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Configuration</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{policy.type}</Typography>
                </TableCell>
                <TableCell>
                  <Typography component="pre" sx={{ fontSize: '12px', overflow: 'auto', maxWidth: 300 }}>
                    {JSON.stringify(policy.config, null, 2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(policy.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" size="small" onClick={() => startEdit(policy)}>
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(policy._id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {policies.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No policies found</Typography>
          </Box>
        )}
      </TableContainer>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this policy? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
