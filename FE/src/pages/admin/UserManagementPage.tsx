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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            User Management
          </Typography>
          <Typography color="text.secondary">Manage all users in the system</Typography>
        </Box>
        {!isCreating && (
          <Button variant="contained" onClick={() => setIsCreating(true)}>
            Create New User
          </Button>
        )}
      </Box>

      {isCreating && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Create New User
            </Typography>
            <Box
              component="form"
              onSubmit={handleCreate}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label="Full Name"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setFieldErrors({ ...fieldErrors, name: null })
                }}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
                placeholder="John Doe"
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setFieldErrors({ ...fieldErrors, email: null })
                }}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                placeholder="john@example.com"
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
                  label="Role"
                >
                  {Object.entries(ROLES).map(([label, value]) => (
                    <MenuItem key={value} value={value}>
                      {roleLabels[value]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Password"
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
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained">
                  Create User
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{user.fullName}</Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={roleLabels[user.role] ?? 'Unknown'} color="primary" size="small" />
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No users found</Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  )
}
