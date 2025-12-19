<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { X, Minus, Square, Maximize2, Terminal as TerminalIcon, Search, Menu } from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  locationName: {
    type: String,
    default: 'Server'
  }
});

const emit = defineEmits(['close']);

const terminalContainer = ref(null);
let term = null;
let fitAddon = null;

const initTerminal = () => {
    if (term) return;

    term = new Terminal({
        theme: {
            background: '#0B0F19', // Darker background for terminal
            foreground: '#d4d4d4',
            cursor: '#d4d4d4',
            selectionBackground: 'rgba(255, 255, 255, 0.3)'
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 12,
        lineHeight: 1.2,
        cursorBlink: true,
        convertEol: true, // Convert \n to \r\n
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer.value);
    
    // Initial content
    term.writeln(`\x1b[1;34mLast login: Mon Nov 4 10:28:00 on ttys001\x1b[0m`);
    term.writeln(`PB-West-01:~ admin$ system-ctl status --service=payment-gateway`);
    term.writeln(`[OK] Service 'payment-gateway' is running.`);
    term.writeln(`Active: active (running) since Mon 2023-12-11 09:00:00 UTC; 1h 30min ago`);
    term.writeln(`PB-West-01:~ admin$ version --check`);
    term.writeln(`Current version: v2.31.5. Build: 20231210-A`);
    term.writeln(`Status: Up to date.`);
    term.writeln(`PB-West-01:~ admin$ logs --tail=5`);
    term.writeln(`[INFO] 10:31:05 - Transaction 8A4F2 successfully processed.`);
    term.writeln(`[INFO] 10:31:12 - Transaction 9C1B7 successfully processed.`);
    term.write('PB-West-01:~ admin$ ');

    term.onData(e => {
        if (e === '\r') {
             term.write('\r\nPB-West-01:~ admin$ ');
        } else if (e === '\u007F') { // Backspace
            if (term._core.buffer.x > 20) {
                term.write('\b \b');
            }
        } else {
            term.write(e);
        }
    });

    fitAddon.fit();
};

watch(() => props.isOpen, async (val) => {
    if (val) {
        await nextTick();
        initTerminal();
        setTimeout(() => fitAddon?.fit(), 100); // Ensure layout is settled
    } else {
        // Optional: Dispose terminal if wanted, but keeping instance is often faster
    }
});

// Resize observer for responsiveness
let resizeObserver = null;
onMounted(() => {
    if (props.isOpen) {
        nextTick(() => {
            initTerminal();
        });
    }
    resizeObserver = new ResizeObserver(() => {
        if (props.isOpen && fitAddon) {
            fitAddon.fit();
        }
    });
    if (terminalContainer.value) {
        resizeObserver.observe(terminalContainer.value);
    }
});

onUnmounted(() => {
    term?.dispose();
    resizeObserver?.disconnect();
});

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
    <div v-if="isOpen" class="fixed bottom-0 left-0 w-full h-[400px] z-40 flex bg-[#161b22] border-t border-gray-700 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
        
        <!-- Sidebar: Server Settings -->
        <div class="w-[300px] flex-none bg-[#1e232e] border-r border-gray-700 p-6 flex flex-col">
            <h3 class="text-white font-bold text-lg mb-1">Server Settings</h3>
            <p class="text-xs text-gray-500 mb-8">View server for {{ locationName }}</p>

            <div class="space-y-6">
                <!-- App Version -->
                <div class="flex justify-between items-center group">
                    <span class="text-gray-400 text-sm font-medium">Server App Version</span>
                    <span class="bg-blue-900/40 text-blue-400 text-xs font-bold px-2 py-1 rounded border border-blue-500/30 group-hover:bg-blue-900/60 transition-colors">v1.2.3-Exchange</span>
                </div>

                <!-- Auto Update -->
                 <div class="flex justify-between items-center group">
                    <span class="text-gray-400 text-sm font-medium">Auto-Update Status</span>
                    <span class="bg-green-900/40 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-500/30 group-hover:bg-green-900/60 transition-colors">Enabled</span>
                </div>
            </div>
        </div>

        <!-- Terminal Window -->
        <div class="flex-1 flex flex-col bg-[#0B0F19]">
            <!-- Terminal Header -->
            <div class="h-10 bg-[#161b22] border-b border-gray-700 flex items-center justify-between px-4 select-none">
                <div class="flex items-center gap-2 text-gray-400">
                    <TerminalIcon class="w-4 h-4" />
                    <span class="text-xs font-bold tracking-wide">Terminal</span>
                    <span class="text-[#4f5666] mx-2">|</span>
                    <span class="text-xs text-[#6e7681]">Nov 4 10:28</span>
                </div>

                <div class="flex items-center gap-2">
                     <button class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                        <Search class="w-4 h-4" />
                    </button>
                    <button class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                        <Menu class="w-4 h-4" />
                    </button>
                    <div class="w-px h-4 bg-gray-700 mx-1"></div>
                    <button class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                        <Minus class="w-4 h-4" />
                    </button>
                    <button class="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                        <Square class="w-3.5 h-3.5" />
                    </button>
                     <button @click="$emit('close')" class="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition-colors">
                        <X class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- xterm Container -->
            <div ref="terminalContainer" class="flex-1 overflow-hidden p-2"></div>
        </div>
    </div>
  </transition>
</template>

<style scoped>
/* Optional styling overrides for xterm if needed */
:deep(.xterm-viewport) {
    overflow-y: auto !important;
}
</style>
