import type { HorarioGenerado, ResultadoGA, SeleccionInscripcion } from '@/types'

export const GA_API_URL    = 'http://localhost:3000'
export const LOCAL_API_URL = 'http://localhost:3001'

const obtenerUltimaSolucion = async (): Promise<HorarioGenerado | null> => {
  const res = await fetch(`${GA_API_URL}/api/ga/ultima-solucion`)
  if (!res.ok) throw new Error(`Error al obtener horario: HTTP ${res.status}`)
  const data = await res.json()
  return data
}

/**
 * Envía la selección del estudiante al backend local para ejecutar el AG personalizado.
 */
const generarHorarioPersonalizado = async (seleccion: SeleccionInscripcion): Promise<ResultadoGA> => {
  const res = await fetch(`${LOCAL_API_URL}/api/ga/generar-horario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seleccion),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err?.error ?? `Error HTTP ${res.status}`)
  }
  return res.json()
}

export const horarioService = { obtenerUltimaSolucion, generarHorarioPersonalizado }
