<script setup lang="ts">
import { ref } from 'vue'
import { cargaDatosService } from '@/services/cargaDatos/cargaDatos.service'
import type { ImportPensumResult, ImportExtrasResult } from '@/types'

// ===== SNACKBAR =====
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error' | 'info' | 'warning'>('info')

function showSnackbar(message: string, color: 'success' | 'error' | 'info' | 'warning' = 'info') {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// ===== ESTADO - PENSUM & PREREQUISITO =====
const pensumFile = ref<File | null>(null)
const prerequisitoFile = ref<File | null>(null)
const loadingPensum = ref(false)
const pensumListo = ref(false)
const importResultPensum = ref<ImportPensumResult | null>(null)

// ===== ESTADO - EXTRAS =====
const estudianteFile = ref<File | null>(null)
const historialFile = ref<File | null>(null)
const informacionContactoFile = ref<File | null>(null)
const loadingExtras = ref(false)
const extrasListo = ref(false)
const importResultExtras = ref<ImportExtrasResult | null>(null)

// ===== MÉTODOS - PENSUM & PREREQUISITO =====
async function cargarPensumPrerequisito() {
  if (!pensumFile.value || !prerequisitoFile.value) {
    showSnackbar('Debes seleccionar ambos archivos: Pensum y Prerequisito', 'warning')
    return
  }
  loadingPensum.value = true
  try {
    const result = await cargaDatosService.importarPensumPrerequisito(
      pensumFile.value,
      prerequisitoFile.value,
    )
    importResultPensum.value = result
    pensumListo.value = true
    pensumFile.value = null
    prerequisitoFile.value = null
    showSnackbar(`Importación completada: ${result.cursosCreados} cursos creados`, 'success')
  } catch (e: any) {
    showSnackbar(e.message ?? 'Error al cargar Pensum y Prerequisito', 'error')
    console.error(e)
  } finally {
    loadingPensum.value = false
  }
}

// ===== MÉTODOS - EXTRAS =====
async function cargarExtras() {
  if (!estudianteFile.value || !historialFile.value || !informacionContactoFile.value) {
    showSnackbar('Debes seleccionar los tres archivos: Estudiante, Historial e Información de Contacto', 'warning')
    return
  }
  loadingExtras.value = true
  try {
    const result = await cargaDatosService.importarExtras(
      estudianteFile.value,
      historialFile.value,
      informacionContactoFile.value,
    )
    importResultExtras.value = result
    extrasListo.value = true
    estudianteFile.value = null
    historialFile.value = null
    informacionContactoFile.value = null
    showSnackbar(`Importación completada: ${result.estudiantesCreados} estudiantes creados`, 'success')
  } catch (e: any) {
    showSnackbar(e.message ?? 'Error al cargar los datos de estudiantes', 'error')
    console.error(e)
  } finally {
    loadingExtras.value = false
  }
}

function resetPensum() {
  pensumFile.value = null
  prerequisitoFile.value = null
  pensumListo.value = false
  importResultPensum.value = null
}

function resetExtras() {
  estudianteFile.value = null
  historialFile.value = null
  informacionContactoFile.value = null
  extrasListo.value = false
  importResultExtras.value = null
}
</script>

<template>
  <v-container fluid class="pa-6 page-bg">

    <!-- ===== SNACKBAR GLOBAL (centrado) ===== -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top"
      rounded="lg"
      :timeout="4000"
      elevation="4"
      min-width="340"
    >
      <div class="d-flex align-center ga-2">
        <v-icon
          :icon="
            snackbarColor === 'success' ? 'mdi-check-circle' :
            snackbarColor === 'error'   ? 'mdi-alert-circle' :
            snackbarColor === 'warning' ? 'mdi-alert'        :
            'mdi-information'
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
          <v-avatar color="blue-darken-4" size="48" rounded="lg">
            <v-icon icon="mdi-database-import" size="26" color="white" />
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold text-white">Carga de Datos</h1>
            <p class="text-caption text-blue-lighten-3 mb-0">
              Importa los archivos CSV para inicializar el sistema
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>

      <!-- ===== CARD: PENSUM & PREREQUISITO ===== -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" border class="card-table h-100">

          <!-- Cabecera de la card -->
          <v-card-title class="d-flex align-center ga-3 pt-5 px-6">
            <v-avatar color="blue-darken-4" size="40" rounded="lg">
              <v-icon icon="mdi-book-education" color="white" size="20" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Pensum & Prerequisito</div>
              <div class="text-caption text-custom-black font-weight-regular">
                Ambos archivos son obligatorios y se envían juntos
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="pensumListo"
              color="green-darken-2"
              variant="tonal"
              size="small"
              prepend-icon="mdi-check-circle"
            >
              Cargado
            </v-chip>
          </v-card-title>

          <v-divider class="mx-6" />

          <v-card-text class="px-6 pt-5 pb-2">

            <!-- Alerta informativa -->
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              rounded="lg"
              icon="mdi-information-outline"
              class="mb-5"
            >
              Debes seleccionar <strong>los dos archivos</strong> antes de cargar.
              El archivo de <em>Pensum</em> y el de <em>Prerequisito</em> se envían en el mismo request.
            </v-alert>

            <!-- Input: Pensum -->
            <div class="mb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
              Archivo de Pensum
            </div>
            <v-file-input
              v-model="pensumFile"
              label="pensum_*.csv"
              accept=".csv"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-file-delimited"
              show-size
              rounded="lg"
              color="blue-darken-4"
              density="comfortable"
              :hint="pensumFile ? '' : 'Ej: pensum_sistemas.csv'"
              persistent-hint
              class="mb-3"
            >
              <template #append-inner>
                <v-icon
                  v-if="pensumFile"
                  color="green-darken-2"
                  icon="mdi-check-circle"
                />
              </template>
            </v-file-input>

            <!-- Input: Prerequisito -->
            <div class="mb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
              Archivo de Prerequisito
            </div>
            <v-file-input
              v-model="prerequisitoFile"
              label="prre_*.csv"
              accept=".csv"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-file-delimited"
              show-size
              rounded="lg"
              color="blue-darken-4"
              density="comfortable"
              :hint="prerequisitoFile ? '' : 'Ej: prre_sistemas.csv'"
              persistent-hint
            >
              <template #append-inner>
                <v-icon
                  v-if="prerequisitoFile"
                  color="green-darken-2"
                  icon="mdi-check-circle"
                />
              </template>
            </v-file-input>

            <!-- Indicador de progreso de selección -->
            <div class="d-flex align-center ga-2 mt-4 mb-2">
              <v-chip
                :color="pensumFile ? 'green-darken-2' : 'grey'"
                :variant="pensumFile ? 'tonal' : 'outlined'"
                size="small"
                :prepend-icon="pensumFile ? 'mdi-check' : 'mdi-minus'"
              >
                Pensum
              </v-chip>
              <v-chip
                :color="prerequisitoFile ? 'green-darken-2' : 'grey'"
                :variant="prerequisitoFile ? 'tonal' : 'outlined'"
                size="small"
                :prepend-icon="prerequisitoFile ? 'mdi-check' : 'mdi-minus'"
              >
                Prerequisito
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions class="px-6 pb-5 pt-2">
            <v-btn
              v-if="pensumListo"
              variant="text"
              color="grey-darken-1"
              rounded="lg"
              prepend-icon="mdi-refresh"
              @click="resetPensum"
            >
              Cargar de nuevo
            </v-btn>
            <v-spacer />
            <v-btn
              color="blue-darken-4"
              variant="elevated"
              :loading="loadingPensum"
              :disabled="!pensumFile || !prerequisitoFile"
              rounded="lg"
              prepend-icon="mdi-upload"
              @click="cargarPensumPrerequisito"
            >
              Cargar CSV
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- ===== CARD: EXTRAS ===== -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" border class="card-table h-100">

          <!-- Cabecera de la card -->
          <v-card-title class="d-flex align-center ga-3 pt-5 px-6">
            <v-avatar color="teal-darken-2" size="40" rounded="lg">
              <v-icon icon="mdi-account-group" color="white" size="20" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Datos de Estudiantes</div>
              <div class="text-caption text-custom-black font-weight-regular">
                Los tres archivos son obligatorios y se envían juntos
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="extrasListo"
              color="green-darken-2"
              variant="tonal"
              size="small"
              prepend-icon="mdi-check-circle"
            >
              Cargado
            </v-chip>
          </v-card-title>

          <v-divider class="mx-6" />

          <v-card-text class="px-6 pt-5 pb-2">

            <!-- Alerta informativa -->
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              rounded="lg"
              icon="mdi-information-outline"
              class="mb-5"
            >
              Debes seleccionar <strong>los tres archivos</strong> antes de cargar.
              Se envían todos en el mismo request.
            </v-alert>

            <!-- Input: Estudiante -->
            <div class="mb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
              Archivo de Estudiantes
            </div>
            <v-file-input
              v-model="estudianteFile"
              label="estudiante.csv"
              accept=".csv"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-account"
              show-size
              rounded="lg"
              color="teal-darken-2"
              density="comfortable"
              :hint="estudianteFile ? '' : 'Ej: estudiante.csv'"
              persistent-hint
              class="mb-3"
            >
              <template #append-inner>
                <v-icon v-if="estudianteFile" color="green-darken-2" icon="mdi-check-circle" />
              </template>
            </v-file-input>

            <!-- Input: Historial -->
            <div class="mb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
              Archivo de Historial Académico
            </div>
            <v-file-input
              v-model="historialFile"
              label="historial.csv"
              accept=".csv"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-history"
              show-size
              rounded="lg"
              color="teal-darken-2"
              density="comfortable"
              :hint="historialFile ? '' : 'Ej: historial.csv'"
              persistent-hint
              class="mb-3"
            >
              <template #append-inner>
                <v-icon v-if="historialFile" color="green-darken-2" icon="mdi-check-circle" />
              </template>
            </v-file-input>

            <!-- Input: Información de Contacto -->
            <div class="mb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
              Archivo de Información de Contacto
            </div>
            <v-file-input
              v-model="informacionContactoFile"
              label="informacion_contacto_estudiante.csv"
              accept=".csv"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-card-account-phone"
              show-size
              rounded="lg"
              color="teal-darken-2"
              density="comfortable"
              :hint="informacionContactoFile ? '' : 'Ej: informacion_contacto_estudiante.csv'"
              persistent-hint
            >
              <template #append-inner>
                <v-icon v-if="informacionContactoFile" color="green-darken-2" icon="mdi-check-circle" />
              </template>
            </v-file-input>

            <!-- Indicador de progreso de selección -->
            <div class="d-flex flex-wrap align-center ga-2 mt-4 mb-2">
              <v-chip
                :color="estudianteFile ? 'green-darken-2' : 'grey'"
                :variant="estudianteFile ? 'tonal' : 'outlined'"
                size="small"
                :prepend-icon="estudianteFile ? 'mdi-check' : 'mdi-minus'"
              >
                Estudiante
              </v-chip>
              <v-chip
                :color="historialFile ? 'green-darken-2' : 'grey'"
                :variant="historialFile ? 'tonal' : 'outlined'"
                size="small"
                :prepend-icon="historialFile ? 'mdi-check' : 'mdi-minus'"
              >
                Historial
              </v-chip>
              <v-chip
                :color="informacionContactoFile ? 'green-darken-2' : 'grey'"
                :variant="informacionContactoFile ? 'tonal' : 'outlined'"
                size="small"
                :prepend-icon="informacionContactoFile ? 'mdi-check' : 'mdi-minus'"
              >
                Info. Contacto
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions class="px-6 pb-5 pt-2">
            <v-btn
              v-if="extrasListo"
              variant="text"
              color="grey-darken-1"
              rounded="lg"
              prepend-icon="mdi-refresh"
              @click="resetExtras"
            >
              Cargar de nuevo
            </v-btn>
            <v-spacer />
            <v-btn
              color="teal-darken-2"
              variant="elevated"
              :loading="loadingExtras"
              :disabled="!estudianteFile || !historialFile || !informacionContactoFile"
              rounded="lg"
              prepend-icon="mdi-upload"
              @click="cargarExtras"
            >
              Cargar CSV
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

    </v-row>
  </v-container>
</template>

<style scoped>
.page-bg {
  min-height: 100vh;
  background-color: #1e2c3e;
}

.card-table {
  background-color: #e6f4ec !important;
  color: #111111 !important;
  border: 2px solid #111111 !important;
}

.card-table :deep(th),
.card-table :deep(td),
.card-table :deep(.v-data-table-header__content) {
  color: #111111 !important;
}

.card-table :deep(.v-card-title),
.card-table :deep(.v-card-text),
.card-table :deep(.v-label),
.card-table :deep(.v-field__input),
.card-table :deep(.v-messages__message) {
  color: #111111 !important;
}

.card-table :deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 0.5;
}
</style>
