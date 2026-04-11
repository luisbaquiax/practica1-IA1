<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authService } from '@/services/auth/auth.service'
import { estudianteService } from '@/services/estudiante/estudiante.service'
import type { EstudianteResponse } from '@/types'

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
const estudiante = ref<EstudianteResponse | null>(null)

// ===== MODAL EDITAR DATOS PERSONALES =====
const dialogPersonal = ref(false)
const loadingPersonal = ref(false)
const formPersonal = ref({ dpi: '', nombres: '', apellidos: '', fecha_nacimiento: '' })

function abrirEditarPersonal() {
  if (!estudiante.value) return
  formPersonal.value = {
    dpi:              estudiante.value.dpi,
    nombres:          estudiante.value.nombres,
    apellidos:        estudiante.value.apellidos,
    fecha_nacimiento: estudiante.value.fecha_nacimiento,
  }
  dialogPersonal.value = true
}

async function guardarPersonal() {
  if (!estudiante.value) return
  loadingPersonal.value = true
  try {
    const actualizado = await estudianteService.updateEstudiante(estudiante.value.carnet, formPersonal.value)
    estudiante.value = actualizado
    dialogPersonal.value = false
    showSnackbar('Datos personales actualizados', 'success')
  } catch (e: unknown) {
    showSnackbar(e instanceof Error ? e.message : 'Error al actualizar datos personales', 'error')
  } finally {
    loadingPersonal.value = false
  }
}

// ===== MODAL EDITAR CONTACTO =====
const dialogContacto = ref(false)
const loadingContacto = ref(false)
const formContacto = ref({
  municipio_vivienda_id: 0,
  direccion: '',
  correo_institucional: '',
  telefono: '',
})

function abrirEditarContacto() {
  if (!estudiante.value?.contacto) return
  formContacto.value = {
    municipio_vivienda_id: estudiante.value.contacto.municipio_vivienda_id,
    direccion:             estudiante.value.contacto.direccion,
    correo_institucional:  estudiante.value.contacto.correo_institucional,
    telefono:              estudiante.value.contacto.telefono,
  }
  dialogContacto.value = true
}

async function guardarContacto() {
  if (!estudiante.value) return
  loadingContacto.value = true
  try {
    const contacto = await estudianteService.updateContacto(estudiante.value.carnet, formContacto.value)
    estudiante.value = { ...estudiante.value, contacto }
    dialogContacto.value = false
    showSnackbar('Información de contacto actualizada', 'success')
  } catch (e: unknown) {
    showSnackbar(e instanceof Error ? e.message : 'Error al actualizar contacto', 'error')
  } finally {
    loadingContacto.value = false
  }
}

// ===== CARGA DEL PERFIL =====
async function cargarEstudiante() {
  const sesion = authService.getSession()
  if (!sesion) return
  loading.value = true
  estudiante.value = null
  try {
    estudiante.value = await estudianteService.getByCarnet(sesion.carnet)
  } catch (e: unknown) {
    showSnackbar(e instanceof Error ? e.message : 'Error al cargar el perfil', 'error')
  } finally {
    loading.value = false
  }
}

// ===== HELPERS =====
function formatearFecha(fecha: string): string {
  if (!fecha) return '–'
  try {
    return new Date(fecha).toLocaleDateString('es-GT', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
    })
  } catch { return fecha }
}

function iniciales(nombres: string, apellidos: string): string {
  return ((nombres?.charAt(0) ?? '') + (apellidos?.charAt(0) ?? '')).toUpperCase()
}

