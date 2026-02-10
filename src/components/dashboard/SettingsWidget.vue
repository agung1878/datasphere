<script setup>
import { useRouter } from 'vue-router';
import { 
  Settings, 
  MessageSquare, 
  Send, 
  UserCog, 
  ChevronRight,
  ShieldCheck,
  CalendarClock
} from 'lucide-vue-next';

const router = useRouter();
const emit = defineEmits(['close', 'openModal']);

// Data menu untuk Task Scheduler & Profile
const menuGroups = [
  {
    title: 'Task Scheduler',
    items: [
      { id: 'blast-wa', name: 'Scheduler', icon: CalendarClock, action: 'modal', color: 'text-green-400' },
    ]
  }
];

const handleAction = (item) => {
  if (item.action === 'modal') {
    // Membuka modal popup (dikirim ke parent)
    emit('openModal', item.id);
  } else {
    // Redirect ke halaman tertentu
    router.push({ name: item.path });
  }
  emit('close'); // Tutup dropdown setelah klik
};
</script>

<template>
  <div class="w-[350px] rounded-3xl overflow-hidden border-2 border-[#1F2023] bg-[#1F2023] shadow-2xl shadow-blue-500/20">
    <div class="px-5 py-4 border-b border-slate-700/50 flex items-center gap-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
      <Settings class="w-4 h-4 text-blue-400" />
      <h3 class="font-semibold text-sm text-white">System Settings</h3>
    </div>

    <div class="p-3 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
      <div v-for="group in menuGroups" :key="group.title">
        <h4 class="px-3 mb-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          {{ group.title }}
        </h4>
        
        <div class="space-y-1">
          <button 
            v-for="item in group.items" 
            :key="item.id"
            @click="handleAction(item)"
            class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                <component :is="item.icon" :class="['w-4 h-4', item.color]" />
              </div>
              <span class="text-sm text-slate-200 group-hover:text-white">{{ item.name }}</span>
            </div>
            <ChevronRight class="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-all" />
          </button>
        </div>
      </div>
    </div>

    <div class="px-5 py-4 bg-slate-900/30 border-t border-slate-700/50">
      <button 
        @click="router.push({ name: 'main-settings' })"
        class="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-medium transition-all border border-slate-700"
      >
        Advanced Configurations
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
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}
</style>