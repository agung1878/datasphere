<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { X, Maximize2, Terminal as TerminalIcon, Lock, Key, Play } from 'lucide-vue-next';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  locationName: { type: String, default: 'Server' },
  pbId: { type: String, default: 'Null'},
  serverConfig: {
    type: Object,
    default: () => ({ host: '', port: 22, username: '' })
  }
});

const emit = defineEmits(['close']);

// State
const terminalElement = ref(null);
const isLoading = ref(false);
const isConnected = ref(false);
const authError = ref('');
const passwordInput = ref(''); 
const usernameInput = ref(''); 

let term = null;
let socket = null;
let fitAddon = null;

const initTerminal = () => {
  if (term) return;
  term = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    theme: { background: '#0B0F19' }
  });
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  term.onData((data) => {
  // Debug: console.log('Sending to backend:', data);
  if (socket && isConnected.value) {
    socket.emit('ssh_input', { data });
  }
});
};

const connectSSH = () => {
  // if (!usernameInput.value) {
  //   authError.value = 'Username is required';
  //   return;
  // }

  // if (!passwordInput.value) {
  //   authError.value = 'Password is required';
  //   return;
  // }

  isLoading.value = true;
  authError.value = '';

  console.log("pb id connectSSH: ", props.pbId);

  // Initialize socket if not exists
  if (!socket) {
    socket = io('http://172.15.2.55:8000', { transports: ['websocket'] });

    socket.on('ssh_output', (res) => {
      isLoading.value = false;
      isConnected.value = true;
      term.write(res.data);
    });

    socket.on('connect_error', () => {
      isLoading.value = false;
      authError.value = 'Backend Server Unreachable';
    });
  }

  // Send connection request
  socket.emit('connect_ssh', {
    host: props.serverConfig.host,
    phone_bank_id: props.pbId
  });
};

watch(() => props.isOpen, async (newVal) => {
  console.log("pb idddddddd: ", props.pbId);
  if (newVal) {
    await nextTick();
    initTerminal();
    term.open(terminalElement.value);
    fitAddon.fit();
    
    connectSSH();
    // if (!isConnected.value && !isLoading.value) {
    //   connectSSH();
    // }
  } else {
    cleanup();
  }
});

const cleanup = () => {
  if (socket) socket.disconnect();
  if (term) term.dispose();
  term = null;
  socket = null;
  isConnected.value = false;
  usernameInput.value = '';
  passwordInput.value = '';
};

onBeforeUnmount(cleanup);
</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="transform translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
  >
    <div v-if="isOpen" class="fixed inset-x-0 bottom-0 z-40 flex h-[600px] bg-[#161b22] border-t border-gray-700 shadow-2xl">
      
      <div class="w-80 flex-none bg-[#1e232e] border-r border-gray-700 p-6 flex flex-col" style="display: none;">
        <div class="flex items-center gap-2 mb-1">
          <Lock class="w-4 h-4 text-blue-400" />
          <h3 class="text-white font-bold text-lg">Authentication</h3>
        </div>
        <p class="text-xs text-gray-500 mb-6">Connect to {{ serverConfig.host }}</p>

        <div class="space-y-4">
          <div>
            <label class="text-[10px] uppercase tracking-wider text-gray-500 font-bold">User</label>
            <div class="relative mt-1">
              <Key class="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input 
                v-model="usernameInput"
                type="text" 
                @keyup.enter="connectSSH"
                placeholder="Username"
                class="w-full bg-[#0B0F19] text-white text-sm pl-9 pr-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                :disabled="isConnected || isLoading"
              />
            </div>
          </div>  

          <div>
            <label class="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Password</label>
            <div class="relative mt-1">
              <Key class="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input 
                v-model="passwordInput"
                type="password" 
                @keyup.enter="connectSSH"
                placeholder="••••••••"
                class="w-full bg-[#0B0F19] text-white text-sm pl-9 pr-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                :disabled="isConnected || isLoading"
              />
            </div>
          </div>

          <button 
            @click="connectSSH"
            :disabled="isConnected || isLoading"
            class="w-full py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all"
            :class="isConnected ? 'bg-green-600/20 text-green-500 border border-green-500/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'"
          >
            <Play v-if="!isLoading && !isConnected" class="w-4 h-4" />
            <div v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ isConnected ? 'Session Active' : (isLoading ? 'Connecting...' : 'Start Terminal') }}
          </button>

          <p v-if="authError" class="text-xs text-red-400 text-center font-medium">{{ authError }}</p>
        </div>

        <div class="mt-auto pt-4 border-t border-gray-700">
           <div class="flex items-center justify-between text-[11px]">
             <span class="text-gray-500">Status</span>
             <span :class="isConnected ? 'text-green-500' : 'text-yellow-500'">
               {{ isConnected ? '● Online' : '○ Offline' }}
             </span>
           </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col bg-[#0B0F19] relative">
        <div class="h-10 bg-[#161b22] border-b border-gray-700 flex items-center px-4 shrink-0 relative z-50">
          <div class="flex items-center gap-2 text-gray-400 min-w-0 pr-8">
            <TerminalIcon class="w-4 h-4 flex-shrink-0" />
            <span class="text-xs font-bold uppercase tracking-widest truncate">Console | Connect to {{ serverConfig.host }}</span>
          </div>
          <button 
            @click="emit('close')" 
            class="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 z-50 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div ref="terminalElement" class="flex-1 w-full p-2 overflow-hidden"></div>
      </div>
    </div>
  </transition>
</template>