onMounted(cargarEstudiante)
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
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center ga-3">
          <v-avatar color="blue-darken-4" size="48" rounded="lg">
            <v-icon icon="mdi-account-school" size="26" color="white" />
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-bold text-white">Perfil del Estudiante</h1>
            <p class="text-caption text-blue-lighten-3 mb-0">
              Consulta la información personal y académica
            </p>
          </div>
        </div>
      </v-col>
    </v-row>



    <!-- ===== LOADING ===== -->
    <div v-if="loading" class="d-flex justify-center align-center py-16">
      <div class="text-center">
        <v-progress-circular indeterminate color="blue-lighten-3" size="56" width="4" />
        <p class="text-body-2 text-blue-lighten-3 mt-4">Buscando estudiante...</p>
      </div>
    </div>

    <!-- ===== PERFIL ===== -->
    <div v-else-if="estudiante">
      <v-row>

        <!-- ===== COLUMNA IZQUIERDA: avatar + datos principales ===== -->
        <v-col cols="12" md="4" lg="3">
          <v-card rounded="xl" elevation="0" border class="card-table pa-5 text-center mb-4">
            <!-- Avatar con iniciales -->
            <v-avatar color="blue-darken-4" size="88" rounded="xl" class="mb-3">
              <span class="text-h5 font-weight-bold text-white">
                {{ iniciales(estudiante.nombres, estudiante.apellidos) }}
              </span>
            </v-avatar>

            <div class="text-h6 font-weight-bold mb-1">
              {{ estudiante.nombres }} {{ estudiante.apellidos }}
            </div>

            <v-chip
              v-if="estudiante.carrera"
              color="blue-darken-4"
              variant="tonal"
              size="small"
              prepend-icon="mdi-school"
              class="mb-3"
            >
              {{ estudiante.carrera }}
            </v-chip>

            <v-divider class="my-2" />

            <v-btn
              color="blue-darken-4"
              variant="tonal"
              size="small"
              rounded="lg"
              prepend-icon="mdi-reload"
              @click="cargarEstudiante"
            >
              Recargar
            </v-btn>

            <v-divider class="mb-3" />

            <!-- Carnet destacado -->
            <div class="info-stat-box mb-2">
              <v-icon color="blue-darken-4" size="18" class="mb-1">mdi-identifier</v-icon>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Carnet</div>
              <div class="text-body-1 font-weight-bold">{{ estudiante.carnet }}</div>
            </div>

            <div class="info-stat-box">
              <v-icon color="blue-darken-4" size="18" class="mb-1">mdi-card-account-details-outline</v-icon>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">DPI</div>
              <div class="text-body-2 font-weight-medium">{{ estudiante.dpi }}</div>
            </div>

            <v-divider class="my-3" />

            <v-chip
              v-if="estudiante.tipo_nombre"
              :color="estudiante.tipo_nombre === 'Regular' ? 'green-darken-2' : 'orange-darken-2'"
              variant="tonal"
              size="small"
              :prepend-icon="estudiante.tipo_nombre === 'Regular' ? 'mdi-check-circle' : 'mdi-account-clock'"
            >
              {{ estudiante.tipo_nombre }}
            </v-chip>
          </v-card>
        </v-col>

        <!-- ===== COLUMNA DERECHA: detalles ===== -->
        <v-col cols="12" md="8" lg="9">

          <!-- Información personal -->
          <v-card rounded="xl" elevation="0" border class="card-table pa-0 mb-4">
            <div class="section-header d-flex align-center ga-2 px-5 py-4">
              <v-avatar color="blue-darken-4" size="32" rounded="lg">
                <v-icon icon="mdi-account" color="white" size="16" />
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">Información Personal</span>
              <v-spacer />
              <v-btn
                color="blue-darken-4"
                variant="elevated"
                size="small"
                rounded="lg"
                prepend-icon="mdi-pencil"
                @click="abrirEditarPersonal"
              >
                Editar
              </v-btn>
            </div>
            <v-divider />

            <v-row dense class="pa-4">
              <v-col cols="12" sm="6">
                <div class="dato-item">
                  <div class="dato-label">
                    <v-icon size="14" color="blue-darken-4" class="mr-1">mdi-account-outline</v-icon>
                    Nombres
                  </div>
                  <div class="dato-valor">{{ estudiante.nombres }}</div>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-item">
                  <div class="dato-label">
                    <v-icon size="14" color="blue-darken-4" class="mr-1">mdi-account-outline</v-icon>
                    Apellidos
                  </div>
                  <div class="dato-valor">{{ estudiante.apellidos }}</div>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-item">
                  <div class="dato-label">
                    <v-icon size="14" color="blue-darken-4" class="mr-1">mdi-cake-variant-outline</v-icon>
                    Fecha de nacimiento
                  </div>
                  <div class="dato-valor">{{ formatearFecha(estudiante.fecha_nacimiento) }}</div>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="dato-item">
                  <div class="dato-label">
                    <v-icon size="14" color="blue-darken-4" class="mr-1">mdi-card-account-details-outline</v-icon>
                    DPI
                  </div>
                  <div class="dato-valor">{{ estudiante.dpi }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- Información de contacto -->
          <v-card rounded="xl" elevation="0" border class="card-table pa-0 mb-4">
            <div class="section-header d-flex align-center ga-2 px-5 py-4">
              <v-avatar color="teal-darken-2" size="32" rounded="lg">
                <v-icon icon="mdi-card-account-phone" color="white" size="16" />
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">Información de Contacto</span>
              <v-spacer />
              <v-btn
                v-if="estudiante.contacto"
                color="teal-darken-2"
                variant="elevated"
                size="small"
                rounded="lg"
                prepend-icon="mdi-pencil"
                @click="abrirEditarContacto"
              >
                Editar
              </v-btn>
            </div>
            <v-divider />

            <div v-if="estudiante.contacto">
              <v-row dense class="pa-4">
                <v-col cols="12" sm="6">
                  <div class="dato-item">
                    <div class="dato-label">
                      <v-icon size="14" color="teal-darken-2" class="mr-1">mdi-map-marker-outline</v-icon>
                      Municipio (ID)
                    </div>
                    <div class="dato-valor">{{ estudiante.contacto.municipio_vivienda_id }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="dato-item">
                    <div class="dato-label">
                      <v-icon size="14" color="teal-darken-2" class="mr-1">mdi-phone-outline</v-icon>
                      Teléfono
                    </div>
                    <div class="dato-valor">{{ estudiante.contacto.telefono }}</div>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="dato-item">
                    <div class="dato-label">
                      <v-icon size="14" color="teal-darken-2" class="mr-1">mdi-home-outline</v-icon>
                      Dirección
                    </div>
                    <div class="dato-valor">{{ estudiante.contacto.direccion }}</div>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="dato-item">
                    <div class="dato-label">
                      <v-icon size="14" color="teal-darken-2" class="mr-1">mdi-email-outline</v-icon>
                      Correo institucional
                    </div>
                    <div class="dato-valor correo">{{ estudiante.contacto.correo_institucional }}</div>
                  </div>
                </v-col>
              </v-row>
            </div>
            <div v-else class="text-center pa-6 text-medium-emphasis text-body-2">
              Sin información de contacto registrada
            </div>
          </v-card>

          <!-- Información académica -->
          <v-card rounded="xl" elevation="0" border class="card-table pa-0">
            <div class="section-header d-flex align-center ga-2 px-5 py-4">
              <v-avatar color="green-darken-2" size="32" rounded="lg">
                <v-icon icon="mdi-school-outline" color="white" size="16" />
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">Información Académica</span>
            </div>
            <v-divider />

            <v-row dense class="pa-4">
              <v-col cols="12" sm="6">
                <div class="dato-item">
                  <div class="dato-label">
                    <v-icon size="14" color="green-darken-2" class="mr-1">mdi-identifier</v-icon>
                    Número de carnet
                  </div>
                  <div class="dato-valor">{{ estudiante.carnet }}</div>
                </div>
              </v-col>
              <v-col v-if="estudiante.carrera" cols="12" sm="6">
                <div class="dato-item">
                  <div class="dato-label">
                    <v-icon size="14" color="green-darken-2" class="mr-1">mdi-school</v-icon>
                    Carrera
                  </div>
                  <div class="dato-valor">{{ estudiante.carrera }}</div>
                </div>
              </v-col>
              <v-col v-if="estudiante.tipo_nombre" cols="12" sm="6">
                <div class="dato-item">
                  <div class="dato-label">
                    <v-icon size="14" color="green-darken-2" class="mr-1">mdi-account-check-outline</v-icon>
                    Tipo de estudiante
                  </div>
                  <div class="dato-valor">{{ estudiante.tipo_nombre }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card>

        </v-col>
      </v-row>
    </div>

    <!-- ===== EMPTY STATE ===== -->
    <div v-else class="d-flex justify-center align-center py-16">
      <div class="text-center">
        <v-icon size="72" color="blue-lighten-4">mdi-account-search-outline</v-icon>
        <p class="text-h6 text-blue-lighten-3 mt-4 mb-1">Sin información de perfil</p>
        <p class="text-body-2 text-disabled mb-4">No se pudo cargar el perfil del estudiante</p>
        <v-btn color="blue-darken-4" variant="elevated" prepend-icon="mdi-refresh" rounded="lg" @click="cargarEstudiante">
          Reintentar
        </v-btn>
      </div>
    </div>

    <!-- ===== DIALOG: EDITAR DATOS PERSONALES ===== -->
    <v-dialog v-model="dialogPersonal" max-width="520" persistent>
      <v-card rounded="xl" theme="light" class="card-dialog">
        <v-card-title class="d-flex align-center ga-2 pt-5 px-6">
          <v-avatar color="blue-darken-4" size="36" rounded="lg">
            <v-icon icon="mdi-account-edit" color="white" size="18" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Editar Datos Personales</div>
            <div class="text-caption text-medium-emphasis">Modifica tu información personal</div>
          </div>
        </v-card-title>
        <v-divider class="mx-6" />
        <v-card-text class="px-6 pt-4">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formPersonal.nombres" label="Nombres" variant="outlined" density="comfortable" rounded="lg" color="blue-darken-4" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formPersonal.apellidos" label="Apellidos" variant="outlined" density="comfortable" rounded="lg" color="blue-darken-4" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formPersonal.dpi" label="DPI" variant="outlined" density="comfortable" rounded="lg" color="blue-darken-4" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formPersonal.fecha_nacimiento" label="Fecha de nacimiento" type="date" variant="outlined" density="comfortable" rounded="lg" color="blue-darken-4" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" rounded="lg" @click="dialogPersonal = false">Cancelar</v-btn>
          <v-btn color="blue-darken-4" variant="elevated" :loading="loadingPersonal" rounded="lg" @click="guardarPersonal">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ===== DIALOG: EDITAR CONTACTO ===== -->
    <v-dialog v-model="dialogContacto" max-width="520" persistent>
      <v-card rounded="xl" theme="light" class="card-dialog">
        <v-card-title class="d-flex align-center ga-2 pt-5 px-6">
          <v-avatar color="teal-darken-2" size="36" rounded="lg">
            <v-icon icon="mdi-card-account-phone" color="white" size="18" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Editar Información de Contacto</div>
            <div class="text-caption text-medium-emphasis">Modifica tus datos de contacto</div>
          </div>
        </v-card-title>
        <v-divider class="mx-6" />
        <v-card-text class="px-6 pt-4">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="formContacto.municipio_vivienda_id" label="ID Municipio" type="number" variant="outlined" density="comfortable" rounded="lg" color="teal-darken-2" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="formContacto.telefono" label="Teléfono" variant="outlined" density="comfortable" rounded="lg" color="teal-darken-2" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="formContacto.direccion" label="Dirección" variant="outlined" density="comfortable" rounded="lg" color="teal-darken-2" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="formContacto.correo_institucional" label="Correo institucional" type="email" variant="outlined" density="comfortable" rounded="lg" color="teal-darken-2" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" rounded="lg" @click="dialogContacto = false">Cancelar</v-btn>
          <v-btn color="teal-darken-2" variant="elevated" :loading="loadingContacto" rounded="lg" @click="guardarContacto">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<style scoped>
.page-bg {
  min-height: 100vh;
  background-color: #1e2c3e;
}

/* Tarjeta de dialogs */
.card-dialog {
  background-color: #ededea !important;
  color: #111111 !important;
}

.card-dialog :deep(.v-card-title),
.card-dialog :deep(.v-card-text),
.card-dialog :deep(.v-label),
.card-dialog :deep(.v-field__input) {
  color: #111111 !important;
}

/* Tarjeta de datos */
.card-table {
  background-color: #e6f4ec !important;
  color: #111111 !important;
  border: 2px solid #111111 !important;
}

.card-table :deep(.v-card-title),
.card-table :deep(.v-card-text) {
  color: #111111 !important;
}

/* Header de sección (dentro de la card) */
.section-header {
  background-color: #b8d8c4;
  border-radius: 12px 12px 0 0;
}

/* Caja de stat destacado */
.info-stat-box {
  background-color: #c8dce8;
  border: 1px solid #90b8cc;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  color: #111111;
}

/* Ítem de dato individual */
.dato-item {
  background-color: #d8eedd;
  border: 1px solid #a0c8b0;
  border-radius: 8px;
  padding: 10px 12px;
  height: 100%;
}

.dato-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4a7060;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.dato-valor {
  font-size: 14px;
  font-weight: 600;
  color: #111111;
  word-break: break-word;
}

.dato-valor.correo {
  font-family: monospace;
  font-size: 13px;
}
</style>
