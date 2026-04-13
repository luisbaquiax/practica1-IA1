<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { authService } from '@/services/auth/auth.service'
import { horarioService } from '@/services/horario/horario.service'
import { pensumService } from '@/services/pensum/pensum.service'
import { dashboardService } from '@/services/dashboard/dashboard.service'
import type {
  DashboardResponse,
  EntradaCalendario,
  EstudianteSession,
  HorarioGenerado,
  PensumResponse,
  ResultadoGA,
} from '@/types'

type TabKey = 'cursos' | 'horario'
type FiltroTipo = 'todos' | 'CLASE' | 'LABORATORIO'

interface CursoDisponibleRow {
  codigo: number
  nombre: string
  semestre: number
  creditos: number
  obligatorio: boolean
  horarioTexto: string
  horarioEntradas: string[]
  tieneHorario: boolean
  intentosFallidos: number
}

interface FranjaHorario {
  inicio: string
  fin: string
}

interface HorarioIdealRow {
  codigo: number
  curso: string
  seccion: string
  horario: string
  salon: string
  docente: string
}

const TAB_CURSOS: TabKey = 'cursos'
const TAB_HORARIO: TabKey = 'horario'

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error' | 'info' | 'warning'>('info')

const tabActual = ref<TabKey>(TAB_CURSOS)
const cargando = ref(false)
const generandoHorarioIdeal = ref(false)
const sesion = ref<EstudianteSession | null>(null)
const pensum = ref<PensumResponse | null>(null)
const horarioGeneral = ref<HorarioGenerado | null>(null)
const resultadoGA = ref<ResultadoGA | null>(null)

const opcionalesSeleccionados = ref<number[]>([])
const filtroCurso = ref('')
const filtroTipo = ref<FiltroTipo>('todos')
const zoomLevel = ref(1)
const dashboard = ref<DashboardResponse | null>(null)

// ── Repitencias en semestre (es_semestre === 'TRUE') por codigo de curso ──
// es_semestre en la BD/CSV es 'TRUE' (semestre regular) o 'FALSE' (vacaciones).
// La regla aplica solo a intentos en semestre regular.
const repitenciasSemestre = computed<Map<number, number>>(() => {
  const map = new Map<number, number>()
  const historial = dashboard.value?.registrosHistorial ?? []
  for (const reg of historial) {
    const esSemestre = String(reg.semestre).toUpperCase() === 'TRUE'
    if (!reg.aprobado && esSemestre) {
      map.set(reg.codigo, (map.get(reg.codigo) ?? 0) + 1)
    }
  }
  return map
})

// Códigos que ya tienen 3 semestres perdidos → bloqueados del GA
const codigosAgotadosSemestre = computed<Set<number>>(() => {
  const set = new Set<number>()
  repitenciasSemestre.value.forEach((count, codigo) => {
    if (count >= 3) set.add(codigo)
  })
  return set
})

// Cursos con exactamente 2 semestres perdidos → advertencia de último intento
const codigosUltimoIntento = computed<Set<number>>(() => {
  const set = new Set<number>()
  repitenciasSemestre.value.forEach((count, codigo) => {
    if (count === 2) set.add(codigo)
  })
  return set
})

// ── Diálogo horario publicado ──
const dialogHorario = ref(false)
const dialogCursoNombre = ref('')
const dialogEntradas = ref<string[]>([])

function abrirDialogHorario(nombre: string, entradas: string[]) {
  dialogCursoNombre.value = nombre
  dialogEntradas.value = entradas
  dialogHorario.value = true
}

function zoomIn() {
  zoomLevel.value = Math.min(2, parseFloat((zoomLevel.value + 0.15).toFixed(2)))
}

function zoomOut() {
  zoomLevel.value = Math.max(0.4, parseFloat((zoomLevel.value - 0.15).toFixed(2)))
}

function resetZoom() {
  zoomLevel.value = 1
}

const STORAGE_PREFIX = 'horario_estudiante_opcionales'

