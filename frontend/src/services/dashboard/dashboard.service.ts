import { apiFetch } from '../api'
import type { DashboardResponse } from '@/types'

const getDashboardByCarnet = (carnet: number) =>
  apiFetch<DashboardResponse>(`/api/dashboard?carnet=${carnet}`)

export const dashboardService = { getDashboardByCarnet }
