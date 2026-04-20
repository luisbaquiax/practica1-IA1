<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { dashboardService } from '@/services/dashboard/dashboard.service'
import { authService } from '@/services/auth/auth.service'
import type { DashboardResponse } from '@/types'

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
const data = ref<DashboardResponse | null>(null)

// ===== UTILIDADES DE COLOR =====
function colorNotaVuetify(nota: number): string {
  if (nota >= 61) return 'green-darken-2'
  if (nota >= 50) return 'amber-darken-2'
  return 'red-darken-3'
}

function colorPctVuetify(pct: number): string {
  if (pct >= 70) return 'green-darken-2'
  if (pct >= 50) return 'amber-darken-2'
  return 'red-darken-3'
}

// ===== TABS Y FILTROS =====
const tabActiva = ref(0)
const filtroHistorial = ref<'todos' | 'ganados' | 'perdidos'>('todos')

const opcionesFiltro = [
  { label: 'Todos los cursos', value: 'todos'   },
  { label: 'Solo ganados',     value: 'ganados'  },
  { label: 'Solo perdidos',    value: 'perdidos' },
]

const tableHeaders = [
  { title: 'Código',   key: 'codigo',   sortable: true, width: '100px' },
  { title: 'Curso',     key: 'nombre',   sortable: true },
  { title: 'Semestre',  key: 'semestre', sortable: true, width: '140px' },
  { title: 'Nota',      key: 'nota',     sortable: true, width: '90px'  },
  { title: 'Estado',    key: 'aprobado', sortable: true, width: '120px' },
  { title: 'Fecha',     key: 'fecha',    sortable: true, width: '120px' },
]

const registrosFiltrados = computed(() => {
  if (!data.value) return []
  const rs = data.value.registrosHistorial
  if (filtroHistorial.value === 'ganados')  return rs.filter(r => r.aprobado)
  if (filtroHistorial.value === 'perdidos') return rs.filter(r => !r.aprobado)
  return rs
})

const topHeaders = [
  { title: '#',         key: 'rank',      sortable: false, width: '52px'  },
  { title: 'Curso',     key: 'nombre',    sortable: true  },
  { title: 'Intentos',  key: 'intentos',  sortable: true, width: '110px' },
  { title: 'Mejor nota',key: 'mejorNota', sortable: true, width: '120px' },
  { title: 'Estado',    key: 'ganado',    sortable: true, width: '110px' },
]

const topConRank = computed(() =>
  (data.value?.topCursosDificiles ?? []).map((c, i) => ({ ...c, rank: i + 1 }))
)

function rankColor(idx: number): string {
  if (idx === 0) return 'amber-darken-2'
  if (idx === 1) return 'grey-lighten-1'
  if (idx === 2) return 'amber-darken-4'
  return 'grey-darken-2'
}

