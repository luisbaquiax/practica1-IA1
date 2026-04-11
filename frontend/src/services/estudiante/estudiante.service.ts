import { apiFetch } from '../api'
import type { EstudianteResponse, ContactoResponse } from '@/types'

const getByCarnet = (carnet: number) =>
  apiFetch<EstudianteResponse>(`/api/estudiantes/${carnet}`)

const updateEstudiante = (
  carnet: number,
  data: Partial<{ dpi: string; nombres: string; apellidos: string; fecha_nacimiento: string }>,
) =>
  apiFetch<EstudianteResponse>(`/api/estudiantes/${carnet}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

const updateContacto = (
  carnet: number,
  data: Partial<{
    municipio_vivienda_id: number
    direccion: string
    correo_institucional: string
    telefono: string
  }>,
) =>
  apiFetch<ContactoResponse>(`/api/estudiantes/${carnet}/contacto`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const estudianteService = { getByCarnet, updateEstudiante, updateContacto }
