<script setup>
import { RefreshCw } from 'lucide-vue-next';

const notifications = [
  { id: 1, text: 'Polres Singkawang: No Internet Connection', type: 'error' },
  { id: 2, text: 'Polres Kalimantan Timur: WhatsApp Update Required', type: 'warning' },
  { id: 3, text: 'Polres Kalimantan Barat: Telegram Update Required', type: 'warning' },
];

const getBgColor = (type) => {
  switch(type) {
    case 'error': return 'bg-red-900/80 border-l-4 border-red-500 text-red-100';
    case 'warning': return 'bg-yellow-900/80 border-l-4 border-yellow-500 text-yellow-100';
    default: return 'bg-slate-700 text-white';
  }
};
</script>

<template>
  <div class="glass-panel w-96 overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
      <h3 class="font-semibold text-sm text-white">Notifications</h3>
      <button class="text-slate-400 hover:text-white transition-colors">
        <RefreshCw class="w-4 h-4" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
      <div 
        v-for="item in notifications" 
        :key="item.id"
        :class="['p-3 rounded text-xs font-medium shadow-sm transition-transform hover:translate-x-1 cursor-pointer', getBgColor(item.type)]"
      >
        {{ item.text }}
      </div>
    </div>

    <!-- Footer -->
    <div class="px-4 py-3 bg-slate-900/50 border-t border-slate-700/50 flex justify-between items-center text-[10px]">
      <button class="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-2">Mark all as read</button>
      <button class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow-lg shadow-blue-900/20 transition-all">
        Go to Notification Center
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
}
</style>