// ===== CARGA =====
async function cargarDashboard() {
  const sesion = authService.getSession()
  if (!sesion) return

  loading.value = true
  data.value = null
  try {
    data.value = await dashboardService.getDashboardByCarnet(sesion.carnet)
    showSnackbar('Dashboard cargado correctamente', 'success')
  } catch (e: unknown) {
    showSnackbar(e instanceof Error ? e.message : 'Error al cargar el dashboard', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(cargarDashboard)
</script>

<template>
  <v-container fluid class="pa-6 page-bg">

    <!-- ===== SNACKBAR ===== -->
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
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center ga-3">
          <v-avatar color="teal-darken-3" size="48" rounded="lg">
            <v-icon icon="mdi-chart-bar" size="26" color="white" />
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold text-white">
              Rendimiento Académico
              <span v-if="data" class="text-teal-lighten-3 text-h6 font-weight-regular">
                — {{ data.carrera }}
              </span>
            </h1>
            <p class="text-caption text-teal-lighten-3 mb-0">
              Panel de control con métricas históricas del estudiante
            </p>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="auto" class="d-flex align-center justify-end">
        <v-btn
          color="teal-darken-3"
          variant="elevated"
          prepend-icon="mdi-refresh"
          rounded="lg"
          :loading="loading"
          @click="cargarDashboard"
        >
          Recargar
        </v-btn>
      </v-col>
    </v-row>

    <!-- ===== SKELETON ===== -->
    <template v-if="loading">
      <v-row class="mb-4">
        <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card" rounded="lg" color="grey-darken-3" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="8">
          <v-skeleton-loader type="card" rounded="lg" color="grey-darken-3" height="180" />
        </v-col>
        <v-col cols="12" md="4">
          <v-skeleton-loader type="card" rounded="lg" color="grey-darken-3" height="180" />
        </v-col>
      </v-row>
    </template>

    <!-- ===== CONTENIDO ===== -->
    <template v-if="!loading && data">

      <!-- ── FILA 1: Métricas principales ── -->
      <v-row class="mb-4">

        <!-- Promedio General -->
        <v-col cols="12" sm="6" md="3">
          <v-card rounded="lg" elevation="4" class="metric-card h-100">
            <v-card-text class="pa-5 d-flex flex-column align-center text-center">
              <v-progress-circular
                :model-value="data.promedioGeneral"
                :color="colorNotaVuetify(data.promedioGeneral)"
                size="90"
                width="9"
                bg-color="grey-darken-3"
              >
                <span class="text-h6 font-weight-bold text-white">
                  {{ data.promedioGeneral.toFixed(1) }}
                </span>
              </v-progress-circular>
              <p class="text-caption text-grey-lighten-1 mt-3 mb-1">Promedio General</p>
              <p class="text-caption text-grey-lighten-2 mb-0">
                Incluye cursos ganados y perdidos
              </p>
              <v-chip
                :color="colorNotaVuetify(data.promedioGeneral)"
                variant="tonal"
                size="x-small"
                class="mt-2"
              >
                {{ data.promedioGeneral >= 61 ? 'Aprobatorio' : 'Reprobatorio' }}
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Promedio Limpio -->
        <v-col cols="12" sm="6" md="3">
          <v-card rounded="lg" elevation="4" class="metric-card h-100">
            <v-card-text class="pa-5 d-flex flex-column align-center text-center">
              <v-progress-circular
                :model-value="data.promedioLimpio"
                :color="colorNotaVuetify(data.promedioLimpio)"
                size="90"
                width="9"
                bg-color="grey-darken-3"
              >
                <span class="text-h6 font-weight-bold text-white">
                  {{ data.promedioLimpio.toFixed(1) }}
                </span>
              </v-progress-circular>
              <p class="text-caption text-grey-lighten-1 mt-3 mb-1">Promedio Limpio</p>
              <p class="text-caption text-grey-lighten-2 mb-0">
                Solo cursos aprobados
              </p>
              <v-chip
                :color="colorNotaVuetify(data.promedioLimpio)"
                variant="tonal"
                size="x-small"
                class="mt-2"
              >
                {{ data.promedioLimpio >= 61 ? 'Aprobatorio' : 'Sin aprobados' }}
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- % Aprobación -->
        <v-col cols="12" sm="6" md="3">
          <v-card rounded="lg" elevation="4" class="metric-card h-100">
            <v-card-text class="pa-5 d-flex flex-column align-center text-center">
              <v-progress-circular
                :model-value="data.porcentajeAprobacion"
                :color="colorPctVuetify(data.porcentajeAprobacion)"
                size="90"
                width="9"
                bg-color="grey-darken-3"
              >
                <span class="text-h6 font-weight-bold text-white">
                  {{ data.porcentajeAprobacion }}%
                </span>
              </v-progress-circular>
              <p class="text-caption text-grey-lighten-1 mt-3 mb-1">Tasa de Aprobación</p>
              <p class="text-caption text-grey-lighten-2 mb-0">
                {{ data.cursosGanadosTotal }} ganados de {{ data.cursosCursadosTotal }} cursados
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- % Avance -->
        <v-col cols="12" sm="6" md="3">
          <v-card rounded="lg" elevation="4" class="metric-card h-100">
            <v-card-text class="pa-5 d-flex flex-column align-center text-center">
              <v-progress-circular
                :model-value="data.porcentajeAvance"
                color="blue-darken-3"
                size="90"
                width="9"
                bg-color="grey-darken-3"
              >
                <span class="text-h6 font-weight-bold text-white">
                  {{ data.porcentajeAvance }}%
                </span>
              </v-progress-circular>
              <p class="text-caption text-grey-lighten-1 mt-3 mb-1">Avance de Carrera</p>
              <p class="text-caption text-grey-lighten-2 mb-0">
                {{ data.creditosAcumulados }} / {{ data.totalCreditos }} créditos
              </p>
            </v-card-text>
          </v-card>
        </v-col>

      </v-row>

      <!-- ── FILA 2: Créditos y desglose semestral ── -->
      <v-row class="mb-4">

        <!-- Avance de créditos (barra grande) -->
        <v-col cols="12" md="8">
          <v-card rounded="lg" elevation="4" class="metric-card h-100">
            <v-card-text class="pa-5">
              <div class="d-flex align-center ga-2 mb-4">
                <v-icon color="blue-lighten-2" icon="mdi-school-outline" />
                <span class="text-subtitle-1 font-weight-bold text-white">Créditos Acumulados</span>
              </div>

              <v-progress-linear
                :model-value="data.porcentajeAvance"
                color="blue-darken-3"
                bg-color="grey-darken-3"
                height="28"
                rounded="lg"
                class="mb-3"
              >
                <span class="text-caption font-weight-bold text-white">
                  {{ data.porcentajeAvance }}%
                </span>
              </v-progress-linear>

              <v-row class="mt-2">
                <v-col cols="4" class="text-center">
                  <div class="text-h5 font-weight-bold text-blue-lighten-2">
                    {{ data.creditosAcumulados }}
                  </div>
                  <div class="text-caption text-grey-lighten-1">Acumulados</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-h5 font-weight-bold text-red-lighten-2">
                    {{ data.creditosFaltantes }}
                  </div>
                  <div class="text-caption text-grey-lighten-1">Faltantes</div>
                </v-col>
                <v-col cols="4" class="text-center">
                  <div class="text-h5 font-weight-bold text-grey-lighten-1">
                    {{ data.totalCreditos }}
                  </div>
                  <div class="text-caption text-grey-lighten-1">Total pensum</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Último Semestre -->
        <v-col cols="12" md="4">
          <v-card rounded="lg" elevation="4" class="metric-card h-100">
            <v-card-text class="pa-5">
              <div class="d-flex align-center ga-2 mb-3">
                <v-icon color="teal-lighten-2" icon="mdi-calendar-clock" />
                <span class="text-subtitle-1 font-weight-bold text-white">Semestre más avanzado</span>
              </div>

              <v-chip
                color="teal-darken-3"
                variant="tonal"
                size="small"
                prepend-icon="mdi-school"
                class="mb-4"
              >
                {{ data.ultimoSemestre ?? 'Sin registro' }}
              </v-chip>

              <div class="d-flex justify-space-around mt-2">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-green-lighten-2">
                    {{ data.cursosGanadosUltimoSemestre }}
                  </div>
                  <div class="d-flex align-center ga-1 justify-center mt-1">
                    <v-icon color="green-lighten-2" size="14" icon="mdi-check-circle" />
                    <span class="text-caption text-grey-lighten-1">Ganados</span>
                  </div>
                </div>
                <v-divider vertical class="mx-2 border-opacity-30" />
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-red-lighten-2">
                    {{ data.cursosPerdidosUltimoSemestre }}
                  </div>
                  <div class="d-flex align-center ga-1 justify-center mt-1">
                    <v-icon color="red-lighten-2" size="14" icon="mdi-close-circle" />
                    <span class="text-caption text-grey-lighten-1">Perdidos</span>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

      </v-row>

      <!-- ── FILA 3: Histórico total de cursos ── -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card rounded="lg" elevation="4" class="metric-card">
            <v-card-text class="pa-5">
              <div class="d-flex align-center ga-2 mb-4">
                <v-icon color="amber-lighten-2" icon="mdi-history" />
                <span class="text-subtitle-1 font-weight-bold text-white">Histórico Total de Cursos</span>
              </div>

              <v-row>
                <!-- Ganados -->
                <v-col cols="12" sm="4" class="d-flex align-center ga-3">
                  <v-avatar color="green-darken-2" size="44" rounded="lg">
                    <v-icon icon="mdi-check-bold" color="white" />
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold text-green-lighten-2">
                      {{ data.cursosGanadosTotal }}
                    </div>
                    <div class="text-caption text-grey-lighten-1">Cursos ganados</div>
                  </div>
                </v-col>

                <!-- Perdidos (nunca aprobados) -->
                <v-col cols="12" sm="4" class="d-flex align-center ga-3">
                  <v-avatar color="red-darken-3" size="44" rounded="lg">
                    <v-icon icon="mdi-close-thick" color="white" />
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold text-red-lighten-2">
                      {{ data.cursosPerdidosTotal }}
                    </div>
                    <div class="text-caption text-grey-lighten-1">Cursos aún no aprobados</div>
                  </div>
                </v-col>

                <!-- Total cursados -->
                <v-col cols="12" sm="4" class="d-flex align-center ga-3">
                  <v-avatar color="blue-darken-3" size="44" rounded="lg">
                    <v-icon icon="mdi-book-open-variant" color="white" />
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold text-blue-lighten-2">
                      {{ data.cursosCursadosTotal }}
                    </div>
                    <div class="text-caption text-grey-lighten-1">Cursos distintos cursados</div>
                  </div>
                </v-col>
              </v-row>

              <!-- Barra ganados vs perdidos -->
              <div class="mt-4">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption text-green-lighten-2">Ganados {{ data.cursosGanadosTotal }}</span>
                  <span class="text-caption text-red-lighten-2">No aprobados {{ data.cursosPerdidosTotal }}</span>
                </div>
                <v-progress-linear
                  :model-value="data.cursosCursadosTotal > 0 ? (data.cursosGanadosTotal / data.cursosCursadosTotal) * 100 : 0"
                  color="green-darken-2"
                  bg-color="red-darken-3"
                  height="16"
                  rounded="lg"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- ── FILA 4: Tabs — Top Difíciles + Tabla Histórica ── -->
      <v-row>
        <v-col cols="12">
          <v-card rounded="lg" elevation="4" class="metric-card">

            <v-tabs
              v-model="tabActiva"
              bg-color="transparent"
              color="orange-lighten-2"
              slider-color="orange-lighten-2"
            >
              <v-tab :value="0" prepend-icon="mdi-fire">Top Cursos Difíciles</v-tab>
              <v-tab :value="1" prepend-icon="mdi-table">Detalle Histórico</v-tab>
            </v-tabs>

            <v-divider class="border-opacity-20" />

            <v-tabs-window v-model="tabActiva">

              <!-- ─── TAB 0: Top Cursos Difíciles ─── -->
              <v-tabs-window-item :value="0">
                <v-card-text class="pa-4">

                  <div v-if="data.topCursosDificiles.length === 0" class="text-center py-8">
                    <v-icon color="grey-darken-1" icon="mdi-database-off" size="48" />
                    <p class="text-caption text-grey mt-2">Sin historial registrado</p>
                  </div>

                  <v-data-table
                    v-else
                    :headers="topHeaders"
                    :items="topConRank"
                    density="compact"
                    :items-per-page="-1"
                    hide-default-footer
                    class="historial-table rounded-lg"
                    item-value="codigo"
                  >
                    <template #[`item.rank`]="{ item }">
                      <v-avatar :color="rankColor(item.rank - 1)" size="24" rounded="sm">
                        <span style="font-size:10px; font-weight:700">{{ item.rank }}</span>
                      </v-avatar>
                    </template>

                    <template #[`item.intentos`]="{ item }">
                      <v-chip color="grey-darken-1" variant="tonal" size="x-small">
                        {{ item.intentos }}
                      </v-chip>
                    </template>

                    <template #[`item.mejorNota`]="{ item }">
                      <v-chip :color="colorNotaVuetify(item.mejorNota)" variant="tonal" size="x-small" class="font-weight-bold">
                        {{ item.mejorNota }}
                      </v-chip>
                    </template>

                    <template #[`item.ganado`]="{ item }">
                      <v-chip
                        :color="item.ganado ? 'green-darken-2' : 'red-darken-3'"
                        variant="tonal"
                        size="x-small"
                        :prepend-icon="item.ganado ? 'mdi-check' : 'mdi-close'"
                      >
                        {{ item.ganado ? 'Ganado' : 'Pendiente' }}
                      </v-chip>
                    </template>
                  </v-data-table>

                </v-card-text>
              </v-tabs-window-item>

              <!-- ─── TAB 1: Tabla Histórica ─── -->
              <v-tabs-window-item :value="1">
                <v-card-text class="pa-5">

                  <!-- Filtro -->
                  <v-row align="center" class="mb-4">
                    <v-col cols="12" sm="4" md="3">
                      <v-select
                        v-model="filtroHistorial"
                        :items="opcionesFiltro"
                        item-title="label"
                        item-value="value"
                        label="Mostrar"
                        density="compact"
                        rounded="lg"
                        variant="outlined"
                        hide-details
                        prepend-inner-icon="mdi-filter-variant"
                        bg-color="grey-darken-4"
                        color="blue-lighten-2"
                      />
                    </v-col>
                    <v-spacer />
                    <v-col cols="12" sm="auto">
                      <v-chip color="blue-darken-3" variant="tonal" size="small" prepend-icon="mdi-format-list-bulleted">
                        {{ registrosFiltrados.length }} registros
                      </v-chip>
                    </v-col>
                  </v-row>

                  <!-- Tabla -->
                  <v-data-table
                    :headers="tableHeaders"
                    :items="registrosFiltrados"
                    density="compact"
                    :items-per-page="15"
                    class="historial-table rounded-lg"
                    item-value="id"
                    hover
                  >
                    <template #[`item.semestre`]="{ item }">
                      <v-chip
                        :color="item.semestre === 'TRUE' ? 'blue-darken-3' : 'deep-purple-darken-2'"
                        variant="tonal"
                        size="x-small"
                        :prepend-icon="item.semestre === 'TRUE' ? 'mdi-calendar-month' : 'mdi-weather-sunny'"
                      >
                        {{ item.semestre === 'TRUE' ? 'SEMESTRE' : 'VACACIONES' }}
                      </v-chip>
                    </template>

                    <template #[`item.nota`]="{ item }">
                      <v-chip
                        :color="colorNotaVuetify(item.nota)"
                        variant="tonal"
                        size="x-small"
                        class="font-weight-bold"
                      >
                        {{ item.nota }}
                      </v-chip>
                    </template>

                    <template #[`item.aprobado`]="{ item }">
                      <v-chip
                        :color="item.aprobado ? 'green-darken-2' : 'red-darken-3'"
                        variant="tonal"
                        size="x-small"
                        :prepend-icon="item.aprobado ? 'mdi-check' : 'mdi-close'"
                      >
                        {{ item.aprobado ? 'Ganado' : 'Perdido' }}
                      </v-chip>
                    </template>

                    <template #[`item.fecha`]="{ item }">
                      <span class="text-caption">{{ item.fecha }}</span>
                    </template>

                    <template #no-data>
                      <div class="text-center py-6">
                        <v-icon color="grey-darken-1" icon="mdi-database-off" size="40" />
                        <p class="text-caption text-grey mt-2">Sin registros</p>
                      </div>
                    </template>
                  </v-data-table>

                </v-card-text>
              </v-tabs-window-item>

            </v-tabs-window>
          </v-card>
        </v-col>
      </v-row>

    </template>

    <!-- ===== ESTADO VACÍO ===== -->
    <template v-if="!loading && !data">
      <v-row justify="center" class="mt-10">
        <v-col cols="12" sm="6" class="text-center">
          <v-icon color="grey-darken-1" icon="mdi-chart-bar-stacked" size="64" />
          <h2 class="text-h6 text-grey-lighten-1 mt-3">Sin datos disponibles</h2>
          <p class="text-caption text-grey">No se pudo cargar el dashboard académico</p>
          <v-btn
            color="teal-darken-3"
            variant="elevated"
            prepend-icon="mdi-refresh"
            class="mt-3"
            @click="cargarDashboard"
          >
            Intentar de nuevo
          </v-btn>
        </v-col>
      </v-row>
    </template>

  </v-container>
</template>

<style scoped>
.metric-card {
  background-color: #1e1e2e !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Tabla historial — tema oscuro */
.historial-table {
  background-color: transparent !important;
}
.historial-table :deep(thead tr th) {
  background-color: #12121e !important;
  color: rgba(255, 255, 255, 0.65) !important;
  font-size: 0.72rem !important;
  letter-spacing: 0.04em;
}
.historial-table :deep(tbody tr td) {
  color: rgba(255, 255, 255, 0.87) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}
.historial-table :deep(tbody tr:hover td) {
  background-color: rgba(255, 255, 255, 0.03) !important;
}
.historial-table :deep(.v-data-table-footer) {
  background-color: #12121e !important;
  color: rgba(255, 255, 255, 0.6) !important;
}
</style>
