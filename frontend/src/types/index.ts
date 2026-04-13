// ===== Auth =====
export interface LoginRequest {
  carnet: number
  contrasenia: string
}

export interface EstudianteSession {
  carnet: number
  nombres: string
  apellidos: string
  carrera_id: number
  carrera?: string
}

// ===== Estudiante =====
export interface ContactoResponse {
  id: number
  carnet_estudiante_id: number
  municipio_vivienda_id: number
  direccion: string
  correo_institucional: string
  telefono: string
}

export interface EstudianteResponse {
  carnet: number
  carrera_id: number
  tipo_estudiante: number
  dpi: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  carrera?: string
  tipo_nombre?: string
  contacto: ContactoResponse | null
}

// ===== Pensum =====
export type EstadoCurso = 'GANADO' | 'DISPONIBLE' | 'BLOQUEADO'

export interface CursoConEstado {
  codigo: number
  nombre: string
  creditos: number
  semestre: number
  obligatorio: boolean
  estado: EstadoCurso
  prerequisitos: number[]
  intentosFallidos: number
}

export interface PensumResponse {
  carrera: string
  cursos: CursoConEstado[]
}

// ===== Carga de datos =====
export interface ImportPensumResult {
  cursosCreados: number
  cursosExistentes: number
  prerequisitosCreados: number
  errores: string[]
}

export interface ImportExtrasResult {
  estudiantesCreados: number
  estudiantesExistentes: number
  historialCreados: number
  contactosCreados: number
  errores: string[]
}

// ===== Dashboard =====
export interface CursoDificil {
  codigo: number
  nombre: string
  intentos: number
  ganado: boolean
  mejorNota: number
}

export interface RegistroHistorial {
  id: number
  codigo: number
  nombre: string
  semestre: string
  nota: number
  aprobado: boolean
}

export interface DashboardResponse {
  carrera: string
  ultimoSemestre: string | null
  cursosGanadosUltimoSemestre: number
  cursosPerdidosUltimoSemestre: number
  cursosGanadosTotal: number
  cursosPerdidosTotal: number
  cursosCursadosTotal: number
  porcentajeAprobacion: number
  porcentajeAvance: number
  creditosAcumulados: number
  creditosFaltantes: number
  totalCreditos: number
  totalCursos: number
  topCursosDificiles: CursoDificil[]
  promedioGeneral: number
  promedioLimpio: number
  registrosHistorial: RegistroHistorial[]
}

// ===== Horario Estudiante =====
export interface EntradaCalendario {
  id: number
  tipo_asignacion: 'CLASE' | 'LABORATORIO'
  dia: string
  curso: string | null
  codigo_curso: number | null
  carrera: string | null
  semestre: number | null
  seccion: string | null
  laboratorio: string | null
  docente: string | null
  registro_docente: string | null
  salon: string | null
  hora_inicio: string | null
  hora_fin: string | null
}

export interface HorarioGenerado {
  solucion: {
    id: number
    generacion: number
    aptitud: number
    fecha_creacion: string
  }
  total: number
  calendario: EntradaCalendario[]
  estadistica: {
    tiempo_ejecucion: number
    generaciones_ejecutadas: number
    cantidad_conflictos: number
    memoria_usada_bytes: number
    porcentaje_cursos_continuos: number
  } | null
  conflictos: { tipo: string; descripcion: string }[]
}

export interface CursoHorario {
  codigo: number
  nombre: string
  semestre: number
  creditos: number
  obligatorio: boolean
  esAreaComun: boolean
  entradas: EntradaCalendario[]
}

// ===== Algoritmo Genético Personalizado =====
export interface CursoSeleccionado {
  codigo: number
  nombre: string
  creditos: number
}

export interface SeleccionInscripcion {
  carnet: number
  obligatorios: CursoSeleccionado[]
  opcionales: CursoSeleccionado[]
}

export interface GenResultado {
  codigoCurso: number
  seccion: string
  horario: string
  salon: string
  docente: string
}

export interface ConflictoGA {
  tipo: string
  descripcion: string
  cursosInvolucrados: number[]
}

export interface ResultadoGA {
  mejorIndividuo: {
    genes: GenResultado[]
    fitness: number
    esValido: boolean
  }
  generaciones: number
  evolucionFitness: number[]
  tiempoCómputoMs: number
  conflictos: ConflictoGA[]
  alternativas: AlternativaGA[]
}

export interface AlternativaGA {
  etiqueta: string
  genes: GenResultado[]
}

