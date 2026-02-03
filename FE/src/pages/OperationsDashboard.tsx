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
  Button as MuiButton,
  Chip,
} from '@mui/material'
import { Assignment, Build, ChevronRight } from '@mui/icons-material'

const OperationsDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    setTasks([
      {
        id: 'TSK-001',
        type: 'PACKING',
        orderId: 'ORD-101',
        priority: 'high',
        operator: 'John Smith',
      },
      {
        id: 'TSK-002',
        type: 'QUALITY_CHECK',
        orderId: 'ORD-102',
        priority: 'medium',
        operator: 'Jane Doe',
      },
    ])
  }, [])

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assignment sx={{ color: 'text.secondary' }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Operations Workflow
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Task ID</TableCell>
              <TableCell>Process Type</TableCell>
              <TableCell>Related Order</TableCell>
              <TableCell>Operator</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{task.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build sx={{ fontSize: '0.875rem', color: 'slate.400' }} />
                    {task.type}
                  </Box>
                </TableCell>
                <TableCell>
                  <Link
                    to={`/dashboard/orders/${task.orderId}`}
                    style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}
                  >
                    {task.orderId}
                  </Link>
                </TableCell>
                <TableCell>{task.operator}</TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    size="small"
                    color={task.priority === 'high' ? 'error' : 'warning'}
                    sx={{ borderRadius: 1, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <MuiButton size="small" endIcon={<ChevronRight />} sx={{ fontSize: '0.75rem' }}>
                    Execute
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

export default OperationsDashboard
