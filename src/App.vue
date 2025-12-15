<script setup>
import TheHeader from './components/layout/TheHeader.vue';
import MapView from './components/map/MapView.vue';
import ServerStatusWidget from './components/dashboard/ServerStatusWidget.vue';
import NotificationWidget from './components/dashboard/NotificationWidget.vue';
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden bg-slate-900 text-white font-sans selection:bg-blue-500/30">
    <!-- Map Background -->
    <MapView />

    <!-- Grid Overlay Effect (Optional tech feel) -->
    <div class="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-10 z-10"></div>

    <!-- UI Layer -->
    <div class="relative z-20 flex flex-col h-full pointer-events-none">
      <!-- Top Bar -->
      <div class="pointer-events-auto">
        <TheHeader />
      </div>

      <!-- Main Layout -->
      <main class="flex-1 p-6 relative">
        
        <!-- Left Widget -->
        <div class="absolute top-6 left-6 pointer-events-auto">
          <ServerStatusWidget />
        </div>

        <!-- Right Widget -->
        <div class="absolute top-6 right-6 pointer-events-auto">
          <!-- <NotificationWidget /> -->
        </div>

        <!-- Bottom Line Decorator -->
        <div class="absolute bottom-32 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div class="absolute bottom-32 left-20 text-white/50 text-xs font-mono uppercase tracking-[0.2em]">System Active // Monitoring</div>

      </main>
    </div>
  </div>
</template>

<style>
/* Global resets if needed */
body { margin: 0; padding: 0; }
</style>
