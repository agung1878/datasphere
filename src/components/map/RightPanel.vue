<script setup>
import { computed, watch, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Smartphone, RefreshCw, X, ChevronDown, Check, AlertCircle } from 'lucide-vue-next';

const router = useRouter();

const props = defineProps({
  show: Boolean,
  items: {
    type: Array,
    default: () => []
  },
  activeLocationId: [Number, String]
});

const emit = defineEmits(['close']);

const goToDetail = (item) => {
  router.push({ name: 'location-detail', params: { id: item.id } });
};


// Helper to resolve images (Vite specific)
const getImageUrl = (name) => {
  return new URL(`../../assets/img/${name}`, import.meta.url).href;
};

const getHeaderBg = (status) => {
  switch (status) {
    case 'Issue': return getImageUrl('header_item_orange.png');
    case 'Offline': return getImageUrl('header_item_red.png');
    default: return getImageUrl('header_item.png');
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Issue': return 'text-white border-orange-500/50 shadow-orange-500/10';
    case 'Offline': return 'text-white border-red-500/50 shadow-red-500/10';
    default: return 'text-white border-green-500/50 shadow-green-500/10';
  }
};

const itemRefs = ref({});
const setItemRef = (el, id) => {
  if (el) {
    itemRefs.value[id] = el;
  }
};

// Scroll to active item when it changes or panel opens
watch(
  [() => props.activeLocationId, () => props.show],
  async ([newId, isShown]) => {
    if (isShown && newId && itemRefs.value[newId]) {
      await nextTick();
      itemRefs.value[newId].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
);
</script>

<template>
  <div 
    class="fixed right-0 top-0 h-full w-[635px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-[60] transform transition-transform duration-500 ease-in-out flex flex-col pt-20"
    :class="show ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Close Button -->
    <button 
      @click="$emit('close')" 
      class="absolute top-20 left-[-40px] bg-slate-800 text-white p-2 rounded-l-md border-y border-l border-white/10 hover:bg-slate-700 transition-colors"
    >
      <X class="w-5 h-5" />
    </button>

    <div class="overflow-y-auto flex-1 custom-scrollbar pb-10">
      
      <div 
        v-for="item in items" 
        :key="item.id" 
        :ref="(el) => setItemRef(el, item.id)"
        class="mb-2 transition-opacity duration-500 cursor-pointer"
        :class="{'opacity-100': item.id === activeLocationId, 'opacity-40 hover:opacity-100': activeLocationId && item.id !== activeLocationId}"
        @click="goToDetail(item)"
      >
        <!-- Header Section -->
        <div class="relative overflow-hidden border-y border-white/10">
  <!-- Gradient background -->
  <div class="absolute inset-0">
    <img
      :src="getHeaderBg(item.status)"
      class="w-full h-ful"
      alt=""
    />
  </div>

  <!-- Header content -->
        <div class="relative z-10 px-6 pt-6 pb-3">
            <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-white tracking-wide">
                {{ item.name }}
            </h2>

            <div
                class="flex items-center gap-1 text-sm font-medium text-white"
            >
                {{ item.statusLabel }}
                <ChevronDown class="w-4 h-4" />
            </div>
            </div>
        </div>

        <!-- Black strip -->
        <div class="relative z-10 bg-black/70 px-6 py-2">
            <p class="text-xs text-gray-200 tracking-wide">
            {{ item.subtext }}
            </p>
        </div>
        </div>

        <!-- Dashboard Grid -->
        <div class="p-4 grid grid-cols-2 gap-4 bg-slate-900/40">
          <!-- Phone Active Card -->
          <div class="bg-slate-800/50 border border-white/5 rounded-lg p-3 relative overflow-hidden group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">PHONE ACTIVE</div>
                <div class="text-2xl font-bold text-white">
                  {{ item.devices?.active || (item.phone_banks?.filter(pb => pb.status !== 'offline' && pb.status !== 'issue').length || 0) }}<span class="text-gray-500 text-lg">/{{ item.devices?.total || item.phone_banks?.length || 0 }}</span>
                </div>
              </div>
              <Smartphone class="w-6 h-6 text-white/50" />
            </div>
          </div>

          <!-- Auto Update Card -->
           <div class="bg-slate-800/50 border border-white/5 rounded-lg p-3 relative overflow-hidden group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">AUTO-UPDATE</div>
                <div class="text-xl font-bold text-white tracking-wide">
                  {{ item.autoUpdate || 'N/A' }}
                </div>
              </div>
               <RefreshCw class="w-6 h-6 text-white/50" />
            </div>
          </div>
        </div>

        <!-- Status List -->
        <div class="px-4 pb-6 grid grid-cols-2 gap-2 bg-slate-900/40">
          <div v-for="(check, idx) in item.checks" :key="idx" class="flex justify-between items-center p-3 bg-slate-800/30 rounded border border-white/5 hover:border-white/10 transition-colors">
            <span class="text-sm text-gray-300">{{ check.label }}</span>
            <div :class="`w-3 h-3 rounded shadow-inner ${check.status ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`"></div>
          </div>
        </div>
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
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
