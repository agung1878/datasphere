<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { 
  ChevronLeft, Home, Bell, Settings, User, 
  CheckCircle, Smartphone, AlertCircle, WifiOff, RefreshCw,
  Radio, Terminal, Download, Search, Filter,
  MoreHorizontal
} from 'lucide-vue-next';
import StreamDeviceDialog from '@/components/dialogs/StreamDeviceDialog.vue';

const route = useRoute();
const router = useRouter();
const locationId = route.params.id;

const goBack = () => {
  router.push('/');
};

const showStreamDialog = ref(false);

const autoUpdate = ref(true);
// Mock Data for display
const locationName = "Polres Lampung Tengah";
const ipAddress = "11.11.11.88";

const deviceList = [
   { id: 'R9RY30053XZ', status: 'Issues', internet: 'Offline', whatsapp: '2.23.12.75', telegram: '1.4.2.1', update: '21/12/2025 14:00', notes: 'Need Troubleshoot' },
   { id: 'R9RY30054XZ', status: 'Issues', internet: 'Workshop08', whatsapp: '3.15.22.88', telegram: '1.4.3.1', update: '22/12/2025 15:00', notes: 'WA Outdated' },
   { id: 'R9RY30055XZ', status: 'Offline', internet: 'Workshop08', whatsapp: '1.10.10.90', telegram: '1.4.4.1', update: '23/12/2025 16:00', notes: 'No Internet' },
   { id: 'R9RY30056XZ', status: 'Healthy', internet: 'Workshop08', whatsapp: '4.30.18.65', telegram: '1.4.5.1', update: '24/12/2025 17:00', notes: '...' },
   { id: 'R9RY30057XZ', status: 'Healthy', internet: 'Workshop08', whatsapp: '5.25.11.12', telegram: '1.4.6.1', update: '25/12/2025 18:00', notes: '...' },
];

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
            <span class="text-gray-300">Polda Lampung</span>
            <span class="mx-2 text-gray-600">/</span>
            <span class="text-blue-500 font-bold underline decoration-blue-500/30 underline-offset-4">{{ locationName }}</span>
          </div>

          <!-- Refresh Action -->
          <div class="ml-auto flex items-center h-full">
             <div class="h-6 w-px bg-slate-700/50"></div>
             <button
               class="flex items-center justify-center
                        bg-[url('@/assets/img/bg_refresh.png')]
                        bg-no-repeat bg-[length:100%_100%]
                        min-w-[209px] min-h-[37px]
                        hover:bg-blue-500"
               >
               <span class="text-xs font-bold text-white">
                  Refresh Data
               </span>
               </button>
             <button class="bg-[url('@/assets/img/icon_refresh.png')]
                        bg-no-repeat bg-[length:100%_100%]
                        min-w-[40px] min-h-[37px] ml-2 hover:bg-blue-500">
            </button>
          </div>
       </div>
    </div>

    <!-- Top Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mx-6">
      
      <!-- Left Card: Stats -->
      <div class="bg-blued border border-blue-neon rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <!-- Background Decor -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div class="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h1 class="text-2xl font-bold text-white mb-1">{{ locationName }}</h1>
            <p class="text-sm text-gray-400">IP Address: <span class="text-gray-200">{{ ipAddress }}</span> <span class="mx-2 text-gray-600">|</span> v1.2.3-Exchange</p>
          </div>
          <div class="flex items-center space-x-6">
            <div class="flex flex-col items-end">
                <div class="flex flex-col items-center gap-1">
                  <!-- Title -->
                  <h2 class="text-white text-xs ">
                     Auto Update
                  </h2>

                  <!-- Toggle -->
                  <button
                     class="relative w-[98px] h-[25px] focus:outline-none" @click="autoUpdate = !autoUpdate">

                     <div
                        class="absolute inset-0 bg-[#081736] border border-[#1e40af]"
                        style="clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%)"
                     ></div>

                     <div
                           class="absolute top-1/2 -translate-y-1/2
                                 w-[55px] h-[24px]
                                 skew-x-[-20deg]
                                 flex items-center justify-center
                                 transition-all duration-300 ease-out"
                           :class="autoUpdate
                           ? 'translate-x-[45px] bg-[#123b8a] border-2 border-[#2b5cff] shadow-[0_0_14px_rgba(43,92,255,0.5)]'
                           : 'translate-x-[10px] bg-[#3b0a0a] border-2 border-[#ff3b3b] shadow-[0_0_14px_rgba(255,59,59,0.5)]'"
                        >
                        <span
                           class="skew-x-[20deg] text-xs tracking-wide transition-colors duration-300"
                           :class="autoUpdate ? 'text-[#7CFF4F]' : 'text-[#ff4d4d]'"
                        >
                           {{ autoUpdate ? 'ON' : 'OFF' }}
                        </span>
                     </div>
                  </button>
                  </div>
            </div>
            <button class="bg-[url(@/assets/img/update_all.png)] bg-no-repeat bg-[length:100%_100%] w-full min-w-[134px] min-h-[36px] hover:bg-blue-500 shadow-lg shadow-blue-600/20 border border-blue-400/50">
               <!-- <span class="animate-spin-slow"><RefreshCw class="w-4 h-4" /></span>
               Update All -->
            </button>
          </div>
        </div>

        <div class="flex gap-4 relative z-10">
          <!-- Save Status -->
          <div class="w-[74px] flex-none bg-green-900/20 border border-green-500/30 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-green-900/30 transition-colors cursor-pointer group">
             <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CheckCircle class="w-6 h-6 text-green-400" />
             </div>
             <span class="text-xs font-bold text-green-400">Save</span>
          </div>
            <div class="bg-[url(@/assets/img/status_item.png)] bg-no-repeat bg-[length:100%_100%] w-full min-w-[181.67px] min-h-[78px] gap-[18px] flex items-center">
               <img
                  class="mt-px h-[53px] w-[53px] ml-3.5 aspect-[1]"
                  alt="Ic outline phone"
                  src="@/assets/img/icon_healthy.png"
               />

               <div class="inline-flex -mt-px h-[55px] w-[47px] relative flex-col items-start">
                  <div
                  class="relative justify-center w-fit mt-[-0.57px] font-bold text-[#2e58f2] text-[27.5px] text-center tracking-[0] leading-[38.5px] whitespace-nowrap flex items-center"
                  style="font-family: 'Sora-Bold', Helvetica;"
                  >
                  27
                  </div>

                  <div
                  class="relative justify-center w-fit font-normal text-[#f4f6f8] text-xs text-center tracking-[0] leading-[16.8px] whitespace-nowrap flex items-center"
                  style="font-family: 'Sora-Regular', Helvetica;"
                  >
                  Healthy
                  </div>
               </div>
            </div>
            <div class="bg-[url(@/assets/img/status_item.png)] bg-no-repeat bg-[length:100%_100%] w-full min-w-[181.67px] min-h-[78px] gap-[18px] flex items-center">
               <img
                  class="mt-px h-[53px] w-[53px] ml-3.5 aspect-[1]"
                  alt="Ic outline phone"
                  src="@/assets/img/icon_issue.png"
               />

               <div class="inline-flex -mt-px h-[55px] w-[47px] relative flex-col items-start">
                  <div
                  class="relative justify-center w-fit mt-[-0.57px] font-bold text-[#2e58f2] text-[27.5px] text-center tracking-[0] leading-[38.5px] whitespace-nowrap flex items-center"
                  style="font-family: 'Sora-Bold', Helvetica;"
                  >
                  27
                  </div>

                  <div
                  class="relative justify-center w-fit font-normal text-[#f4f6f8] text-xs text-center tracking-[0] leading-[16.8px] whitespace-nowrap flex items-center"
                  style="font-family: 'Sora-Regular', Helvetica;"
                  >
                  Issue
                  </div>
               </div>
            </div>

            <div class="bg-[url(@/assets/img/status_item.png)] bg-no-repeat bg-[length:100%_100%] w-full min-w-[181.67px] min-h-[78px] gap-[18px] flex items-center">
               <img
                  class="mt-px h-[53px] w-[53px] ml-3.5 aspect-[1]"
                  alt="Ic outline phone"
                  src="@/assets/img/icon_offline.png"
               />

               <div class="inline-flex -mt-px h-[55px] w-[47px] relative flex-col items-start">
                  <div
                  class="relative justify-center w-fit mt-[-0.57px] font-bold text-[#2e58f2] text-[27.5px] text-center tracking-[0] leading-[38.5px] whitespace-nowrap flex items-center"
                  style="font-family: 'Sora-Bold', Helvetica;"
                  >
                  27
                  </div>

                  <div
                  class="relative justify-center w-fit font-normal text-[#f4f6f8] text-xs text-center tracking-[0] leading-[16.8px] whitespace-nowrap flex items-center"
                  style="font-family: 'Sora-Regular', Helvetica;"
                  >
                  Offline
                  </div>
               </div>
            </div>
        </div>
      </div>

      <!-- Right Card: Issue Tracker & Actions -->
      <div class="bg-blued border border-blue-neon rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
         <h3 class="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Issue Tracker</h3>
         
         <!-- Tracker List -->
         <div class="flex-1 bg-black/40 rounded-lg mb-4 p-2 border border-white/5 overflow-y-auto max-h-[140px] text-[10px] font-mono space-y-1 custom-scrollbar">
            <div class="flex gap-2 items-start text-gray-400">
               <span class="text-gray-500">21/12/2026 14:00</span>
               <span class="text-red-400">-- Baterai kembung</span>
            </div>
             <div class="flex gap-2 items-start text-gray-400">
               <span class="text-gray-500">21/12/2026 16:00</span>
               <span class="text-green-400">-- Proses pembelian baterai</span>
            </div>
             <div class="flex gap-2 items-start text-gray-400">
               <span class="text-gray-500">22/12/2025 07:00</span>
               <span class="text-gray-300">-- Sudah dikirim</span>
            </div>
             <div class="flex gap-2 items-start text-gray-400">
               <span class="text-gray-500">22/12/2025 07:03</span>
               <span class="text-gray-300">-- R9RY30053XZ WhatsApp outdated</span>
            </div>
         </div>

         <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-4 mt-auto">
             <button @click="showStreamDialog = true" class="bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
               <Radio class="w-4 h-4" />
               Stream Device
            </button>
            <button class="bg-slate-800 hover:bg-slate-700 border border-white/10 text-gray-300 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
               <Terminal class="w-4 h-4" />
               Launch Terminal
            </button>
         </div>
      </div>
    </div>

    <!-- Device List Section -->
    <div class="bg-blued border border-blue-neon rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] min-h-0 mx-6">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <div class="flex items-center justify-center space-x-4">
            <div class="flex items-center justify-center bg-transparent border border-[#2E58F2] w-[159px] h-[35px] px-4 py-1 solid rounded-lg text-sm font-bold text-white">
               <span class="text-xm font-bold text-white">
                  Total Device 30
               </span>
            </div>
            <div class="flex bg-transparent justify-between rounded-lg p-1 border border-[#2E58F2] w-[312px] h-[35px]">
               <button class="px-4 py-1 rounded text-xs font-bold bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20">All</button>
               <button class="px-4 py-1 rounded text-xs font-bold text-gray-400 hover:text-white transition-colors">Issue</button>
               <button class="px-4 py-1 rounded text-xs font-bold text-gray-400 hover:text-white transition-colors">Healthy</button>
               <button class="px-4 py-1 rounded text-xs font-bold text-gray-400 hover:text-white transition-colors">Offline</button>
            </div>
            <div class="relative group border border-[#2E58F2] w-[329px] h-[35px] rounded-lg">
                  <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  <input type="text" placeholder="Search" class="bg-transparent w-[329px] h-[35px] border border-[#2E58F2] rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 w-64 transition-all placeholder:text-gray-600 focus:shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            </div>
         </div>

         <div class="flex items-center space-x-4 w-full md:w-auto">
             <button class="border border-blue-500/30 text-blue-300 hover:bg-blue-900/20 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
               <Download class="w-4 h-4" />
               Export
            </button>
         </div>
      </div>

      <!-- Table Header -->
      <div class="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pb-3 border-b border-white/10">
         <div class="col-span-2">ID</div>
         <div class="col-span-1">Status</div>
         <div class="col-span-2">Internet</div>
         <div class="col-span-1">WhatsApp</div>
         <div class="col-span-1">Telegram</div>
         <div class="col-span-2">Latest Update <span class="text-blue-500">↓</span></div>
         <div class="col-span-2">Notes</div>
         <div class="col-span-1 text-right">Action</div>
      </div>

      <!-- Table Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
         <div v-for="(device, index) in deviceList" :key="index" class="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors text-sm group">
            
            <div class="col-span-2 font-mono text-gray-300 font-bold truncate">{{ device.id }}</div>
            
            <div class="col-span-1">
               <span 
                  class="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center w-fit gap-1"
                  :class="{
                     'bg-green-500/10 text-green-400 border-green-500/20': device.status === 'Healthy',
                     'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.1)]': device.status === 'Issues',
                     'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10': device.status === 'Offline'
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

            <div class="col-span-2 flex items-center gap-2 text-gray-300">
               <WifiOff v-if="device.internet === 'Offline'" class="w-4 h-4 text-orange-400" />
               <div v-else class="w-4 h-4 rounded-full border-2 border-green-500/50 flex items-center justify-center">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               </div>
               <span :class="{'text-gray-500': device.internet === 'Offline'}">{{ device.internet }}</span>
            </div>

            <div class="col-span-1 text-gray-300">{{ device.whatsapp }}</div>
            <div class="col-span-1 text-gray-300">{{ device.telegram }}</div>
            <div class="col-span-2 text-gray-400 text-xs">{{ device.update }}</div>
            <div class="col-span-2 text-gray-400 truncate text-xs">{{ device.notes }}</div>
            
            <div class="col-span-1 flex justify-end">
               <button class="p-1.5 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                  <Settings class="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
   </div>
      <!-- Pagination -->
      <div class="flex justify-center items-center mt-4 space-x-2">
         <button class="w-8 h-8 rounded border border-blue-500/50 bg-blue-900/30 text-white font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">01</button>
         <button class="w-8 h-8 rounded text-gray-500 hover:text-white font-bold text-xs flex items-center justify-center transition-colors">02</button>
         <button class="w-8 h-8 rounded text-gray-500 hover:text-white font-bold text-xs flex items-center justify-center transition-colors">03</button>
         <span class="text-gray-600 text-xs">...</span>
         <button class="w-8 h-8 rounded text-gray-500 hover:text-white font-bold text-xs flex items-center justify-center transition-colors">04</button>
         <button class="w-8 h-8 rounded text-gray-500 hover:text-white font-bold text-xs flex items-center justify-center transition-colors">05</button>
         <button class="w-8 h-8 rounded text-gray-500 hover:text-white font-bold text-xs flex items-center justify-center transition-colors">06</button>
      </div>

    </div>
  </div>
  
  <StreamDeviceDialog 
    :is-open="showStreamDialog" 
    @close="showStreamDialog = false"
  />
</template>


<style scoped>

.bg-blued {
   background-color: rgba(4, 13, 42, 1);
}

.border-blue-neon {
   border-color: rgba(8, 34, 130, 1);
   border-width: 2px;
}

.border-status {
   background-color:rgba(46, 88, 242, 1);
   border-width: 2px;
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
