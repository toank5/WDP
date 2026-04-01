import { useEffect, useState } from 'react'
import {
  getRevenueOverview,
  getRevenueTimeSeries,
  type RevenueOverview,
  type RevenueTimeSeries,
  formatCurrency,
} from '@/lib/revenue-api'
import { orderApi, type Order } from '@/lib/order-api'
import { staffReturnApi, type ReturnStats } from '@/lib/return-api'
import { preorderApi, type PreorderOverview } from '@/lib/preorder-api'
import {
  getInventoryList,
  type InventoryItemEnriched,
} from '@/lib/inventory-api'
import {
  ORDER_STATUS,
  PRESCRIPTION_REVIEW_STATUS,
  LAB_JOB_STATUS,
} from '@eyewear/shared'
import axios from 'axios'

// Types for dashboard data

export interface ManagerKPIs {
  revenueOverview: RevenueOverview | null
  todayRevenue: number
  monthRevenue: number
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  delayedOrders: number
  returnsRate: number
  preordersOverview: PreorderOverview | null
  lowStockCount: number
  isLoading: boolean
  error: string | null
}

export interface SaleStaffKPIs {
  pendingPrescriptions: number
  pendingReturns: number
  ordersWithIssues: number
  todayPrescriptionsReviewed: number
  recentPrescriptions: Order[]
  recentReturns: any[]
  isLoading: boolean
  error: string | null
}

export interface OperationStaffKPIs {
  pendingLabJobs: number
  inProgressLabJobs: number
  ordersReadyToShip: number
  returnsReceivedNotProcessed: number
  lowStockItems: InventoryItemEnriched[]
  todayLabJobsCompleted: number
  isLoading: boolean
  error: string | null
}

// Helper function to get today's date range
function getTodayRange() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  return {
    from: startOfDay.toISOString(),
    to: endOfDay.toISOString(),
  }
}

// Helper function to get this month's date range
function getMonthRange() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
  return {
    from: startOfMonth.toISOString(),
    to: endOfMonth.toISOString(),
  }
}

// Manager Dashboard Hook
export function useManagerDashboard() {
  const [data, setData] = useState<ManagerKPIs>({
    revenueOverview: null,
    todayRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    delayedOrders: 0,
    returnsRate: 0,
    preordersOverview: null,
    lowStockCount: 0,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }))

        // Fetch revenue data - API client handles auth headers automatically
        // Promise.allSettled ensures all requests complete even if some fail
        const [todayRevenue, monthRevenue, overview, preorderData, lowStock] = await Promise.allSettled([
          getRevenueOverview(getTodayRange()),
          getRevenueOverview(getMonthRange()),
          orderApi.getOrderStats(),
          preorderApi.getOverview(),
          getInventoryList({ lowStock: true, limit: 10 }),
        ])

        const todayRev = todayRevenue.status === 'fulfilled' ? todayRevenue.value.totalRevenue : 0
        const monthRev = monthRevenue.status === 'fulfilled' ? monthRevenue.value.totalRevenue : 0
        const stats = overview.status === 'fulfilled' ? overview.value : { total: 0, byStatus: {} }
        const preorders = preorderData.status === 'fulfilled' ? preorderData.value : null
        const lowStockItems = lowStock.status === 'fulfilled' ? lowStock.value.items : []

        setData({
          revenueOverview: monthRevenue.status === 'fulfilled' ? monthRevenue.value : null,
          todayRevenue: todayRev,
          monthRevenue: monthRev,
          totalOrders: stats.total || 0,
          pendingOrders: stats.byStatus?.[ORDER_STATUS.PENDING] || 0,
          processingOrders: stats.byStatus?.[ORDER_STATUS.PROCESSING] || 0,
          delayedOrders: 0, // TODO: Calculate based on shipping dates
          returnsRate: 0, // TODO: Calculate from return stats
          preordersOverview: preorders,
          lowStockCount: lowStockItems.length,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data',
        }))
      }
    }

    fetchManagerData()
  }, [])

  return data
}

// Sale Staff Dashboard Hook
export function useSaleStaffDashboard() {
  const [data, setData] = useState<SaleStaffKPIs>({
    pendingPrescriptions: 0,
    pendingReturns: 0,
    ordersWithIssues: 0,
    todayPrescriptionsReviewed: 0,
    recentPrescriptions: [],
    recentReturns: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const fetchSaleStaffData = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }))

        const [prescriptions, returns] = await Promise.allSettled([
          orderApi.getPrescriptionQueue(PRESCRIPTION_REVIEW_STATUS.PENDING_REVIEW),
          staffReturnApi.queryReturns({ limit: 10, status: 'SUBMITTED' as any }),
        ])

        const prescriptionOrders = prescriptions.status === 'fulfilled' ? prescriptions.value : []
        const returnItems = returns.status === 'fulfilled' ? returns.value.items : []

        setData({
          pendingPrescriptions: prescriptionOrders.length,
          pendingReturns: returnItems.length,
          ordersWithIssues: 0, // TODO: Implement orders with issues logic
          todayPrescriptionsReviewed: 0, // TODO: Calculate today's reviewed count
          recentPrescriptions: prescriptionOrders.slice(0, 5),
          recentReturns: returnItems.slice(0, 5),
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data',
        }))
      }
    }

    fetchSaleStaffData()
  }, [])

  return data
}

// Operation Staff Dashboard Hook
export function useOperationStaffDashboard() {
  const [data, setData] = useState<OperationStaffKPIs>({
    pendingLabJobs: 0,
    inProgressLabJobs: 0,
    ordersReadyToShip: 0,
    returnsReceivedNotProcessed: 0,
    lowStockItems: [],
    todayLabJobsCompleted: 0,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const fetchOperationStaffData = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }))

        const [pendingLabJobs, inProgressLabJobs, readyToShip, returnsNotProcessed, lowStock] =
          await Promise.allSettled([
            orderApi.getLabJobs(LAB_JOB_STATUS.PENDING),
            orderApi.getLabJobs(LAB_JOB_STATUS.IN_PROGRESS),
            orderApi.getOpsOrders({ status: ORDER_STATUS.READY_TO_SHIP, limit: 50 }),
            staffReturnApi.queryReturns({ status: 'IN_REVIEW' as any, limit: 10 }),
            getInventoryList({ lowStock: true, limit: 10 }),
          ])

        const pendingJobs = pendingLabJobs.status === 'fulfilled' ? pendingLabJobs.value : []
        const inProgressJobs = inProgressLabJobs.status === 'fulfilled' ? inProgressLabJobs.value : []
        const readyOrders = readyToShip.status === 'fulfilled' ? readyToShip.value.orders : []
        const receivedReturns = returnsNotProcessed.status === 'fulfilled' ? returnsNotProcessed.value.items : []
        const lowStockItems = lowStock.status === 'fulfilled' ? lowStock.value.items : []

        setData({
          pendingLabJobs: pendingJobs.length,
          inProgressLabJobs: inProgressJobs.length,
          ordersReadyToShip: readyOrders.length,
          returnsReceivedNotProcessed: receivedReturns.length,
          lowStockItems,
          todayLabJobsCompleted: 0, // TODO: Calculate today's completed jobs
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data',
        }))
      }
    }

    fetchOperationStaffData()
  }, [])

  return data
}

// Helper to format revenue for display
export function formatRevenue(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return amount.toString()
}
