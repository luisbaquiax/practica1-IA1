import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '@/services/auth/auth.service'
import LoginView              from '@/views/LoginView.vue'
import EstudianteView         from '@/views/EstudianteView.vue'
import CargaDatosView         from '@/views/CargaDatosView.vue'
import PensumView             from '@/views/PensumView.vue'
import DashboardView          from '@/views/DashboardView.vue'
import HorarioEstudianteView  from '@/views/HorarioEstudianteView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { publica: true },
    },
    {
      path: '/estudiante',
      name: 'estudiante',
      component: EstudianteView,
    },
    {
      path: '/pensum',
      name: 'pensum',
      component: PensumView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/horario',
      name: 'horario',
      component: HorarioEstudianteView,
    },
    {
      path: '/carga',
      name: 'carga',
      component: CargaDatosView,
      meta: { publica: true },
    },
    {
      path: '/',
      redirect: '/pensum',
    },
  ],
})

// Guard: rutas privadas requieren sesión
router.beforeEach((to) => {
  const sesion = authService.getSession()
  if (!to.meta.publica && !sesion) return '/login'
})

export default router
