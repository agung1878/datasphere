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
    <div class="relative w-full max-w-5xl bg-[url(@/assets/img/bg_stream_device.png)] bg-no-repeat bg-[length:100%_100%] min-w-[1034px] min-h-[753px] border border-blue-900/50 rounded-lg shadow-[0_0_50px_rgba(30,58,138,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-blue-900/30">
        <h2 class="text-xl font-bold text-white tracking-wide">Select Device</h2>
        <button @click="$emit('close')" class="p-2 rounded-full hover:bg-blue-900/30 transition-colors text-blue-400 hover:text-white">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-8 flex-1 overflow-hidden flex flex-col">
        
        <!-- Filters -->
        <div class="flex items-center justify-between mb-6">
             <label class="text-gray-300 font-medium">Device</label>

           <div class="flex items-center gap-4">
             <div class="relative">
                <button @click="isDropdownOpen = !isDropdownOpen" class="min-w-[140px] min-h-[54px] bg-[#0B1739] border border-blue-800 text-white px-4 py-2.5 rounded-lg flex items-center justify-between text-sm hover:border-blue-500 transition-colors">
                   {{ filterStatus }}
                   <ChevronDown class="w-4 h-4 text-gray-400" />
                </button>
                <div v-if="isDropdownOpen" class="absolute top-full left-0 w-full mt-1 bg-[#0B1739] border border-blue-800 rounded-lg shadow-xl z-20 overflow-hidden">
                   <div v-for="status in ['All', 'Healthy', 'Issues', 'Offline']" :key="status" 
                        class="px-4 py-2 hover:bg-blue-900/50 cursor-pointer text-sm text-gray-300 hover:text-white"
                        @click="filterStatus = status; isDropdownOpen = false"
                   >
                      {{ status }}
                   </div>
                </div>
             </div>
           
             <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input v-model="searchQuery" type="text" placeholder="Search" 
                       class="min-w-[354px] min-h-[54px] bg-[#0B1739] border border-blue-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600">
             </div>
           </div>
        </div>

        <!-- Table Container with Neon Border Effect -->
        <div class="relative border border-blue-500 rounded-lg p-[1px] shadow-[0_0_15px_rgba(59,130,246,0.15)] flex-1 flex flex-col overflow-hidden bg-[#040D2A]">
           <div class="bg-[#050C25] w-full h-full rounded-lg flex flex-col overflow-hidden">
              
              <!-- Table Header -->
              <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0B1739] text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-blue-900/30">
                 <div class="col-span-1">Select</div>
                 <div class="col-span-3">ID</div>
                 <div class="col-span-2">Status</div>
                 <div class="col-span-3">Latest Update</div>
                 <div class="col-span-3">Notes</div>
              </div>

              <!-- Table Content -->
              <div class="overflow-y-auto custom-scrollbar flex-1">
                 <div v-for="device in filteredDevices" :key="device.id" 
                      @click="selectDevice(device.id)"
                      class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-blue-900/10 hover:bg-blue-900/10 cursor-pointer transition-colors group items-center"
                      :class="{'bg-blue-900/20': selectedDeviceIds.includes(device.id)}"
                 >
                    <div class="col-span-1 flex items-center">
                       <div class="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center transition-all"
                            :class="selectedDeviceIds.includes(device.id) ? 'bg-blue-600 border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-transparent border-gray-600 group-hover:border-blue-400'"
                       >
                          <div v-if="selectedDeviceIds.includes(device.id)" class="w-2.5 h-2.5 bg-white rounded-full"></div>
                       </div>
                    </div>
                    
                    <div class="col-span-3 text-white font-mono text-sm">{{ device.id }}</div>
                    
                    <div class="col-span-2">
                       <span class="px-3 py-1 rounded-full text-[10px] font-bold border flex items-center w-fit gap-1.5"
                          :class="{
                             'bg-green-500/10 text-green-400 border-green-500/20': device.status === 'Healthy',
                             'bg-orange-500/10 text-orange-400 border-orange-500/20': device.status === 'Issues',
                             'bg-red-500/10 text-red-400 border-red-500/20': device.status === 'Offline'
                          }"
                       >
                          <div class="w-1.5 h-1.5 rounded-full" :class="{
                             'bg-green-500': device.status === 'Healthy',
                             'bg-orange-500': device.status === 'Issues',
                             'bg-red-500': device.status === 'Offline'
                          }"></div>
                          {{ device.status }}
                       </span>
                    </div>
                    
                    <div class="col-span-3 text-gray-400 text-sm">{{ device.update }}</div>
                    <div class="col-span-3 text-gray-400 text-sm truncate">{{ device.notes }}</div>
                 </div>
              </div>

           </div>
           
           <!-- Scrollbar Track Decor -->
           <div class="absolute top-10 right-1 w-1 h-32 bg-blue-500/20 rounded-full"></div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-8 py-6 flex justify-end gap-4 border-t border-blue-900/30">
        <button @click="$emit('close')" class="px-8 py-2.5 rounded-lg border border-[#910E0E] text-white hover:bg-red-900/20 transition-colors text-sm font-bold bg-transparent">
           Cancel
        </button>
        <button @click="goToStreamDevice" 
                class="px-8 py-2.5 rounded-lg bg-[#061B65] hover:bg-[#2E58F2] text-white shadow-lg shadow-blue-600/20 transition-all text-sm font-bold border border-[#2E58F2]"
                :class="{'opacity-50 cursor-not-allowed': selectedDeviceIds.length === 0}"
                :disabled="selectedDeviceIds.length === 0"
        >
           Next
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
