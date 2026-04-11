import { apiFormData } from '../api'
import type { ImportPensumResult, ImportExtrasResult } from '@/types'

const importarPensumPrerequisito = (pensumFile: File, prerequisitoFile: File) => {
  const fd = new FormData()
  fd.append('pensum',      pensumFile)
  fd.append('prerequisito', prerequisitoFile)
  return apiFormData<ImportPensumResult>('/api/carga-datos/pensum-prerequisito', fd)
}

const importarExtras = (estudianteFile: File, historialFile: File, contactoFile: File) => {
  const fd = new FormData()
  fd.append('estudiante', estudianteFile)
  fd.append('historial',  historialFile)
  fd.append('contacto',   contactoFile)
  return apiFormData<ImportExtrasResult>('/api/carga-datos/extras', fd)
}

export const cargaDatosService = { importarPensumPrerequisito, importarExtras }