function showSnackbar(msg: string, color: 'success' | 'error' | 'info' | 'warning' = 'info') {
  snackbarMessage.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

function formatHora(hora: string | null): string {
  return hora ? hora.slice(0, 5) : ''
}

function diaTexto(dia: string | null): string {
  const map: Record<string, string> = {
    LXV: 'Lunes, Miércoles y Viernes',
    L: 'Lunes',
    M: 'Martes',
    X: 'Miércoles',
    J: 'Jueves',
    V: 'Viernes',
    S: 'Sábado',
  }
  if (!dia) return 'Sin día'
  return map[dia] ?? dia
}

function diaDots(dia: string | null): string[] {
  if (!dia) return []
  if (dia === 'LXV') return ['L', 'X', 'V']
  if (dia === 'M') return ['M']
  if (dia === 'J') return ['J']
  if (dia === 'L') return ['L']
  if (dia === 'X') return ['X']
  if (dia === 'V') return ['V']
  if (dia === 'S') return ['S']
  return [dia.charAt(0).toUpperCase()]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

function clasificarCarrera(value: string | null | undefined): string | null {
  const normalized = normalizeText(value)
  if (!normalized) return null
  if (normalized.includes('AREA COMUN')) return 'AREA_COMUN'
  if (normalized.includes('MECANICA INDUSTRIAL')) return 'MECANICA_INDUSTRIAL'
  if (normalized.includes('SISTEMAS')) return 'SISTEMAS'
  if (normalized.includes('CIVIL')) return 'CIVIL'
  if (normalized.includes('INDUSTRIAL')) return 'INDUSTRIAL'
  if (normalized.includes('MECANICA')) return 'MECANICA'
  return normalized
}

function llaveSeleccion(carnet: number): string {
  return `${STORAGE_PREFIX}_${carnet}`
}

function persistirSeleccion() {
  if (!sesion.value) return
  localStorage.setItem(
    llaveSeleccion(sesion.value.carnet),
    JSON.stringify({
      codigos: opcionalesSeleccionados.value,
      actualizado: new Date().toISOString(),
    }),
  )
}

function restaurarSeleccion() {
  if (!sesion.value) return
  const raw = localStorage.getItem(llaveSeleccion(sesion.value.carnet))
  if (!raw) {
    opcionalesSeleccionados.value = []
    return
  }

  try {
    const parsed = JSON.parse(raw) as { codigos?: number[] }
    opcionalesSeleccionados.value = Array.isArray(parsed.codigos)
      ? parsed.codigos.filter((codigo) => Number.isFinite(codigo))
      : []
  } catch {
    opcionalesSeleccionados.value = []
  }
}

function horarioTexto(entradas: EntradaCalendario[]): string {
  if (!entradas.length) return 'No aparece en el horario general publicado'
  return entradas
    .slice()
    .sort((a, b) => {
      const horaA = `${a.hora_inicio ?? ''}-${a.hora_fin ?? ''}`
      const horaB = `${b.hora_inicio ?? ''}-${b.hora_fin ?? ''}`
      return horaA.localeCompare(horaB)
    })
    .map((entrada) => {
      const horario = `${formatHora(entrada.hora_inicio)} - ${formatHora(entrada.hora_fin)}`.trim()
      const salon = entrada.salon ? ` · ${entrada.salon}` : ''
      return `${diaTexto(entrada.dia)} ${horario}${salon}`.trim()
    })
    .join(' | ')
}

function estaSeleccionado(codigo: number): boolean {
  return opcionalesSeleccionados.value.includes(codigo)
}

function toggleOpcional(codigo: number) {
  opcionalesSeleccionados.value = estaSeleccionado(codigo)
    ? opcionalesSeleccionados.value.filter((item) => item !== codigo)
    : [...opcionalesSeleccionados.value, codigo]
  persistirSeleccion()
}

function entradaEsDeLaCarrera(entrada: EntradaCalendario): boolean {
  if (!sesion.value?.carrera) return true
  const carreraEntrada = clasificarCarrera(entrada.carrera)
  const carreraSesion = clasificarCarrera(sesion.value.carrera)
  if (!carreraSesion) return true
  return carreraEntrada === 'AREA_COMUN' || carreraEntrada === carreraSesion
}

const entradasCarrera = computed(() => {
  const calendario = horarioGeneral.value?.calendario ?? []
  if (!calendario.length) return []
  const filtradas = calendario.filter(entradaEsDeLaCarrera)
  return filtradas.length ? filtradas : calendario
})

const entradasPorCodigo = computed(() => {
  const map = new Map<number, EntradaCalendario[]>()
  for (const entrada of entradasCarrera.value) {
    const codigo = Number(entrada.codigo_curso)
    if (!codigo) continue
    const existentes = map.get(codigo) ?? []
    existentes.push(entrada)
    map.set(codigo, existentes)
  }
  return map
})

const cursosDisponibles = computed<CursoDisponibleRow[]>(() => {
  const cursos = pensum.value?.cursos ?? []
  return cursos
    .filter((curso) => curso.estado === 'DISPONIBLE')
    .map((curso) => {
      const entradas = entradasPorCodigo.value.get(curso.codigo) ?? []
      const sorted = entradas.slice().sort((a, b) => {
        const ha = `${a.hora_inicio ?? ''}-${a.hora_fin ?? ''}`
        const hb = `${b.hora_inicio ?? ''}-${b.hora_fin ?? ''}`
        return ha.localeCompare(hb)
      })
      const horarioEntradas = sorted.map((entrada) => {
        const h = `${formatHora(entrada.hora_inicio)} - ${formatHora(entrada.hora_fin)}`.trim()
        const salon = entrada.salon ? ` · ${entrada.salon}` : ''
        return `${diaTexto(entrada.dia)} ${h}${salon}`.trim()
      })
      return {
        codigo: curso.codigo,
        nombre: curso.nombre,
        semestre: curso.semestre,
        creditos: curso.creditos,
        obligatorio: curso.obligatorio,
        horarioTexto: horarioTexto(entradas),
        horarioEntradas,
        tieneHorario: entradas.length > 0,
        intentosFallidos: curso.intentosFallidos ?? 0,
      }
    })
    .sort((a, b) => a.semestre - b.semestre || a.nombre.localeCompare(b.nombre))
})

const cursosObligatorios = computed(() => cursosDisponibles.value.filter((curso) => curso.obligatorio))
const cursosOpcionales = computed(() => cursosDisponibles.value.filter((curso) => !curso.obligatorio))

const opcionalesSeleccionadosRows = computed(() => {
  const seleccion = new Set(opcionalesSeleccionados.value)
  return cursosOpcionales.value.filter((curso) => seleccion.has(curso.codigo))
})

const resumenSeleccion = computed(() => {
  const totalCursos = cursosObligatorios.value.length + opcionalesSeleccionadosRows.value.length
  const totalCreditos = [...cursosObligatorios.value, ...opcionalesSeleccionadosRows.value]
    .reduce((acc, curso) => acc + curso.creditos, 0)
  return {
    totalCursos,
    totalCreditos,
  }
})

const calendarioFiltrado = computed(() => {
  return entradasCarrera.value.filter((entrada) => {
    if (filtroTipo.value !== 'todos' && entrada.tipo_asignacion !== filtroTipo.value) return false

    if (!filtroCurso.value.trim()) return true
    const textoBase = normalizeText(`${entrada.codigo_curso ?? ''} ${entrada.curso ?? ''}`)
    return textoBase.includes(normalizeText(filtroCurso.value))
  })
})

const salones = computed(() => {
  const set = new Set<string>()
  calendarioFiltrado.value.forEach((entrada) => {
    if (entrada.salon) set.add(entrada.salon)
  })
  const lista = [...set].sort((a, b) => a.localeCompare(b))
  if (calendarioFiltrado.value.some((entrada) => !entrada.salon)) lista.push('(Sin aula)')
  return lista
})

const franjas = computed<FranjaHorario[]>(() => {
  const map = new Map<string, FranjaHorario>()
  calendarioFiltrado.value.forEach((entrada) => {
    if (!entrada.hora_inicio || !entrada.hora_fin) return
    map.set(`${entrada.hora_inicio}-${entrada.hora_fin}`, {
      inicio: entrada.hora_inicio,
      fin: entrada.hora_fin,
    })
  })
  return [...map.values()].sort((a, b) => {
    const cmp = a.inicio.localeCompare(b.inicio)
    return cmp !== 0 ? cmp : a.fin.localeCompare(b.fin)
  })
})

function getCeldas(franja: FranjaHorario, salon: string): EntradaCalendario[] {
  return calendarioFiltrado.value.filter((entrada) => {
    const mismaFranja = entrada.hora_inicio === franja.inicio && entrada.hora_fin === franja.fin
    if (!mismaFranja) return false
    if (salon === '(Sin aula)') return !entrada.salon
    return entrada.salon === salon
  })
}

const nombresCursoPorCodigo = computed(() => {
  const map = new Map<number, string>()
  for (const curso of pensum.value?.cursos ?? []) {
    map.set(curso.codigo, curso.nombre)
  }
  return map
})

const horarioIdealRows = computed<HorarioIdealRow[]>(() => {
  return (resultadoGA.value?.mejorIndividuo.genes ?? []).map((gene) => ({
    codigo: gene.codigoCurso,
    curso: nombresCursoPorCodigo.value.get(gene.codigoCurso) ?? `Curso ${gene.codigoCurso}`,
    seccion: gene.seccion || '—',
    horario: gene.horario || '—',
    salon: gene.salon || '—',
    docente: gene.docente || 'Sin docente asignado',
  }))
})

async function cargarDatos() {
  const sesionActual = authService.getSession()
  if (!sesionActual) {
    showSnackbar('No hay una sesión de estudiante activa', 'error')
    return
  }

  sesion.value = sesionActual
  cargando.value = true

  try {
    const [pensumResponse, horarioResponse, dashboardResponse] = await Promise.all([
      pensumService.getPensumByCarnet(sesionActual.carnet),
      horarioService.obtenerUltimaSolucion().catch(() => null),
      dashboardService.getDashboardByCarnet(sesionActual.carnet).catch(() => null),
    ])

    pensum.value = pensumResponse
    horarioGeneral.value = horarioResponse
    dashboard.value = dashboardResponse
    restaurarSeleccion()

    if (!horarioResponse) {
      showSnackbar('No hay horario general publicado todavía', 'info')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cargar la información del estudiante'
    showSnackbar(message, 'error')
  } finally {
    cargando.value = false
  }
}

async function generarHorarioIdeal() {
  if (!sesion.value) {
    showSnackbar('No hay una sesión de estudiante activa', 'error')
    return
  }

  const obligatorios = cursosObligatorios.value
    .filter((curso) => !codigosAgotadosSemestre.value.has(curso.codigo))
    .map((curso) => ({
      codigo: curso.codigo,
      nombre: curso.nombre,
      creditos: curso.creditos,
    }))

  const opcionales = opcionalesSeleccionadosRows.value
    .filter((curso) => !codigosAgotadosSemestre.value.has(curso.codigo))
    .map((curso) => ({
      codigo: curso.codigo,
      nombre: curso.nombre,
      creditos: curso.creditos,
    }))

  if (!obligatorios.length && !opcionales.length) {
    showSnackbar('No hay cursos seleccionados para generar el horario ideal', 'warning')
    return
  }

  generandoHorarioIdeal.value = true
  persistirSeleccion()

  try {
    resultadoGA.value = await horarioService.generarHorarioPersonalizado({
      carnet: sesion.value.carnet,
      obligatorios,
      opcionales,
    })

    const esValido = resultadoGA.value.mejorIndividuo.esValido
    showSnackbar(
      esValido
        ? 'Horario ideal generado correctamente'
        : 'Horario generado con conflictos. Revisa el detalle antes de exportar.',
      esValido ? 'success' : 'warning',
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al generar el horario ideal'
    showSnackbar(message, 'error')
  } finally {
    generandoHorarioIdeal.value = false
  }
}

function exportarHorarioIdealPDF() {
  if (!horarioIdealRows.value.length) {
    showSnackbar('Genera un horario ideal antes de exportarlo', 'warning')
    return
  }

  const filas = horarioIdealRows.value.map((row) => `
    <tr>
      <td>${row.codigo}</td>
      <td>${escapeHtml(row.curso)}</td>
      <td>${escapeHtml(row.seccion)}</td>
      <td>${escapeHtml(row.horario)}</td>
      <td>${escapeHtml(row.salon)}</td>
      <td>${escapeHtml(row.docente)}</td>
    </tr>
  `).join('')

  const estudiante = sesion.value ? `${sesion.value.nombres} ${sesion.value.apellidos}` : 'Estudiante'
  const carrera = sesion.value?.carrera ?? pensum.value?.carrera ?? 'Sin carrera'
  const fitness = resultadoGA.value?.mejorIndividuo.fitness ?? 0
  const estado = resultadoGA.value?.mejorIndividuo.esValido ? 'Sin conflictos' : 'Con conflictos'

  const html = `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Horario ideal</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
        h1 { margin: 0 0 6px; font-size: 22px; }
        p { margin: 4px 0; font-size: 12px; color: #444; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border: 1px solid #cfd8dc; padding: 8px 10px; text-align: left; }
        th { background: #dbe8f2; }
        tbody tr:nth-child(even) { background: #f7fafc; }
      </style>
    </head>
    <body>
      <h1>Horario ideal del estudiante</h1>
      <p><strong>Estudiante:</strong> ${escapeHtml(estudiante)}</p>
      <p><strong>Carrera:</strong> ${escapeHtml(carrera)}</p>
      <p><strong>Fecha:</strong> ${escapeHtml(new Date().toLocaleString('es-GT'))}</p>
      <p><strong>Fitness:</strong> ${fitness.toFixed(0)} | <strong>Estado:</strong> ${escapeHtml(estado)}</p>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Curso</th>
            <th>Sección</th>
            <th>Horario</th>
            <th>Aula</th>
            <th>Docente</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </body>
  </html>`

  const ventana = window.open('', '_blank', 'width=980,height=720')
  if (!ventana) {
    showSnackbar('El navegador bloqueó la ventana de impresión', 'warning')
    return
  }

  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  ventana.print()
}

onMounted(cargarDatos)
</script>

<template>
  <v-container fluid class="page-shell pa-5 pa-md-6">
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top right"
      rounded="lg"
      :timeout="3500"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
      </template>
    </v-snackbar>

    <!-- Diálogo horario publicado -->
    <v-dialog v-model="dialogHorario" max-width="520" scrollable>
      <v-card color="#162030" rounded="xl">
        <v-card-title class="pa-5 pb-2" style="color:#e8f4fd;font-size:1.1rem;font-weight:700">
          <v-icon icon="mdi-calendar-clock" color="teal-lighten-2" class="me-2" />
          Horario publicado
        </v-card-title>
        <v-card-subtitle class="px-5 pb-3" style="color:#80cbc4;white-space:normal">
          {{ dialogCursoNombre }}
        </v-card-subtitle>
        <v-divider color="#2d4155" />
        <v-card-text class="pa-5">
          <div v-if="dialogEntradas.length">
            <div
              v-for="(entrada, i) in dialogEntradas"
              :key="i"
              class="dialog-entry-item"
            >
              <v-icon icon="mdi-clock-outline" size="18" color="teal-lighten-2" />
              <span>{{ entrada }}</span>
            </div>
          </div>
          <div v-else style="color:#546e7a;font-size:.9rem">Sin horario publicado.</div>
        </v-card-text>
        <v-divider color="#2d4155" />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="teal-lighten-2"
            variant="tonal"
            rounded="lg"
            @click="dialogHorario = false"
          >Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <section class="page-header mb-5">
      <div>
        <p class="eyebrow mb-2">Horario del estudiante</p>
        <h1 class="page-title mb-1">Inscripción y horario ideal</h1>
        <p class="page-subtitle mb-0">
          Consulta tus cursos disponibles, revisa el horario general de tu carrera y genera tu horario ideal.
        </p>
      </div>

      <div class="header-actions">
        <div class="student-pill" v-if="sesion">
          <strong>{{ sesion.nombres }} {{ sesion.apellidos }}</strong>
          <span>{{ sesion.carrera ?? pensum?.carrera ?? 'Carrera no disponible' }}</span>
        </div>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-refresh"
          :loading="cargando"
          @click="cargarDatos"
        >
          Recargar
        </v-btn>
      </div>
    </section>

    <v-progress-linear v-if="cargando" indeterminate color="primary" rounded class="mb-4" />

    <v-tabs
      v-model="tabActual"
      color="teal-lighten-2"
      bg-color="#162030"
      class="tabs-bar mb-4"
      fixed-tabs
    >
      <v-tab :value="TAB_CURSOS">Cursos disponibles</v-tab>
      <v-tab :value="TAB_HORARIO">Horario general e ideal</v-tab>
    </v-tabs>

    <v-window v-model="tabActual">
      <v-window-item :value="TAB_CURSOS">
        <div class="content-stack">
          <v-alert
            v-if="!pensum && !cargando"
            type="warning"
            variant="tonal"
            rounded="lg"
          >
            No fue posible cargar el pensum del estudiante.
          </v-alert>

          <!-- Alerta: cursos con 3 fallos — no pueden cursarse en semestre -->
          <v-alert
            v-if="codigosAgotadosSemestre.size > 0"
            type="error"
            variant="tonal"
            rounded="xl"
            icon="mdi-cancel"
            prominent
          >
            <div class="mb-2">
              <strong>No puedes inscribir los siguientes cursos este semestre.</strong>
              Ya los has reprobado 3 veces en semestre. Solo puedes llevarlos en vacaciones.
            </div>
            <div
              v-for="codigo in [...codigosAgotadosSemestre]"
              :key="codigo"
              class="repitencia-item"
            >
              <v-icon icon="mdi-book-remove" size="15" />
              {{ nombresCursoPorCodigo.get(codigo) ?? `Curso ${codigo}` }}
              <span class="repitencia-badge-codigo">({{ codigo }})</span>
            </div>
          </v-alert>

          <!-- Alerta: cursos con 2 fallos — último intento en semestre -->
          <v-alert
            v-if="codigosUltimoIntento.size > 0"
            type="warning"
            variant="tonal"
            rounded="xl"
            icon="mdi-alert-circle-outline"
            prominent
          >
            <div class="mb-2">
              <strong>Última oportunidad de llevar estos cursos en semestre.</strong>
              Si los repruebas este semestre, solo podrás tomarlos en vacaciones.
            </div>
            <div
              v-for="codigo in [...codigosUltimoIntento]"
              :key="codigo"
              class="repitencia-item"
            >
              <v-icon icon="mdi-book-alert" size="15" />
              {{ nombresCursoPorCodigo.get(codigo) ?? `Curso ${codigo}` }}
              <span class="repitencia-badge-codigo">({{ codigo }})</span>
            </div>
          </v-alert>

          <section v-if="pensum" class="section-card">
            <div class="section-heading">
              <div>
                <h2 class="section-title mb-1">Cursos obligatorios</h2>
                <p class="section-copy mb-0">Cursos disponibles que se agregan automáticamente al horario ideal.</p>
              </div>
              <v-chip color="primary" variant="tonal">{{ cursosObligatorios.length }} cursos</v-chip>
            </div>

            <div class="table-shell mt-4">
              <v-table class="simple-table" density="comfortable">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Curso</th>
                    <th>Semestre</th>
                    <th>Créditos</th>
                    <th>Horario publicado</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="curso in cursosObligatorios"
                    :key="curso.codigo"
                    :class="{
                      'row-ultimo-intento': codigosUltimoIntento.has(curso.codigo),
                      'row-agotado': codigosAgotadosSemestre.has(curso.codigo),
                    }"
                  >
                    <td>{{ curso.codigo }}</td>
                    <td>{{ curso.nombre }}</td>
                    <td>{{ curso.semestre }}</td>
                    <td>{{ curso.creditos }}</td>
                    <td>
                      <v-btn
                        v-if="curso.horarioEntradas.length"
                        size="small"
                        color="teal"
                        variant="tonal"
                        rounded="lg"
                        prepend-icon="mdi-calendar-clock"
                        @click.stop="abrirDialogHorario(curso.nombre, curso.horarioEntradas)"
                      >Ver horario</v-btn>
                      <span v-else class="text-muted">Sin horario</span>
                    </td>
                    <td class="estado-col">
                      <span v-if="codigosAgotadosSemestre.has(curso.codigo)" class="badge-agotado">
                        <v-icon icon="mdi-close-circle" size="14" /> Sin cupos en semestre
                      </span>
                      <span v-else-if="codigosUltimoIntento.has(curso.codigo)" class="badge-advertencia">
                        <v-icon icon="mdi-alert" size="14" /> Último intento
                      </span>
                      <span v-else class="badge-ok">
                        <v-icon icon="mdi-check-circle" size="14" /> OK
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!cursosObligatorios.length">
                    <td colspan="6" class="empty-cell">No hay cursos obligatorios disponibles.</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </section>

          <section v-if="pensum" class="section-card">
            <div class="section-heading">
              <div>
                <h2 class="section-title mb-1">Cursos opcionales</h2>
                <p class="section-copy mb-0">Selecciona los opcionales que quieres considerar para tu horario ideal.</p>
              </div>
              <v-chip color="secondary" variant="tonal">
                {{ opcionalesSeleccionadosRows.length }} seleccionados
              </v-chip>
            </div>

            <div class="table-shell mt-4">
              <v-table class="simple-table" density="comfortable">
                <thead>
                  <tr>
                    <th class="checkbox-col">Elegir</th>
                    <th>Código</th>
                    <th>Curso</th>
                    <th>Semestre</th>
                    <th>Créditos</th>
                    <th>Horario publicado</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="curso in cursosOpcionales"
                    :key="curso.codigo"
                    :class="{
                      'row-selected': estaSeleccionado(curso.codigo),
                      'row-ultimo-intento': codigosUltimoIntento.has(curso.codigo),
                      'row-agotado': codigosAgotadosSemestre.has(curso.codigo),
                    }"
                    @click="toggleOpcional(curso.codigo)"
                  >
                    <td class="checkbox-col">
                      <v-checkbox-btn
                        :model-value="estaSeleccionado(curso.codigo)"
                        color="primary"
                        density="compact"
                        hide-details
                        @click.stop="toggleOpcional(curso.codigo)"
                      />
                    </td>
                    <td>{{ curso.codigo }}</td>
                    <td>{{ curso.nombre }}</td>
                    <td>{{ curso.semestre }}</td>
                    <td>{{ curso.creditos }}</td>
                    <td>
                      <v-btn
                        v-if="curso.horarioEntradas.length"
                        size="small"
                        color="teal"
                        variant="tonal"
                        rounded="lg"
                        prepend-icon="mdi-calendar-clock"
                        @click.stop="abrirDialogHorario(curso.nombre, curso.horarioEntradas)"
                      >Ver horario</v-btn>
                      <span v-else class="text-muted">Sin horario</span>
                    </td>
                    <td class="estado-col">
                      <span v-if="codigosAgotadosSemestre.has(curso.codigo)" class="badge-agotado">
                        <v-icon icon="mdi-close-circle" size="14" /> Sin cupos en semestre
                      </span>
                      <span v-else-if="codigosUltimoIntento.has(curso.codigo)" class="badge-advertencia">
                        <v-icon icon="mdi-alert" size="14" /> Último intento
                      </span>
                      <span v-else class="badge-ok">
                        <v-icon icon="mdi-check-circle" size="14" /> OK
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!cursosOpcionales.length">
                    <td colspan="7" class="empty-cell">No hay cursos opcionales disponibles.</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </section>
        </div>
      </v-window-item>

      <v-window-item :value="TAB_HORARIO">
        <div class="content-stack">
          <section class="section-card">
            <div class="section-heading">
              <div>
                <h2 class="section-title mb-1">Horario general de la carrera</h2>
              </div>
            </div>

            <div class="filter-row mt-4">
              <v-btn-toggle
                v-model="filtroTipo"
                mandatory
                divided
                rounded="lg"
                density="comfortable"
                color="teal-lighten-1"
                bg-color="#1e3248"
                class="filter-toggle"
              >
                <v-btn value="todos" prepend-icon="mdi-view-grid-outline">Todos</v-btn>
                <v-btn value="CLASE" prepend-icon="mdi-chair-school">Solo cursos</v-btn>
                <v-btn value="LABORATORIO" prepend-icon="mdi-flask">Solo labs</v-btn>
              </v-btn-toggle>
            </div>

            <v-alert
              v-if="!horarioGeneral && !cargando"
              type="info"
              variant="tonal"
              rounded="lg"
              class="mt-4"
            >
              No hay horario general publicado en este momento.
            </v-alert>

            <div v-else class="schedule-shell mt-4">
              <div class="zoom-bar">
                <v-btn
                  icon="mdi-magnify-minus-outline"
                  size="small"
                  variant="tonal"
                  color="teal"
                  :disabled="zoomLevel <= 0.4"
                  @click="zoomOut"
                />
                <span class="zoom-label">{{ Math.round(zoomLevel * 100) }}%</span>
                <v-btn
                  icon="mdi-magnify-plus-outline"
                  size="small"
                  variant="tonal"
                  color="teal"
                  :disabled="zoomLevel >= 2"
                  @click="zoomIn"
                />
                <v-btn
                  size="small"
                  variant="text"
                  color="teal-lighten-2"
                  @click="resetZoom"
                >
                  Restablecer
                </v-btn>
                <span class="zoom-tip">Scroll para desplazarte</span>
              </div>
              <div class="schedule-outer">
                <div class="schedule-zoom-wrapper" :style="{ zoom: zoomLevel }">
                <table class="schedule-table">
                  <thead>
                    <tr>
                      <th class="hour-col">Horario</th>
                      <th v-for="salon in salones" :key="salon" class="room-col">{{ salon }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="franja in franjas" :key="`${franja.inicio}-${franja.fin}`">
                      <td class="hour-cell">
                        <div>{{ formatHora(franja.inicio) }}</div>
                        <span>—</span>
                        <div>{{ formatHora(franja.fin) }}</div>
                      </td>
                      <td v-for="salon in salones" :key="`${franja.inicio}-${salon}`" class="schedule-cell">
                        <div
                          v-for="entrada in getCeldas(franja, salon)"
                          :key="entrada.id"
                          class="schedule-entry"
                          :class="entrada.tipo_asignacion === 'LABORATORIO' ? 'schedule-entry-lab' : 'schedule-entry-class'"
                        >
                          <div class="entry-title">{{ entrada.codigo_curso }} - {{ entrada.curso }}</div>
                          <div class="entry-section-big">{{ entrada.seccion ?? entrada.laboratorio ?? '—' }}</div>
                          <div v-if="entrada.semestre" class="entry-semestre">{{ entrada.semestre }}° Semestre</div>
                          <div class="entry-docente">
                            <template v-if="entrada.registro_docente">{{ entrada.registro_docente }} - </template>{{ entrada.docente ?? 'Sin docente asignado' }}
                          </div>
                          <div class="entry-dia-text">{{ diaTexto(entrada.dia) }}</div>
                          <div class="entry-day-dots">
                            <span
                              v-for="dot in diaDots(entrada.dia)"
                              :key="dot"
                              class="entry-dot"
                              :class="entrada.tipo_asignacion === 'LABORATORIO' ? 'entry-dot-lab' : 'entry-dot-class'"
                            >{{ dot }}</span>
                          </div>
                        </div>
                        <div v-if="getCeldas(franja, salon).length === 0" class="schedule-empty"></div>
                      </td>
                    </tr>
                    <tr v-if="!franjas.length || !salones.length">
                      <td :colspan="Math.max(salones.length, 1) + 1" class="empty-cell">
                        No hay resultados con los filtros actuales.
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-heading">
              <div>
                <h2 class="section-title mb-1">Generar mi horario ideal</h2>
                <p class="section-copy mb-0">
                  Se usarán <strong style="color:#80cbc4">{{ cursosObligatorios.length }}</strong> obligatorios y
                  <strong style="color:#80cbc4">{{ opcionalesSeleccionadosRows.length }}</strong> opcionales
                  ({{ resumenSeleccion.totalCursos }} cursos · {{ resumenSeleccion.totalCreditos }} créditos).
                </p>
              </div>
            </div>

            <div class="ideal-actions mt-4">
              <v-btn
                color="teal-darken-2"
                variant="flat"
                rounded="lg"
                size="large"
                prepend-icon="mdi-auto-fix"
                :loading="generandoHorarioIdeal"
                @click="generarHorarioIdeal"
              >
                Generar horario ideal
              </v-btn>
              <v-btn
                color="red-darken-1"
                variant="tonal"
                rounded="lg"
                size="large"
                prepend-icon="mdi-file-pdf-box"
                :disabled="!horarioIdealRows.length"
                @click="exportarHorarioIdealPDF"
              >
                Exportar PDF
              </v-btn>
            </div>

            <!-- Aviso: cursos con último intento en semestre -->
            <v-alert
              v-if="codigosUltimoIntento.size > 0"
              type="warning"
              variant="tonal"
              rounded="lg"
              class="mt-4"
              icon="mdi-alert-outline"
            >
              <div class="mb-1"><strong>Advertencia — Último intento en semestre:</strong></div>
              <div
                v-for="codigo in [...codigosUltimoIntento]"
                :key="codigo"
                class="repitencia-item"
              >
                <v-icon icon="mdi-book-alert" size="15" />
                {{ nombresCursoPorCodigo.get(codigo) ?? `Curso ${codigo}` }} ({{ codigo }}) — Si lo repruebas este semestre solo podrás llevarlo en vacaciones.
              </div>
            </v-alert>

            <!-- Aviso: cursos excluidos del GA por 3 semestres perdidos -->
            <v-alert
              v-if="codigosAgotadosSemestre.size > 0"
              type="error"
              variant="tonal"
              rounded="lg"
              class="mt-3"
              icon="mdi-cancel"
            >
              <div class="mb-1"><strong>Cursos excluidos del horario ideal:</strong></div>
              <div class="mb-1" style="font-size:0.85rem;opacity:0.85">
                Agotaste los 3 intentos en semestre. Solo pueden cursarse en vacaciones (fuera de este ciclo).
              </div>
              <div
                v-for="codigo in [...codigosAgotadosSemestre]"
                :key="codigo"
                class="repitencia-item"
              >
                <v-icon icon="mdi-book-remove" size="15" />
                {{ nombresCursoPorCodigo.get(codigo) ?? `Curso ${codigo}` }} ({{ codigo }})
              </div>
            </v-alert>

            <v-alert
              v-if="resultadoGA && resultadoGA.conflictos.length"
              type="warning"
              variant="tonal"
              rounded="lg"
              class="mt-4"
            >
              <div class="mb-2"><strong>Conflictos detectados:</strong></div>
              <div v-for="(conflicto, index) in resultadoGA.conflictos" :key="`${conflicto.tipo}-${index}`">
                {{ conflicto.descripcion }}
              </div>
            </v-alert>

            <div v-if="resultadoGA" class="result-summary mt-4">
              <div>
                <span class="summary-label">Fitness</span>
                <strong>{{ resultadoGA.mejorIndividuo.fitness.toFixed(0) }}</strong>
              </div>
              <div>
                <span class="summary-label">Generaciones</span>
                <strong>{{ resultadoGA.generaciones }}</strong>
              </div>
              <div>
                <span class="summary-label">Estado</span>
                <strong>{{ resultadoGA.mejorIndividuo.esValido ? 'Sin conflictos' : 'Con conflictos' }}</strong>
              </div>
            </div>

            <div class="ideal-table-shell mt-4">
              <table class="ideal-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Curso</th>
                    <th>Sección</th>
                    <th>Horario</th>
                    <th>Aula</th>
                    <th>Docente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in horarioIdealRows" :key="`${row.codigo}-${row.seccion}-${index}`">
                    <td class="ideal-td-code">{{ row.codigo }}</td>
                    <td class="ideal-td-curso">{{ row.curso }}</td>
                    <td class="ideal-td-sec">{{ row.seccion }}</td>
                    <td class="ideal-td-horario">{{ row.horario }}</td>
                    <td class="ideal-td-aula">{{ row.salon }}</td>
                    <td class="ideal-td-doc">{{ row.docente }}</td>
                  </tr>
                  <tr v-if="!horarioIdealRows.length">
                    <td colspan="6" class="ideal-empty">Todavía no has generado un horario ideal.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<style scoped>
/* ── Page shell ── */
.page-shell {
  min-height: 100vh;
  background: #0d1b2a;
  overflow-x: auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #80cbc4;
}

.page-title {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  line-height: 1.2;
  color: #ffffff;
  font-weight: 700;
}

.page-subtitle {
  max-width: 760px;
  color: #8ba7bc;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.student-pill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 16px;
  border: 1px solid #2d4155;
  border-radius: 16px;
  background: #162030;
  color: #e8f4fd;
}

.student-pill span {
  color: #80cbc4;
  font-size: 0.85rem;
}

.tabs-bar {
  border: 1px solid #2d4155;
  border-radius: 18px;
  overflow: hidden;
}

.content-stack {
  display: grid;
  gap: 20px;
}

.section-card {
  background: #162030;
  border: 1px solid #2d4155;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 0; /* evita que hijos rompan el layout de grid */
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.2rem;
  color: #e8f4fd;
  font-weight: 700;
}

.section-copy {
  color: #7a9cb5;
}

/* ── Tables (fondo claro, como pidió el usuario) ── */
.table-shell {
  border: 1px solid #2d4155;
  border-radius: 16px;
  overflow-x: auto;   /* scroll horizontal en pantallas pequeñas */
  overflow-y: hidden; /* mantiene el clip del border-radius */
}

.simple-table {
  color: #16202b;
}

:deep(.simple-table table) {
  background: #ffffff;
}

:deep(.simple-table th) {
  background: #eaf1f7;
  color: #17202b;
  font-weight: 700;
  border-bottom: 1px solid #cfdae5;
  white-space: nowrap;
}

:deep(.simple-table td) {
  color: #1f2a35;
  border-bottom: 1px solid #e4ecf3;
  vertical-align: top;
}

:deep(.simple-table tbody tr:nth-child(even)) {
  background: #f8fbfd;
}

.checkbox-col {
  width: 82px;
  text-align: center;
}

.row-selected {
  background: #cce3f9 !important;
}

.row-ultimo-intento td {
  background: #fff8e1 !important;
}

.row-agotado td {
  background: #fce4ec !important;
  opacity: 0.75;
}

/* ── Estado badges ── */
.estado-col {
  white-space: nowrap;
  vertical-align: middle;
}

.badge-ok,
.badge-advertencia,
.badge-agotado {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
}

.badge-ok {
  color: #1b5e20;
  background: #e8f5e9;
}

.badge-advertencia {
  color: #e65100;
  background: #fff3e0;
}

.badge-agotado {
  color: #b71c1c;
  background: #ffebee;
}

/* ── Items en alertas de repitencia ── */
.repitencia-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  padding: 3px 0;
}

.repitencia-badge-codigo {
  opacity: 0.65;
  font-size: 0.8rem;
}

.empty-cell {
  padding: 22px !important;
  text-align: center;
  color: #6d7b88;
}

.text-muted {
  color: #7b8895;
  font-style: italic;
  font-size: 0.85rem;
}

/* ── Horario publicado per-line (leg.) ── */
/* .horario-line ya no se usa; celdas reemplazadas por botón diálogo */

/* ── Filters ── */
.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-field {
  min-width: 260px;
  flex: 1;
}

.filter-toggle {
  align-self: center;
  flex-shrink: 0;
}

/* ── Zoom bar ── */
.zoom-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #2d4155;
  background: #0f1e2d;
  flex-wrap: wrap;
}

.zoom-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #80cbc4;
  min-width: 40px;
  text-align: center;
}

