<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, ChevronLeft } from 'lucide-vue-next';

const router = useRouter();

const goBack = () => {
  router.push('/');
};

// Filter states
const activeFilter = ref('All');
const searchQuery = ref('');

// Sample notification data
const notifications = ref([
  { id: 1, date: '09/12/2025 20:00', type: 'Update', message: 'WhatsApp update required', device: 'Polres Lampung Tengah', status: 'Solved' },
  { id: 2, date: '09/13/2025 14:30', type: 'Issues', message: 'Server maintenance scheduled', device: 'Polres Bekasi', status: 'Unread' },
  { id: 3, date: '09/13/2025 14:30', type: 'Issues', message: 'Server maintenance scheduled', device: 'Polres Bekasi', status: 'Unread' },
  { id: 4, date: '09/14/2025 09:00', type: 'Issues', message: 'User feedback session', device: 'Polres Jakarta Pusat', status: 'Read' },
  { id: 5, date: '09/14/2025 09:00', type: 'Issues', message: 'User feedback session', device: 'Polres Jakarta Pusat', status: 'Read' },
  { id: 6, date: '09/15/2025 11:00', type: 'Info', message: 'Newsletter draft review', device: 'Polres Jawa Barat', status: 'Solved' },
  { id: 7, date: '09/15/2025 11:00', type: 'Info', message: 'Newsletter draft review', device: 'Polres Jawa Barat', status: 'Solved' },
  { id: 8, date: '09/16/2025 17:00', type: 'Info', message: 'Data breach investigation', device: 'Polres Mesuji', status: 'Solved' },
  { id: 9, date: '09/16/2025 17:00', type: 'Info', message: 'Data breach investigation', device: 'Polres Mesuji', status: 'Solved' },
  { id: 10, date: '09/16/2025 17:00', type: 'Info', message: 'Data breach investigation', device: 'Polres Mesuji', status: 'Solved' },
  { id: 11, date: '09/16/2025 17:00', type: 'Info', message: 'Data breach investigation', device: 'Polres Mesuji', status: 'Solved' },
]);

