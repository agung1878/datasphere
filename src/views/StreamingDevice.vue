<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { 
  Power, Volume2, Volume1, Triangle, Circle, Square, Camera, Keyboard, WifiOff 
} from 'lucide-vue-next';
import StreamDeviceDialog from '@/components/dialogs/StreamDeviceDialog.vue';
import WarningShowAlldevicesDialog from '@/components/dialogs/WarningShowAlldevicesDialog.vue';   
const route = useRoute();
const router = useRouter();
const locationId = route.params.id;
const goBack = () => {
  router.push('/location/' + locationId);
};
const showWarningShowAllDevicesDialog = ref(false);
const locationName = "Polda Lampung";
const streams = ref([
   { name: 'R9RY30053XZ', status: 'active', url: 'http://13.13.13.27:8000/#!action=stream&udid=R9CTB042G9F&player=mse&ws=ws%3A%2F%2F13.13.13.27%3A8000%2F%3Faction%3Dproxy-adb%26remote%3Dtcp%253A8886%26udid%3DR9CTB042G9F' },
   { name: 'R9RY30053XC', status: 'active', url: 'http://13.13.13.27:8000/#!action=stream&udid=R9CTC00TRRD&player=mse&ws=ws%3A%2F%2F13.13.13.27%3A8000%2F%3Faction%3Dproxy-adb%26remote%3Dtcp%253A8886%26udid%3DR9CTC00TRRD' },
   { name: 'R9RY30053XB', status: 'active', url: 'http://13.13.13.27:8000/#!action=stream&udid=R9CW7018GJW&player=mse&ws=ws%3A%2F%2F13.13.13.27%3A8000%2F%3Faction%3Dproxy-adb%26remote%3Dtcp%253A8886%26udid%3DR9CW7018GJW' },
   { name: 'R9RY30053XN', status: 'active', url: 'about:blank' }, // Placeholder URL
   { name: 'R9RY300C8RP', status: 'offline', url: '' },
   { name: 'Empty Slot', status: 'empty', url: '' }, 
]);

const iframeRef = ref(null)
function accessIframe() {
  const iframe = iframeRef.value
  const doc = iframe.contentWindow.document

  const deviceView = doc.querySelector('.device-view')
  const stream = doc.querySelector('.stream')

  console.log(deviceView, stream)
}


console.log("access iframe: ", iframeRef); 

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
            <span class="text-gray-300">{{ locationName }}</span>
            <span class="mx-2 text-gray-600">/</span>
            <span class="text-blue-500 font-bold underline decoration-blue-500/30 underline-offset-4">Streaming Device</span>
          </div>
          <!-- Refresh Action -->
          <div class="ml-auto flex items-center h-full">
             <div class="h-6 w-px bg-slate-700/50"></div>
             <button
             @click="showWarningShowAllDevicesDialog = true"
               class="flex items-center justify-center
                        bg-[url('@/assets/img/bg_refresh.png')]
                        bg-no-repeat bg-[length:100%_100%]
                        min-w-[209px] min-h-[37px]
                        hover:bg-blue-500"
               >
               <span class="text-xs font-bold text-white">
                  Show All Devices
               </span>
               </button>
          </div>
       </div>
    </div>
    <!-- Streaming Grid -->
    <div class="h-full overflow-y-auto custom-scrollbar p-6">
       <div class="flex flex-wrap justify-center gap-4">
          <div v-for="(stream, index) in streams" :key="index" 
               class="bg-[#050C25] w-[425px] h-[720px] border border-blue-900/50 rounded-xl overflow-hidden flex flex-col items-center relative shadow-[0_0_30px_rgba(8,34,130,0.3)]">
             
             <!-- Header (Only for Active/Offline) -->
             <div v-if="stream.status !== 'empty'" class="w-full py-3 bg-[#081736] border-b border-blue-900/30 text-center relative shrink-0">
                <span class="text-white font-bold tracking-wider text-sm">{{ stream.name }}</span>
                 <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                   <div class="w-1.5 h-1.5 rounded-full" :class="stream.status === 'active' ? 'bg-green-500' : 'bg-red-500'"></div>
                 </div>
             </div>
             <!-- Content Area -->
             <div class="flex-1 w-full relative h-full flex overflow-hidden aspect-video">
                
                <!-- ACTIVE STATE -->
               <template v-if="stream.status === 'active'">
                  <iframe 
                           :src="stream.url" 
                           class="absolute inset-0 w-full h-full border-none"
                           allowfullscreen
                        ></iframe>
                  </template>
                <!-- OFFLINE STATE -->
                <template v-else-if="stream.status === 'offline'">
                   <div class="w-full h-full flex flex-col items-center justify-center bg-black/50 p-6 text-center">
                      <div class="mb-6 relative">
                         <img src="@/assets/img/icon_disconnected.png" class="w-20 h-20" alt="Offline" />
                         <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-24 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
                         </div>
                      </div>
                      <h3 class="text-white text-lg font-bold mb-2">Device Offline</h3>
                      <p class="text-gray-400 text-xs mb-6 max-w-[200px] leading-relaxed">
                         Unable to connect to the device. Try reconnecting or check the device status.
                      </p>
                      <button class="px-8 py-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500 text-blue-300 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                         Retry
                      </button>
                   </div>
                   <!-- Ghost Toolbar for visual consistency -->
                   <!-- <div class="w-12 bg-[#1A202C]/50 border-l border-white/5 flex flex-col items-center py-4 gap-6 shrink-0 opacity-30 pointer-events-none">
                      <Power class="w-5 h-5" /><Volume2 class="w-5 h-5" /><Volume1 class="w-5 h-5" />
                   </div> -->
                </template>
                <!-- EMPTY STATE -->
                <template v-else>
                   <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1739] to-[#050C25] p-6 text-center border-2 border-dashed border-blue-900/30 m-4 rounded-xl group hover:border-blue-500/30 transition-colors">
                      <div class="w-24 h-32 border-4 border-gray-600 rounded-[1rem] mb-6 flex flex-col items-center justify-end pb-4 relative opacity-50 group-hover:opacity-80 transition-opacity">
                         <div class="w-12 h-1 bg-gray-600 rounded-full mb-2"></div>
                      </div>
                      <h3 class="text-white text-lg font-bold mb-2">No Device Selected</h3>
                      <p class="text-gray-500 text-xs mb-8">Please add a device to begin.</p>
                      <button @click="showStreamDialog = true" class="px-6 py-2.5 bg-transparent hover:bg-white/5 border border-white/20 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                         Add Device
                      </button>
                   </div>
                </template>
             </div>
          </div>
       </div>
    </div>
    </div>
  </div>

  <WarningShowAlldevicesDialog 
    :is-open="showWarningShowAllDevicesDialog" 
    @close="showWarningShowAllDevicesDialog = false"
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

iframe {
  border: none;
  display: block;
  pointer-events: auto;
}
</style>