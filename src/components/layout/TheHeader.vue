<script setup>
import { Bell, Settings, User, Hexagon } from 'lucide-vue-next';
</script>

<template>
  <header class="header-bg fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-indigo-500/30 bg-slate-900/80 backdrop-blur-md shadow-lg shadow-indigo-500/10">
    <!-- Logo Section -->
    <div class="flex items-center space-x-3">
      <div class="relative">
        <img src="@/assets/img/logo_icon.png" alt="Logo" class="w-10 h-10">
      </div>
      <h1 class="text-2xl font-bold tracking-widest text-white uppercase font-sans">
        Data<span class="text-blue-400">Sphere</span>
      </h1>
      <!-- Decorative Lines -->
      <div class="h-6 w-px bg-slate-700 mx-4"></div>
      <div class="flex space-x-1">
        <div class="w-8 h-1 bg-blue-600 rounded-full"></div>
        <div class="w-2 h-1 bg-blue-600/50 rounded-full"></div>
        <div class="w-1 h-1 bg-blue-600/30 rounded-full"></div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center space-x-4">
      <button class="p-2 rounded-full hover:bg-white/10 transition-colors relative group">
        <Bell class="w-5 h-5 text-gray-300 group-hover:text-white" />
        <span class="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        <span class="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      
      <button class="p-2 rounded-full hover:bg-white/10 transition-colors group">
        <Settings class="w-5 h-5 text-gray-300 group-hover:text-white spin-hover" />
      </button>

      <div class="h-6 w-px bg-slate-700 mx-2"></div>

      <button class="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/20">
        <User class="w-5 h-5 text-gray-300" />
        <span class="text-sm font-medium tracking-wide">PROFILE</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header-bg {
  background-image: url('@/assets/img/frame_bg_logo.png'), url('@/assets/img/frame_line.png');
  background-position: left top, left bottom;
  background-repeat: no-repeat, no-repeat;
  background-size: auto 100%, 100% auto;
}

.spin-hover:hover {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