.zoom-tip {
  font-size: 0.72rem;
  color: #546e7a;
  margin-left: auto;
}

/* ── Diálogo entradas ── */
.dialog-entry-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #2d4155;
  color: #b2dfdb;
  font-size: 0.9rem;
}

.dialog-entry-item:last-child {
  border-bottom: none;
}

/* ── Schedule grid ── */
.schedule-shell {
  border: 1px solid #2d4155;
  border-radius: 16px;
  overflow: hidden;
}

.schedule-outer {
  width: 100%;
  overflow: auto;
  max-height: 72vh;
}

/* display:inline-block hace que el elemento reporte su ancho REAL
   (ya escalado por zoom) al contenedor overflow:auto, activando
   el scrollbar horizontal sin necesidad de width:max-content en el padre. */
.schedule-zoom-wrapper {
  display: inline-block;
}

.schedule-table {
  width: max-content;
  border-collapse: collapse;
  table-layout: fixed;
}

.hour-col,
.room-col {
  background: #1a2d3e;
  color: #80cbc4;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 14px;
  border-bottom: 2px solid #2d4155;
  border-right: 1px solid #2d4155;
  position: sticky;
  top: 0;
  z-index: 5;
}

.hour-col {
  min-width: 96px;
  max-width: 96px;
  position: sticky;
  left: 0;
  z-index: 10;
}

