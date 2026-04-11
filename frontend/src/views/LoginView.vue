<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth/auth.service'

const router = useRouter()

const carnet = ref<string>('')
const contrasenia = ref<string>('')
const loading = ref(false)
const error = ref<string | null>(null)
const mostrarPass = ref(false)

async function iniciarSesion() {
  if (!carnet.value || !contrasenia.value) {
    error.value = 'Ingresa tu carnet y contraseña'
    return
  }
  loading.value = true
  error.value = null
  try {
    await authService.login(Number(carnet.value), contrasenia.value)
    router.push('/pensum')
  } catch (e: any) {
    error.value = e.message ?? 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-app style="background-color: #1e2c3e;">
    <v-main>
      <v-container fluid class="d-flex align-center justify-center" style="min-height: 100vh;">
        <v-col cols="12" sm="8" md="5" lg="4">

          <!-- Logo / título -->
          <div class="text-center mb-8">
            <v-avatar color="blue-darken-4" size="72" rounded="xl" class="mb-4">
              <v-icon icon="mdi-school" size="40" color="white" />
            </v-avatar>
            <h1 class="text-h5 font-weight-bold text-white">Control de Horarios</h1>
            <p class="text-caption text-blue-lighten-3 mt-1">CUNOC — Ingresa con tu carnet</p>
          </div>

          <!-- Card de login -->
          <v-card rounded="xl" elevation="0" class="card-login pa-6">

            <v-card-text class="pa-0">
              <div class="text-subtitle-1 font-weight-bold mb-5 text-center">Iniciar Sesión</div>

              <!-- Alerta de error -->
              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                rounded="lg"
                density="compact"
                class="mb-4"
                :text="error"
              />

              <!-- Carnet -->
              <div class="mb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
                Número de carnet
              </div>
              <v-text-field
                v-model="carnet"
                label="Ej: 202030556"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prepend-inner-icon="mdi-identifier"
                color="blue-darken-4"
                type="number"
                hide-details="auto"
                class="mb-4"
                @keyup.enter="iniciarSesion"
              />

              <!-- Contraseña -->
              <div class="mb-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
                Contraseña
              </div>
              <v-text-field
                v-model="contrasenia"
                label="Contraseña"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="mostrarPass ? 'mdi-eye-off' : 'mdi-eye'"
                :type="mostrarPass ? 'text' : 'password'"
                color="blue-darken-4"
                hide-details="auto"
                class="mb-6"
                @click:append-inner="mostrarPass = !mostrarPass"
                @keyup.enter="iniciarSesion"
              />

              <!-- Botón -->
              <v-btn
                color="blue-darken-4"
                variant="elevated"
                rounded="lg"
                size="large"
                block
                :loading="loading"
                prepend-icon="mdi-login"
                @click="iniciarSesion"
              >
                Ingresar
              </v-btn>
            </v-card-text>
          </v-card>

        </v-col>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.card-login {
  background-color: #e6f4ec !important;
  color: #111111 !important;
  border: 2px solid #111111 !important;
}

.card-login :deep(.v-label),
.card-login :deep(.v-field__input),
.card-login :deep(.v-card-text) {
  color: #111111 !important;
}
</style>
