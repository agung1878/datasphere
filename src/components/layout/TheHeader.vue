<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Settings, User, LogOut, ChevronDown, Menu, X, Play, CalendarRange } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import NotificationWidget from '@/components/dashboard/NotificationWidget.vue';

const authStore = useAuthStore();
const dashboardStore = useDashboardStore();
const router = useRouter();

// --- UI States ---
const showProfileMenu = ref(false);
const showNotificationMenu = ref(false);
const showSettingsMenu = ref(false);
const showMobileMenu = ref(false);

// --- Logs States ---
const showLogsModal = ref(false);
const taskLogs = ref("");

const goDashboard = () => router.push('/');

// Fungsi untuk navigasi ke scheduler
const goScheduler = () => {
  closeAllMenus();
  router.push('/scheduler');
};

const handleLogout = () => {
  authStore.logout();
  closeAllMenus();
  router.push({ name: 'login' });
};

// --- Toggle Logic (Fixed) ---
const closeAllMenus = () => {
  showProfileMenu.value = false;
  showNotificationMenu.value = false;
  showSettingsMenu.value = false;
};

/**
 * Memperbaiki bug "value on boolean" dengan menerima string identifier
 */
const toggleMenu = (menuName) => {
  if (menuName === 'notification') {
    const targetState = !showNotificationMenu.value;
    closeAllMenus();
    showNotificationMenu.value = targetState;
  } else if (menuName === 'settings') {
    const targetState = !showSettingsMenu.value;
    closeAllMenus();
    showSettingsMenu.value = targetState;
  } else if (menuName === 'profile') {
    const targetState = !showProfileMenu.value;
    closeAllMenus();
    showProfileMenu.value = targetState;
  }
};

const handleClickOutside = (event) => {
  const target = event.target;
  if (!target.closest('.notification-group')) showNotificationMenu.value = false;
  if (!target.closest('.profile-group')) showProfileMenu.value = false;
  if (!target.closest('.settings-group')) showSettingsMenu.value = false;
};

