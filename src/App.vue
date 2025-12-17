<script setup>
import TheHeader from './components/layout/TheHeader.vue';
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden bg-slate-900 text-white font-sans selection:bg-blue-500/30 flex flex-col">
    <!-- Top Bar -->
    <div class="z-50 relative pointer-events-auto">
      <TheHeader />
    </div>

    <!-- Main Content (Router View) -->
    <div class="flex-1 relative overflow-hidden">
       <router-view />
    </div>
  </div>
</template>

<style>
/* Global resets if needed */
body { margin: 0; padding: 0; }
</style>
