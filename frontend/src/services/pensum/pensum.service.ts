import { apiFetch } from '../api'
import type { PensumResponse } from '@/types'

const getPensumByCarnet = (carnet: number) =>
  apiFetch<PensumResponse>(`/api/pensum?carnet=${carnet}`)

export const pensumService = { getPensumByCarnet }
