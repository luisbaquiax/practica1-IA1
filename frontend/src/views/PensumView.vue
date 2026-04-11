<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { pensumService } from '@/services/pensum/pensum.service'
import { authService } from '@/services/auth/auth.service'
import type { PensumResponse, EstadoCurso } from '@/types'

// ===== SNACKBAR =====
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error' | 'info' | 'warning'>('info')

function showSnackbar(msg: string, color: 'success' | 'error' | 'info' | 'warning' = 'info') {
  snackbarMessage.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

// ===== ESTADO =====
const loading = ref(false)
const pensum = ref<PensumResponse | null>(null)

// ===== COMPUTADOS =====
const semestres = computed(() => {
  if (!pensum.value) return []
  const max = Math.max(...pensum.value.cursos.map(c => c.semestre), 0)
  return Array.from({ length: max }, (_, i) => i + 1)
})

const totalCreditos = computed(() => {
  if (!pensum.value) return 0
  return pensum.value.cursos.reduce((s, c) => s + c.creditos, 0)
})

const conteoEstados = computed(() => {
  if (!pensum.value) return { GANADO: 0, DISPONIBLE: 0, BLOQUEADO: 0 }
  return pensum.value.cursos.reduce(
    (acc, c) => { acc[c.estado]++; return acc },
    { GANADO: 0, DISPONIBLE: 0, BLOQUEADO: 0 } as Record<EstadoCurso, number>,
  )
})

function cursosDelSemestre(sem: number) {
  if (!pensum.value) return []
  return pensum.value.cursos.filter(c => c.semestre === sem)
}

function nombrePrerequisito(codigo: number): string {
  return pensum.value?.cursos.find(c => c.codigo === codigo)?.nombre ?? `Cód. ${codigo}`
}

// ===== ESTILOS DINÁMICOS =====
const estadoConfig: Record<EstadoCurso, {
  darkBg: string; lightBg: string
  darkText: string; lightText: string
  border: string; chip: string; label: string
}> = {
  GANADO:     { darkBg: '#2E7D32', lightBg: '#C8E6C9', darkText: '#fff', lightText: '#1B5E20', border: '#1B5E20', chip: 'green-darken-2',  label: 'Ganado'     },
  DISPONIBLE: { darkBg: '#1565C0', lightBg: '#BBDEFB', darkText: '#fff', lightText: '#0D47A1', border: '#0D47A1', chip: 'blue-darken-3',   label: 'Disponible' },
  BLOQUEADO:  { darkBg: '#C62828', lightBg: '#FFCDD2', darkText: '#fff', lightText: '#B71C1C', border: '#B71C1C', chip: 'red-darken-3',    label: 'Bloqueado'  },
}

function cfgEstado(estado: EstadoCurso) {
  return estadoConfig[estado] ?? estadoConfig.BLOQUEADO
}

function estiloTarjeta(estado: EstadoCurso) {
  const c = cfgEstado(estado)
  return { border: `2px solid ${c.border}`, borderRadius: '8px', overflow: 'hidden' }
}

function estiloDark(estado: EstadoCurso) {
  const c = cfgEstado(estado)
  return { backgroundColor: c.darkBg, color: c.darkText }
}

function estiloLight(estado: EstadoCurso) {
  const c = cfgEstado(estado)
  return { backgroundColor: c.lightBg, color: c.lightText }
}

// ===== CARGA =====
async function cargarPensum() {
  const sesion = authService.getSession()
  if (!sesion) return

  loading.value = true
  pensum.value = null
  try {
    pensum.value = await pensumService.getPensumByCarnet(sesion.carnet)
    showSnackbar(`Pensum de ${pensum.value.carrera} cargado`, 'success')
  } catch (e: any) {
    showSnackbar(e?.message ?? 'Error al cargar el pensum', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(cargarPensum)
</script>

<template>
  <v-container fluid class="pa-6 page-bg">

    <!-- ===== SNACKBAR (centrado) ===== -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top"
      rounded="lg"
      :timeout="3500"
      elevation="4"
      min-width="320"
    >
      <div class="d-flex align-center ga-2">
        <v-icon
          :icon="
            snackbarColor === 'success' ? 'mdi-check-circle' :
            snackbarColor === 'error'   ? 'mdi-alert-circle' :
            snackbarColor === 'warning' ? 'mdi-alert'        : 'mdi-information'
          "
        />
        {{ snackbarMessage }}
      </div>
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
      </template>
    </v-snackbar>

    <!-- ===== HEADER ===== -->
    <v-row align="center" class="mb-5">
      <v-col>
        <div class="d-flex align-center ga-3">
          <v-avatar color="blue-darken-4" size="48" rounded="lg">
            <v-icon icon="mdi-school" size="26" color="white" />
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold text-white">
              Pensum Académico
              <span v-if="pensum" class="text-blue-lighten-3 text-h6 font-weight-regular">
                — {{ pensum.carrera }}
              </span>
            </h1>
            <p class="text-caption text-blue-lighten-3 mb-0">
              Visualización del plan de estudios por semestre
            </p>
          </div>
        </div>
      </v-col>

      <!-- Botón recargar -->
      <v-col cols="12" sm="auto" class="d-flex flex-wrap ga-2 align-center justify-end">
        <v-btn
          color="blue-darken-4"
          variant="elevated"
          prepend-icon="mdi-refresh"
          rounded="lg"
          :loading="loading"
          @click="cargarPensum"
        >
          Recargar
        </v-btn>
      </v-col>
    </v-row>

    <!-- ===== LEYENDA + ESTADÍSTICAS ===== -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" class="d-flex flex-wrap ga-3 align-center">
        <!-- Leyenda estados -->
        <div class="d-flex align-center ga-2">
          <div class="leyenda-dot" style="background:#2E7D32" />
          <span class="text-caption text-white font-weight-medium">Ganado</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="leyenda-dot" style="background:#1565C0" />
          <span class="text-caption text-white font-weight-medium">Disponible</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="leyenda-dot" style="background:#C62828" />
          <span class="text-caption text-white font-weight-medium">Bloqueado</span>
        </div>

        <v-divider vertical class="mx-1 border-opacity-50" />

        <!-- Chips de conteo -->
        <v-chip v-if="pensum" color="green-darken-2" variant="tonal" size="small" prepend-icon="mdi-check-circle">
          {{ conteoEstados.GANADO }} ganados
        </v-chip>
        <v-chip v-if="pensum" color="blue-darken-3" variant="tonal" size="small" prepend-icon="mdi-circle-outline">
          {{ conteoEstados.DISPONIBLE }} disponibles
        </v-chip>
        <v-chip v-if="pensum" color="red-darken-3" variant="tonal" size="small" prepend-icon="mdi-lock">
          {{ conteoEstados.BLOQUEADO }} bloqueados
        </v-chip>

        <v-spacer />

        <v-chip v-if="pensum" color="white" variant="tonal" size="small" prepend-icon="mdi-school">
          {{ pensum.cursos.length }} cursos · {{ totalCreditos }} créditos totales
        </v-chip>

        <!-- Leyenda obligatorio -->
        <v-chip color="white" variant="tonal" size="small">
          <span class="mr-1 text-body-1">●</span> Obligatorio
        </v-chip>
      </v-col>
    </v-row>

    <!-- ===== LOADING ===== -->
    <div v-if="loading" class="d-flex justify-center align-center py-16">
      <div class="text-center">
        <v-progress-circular indeterminate color="blue-lighten-3" size="56" width="4" />
        <p class="text-body-2 text-blue-lighten-3 mt-4">Cargando pensum...</p>
      </div>
    </div>

    <!-- ===== GRID DEL PENSUM ===== -->
    <div v-else-if="pensum" class="pensum-scroll-wrapper">
      <div class="pensum-grid">

        <!-- Columna por semestre -->
        <div
          v-for="sem in semestres"
          :key="sem"
          class="semestre-col"
        >
          <!-- Header del semestre -->
          <div class="semestre-header">
            <span class="sem-label">Semestre</span>
            <span class="sem-num">{{ sem }}</span>
            <span class="sem-count text-caption">{{ cursosDelSemestre(sem).length }} cursos</span>
          </div>

          <!-- Tarjetas de cursos -->
          <div class="cursos-lista">
            <v-tooltip
              v-for="curso in cursosDelSemestre(sem)"
              :key="curso.codigo"
              location="bottom"
              max-width="340"
            >
              <!-- Trigger: la tarjeta -->
              <template #activator="{ props }">
                <div
                  v-bind="props"
                  class="curso-card"
                  :style="estiloTarjeta(curso.estado)"
                >
                  <!-- Izquierda: código + créditos -->
                  <div class="card-left" :style="estiloDark(curso.estado)">
                    <span class="card-codigo">{{ curso.codigo }}</span>
                    <v-divider class="my-1" :style="{ borderColor: 'rgba(255,255,255,0.3)' }" />
                    <span class="card-creditos">{{ curso.creditos }}</span>
                  </div>

                  <!-- Centro: nombre -->
                  <div class="card-center" :style="estiloLight(curso.estado)">
                    <span class="card-nombre">{{ curso.nombre }}</span>
                  </div>

                  <!-- Derecha: obligatorio + prerequisitos -->
                  <div class="card-right" :style="estiloDark(curso.estado)">
                    <span v-if="curso.obligatorio" class="card-bullet" title="Obligatorio">●</span>
                    <div class="card-prereqs">
                      <span
                        v-for="pre in curso.prerequisitos"
                        :key="pre"
                        class="prereq-code"
                      >{{ pre }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Contenido del tooltip -->
              <div class="tooltip-content">
                <div class="font-weight-bold mb-1">{{ curso.nombre }}</div>
                <div class="text-caption mb-1">
                  Código: <strong>{{ curso.codigo }}</strong> ·
                  Créditos: <strong>{{ curso.creditos }}</strong> ·
                  Semestre: <strong>{{ curso.semestre }}</strong>
                </div>
                <div class="text-caption mb-1">
                  <v-chip
                    :color="cfgEstado(curso.estado).chip"
                    size="x-small"
                    variant="tonal"
                  >{{ cfgEstado(curso.estado).label }}</v-chip>
                  &nbsp;
                  <v-chip
                    :color="curso.obligatorio ? 'orange-darken-2' : 'grey'"
                    size="x-small"
                    variant="tonal"
                  >{{ curso.obligatorio ? 'Obligatorio' : 'Optativo' }}</v-chip>
                </div>
                <div v-if="curso.prerequisitos.length" class="text-caption mt-2">
                  <div class="font-weight-medium mb-1">Prerequisitos:</div>
                  <div
                    v-for="pre in curso.prerequisitos"
                    :key="pre"
                    class="d-flex align-center ga-1 mb-1"
                  >
                    <v-icon size="10" color="white">mdi-arrow-right</v-icon>
                    <span>{{ pre }} – {{ nombrePrerequisito(pre) }}</span>
                  </div>
                </div>
                <div v-else class="text-caption text-disabled mt-1">Sin prerequisitos</div>
              </div>
            </v-tooltip>
          </div>
        </div>

      </div>
    </div>

    <!-- ===== EMPTY STATE ===== -->
    <div v-else class="d-flex justify-center align-center py-16">
      <div class="text-center">
        <v-icon size="72" color="blue-lighten-4">mdi-book-off-outline</v-icon>
        <p class="text-h6 text-blue-lighten-3 mt-4 mb-1">Sin datos de pensum</p>
        <p class="text-body-2 text-disabled mb-4">Selecciona una carrera y presiona Cargar</p>
        <v-btn color="blue-darken-4" variant="elevated" prepend-icon="mdi-refresh" rounded="lg" @click="cargarPensum">
          Cargar Pensum
        </v-btn>
      </div>
    </div>

  </v-container>
</template>

<style scoped>
/* ===== FONDO DE PÁGINA ===== */
.page-bg {
  min-height: 100vh;
  background-color: #1e2c3e;
}

/* ===== LEYENDA ===== */
.leyenda-dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ===== SCROLL WRAPPER ===== */
.pensum-scroll-wrapper {
  overflow-x: auto;
  padding-bottom: 12px;
}

/* ===== GRID: fila de columnas ===== */
.pensum-grid {
  display: flex;
  flex-direction: row;
  gap: 10px;
  min-width: max-content;
  align-items: flex-start;
}

/* ===== COLUMNA DE SEMESTRE ===== */
.semestre-col {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Header del semestre */
.semestre-header {
  background-color: #1a2e42;
  border: 2px solid #3a5068;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #90caf9;
}

.sem-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
}

.sem-num {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  color: #e3f2fd;
}

.sem-count {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 1px;
}

/* ===== LISTA DE CURSOS ===== */
.cursos-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ===== TARJETA DE CURSO ===== */
.curso-card {
  display: flex;
  flex-direction: row;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  min-height: 62px;
}

.curso-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35) !important;
}

/* Sección izquierda: código y créditos */
.card-left {
  width: 44px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  border-right: 2px solid rgba(0, 0, 0, 0.25);
  gap: 2px;
}

.card-codigo {
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  word-break: break-all;
}

.card-creditos {
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}

/* Sección centro: nombre */
.card-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  min-width: 0;
}

.card-nombre {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  line-height: 1.35;
  word-break: break-word;
  hyphens: auto;
}

/* Sección derecha: obligatorio + prereqs */
.card-right {
  width: 46px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 5px 3px;
  border-left: 2px solid rgba(0, 0, 0, 0.25);
  gap: 3px;
  overflow: hidden;
}

.card-bullet {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.card-prereqs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  overflow: hidden;
  width: 100%;
}

.prereq-code {
  font-size: 8px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  opacity: 0.9;
  word-break: break-all;
}

/* ===== TOOLTIP ===== */
.tooltip-content {
  background-color: #212121; /* gris oscuro */
  color: white;              /* texto claro */
  padding: 8px;
  border-radius: 4px;
}
</style>
