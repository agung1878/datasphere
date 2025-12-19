<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { X, Search, ChevronDown, CheckCircle, AlertCircle, Smartphone } from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();

const goToMainPage = () => {    
  router.push({ name: 'home'});
};

const emit = defineEmits(['close', 'next']);

const selectedDeviceIds = ref([]);
const searchQuery = ref('');
const filterStatus = ref('All');
const isDropdownOpen = ref(false);

const devices = [
  { id: 'R9RY30053XZ', status: 'Issues', update: '21/12/2025 14:00', notes: 'Need Troubleshoot' },
  { id: 'R9RY30054XZ', status: 'Issues', update: '21/12/2025 14:00', notes: 'WhatsApp Outdated' },
  { id: 'R9RY30055XZ', status: 'Offline', update: '21/12/2025 14:00', notes: 'Telegram Outdated' },
  { id: 'R9RY30056XZ', status: 'Healthy', update: '21/12/2025 14:00', notes: '...' },
  { id: 'R9RY30057XZ', status: 'Healthy', update: '21/12/2025 14:00', notes: '...' },
];

const filteredDevices = computed(() => {
  return devices.filter(device => {
    const matchesSearch = device.id.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesFilter = filterStatus.value === 'All' || device.status === filterStatus.value;
    return matchesSearch && matchesFilter;
  });
});

const selectDevice = (id) => {
  if (selectedDeviceIds.value.includes(id)) {
    selectedDeviceIds.value = selectedDeviceIds.value.filter(itemId => itemId !== id);
  } else {
    selectedDeviceIds.value.push(id);
  }
};

const handleNext = () => {
  if (selectedDeviceIds.value.length > 0) {
    emit('next', selectedDeviceIds.value);
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
    
    <!-- Modal Content -->
    <div class="relative w-full max-w-5xl bg-[url(@/assets/img/bg_confirmation.png)] bg-no-repeat bg-[length:100%_100%] min-w-[1034px] min-h-[753px] border border-blue-900/80 rounded-xl shadow-[0_0_50px_rgba(30,58,138,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="flex items-end justify-end px-6 py-4">
        
      </div>

      <!-- Body -->
      <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <img class="mx-auto h-16 w-auto" src="@/assets/img/logo_icon.png" alt="Your Company" />
      <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" action="#" method="POST">
        <div>
          <label for="email" class="block text-sm/6 font-medium text-gray-100">Email address</label>
          <div class="mt-2">
            <input type="email" name="email" id="email" autocomplete="email" required="" class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm/6 font-medium text-gray-100">Password</label>
            <div class="text-sm">
              <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300">Forgot password?</a>
            </div>
          </div>
          <div class="mt-2">
            <input type="password" name="password" id="password" autocomplete="current-password" required="" class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
          </div>
        </div>

        <div>
          <button @click="goToMainPage" class="flex w-full justify-center rounded-md bg-[#061B65] px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-[#2E58F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Sign in</button>
        </div>
      </form>

      <p class="mt-10 text-center text-sm/6 text-gray-400">
        Create account?
        {{ ' ' }}
        <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300">Register</a>
      </p>
    </div>
  </div>

      <!-- Footer -->
      <div class="px-8 py-6 flex justify-center gap-4">
        <!-- <button @click="$emit('close')" class="px-8 py-2.5 rounded-lg border border-[#910E0E] text-white hover:bg-red-900/20 transition-colors text-sm font-bold bg-transparent">
           Cancel
        </button>
        <button @click="goTo" 
                class="px-8 py-2.5 rounded-lg bg-[#061B65] hover:bg-[#2E58F2] text-white shadow-lg shadow-blue-600/20 transition-all text-sm font-bold border border-[#2E58F2]"
        >
           Login
        </button> -->
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 2px;
}
</style>