// Filtered notifications
const filteredNotifications = computed(() => {
  let filtered = notifications.value;
  
  // Filter by type
  if (activeFilter.value !== 'All') {
    filtered = filtered.filter(n => {
      if (activeFilter.value === 'Issue') return n.type === 'Issues';
      if (activeFilter.value === 'Healthy') return n.status === 'Solved';
      if (activeFilter.value === 'Offline') return n.status === 'Unread';
      return true;
    });
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(n => 
      n.message.toLowerCase().includes(query) ||
      n.device.toLowerCase().includes(query) ||
      n.type.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() => Math.ceil(filteredNotifications.value.length / itemsPerPage));

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredNotifications.value.slice(start, end);
});

const setFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const getTypeColor = (type) => {
  switch(type) {
    case 'Update': return 'text-orange-400';
    case 'Issues': return 'text-red-400';
    case 'Info': return 'text-blue-400';
    default: return 'text-gray-400';
  }
};

const getStatusColor = (status) => {
  switch(status) {
    case 'Solved': return 'text-green-400';
    case 'Unread': return 'text-orange-400';
    case 'Read': return 'text-blue-400';
    default: return 'text-gray-400';
  }
};
</script>

<template>
  <div class="relative h-full w-full bg-slate-900">
    <!-- Background Image -->
    <div class="absolute inset-0 z-0">
      <img src="@/assets/img/background_location.png" class="w-full h-full object-cover opacity-100" alt="" />
      <div class="absolute inset-0 bg-slate-900/40"></div>
    </div>
    
    <!-- Main Content -->
    <div class="relative z-10 h-full flex flex-col pt-[74px] pb-6 overflow-y-auto">
      <!-- Breadcrumb & Back -->
      <div class="relative w-full h-[62px] flex items-center px-4 mb-6">
        <!-- Background -->
        <img src="@/assets/img/bg_brb_2.png" class="absolute inset-0 w-full h-full object-fill" alt="" />
        
        <div class="relative z-10 flex items-center w-full h-full">
          <!-- Back Button -->
          <button @click="goBack" class="mr-4 hover:opacity-80 transition-opacity">
            <img src="@/assets/img/left_arrow.png" class="w-2.5 h-4" alt="Back" />
          </button>

          <!-- Divider -->
          <div class="h-6 w-px bg-slate-700/50 mr-4"></div>

          <!-- Globe Icon -->
          <img src="@/assets/img/icon_globe.png" class="" alt="Globe" />

          <!-- Path -->
          <div class="flex items-center text-sm font-medium tracking-wide ml-4">
            <span class="text-gray-400 cursor-pointer hover:text-white transition-colors" @click="goBack">Home</span>
            <span class="mx-2 text-gray-600">/</span>
            <span class="text-blue-500 font-bold underline decoration-blue-500/30 underline-offset-4">Notification Center</span>
          </div>
        </div>
      </div>

      <!-- Main Card -->
      <div class="mx-6 bg-blued border-2 border-blue-neon rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <!-- Background Decor -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

        <!-- Filters and Search -->
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div class="flex items-center space-x-4">
            <!-- Filter Tabs -->
            <div class="flex bg-transparent rounded-lg p-1 border border-[#2E58F2] h-[35px]">
              <button 
                @click="setFilter('All')"
                :class="['px-4 py-1 rounded text-xs font-bold transition-colors', activeFilter === 'All' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white']"
              >
                All
              </button>
              <button 
                @click="setFilter('Issue')"
                :class="['px-4 py-1 rounded text-xs font-bold transition-colors', activeFilter === 'Issue' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white']"
              >
                Issue
              </button>
              <button 
                @click="setFilter('Healthy')"
                :class="['px-4 py-1 rounded text-xs font-bold transition-colors', activeFilter === 'Healthy' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white']"
              >
                Healthy
              </button>
              <button 
                @click="setFilter('Offline')"
                :class="['px-4 py-1 rounded text-xs font-bold transition-colors', activeFilter === 'Offline' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white']"
              >
                Offline
              </button>
            </div>

            <!-- Search -->
            <div class="relative group border border-[#2E58F2] w-[329px] h-[35px] rounded-lg">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search" 
                class="bg-transparent w-full h-full border-0 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 focus:shadow-[0_0_10px_rgba(59,130,246,0.1)]"
              >
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="relative z-10">
          <!-- Table Header -->
          <div class="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pb-3 border-b border-white/10">
            <div class="col-span-2">Date</div>
            <div class="col-span-1">Type</div>
            <div class="col-span-4">Message</div>
            <div class="col-span-3">Device</div>
            <div class="col-span-1">Status</div>
            <div class="col-span-1 text-right">Action</div>
          </div>

          <!-- Table Body -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div 
              v-for="notification in paginatedNotifications" 
              :key="notification.id" 
              class="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors text-sm group"
            >
              <div class="col-span-2 text-gray-300 text-xs">{{ notification.date }}</div>
              <div class="col-span-1">
                <span :class="['text-xs font-bold', getTypeColor(notification.type)]">
                  {{ notification.type }}
                </span>
              </div>
              <div class="col-span-4 text-gray-300 text-xs">{{ notification.message }}</div>
              <div class="col-span-3 text-gray-300 text-xs">{{ notification.device }}</div>
              <div class="col-span-1">
                <span :class="['text-xs font-bold', getStatusColor(notification.status)]">
                  {{ notification.status }}
                </span>
              </div>
              <div class="col-span-1 flex justify-end">
                <button class="p-1.5 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex justify-center items-center mt-6 space-x-2 relative z-10">
          <button 
            v-for="page in totalPages" 
            :key="page"
            @click="goToPage(page)"
            :class="[
              'w-8 h-8 rounded text-xs flex items-center justify-center transition-colors font-bold',
              currentPage === page 
                ? 'border border-blue-500/50 bg-blue-900/30 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                : 'text-gray-500 hover:text-white'
            ]"
          >
            {{ page.toString().padStart(2, '0') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-blued {
  background-color: rgba(4, 13, 42, 1);
}

.border-blue-neon {
  border-color: rgba(8, 34, 130, 1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
