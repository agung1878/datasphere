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

const goToStreamDevice = () => {
  router.push({ name: 'stream-device'});
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
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <!-- Modal Content -->
    <div class="relative w-full max-w-5xl bg-[url(@/assets/img/bg_confirmation.png)] bg-no-repeat bg-[length:100%_100%] min-w-[1034px] min-h-[753px] border border-blue-900/50 rounded-lg shadow-[0_0_50px_rgba(30,58,138,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="flex items-end justify-end px-6 py-4">
        <button @click="$emit('close')" class="p-2 rounded-full hover:bg-blue-900/30 transition-colors text-blue-400 hover:text-white">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-8 flex items-center justify-center">
        <div class="row items-center">
            <img src="@/assets/img/icon_show_all.png" alt="Warning" class="w-[232px] h-[232px] mx-auto">
            <h1 class="text-white text-center font-bold text-xl mt-6">Show all devices?</h1>  
            <p class="text-white text-center mt-14 text-xl">Showing all devices will open multiple live streams and may slow down your system.</p>  
        </div>
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 flex justify-center gap-4">
        <button @click="$emit('close')" class="px-8 py-2.5 rounded-lg border border-[#910E0E] text-white hover:bg-red-900/20 transition-colors text-sm font-bold bg-transparent">
           Cancel
        </button>
        <button @click="goToStreamDevice" 
                class="px-8 py-2.5 rounded-lg bg-[#061B65] hover:bg-[#2E58F2] text-white shadow-lg shadow-blue-600/20 transition-all text-sm font-bold border border-[#2E58F2]"
        >
           Continue
        </button>
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
