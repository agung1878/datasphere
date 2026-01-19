<script setup>
import { ref, computed, watch } from 'vue';
import { X, Minus, Square, Maximize2, Terminal as TerminalIcon, Search, Menu } from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  locationName: {
    type: String,
    default: 'Server'
  },
  serverConfig: {
    type: Object,
    default: () => ({
      host: 'localhost',
      port: 22,
      username: 'admin'
    })
  }
});

const emit = defineEmits(['close']);

// Wetty configuration
const wettyBaseUrl = ref('http://localhost:3001/terminal/'); // Wetty server URL

// Build Wetty URL with SSH parameters
const wettyUrl = computed(() => {
  const params = new URLSearchParams({
    sshhost: props.serverConfig.host,
    sshport: props.serverConfig.port.toString(),
    sshuser: props.serverConfig.username
  });
  
  return `${wettyBaseUrl.value}?${params.toString()}`;
});

// Terminal state
const isLoading = ref(true);
const isFullscreen = ref(false);

// Handle iframe load
const handleIframeLoad = () => {
  isLoading.value = false;
  console.log('Terminal loaded');
};

// Toggle fullscreen
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// Minimize (close)
const minimize = () => {
  emit('close');
};

</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="transform translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-full opacity-0"
  >
    <div 
      v-if="isOpen" 
      class="fixed z-40 flex bg-[#161b22] border border-gray-700 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]"
      :class="isFullscreen ? 'inset-0' : 'bottom-0 left-0 w-full h-[400px]'"
    >
        
        <!-- Sidebar: Server Settings -->
        <div class="w-[300px] flex-none bg-[#1e232e] border-r border-gray-700 p-6 flex flex-col">
            <h3 class="text-white font-bold text-lg mb-1">Server Settings</h3>
            <p class="text-xs text-gray-500 mb-8">SSH Terminal for {{ locationName }}</p>

            <div class="space-y-6">
                <!-- Server Info -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center group">
                      <span class="text-gray-400 text-sm font-medium">Host</span>
                      <span class="bg-slate-800 text-gray-300 text-xs font-mono px-2 py-1 rounded border border-gray-700">{{ serverConfig.host }}</span>
                  </div>
                  
                  <div class="flex justify-between items-center group">
                      <span class="text-gray-400 text-sm font-medium">Port</span>
                      <span class="bg-slate-800 text-gray-300 text-xs font-mono px-2 py-1 rounded border border-gray-700">{{ serverConfig.port }}</span>
                  </div>
                  
                  <div class="flex justify-between items-center group">
                      <span class="text-gray-400 text-sm font-medium">User</span>
                      <span class="bg-slate-800 text-gray-300 text-xs font-mono px-2 py-1 rounded border border-gray-700">{{ serverConfig.username }}</span>
                  </div>
                </div>

                <div class="border-t border-gray-700 pt-6">
                  <!-- Connection Status -->
                  <div class="flex justify-between items-center group">
                      <span class="text-gray-400 text-sm font-medium">Status</span>
                      <span 
                        class="text-xs font-bold px-2 py-1 rounded border flex items-center gap-1.5"
                        :class="isLoading ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30' : 'bg-green-900/40 text-green-400 border-green-500/30'"
                      >
                        <div 
                          class="w-1.5 h-1.5 rounded-full"
                          :class="isLoading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'"
                        ></div>
                        {{ isLoading ? 'Connecting...' : 'Connected' }}
                      </span>
                  </div>
                </div>
            </div>
            
            <!-- Info Box -->
            <div class="mt-auto pt-6 border-t border-gray-700">
              <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p class="text-xs text-blue-300 leading-relaxed">
                  <span class="font-bold">Tip:</span> Use Ctrl+C to copy and Ctrl+V to paste in the terminal.
                </p>
              </div>
            </div>
        </div>

        <!-- Terminal Window -->
        <div class="flex-1 flex flex-col bg-[#0B0F19]">
            <!-- Terminal Header -->
            <div class="h-10 bg-[#161b22] border-b border-gray-700 flex items-center justify-between px-4 select-none">
                <div class="flex items-center gap-2 text-gray-400">
                    <TerminalIcon class="w-4 h-4" />
                    <span class="text-xs font-bold tracking-wide">SSH Terminal</span>
                    <span class="text-[#4f5666] mx-2">|</span>
                    <span class="text-xs text-[#6e7681]">{{ serverConfig.host }}</span>
                </div>

                <div class="flex items-center gap-2">
                     <button 
                       @click="toggleFullscreen"
                       class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                       :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
                     >
                        <Maximize2 class="w-4 h-4" />
                    </button>
                    <div class="w-px h-4 bg-gray-700 mx-1"></div>
                    <button 
                      @click="minimize"
                      class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                      title="Minimize"
                    >
                        <Minus class="w-4 h-4" />
                    </button>
                     <button 
                       @click="$emit('close')" 
                       class="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition-colors"
                       title="Close"
                     >
                        <X class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- Loading Overlay -->
            <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-[#0B0F19] z-10">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p class="text-gray-400 text-sm">Connecting to {{ serverConfig.host }}...</p>
              </div>
            </div>

            <!-- Wetty iframe -->
            <iframe 
              :src="wettyUrl"
              @load="handleIframeLoad"
              class="flex-1 w-full h-full border-none bg-[#0B0F19]"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
            ></iframe>
        </div>
    </div>
  </transition>
</template>

<style scoped>
/* Ensure iframe fills container properly */
iframe {
  display: block;
  border: none;
}
</style>
