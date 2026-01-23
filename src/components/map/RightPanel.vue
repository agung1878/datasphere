<script setup>
import { computed, watch, ref, nextTick, onMounted } from 'vue';
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
  router.push({
    name: 'location-detail',
    params: { id: item.id },
    state: { locationData: item }
  });
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

/**
 * Returns Tailwind classes based on the phone_bank status
 */
const getBadgeStyles = (status) => {
  const base = "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300";

  switch (status?.toLowerCase()) {
    case 'healthy':
      return `${base} bg-green-500/20 text-green-400 border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.2)]`;
    case 'issue':
      return `${base} bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)]`;
    case 'offline':
      return `${base} bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]`;
    default:
      return `${base} bg-slate-700/50 text-slate-400 border-slate-600/50`;
  }
};

// Helper to get health check data from phone_banks
const getHealthCheck = (item) => {
  const phoneBank = item.phone_banks?.[0];
  return phoneBank?.data?.health_check || {};
};

const getPhoneBankCount = (item) => {
  const phoneBank = item.phone_banks?.[0];
  return phoneBank?.data?.count || {};
};

// Helper to get auto update data from phone_banks
const getAutoUpdateGrazling = (item) => {
  const phoneBank = item.phone_banks?.[0];
  return phoneBank?.data?.auto_update?.grazling ? "Enable" : "Disable";
};

const getAutoUpdateAutomation = (item) => {
  const phoneBank = item.phone_banks?.[0];
  return phoneBank?.data?.auto_update?.automation ? "Enable" : "Disable";
};

const itemRefs = ref({});
const setItemRef = (el, id) => {
  if (el) {
    itemRefs.value[id] = el;
  }
};

/**
 * Converts a date into a human-readable relative time string.
 * @param {Date | number} date - The date object or timestamp to compare.
 * @param {string} [lang='en'] - The language code (e.g., 'en', 'es', 'fr').
 * @returns {string} - The formatted relative time string.
 */
