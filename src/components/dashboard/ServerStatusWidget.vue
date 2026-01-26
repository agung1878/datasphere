<script setup>
import { computed, watch } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';

const dashboardStore = useDashboardStore();

// Map API data to component display
const servers = computed(() => ({
  total: dashboardStore.totalServers,
  warning: dashboardStore.issueServers,
  offline: dashboardStore.offlineServers,
  online: dashboardStore.healthyServers
}));

console.log("INITIAL - total servers: ", dashboardStore.totalServers);
console.log("INITIAL - issue servers: ", dashboardStore.issueServers);
console.log("INITIAL - offline servers: ", dashboardStore.offlineServers);
console.log("INITIAL - healthy servers: ", dashboardStore.healthyServers);

// Watch for changes to verify reactivity
watch(() => dashboardStore.summary, (newSummary) => {
  console.log("UPDATED - summary changed:", newSummary);
  console.log("UPDATED - total servers: ", dashboardStore.totalServers);
  console.log("UPDATED - issue servers: ", dashboardStore.issueServers);
  console.log("UPDATED - offline servers: ", dashboardStore.offlineServers);
  console.log("UPDATED - healthy servers: ", dashboardStore.healthyServers);
}, { deep: true });

</script>

<template>
  <div class="glass-panel p-4 w-full md:w-auto md:min-w-[240px] select-none transform hover:scale-105 transition-transform duration-300">
    <!-- Loading State -->
    <div v-if="dashboardStore.loading" class="flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="dashboardStore.error" class="text-red-400 text-sm p-2">
      <p>{{ dashboardStore.error }}</p>
    </div>

    <!-- Data Display -->
    <div v-else>
      <div class="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
        <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Server</span>
        <span class="text-white font-mono font-bold">{{ dashboardStore.totalServers }} Server</span>
      </div>
      
      <div class="space-y-2">
        <!-- Warning -->
        <div class="flex items-center justify-between group">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="w-2 h-2 rounded-full bg-orange-500"></div>
              <div class="absolute inset-0 bg-orange-500/50 rounded-full animate-ping group-hover:animate-none"></div>
            </div>
            <span class="text-xs text-slate-300">Warning</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-orange-400 font-mono font-bold">{{ dashboardStore.issueServers }}</span>
            <span class="text-[10px] text-slate-500 uppercase">Server</span>
          </div>
        </div>

        <!-- Offline -->
        <div class="flex items-center justify-between group">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="w-2 h-2 rounded-full bg-red-500"></div>
              <div class="absolute inset-0 bg-red-500/50 rounded-full animate-ping group-hover:animate-none"></div>
            </div>
            <span class="text-xs text-slate-300">Offline</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-red-400 font-mono font-bold">{{ dashboardStore.offlineServers }}</span>
            <span class="text-[10px] text-slate-500 uppercase">Server</span>
          </div>
        </div>

        <!-- Online -->
        <div class="flex items-center justify-between group">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div class="absolute inset-0 bg-emerald-500/50 rounded-full animate-pulse group-hover:animate-none"></div>
            </div>
            <span class="text-xs text-slate-300">Online</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-emerald-400 font-mono font-bold">{{ dashboardStore.healthyServers }}</span>
            <span class="text-[10px] text-slate-500 uppercase">Server</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
