<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth/auth.service'

const drawer = ref(false)
const router = useRouter()

const sesion = computed(() => authService.getSession())

function cerrarSesion() {
  authService.clearSession()
  router.push('/login')
}

interface NavItem {
    title: string
    icon: string
    to: string
}

const navItems: NavItem[] = [
    { title: 'Estudiante', icon: 'mdi-account-circle-outline', to: '/estudiante' },
    { title: 'Pensum', icon: 'mdi-book-open-variant', to: '/pensum' },
    { title: 'Control Notas', icon: 'mdi-chart-bar', to: '/dashboard' },
    { title: 'Carga de Datos', icon: 'mdi-upload', to: '/carga' },
]
</script>

<template>
    <!-- ── App bar ── -->
    <v-app-bar height="80" color="teal-darken-4"
        image="https://aprende.guatemala.com/wp-content/uploads/2021/06/Mapa-del-Campus-Central-de-la-USAC-Guatemala..jpg">
        <!-- Botón hamburguesa -->
        <template #prepend>
            <v-btn @click="drawer = !drawer">
                <v-icon>mdi-view-headline</v-icon>
            </v-btn>
        </template>

        <v-app-bar-title>Horarios CUNOC</v-app-bar-title>

        <v-spacer />

        <!-- Nombre de sesión -->
        <div v-if="sesion" class="d-flex align-center ga-2 mr-2">
            <v-icon color="white" size="20">mdi-account-circle</v-icon>
            <span class="text-body-2 text-white font-weight-medium d-none d-sm-inline">
                {{ sesion.nombres }} {{ sesion.apellidos }}
            </span>
        </div>

        <!-- Botón logout -->
        <v-btn
            v-if="sesion"
            icon="mdi-logout"
            color="white"
            variant="text"
            title="Cerrar sesión"
            @click="cerrarSesion"
        />
    </v-app-bar>

    <!-- ── Navigation drawer ── -->
    <v-navigation-drawer v-model="drawer" temporary width="300">

        <!-- Header del drawer -->
        <div class="drawer-header pa-4 d-flex align-center gap-3">
            <v-icon icon="mdi-book-open-page-variant" color="#e8c97a" size="32" />
            <div>
                <div class="font-weight-bold" style="color: #e8c97a; letter-spacing: 1px;">Control de Horarios</div>
                <div v-if="sesion" class="text-caption" style="color: #ccb870;">
                    {{ sesion.nombres }} {{ sesion.apellidos }}
                </div>
            </div>
        </div>

        <v-divider />

        <!-- Items de navegación -->
        <v-list nav class="pa-2">
            <v-list-item v-for="item in navItems" :key="item.to" :to="item.to" :title="item.title"
                :prepend-icon="item.icon" rounded="lg" class="mb-1" />
        </v-list>

        <template #append>
            <v-divider />
            <div class="pa-2">
                <v-list-item
                    title="Cerrar sesión"
                    prepend-icon="mdi-logout"
                    rounded="lg"
                    base-color="red"
                    @click="cerrarSesion"
                />
            </div>
        </template>

    </v-navigation-drawer>
</template>

<style scoped>
.drawer-header {
    background: #1a1008;
}
</style>