.room-col {
  min-width: 230px;
  text-align: center;
  white-space: nowrap;
}

.hour-cell {
  background: #1e3248;
  color: #b2dfdb;
  padding: 12px 8px;
  border-right: 2px solid #2d4155;
  border-bottom: 1px solid #2d4155;
  text-align: center;
  font-weight: 700;
  font-size: 0.82rem;
  position: sticky;
  left: 0;
  z-index: 3;
}

.hour-cell span {
  display: block;
  color: #546e7a;
  font-weight: 400;
}

.schedule-cell {
  padding: 8px;
  vertical-align: top;
  border-right: 1px solid #2d4155;
  border-bottom: 1px solid #2d4155;
  background: #0f1e2d;
  min-width: 230px;
}

/* ── Schedule entry card (estilo de imagen adjunta) ── */
.schedule-entry {
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 6px;
  border-left: 4px solid transparent;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.schedule-entry-class {
  background: #fff3e0;
  border-left-color: #f57c00;
}

.schedule-entry-lab {
  background: #e8f5e9;
  border-left-color: #388e3c;
}

.entry-title {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 6px;
  word-break: break-word;
}

.schedule-entry-class .entry-title {
  color: #e65100;
}

.schedule-entry-lab .entry-title {
  color: #1b5e20;
}

.entry-section-big {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
  color: #37474f;
  margin-bottom: 2px;
  letter-spacing: 1px;
  line-height: 1;
}

.entry-semestre {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.schedule-entry-class .entry-semestre {
  color: #f57c00;
}

.schedule-entry-lab .entry-semestre {
  color: #388e3c;
}

.entry-docente {
  font-size: 0.7rem;
  color: #37474f;
  line-height: 1.4;
  margin-bottom: 3px;
  word-break: break-word;
}

.entry-dia-text {
  font-size: 0.68rem;
  color: #607d8b;
  margin-bottom: 8px;
}

.entry-day-dots {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.entry-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.entry-dot-class {
  background: #f57c00;
}

.entry-dot-lab {
  background: #388e3c;
}

.schedule-empty {
  min-height: 60px;
  border: 1px dashed #2d4155;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}

/* ── Ideal schedule actions ── */
.ideal-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

/* ── Result summary ── */
.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.result-summary > div {
  padding: 14px;
  border-radius: 14px;
  background: #1e3248;
  border: 1px solid #2d4155;
  color: #e8f4fd;
}

.summary-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #80cbc4;
}

@media (max-width: 960px) {
  .section-card {
    padding: 16px;
  }

  .filter-field,
  .filter-type {
    min-width: 100%;
  }
}

/* ── Tabla nativa: Horario ideal ── */
.ideal-table-shell {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #2d4155;
  border-radius: 16px;
}

.ideal-table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
  background: #ffffff;
}

.ideal-table thead th {
  background: #eaf1f7;
  color: #17202b;
  font-weight: 700;
  padding: 11px 14px;
  border-bottom: 2px solid #cfdae5;
  white-space: nowrap;
  text-align: left;
}

.ideal-table tbody td {
  color: #1f2a35;
  padding: 10px 14px;
  border-bottom: 1px solid #e4ecf3;
  vertical-align: top;
}

.ideal-table tbody tr:nth-child(even) td {
  background: #f8fbfd;
}

.ideal-td-code  { width: 90px;  white-space: nowrap; }
.ideal-td-sec   { width: 80px;  white-space: nowrap; }
.ideal-td-aula  { width: 180px; white-space: nowrap; }
.ideal-td-horario { white-space: nowrap; }
.ideal-td-doc   { min-width: 180px; }
.ideal-td-curso { min-width: 200px; }

.ideal-empty {
  padding: 22px;
  text-align: center;
  color: #6d7b88;
}
</style>