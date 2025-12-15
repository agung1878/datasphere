<script setup>
const servers = {
  total: 123,
  warning: 8,
  offline: 2,
  online: 40
};
</script>

<template>
  <div class="glass-panel p-4 min-w-[240px] select-none transform hover:scale-105 transition-transform duration-300 mt-[60px]">
    <div class="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
      <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Server</span>
      <span class="text-white font-mono font-bold">{{ servers.total }} Server</span>
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
          <span class="text-orange-400 font-mono font-bold">{{ servers.warning }}</span>
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
          <span class="text-red-400 font-mono font-bold">{{ servers.offline }}</span>
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
          <span class="text-emerald-400 font-mono font-bold">{{ servers.online }}</span>
          <span class="text-[10px] text-slate-500 uppercase">Server</span>
        </div>
      </div>
    </div>
  </div>
</template>
