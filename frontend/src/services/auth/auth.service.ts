import { apiFetch } from '../api'
import type { EstudianteResponse, EstudianteSession } from '@/types'

const SESSION_KEY = 'estudiante_session'

function getSession(): EstudianteSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? (JSON.parse(raw) as EstudianteSession) : null
}

function setSession(data: EstudianteSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

async function login(carnet: number, contrasenia: string): Promise<EstudianteSession> {
  const data = await apiFetch<EstudianteResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ carnet, contrasenia }),
  })
  const session: EstudianteSession = {
    carnet:    data.carnet,
    nombres:   data.nombres,
    apellidos: data.apellidos,
    carrera_id: data.carrera_id,
    carrera:   data.carrera,
  }
  setSession(session)
  return session
}

export const authService = { login, getSession, setSession, clearSession }
