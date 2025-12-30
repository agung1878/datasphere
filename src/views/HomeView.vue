<script setup>
import { onMounted } from 'vue';
import MapView from '../components/map/MapView.vue';
import ServerStatusWidget from '../components/dashboard/ServerStatusWidget.vue';
import NotificationWidget from '../components/dashboard/NotificationWidget.vue';
import { useDashboardStore } from '@/stores/dashboard';

const dashboardStore = useDashboardStore();

// Fetch dashboard data when component mounts
onMounted(async () => {
  await dashboardStore.fetchDashboard();
});
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Map Background -->
    <MapView />

    <!-- Grid Overlay Effect -->
    <div class="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-10 z-10"></div>

    <!-- UI Layer -->
    <div class="relative z-20 flex flex-col h-full pointer-events-none">
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
