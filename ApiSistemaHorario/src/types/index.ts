export interface LoginRequest {
  carnet: number;
  contrasenia: string;
}

export interface ContactoResponse {
  id: number;
  carnet_estudiante_id: number;
  municipio_vivienda_id: number;
  direccion: string;
  correo_institucional: string;
  telefono: string;
}

export interface EstudianteResponse {
  carnet: number;
  carrera_id: number;
  tipo_estudiante: number;
  dpi: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  carrera?: string;
  tipo_nombre?: string;
  contacto: ContactoResponse | null;
}

export type EstadoCurso = 'GANADO' | 'DISPONIBLE' | 'BLOQUEADO';

export interface CursoConEstado {
  codigo: number;
  nombre: string;
  creditos: number;
  semestre: number;
  obligatorio: boolean;
  estado: EstadoCurso;
  prerequisitos: number[];
  intentosFallidos: number;
}

export interface PensumResponse {
  carrera: string;
  cursos: CursoConEstado[];
}

export interface ImportPensumResult {
  cursosCreados: number;
  cursosExistentes: number;
  prerequisitosCreados: number;
  errores: string[];
}

export interface ImportExtrasResult {
  estudiantesCreados: number;
  estudiantesExistentes: number;
  historialCreados: number;
  contactosCreados: number;
  errores: string[];
}

// ===== Dashboard =====
export interface CursoDificil {
  codigo: number;
  nombre: string;
  intentos: number;
  ganado: boolean;
  mejorNota: number;
}

export interface RegistroHistorial {
  id: number;
  codigo: number;
  nombre: string;
  semestre: string;
  nota: number;
  aprobado: boolean;
  fecha: string;
}

export interface DashboardResponse {
  carrera: string;
  ultimoSemestre: string | null;
  cursosGanadosUltimoSemestre: number;
  cursosPerdidosUltimoSemestre: number;
  cursosGanadosTotal: number;
  cursosPerdidosTotal: number;
  cursosCursadosTotal: number;
  porcentajeAprobacion: number;
  porcentajeAvance: number;
  creditosAcumulados: number;
  creditosFaltantes: number;
  totalCreditos: number;
  totalCursos: number;
  topCursosDificiles: CursoDificil[];
  promedioGeneral: number;
  promedioLimpio: number;
  registrosHistorial: RegistroHistorial[];
}
