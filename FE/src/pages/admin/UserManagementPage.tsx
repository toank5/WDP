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
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
} from '@mui/material'
import { createUser, getAllUsers, type CreateUserPayload, type User } from '@/lib/user-api'
import { roleLabels, ADMIN_ROLE } from '@/lib/constants'
import { validateField, ROLES } from '@/lib/validations'

type UserFormData = {
  name: string
  email: string
  role: number
  password: string
}

import { People, Add, PersonAdd, Mail, Lock, Shield } from '@mui/icons-material'

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 4,
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const errors: Record<string, string | null> = {}
    let hasErrors = false

    const nameError = validateField('fullName', formData.name)
    const emailError = validateField('email', formData.email)
    const passwordError = validateField('password', formData.password)

    if (nameError) {
      errors.name = nameError
      hasErrors = true
    }
    if (emailError) {
      errors.email = emailError
      hasErrors = true
    }
    if (passwordError) {
      errors.password = passwordError
      hasErrors = true
    }

    if (hasErrors) {
      setFieldErrors(errors)
      toast.error('Please fix validation errors')
      return
    }

    try {
      const payload: CreateUserPayload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      }
      await createUser(payload)
      toast.success('User created successfully')
      setIsCreating(false)
      setFormData({ name: '', email: '', role: 4, password: '' })
      setFieldErrors({})
      loadUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user'
      toast.error(message)
    }
  }

  const cancelForm = () => {
    setIsCreating(false)
    setFormData({ name: '', email: '', role: 4, password: '' })
    setFieldErrors({})
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <People color="secondary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h1">User Directory</Typography>
            <Typography variant="body2" color="text.secondary">
              Managing secure access for {users.length} active members
            </Typography>
          </Box>
        </Box>
        {!isCreating && (
          <Button variant="contained" onClick={() => setIsCreating(true)} startIcon={<Add />}>
            Provision User
          </Button>
        )}
      </Box>

      {isCreating && (
        <Paper
          variant="outlined"
          sx={{
            mb: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'grey.100',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <PersonAdd sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle2">USER PROVISIONING FORM</Typography>
          </Box>
          <Box sx={{ p: 4 }}>
            <Box
              component="form"
              onSubmit={handleCreate}
              sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    Official Full Name
                  </Typography>
                  <TextField
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      setFieldErrors({ ...fieldErrors, name: null })
                    }}
                    error={!!fieldErrors.name}
                    helperText={fieldErrors.name}
                    placeholder="e.g. John Fitzgerald Kennedy"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    System Access Email
                  </Typography>
                  <TextField
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      setFieldErrors({ ...fieldErrors, email: null })
                    }}
                    error={!!fieldErrors.email}
                    helperText={fieldErrors.email}
                    placeholder="name@company.com"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    Assigned Authorization Level
                  </Typography>
                  <FormControl fullWidth required size="small">
                    <Select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
                    >
                      {Object.entries(ROLES).map(([label, value]) => (
                        <MenuItem key={value} value={value}>
                          {roleLabels[value]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    Initial Security Password
                  </Typography>
                  <TextField
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      setFieldErrors({ ...fieldErrors, password: null })
                    }}
                    error={!!fieldErrors.password}
                    helperText={fieldErrors.password}
                    placeholder="••••••••"
                    inputProps={{ minLength: 6 }}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={cancelForm} color="secondary">
                  Dismiss
                </Button>
                <Button type="submit" variant="contained">
                  Provision Account
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Personnel Name</TableCell>
              <TableCell>System Identifier (Email)</TableCell>
              <TableCell>Access Level</TableCell>
              <TableCell>Registration Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'text.secondary',
                      }}
                    >
                      {user.fullName.charAt(0)}
                    </Box>
                    <Typography fontWeight={600} fontSize="0.875rem">
                      {user.fullName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={roleLabels[user.role] ?? 'Unknown'}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      bgcolor: 'grey.50',
                    }}
                  />
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" variant="body2">
              No registered personnel found in system
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  )
}