const closeLogs = () => {
  showLogsModal.value = false;
  taskLogs.value = "";
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  // Fetch data jika diperlukan
  if (dashboardStore.phoneBanks?.length === 0) {
    try {
      await dashboardStore.fetchPhoneBanks();
    } catch (err) {
      console.error("Header Store Error:", err);
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <header class="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
    
    <div class="flex items-center space-x-4 cursor-pointer group" @click="goDashboard">
      <div class="relative overflow-hidden rounded-xl border border-blue-500/30 group-hover:border-blue-500/60 transition-all">
        <img src="@/assets/img/logo_icon.png" alt="Logo" class="w-10 h-10 transform group-hover:scale-110 transition-transform duration-500">
        <div class="absolute inset-0 bg-blue-500/10 group-hover:bg-transparent"></div>
      </div>
      <div class="flex flex-col">
        <h1 class="text-xl font-black tracking-tighter text-white uppercase leading-none">
          Data<span class="text-blue-500">Sphere</span>
        </h1>
        <span class="text-[9px] font-mono text-blue-400/60 tracking-[0.3em] uppercase">Fleet Manager</span>
      </div>
    </div>

    <div class="hidden md:flex items-center space-x-2">
      
      <div class="relative notification-group">
        <button 
          class="p-2.5 rounded-xl hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-500/20" 
          @click.stop="toggleMenu('notification')"
        >
          <Bell class="w-5 h-5 text-gray-400" :class="{'text-blue-400': showNotificationMenu}" />
          <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <Transition name="dropdown">
          <div v-if="showNotificationMenu" class="absolute right-0 mt-3 z-50 w-80">
            <NotificationWidget @close="showNotificationMenu = false" />
          </div>
        </Transition>
      </div>
      
      <div class="relative settings-group">
        <button 
          class="p-2.5 rounded-xl hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-500/20 group" 
          @click.stop="toggleMenu('settings')"
        >
          <Settings class="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform duration-500" :class="{'text-blue-400': showSettingsMenu}" />
        </button>

        <Transition name="dropdown">
          <div v-if="showSettingsMenu" class="absolute right-0 mt-3 w-64 bg-[#040D2A] border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
            <div class="px-5 py-4 bg-blue-500/5 border-b border-white/5">
              <p class="text-[9px] font-mono text-blue-400 uppercase tracking-widest">System Configuration</p>
            </div>
            <div class="p-2">
              <button @click="goScheduler" class="w-full flex items-center space-x-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 rounded-xl transition-all group">
                <CalendarRange class="w-4 h-4" />
                <span class="uppercase tracking-widest">Task Scheduler</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <div class="h-6 w-px bg-white/10 mx-2"></div>

      <div class="relative profile-group">
        <button 
          @click.stop="toggleMenu('profile')" 
          class="flex items-center space-x-3 px-4 py-2 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 transition-all border border-blue-500/10 hover:border-blue-500/30"
        >
          <div class="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
            <User class="w-4 h-4 text-white" />
          </div>
          <span class="text-xs font-bold tracking-widest text-white uppercase">{{ authStore.currentUser?.username || 'GUEST' }}</span>
          <ChevronDown class="w-4 h-4 text-gray-500 transition-transform" :class="{'rotate-180': showProfileMenu}" />
        </button>

        <Transition name="dropdown">
          <div v-if="showProfileMenu" class="absolute right-0 mt-3 w-56 bg-[#040D2A] border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
            <div class="px-5 py-4 bg-blue-500/5 border-b border-white/5">
              <p class="text-[9px] font-mono text-blue-400 uppercase tracking-widest">Signed in as</p>
              <p class="text-sm font-bold text-white truncate mt-1">{{ authStore.currentUser?.username }}</p>
            </div>
            <div class="p-2">
              <button @click="handleLogout" class="w-full flex items-center space-x-3 px-4 py-3 text-xs font-bold text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group">
                <LogOut class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span class="uppercase tracking-widest">Terminate Session</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <button class="md:hidden p-2 text-gray-400 hover:text-white transition-colors" @click="showMobileMenu = !showMobileMenu">
      <Menu v-if="!showMobileMenu" class="w-6 h-6" />
      <X v-else class="w-6 h-6" />
    </button>
  </header>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showLogsModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
        <div class="bg-[#020617] border-2 border-blue-500/30 w-full max-w-4xl rounded-3xl shadow-[0_0_100px_rgba(59,130,246,0.2)] overflow-hidden flex flex-col h-[75vh]">
          <div class="p-4 bg-slate-900/80 border-b border-white/5 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div class="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <span class="text-[10px] font-mono text-blue-400 uppercase tracking-[0.4em] ml-4">Terminal Trace // Task v1.0.4</span>
            </div>
            <button @click="closeLogs" class="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="flex-1 p-8 font-mono text-[11px] overflow-y-auto custom-scrollbar bg-black/60">
            <div class="text-emerald-500 mb-4 flex items-center gap-2">
              <Play class="w-3 h-3 fill-current" />
              <span>Link established. Monitoring data packets...</span>
            </div>
            <pre class="text-gray-300 leading-relaxed whitespace-pre-wrap">{{ taskLogs || 'SYSTEM_WAITING: No active data stream detected.' }}</pre>
            <div class="animate-pulse inline-block w-2 h-4 bg-emerald-500 ml-1 translate-y-1"></div>
          </div>
          <div class="p-4 bg-blue-900/5 border-t border-white/5 flex justify-between items-center">
             <span class="text-[9px] text-blue-500/40 font-mono italic">Encryption: RSA-4096 / TLS 1.3</span>
             <span class="text-[9px] text-emerald-500/50 font-mono tracking-widest">SYSTEM_STABLE</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Transition Dropdown */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

/* Transition Modal */
.modal-enter-active, .modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(1.05) translateY(-20px);
}

/* Scrollbar Custom */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
</style>