function getRelativeTimeString(date, lang = 'en') {
  const timeMs = typeof date === 'number' ? date : date.getTime();
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

  // Array of time units and their values in seconds
  const cutoffs = [
    { type: 'year', value: 31536000 },
    { type: 'month', value: 2592000 },
    { type: 'week', value: 604800 },
    { type: 'day', value: 86400 },
    { type: 'hour', value: 3600 },
    { type: 'minute', value: 60 },
    { type: 'second', value: 1 },
  ];

  // Find the appropriate unit for the delta
  const unitObj = cutoffs.find(x => Math.abs(deltaSeconds) >= x.value) || cutoffs[cutoffs.length - 1];

  // Create the Intl formatter
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

  // Calculate the value for the unit and format it
  return rtf.format(Math.floor(deltaSeconds / unitObj.value), unitObj.type);
}

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
    :class="show ? 'translate-x-0' : 'translate-x-full'">

    <button @click="$emit('close')"
      class="absolute top-20 left-[-40px] bg-slate-800 text-white p-2 rounded-l-md border-y border-l border-white/10 hover:bg-slate-700 transition-colors">
      <X class="w-5 h-5" />
    </button>

    <div class="overflow-y-auto flex-1 custom-scrollbar pb-10">
      <div v-for="item in items" :key="item.id" :ref="(el) => setItemRef(el, item.id)"
        class="mb-2 transition-opacity duration-500 cursor-pointer"
        :class="{ 'opacity-100': item.id === activeLocationId, 'opacity-40 hover:opacity-100': activeLocationId && item.id !== activeLocationId }"
        @click="goToDetail(item)">

        <div class="relative overflow-hidden border-y border-white/10">
          <div class="absolute inset-0">
            <img :src="getHeaderBg(item.status)" class="w-full h-full object-cover" alt="" />
          </div>

          <div class="relative z-10 px-6 pt-6 pb-3">
            <div class="flex justify-between items-center">
              <div class="flex flex-row gap-1 items-center justify-between w-full">
                <div class="flex flex-col">
                  <h2 class="text-2xl font-bold text-white tracking-wide">
                    {{ item.name }}
                  </h2>
                  <small>{{ item.phone_banks[0]?.latest_ping ? getRelativeTimeString(new
                    Date(item.phone_banks[0]?.latest_ping),
                    'en') : "-" }}</small>
                </div>

                <div v-if="item?.phone_banks?.[0]?.status" :class="getBadgeStyles(item.phone_banks[0].status)">
                  {{ item.phone_banks[0].status }}
                </div>
              </div>

              <div
                class="flex items-center gap-1 text-sm font-medium text-white bg-black/20 px-3 py-1 rounded-md border border-white/5">
                {{ item.statusLabel }}
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <div class="relative z-10 bg-black/70 px-6 py-2">
            <p class="text-xs text-gray-200 tracking-wide">
              {{ item.phone_banks[0].type }}
            </p>
          </div>
        </div>

        <div class="px-4 py-2 grid grid-cols-2 gap-4 bg-slate-900/40 mt-2">
          <div
            class="bg-slate-800/50 border border-white/5 rounded-lg p-3 relative overflow-hidden group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">PHONE ACTIVE</div>
                <div class="text-2xl font-bold text-white">
                  {{ getPhoneBankCount(item).healthy || 0 }}<span class="text-gray-500 text-lg">/{{
                    getPhoneBankCount(item).all || 0 }}</span>
                </div>
              </div>
              <img src="@/assets/img/ic_outline_phone_android.png" class="min-w-[41px] min-h-[41px] opacity-50" />
            </div>
          </div>

          <div
            class="bg-slate-800/50 border border-white/5 rounded-lg p-3 relative overflow-hidden group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">AUTO-UPDATE</div>
                <div class="text-[11px] text-white tracking-wide leading-tight">
                  <div>Grazling: <span class="text-blue-400 font-bold">{{ getAutoUpdateGrazling(item) }}</span></div>
                  <div>Automation: <span class="text-blue-400 font-bold">{{ getAutoUpdateAutomation(item) }}</span>
                  </div>
                </div>
              </div>
              <img src="@/assets/img/ic_round_update.png" class="min-w-[41px] min-h-[41px] opacity-50" />
            </div>
          </div>
        </div>

        <div class="px-4 py-2 grid grid-cols-2 gap-4 bg-slate-900/40">
          <div
            class="min-h-[46px] bg-slate-800/50 border border-white/5 rounded-lg p-3 group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Automation Git</span>
              <img
                :src="getHealthCheck(item).automation_git_health ? getImageUrl('ic_on.png') : getImageUrl('ic_off.png')"
                class="w-5 h-5" />
            </div>
          </div>
          <div
            class="min-h-[46px] bg-slate-800/50 border border-white/5 rounded-lg p-3 group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Automation Symlink</span>
              <img :src="getHealthCheck(item).automation_symlink ? getImageUrl('ic_on.png') : getImageUrl('ic_off.png')"
                class="w-5 h-5" />
            </div>
          </div>
          <div
            class="min-h-[46px] bg-slate-800/50 border border-white/5 rounded-lg p-3 group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Grazling Git</span>
              <img
                :src="getHealthCheck(item).grazling_git_health ? getImageUrl('ic_on.png') : getImageUrl('ic_off.png')"
                class="w-5 h-5" />
            </div>
          </div>
          <div
            class="min-h-[46px] bg-slate-800/50 border border-white/5 rounded-lg p-3 group hover:bg-slate-800/70 transition-colors">
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Grazling Symlink</span>
              <img :src="getHealthCheck(item).grazling_symlink ? getImageUrl('ic_on.png') : getImageUrl('ic_off.png')"
                class="w-5 h-5" />
            </div>
          </div>
          <div
            class="min-h-[46px] bg-slate-800/50 border border-white/5 rounded-lg p-3 group hover:bg-slate-800/70 transition-colors col-span-1">
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Cron Status</span>
              <img :src="getHealthCheck(item).cron_status ? getImageUrl('ic_on.png') : getImageUrl('ic_off.png')"
                class="w-5 h-5" />
            </div>
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