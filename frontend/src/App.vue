<script setup lang="ts">
  import BarraNavegacion from './components/BarraNavegacion.vue'
</script>

<template>
  <v-app>
    <BarraNavegacion/>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped></style>
