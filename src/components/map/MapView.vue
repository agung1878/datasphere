<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Wifi, Search, X, Command } from 'lucide-vue-next'; // Added icons
import RightPanel from './RightPanel.vue';
import iconMarkOn from '@/assets/img/icon_mark_on.png';
import iconMarkGrey from '@/assets/img/icon_mark_grey.png';
import { useDashboardStore } from '@/stores/dashboard';

const dashboardStore = useDashboardStore();

const servers = computed(() => ({
  total: dashboardStore.totalServers,
  warning: dashboardStore.issueServers,
  offline: dashboardStore.offlineServers,
  online: dashboardStore.healthyServers
}));

// State for Panels & Search
const showPanel = ref(false);
const selectedLocation = ref(null);
const showSearchModal = ref(false);
const searchInput = ref('');
const searchInputRef = ref(null);

// Keyboard Shortcut Logic (CTRL+K / CMD+K)
const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    toggleSearch();
  }
  if (e.key === 'Escape' && showSearchModal.value) {
    showSearchModal.value = false;
  }
};

const toggleSearch = () => {
  showSearchModal.value = !showSearchModal.value;
  if (showSearchModal.value) {
    // Focus input after modal opens
    setTimeout(() => searchInputRef.value?.focus(), 100);
  }
};

// Debounce Logic
let debounceTimeout = null;
watch(searchInput, (newVal) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    dashboardStore.setSearchQuery(newVal);
    console.log('Global search updated:', newVal);
  }, 300); // 300ms debounce
});

const createCustomIcon = (count, status) => {
  const isOnline = status !== 'Offline';
  const iconSrc = isOnline ? iconMarkOn : iconMarkGrey;

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="relative group cursor-pointer">
        <div class="relative z-10 transition-transform duration-300 hover:scale-110">
           <img src="${iconSrc}" class="w-12 h-12 contain" alt="Marker" />
        </div>
        <div class="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-700 z-20">
          ${count}
        </div>
        ${isOnline ? '<div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50 scale-75"></div>' : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
};

const mapContainer = ref(null);
let map = null;
let markersLayer = null;

const initializeMap = () => {
  if (!mapContainer.value || map) return;

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([-3.550989154516016, 120.3330422389674], 5);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
};

const renderMarkers = () => {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  const locations = dashboardStore.filteredMapLocations;
  console.log("filteredMapLocations:", locations)
  if (locations.length === 0) return;

  locations.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng], {
      icon: createCustomIcon(loc.count, loc.status)
    }).addTo(markersLayer);

    const childrenCount = loc.childrenCount || 0;
    let childrenListHTML = '';

    if (loc.children && loc.children.length > 0) {
      const displayChildren = loc.children.slice(0, 3);
      childrenListHTML = displayChildren.map(child => {
        const childDeviceCount = child.phone_banks?.length || 0;
        const childActiveCount = child.phone_banks?.filter(pb => pb.status !== 'offline' && pb.status !== 'issue').length || 0;
        return `
          <div class="flex justify-between items-center group">
            <div class="leading-tight">
              <span class="block text-white text-xs tracking-wide truncate max-w-[160px]">${child.name}</span>
              <span class="text-[10px] text-slate-400 font-medium">${childActiveCount}/${childDeviceCount} Devices</span>
            </div>
            <div class="bg-[#2563eb] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-400/30 text-white tracking-wider ml-2">${child.phone_banks?.[0]?.type}</div>
          </div>
        `;
      }).join('');

      if (loc.children.length > 3) {
        childrenListHTML += `<div class="text-center text-[10px] text-slate-400">+${loc.children.length - 3} more...</div>`;
      }
    }

    const popupContent = `
      <div class="popup-custom-content relative w-full h-full text-white p-4 pl-6 font-sans flex flex-col justify-center">
        <div class="flex justify-between items-center">
             <h2 class="font-extrabold text-xl uppercase tracking-wider text-white leading-tight">${loc.name}</h2>
             
        </div>
        <span class="text-blue-300 text-xs">${childrenCount} Polres</span>
        <div class="space-y-1.5 mt-1">
          ${childrenListHTML || '<div class="text-xs text-slate-400">No children available</div>'}
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      className: 'custom-leaflet-popup',
      closeButton: false,
      maxWidth: 379,
      minWidth: 379,
      maxHeight: 300,
      minHeight: 300,
      offset: [0, -10]
    });

    marker.on('mouseover', () => marker.openPopup());
    marker.on('mouseout', () => marker.closePopup());
    marker.on('click', () => {
      if (selectedLocation.value && selectedLocation.value.id === loc.id && showPanel.value) {
        showPanel.value = false;
        selectedLocation.value = null;
      } else {
        selectedLocation.value = loc;
        showPanel.value = true;
      }
    });
  });
};

onMounted(() => {
  initializeMap();
  renderMarkers();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

watch(() => dashboardStore.filteredMapLocations, () => {
  renderMarkers();
}, { deep: true });
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="w-full h-full z-0 absolute inset-0 bg-slate-900"></div>

    <div class="info-server">
      <div
        class="w-80 bg-[#00000080]/50 backdrop-blur-md rounded-2xl shadow-2xl p-6 text-white font-medium border border-white/10">
        <div class="flex justify-between items-center mb-4">
          <div class="text-xs">
            Total Phone Bank : <span class="text-blue-400">{{ servers.total }}</span> Devices
          </div>
          <div
            class="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded border border-white/10 text-[9px] text-gray-400">
            <Command class="w-2.5 h-2.5" /> K
          </div>
        </div>

        <div class="space-y-1">
          <div class="flex items-start justify-between px-8">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
              <span class="text-xs">Healthy</span>
            </div>
            <span class="text-xs">:</span>
            <span class="text-xs text-right">{{ servers.online }} Devices</span>
          </div>
          <div class="flex items-start justify-between px-8">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
              <span class="text-xs">Issues</span>
            </div>
            <span class="text-xs">:</span>
            <span class="text-xs text-right">{{ servers.warning }} Devices</span>
          </div>
          <div class="flex items-start justify-between px-8">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-red-600 rounded-full shadow-lg shadow-red-600/50"></div>
              <span class="text-xs">Offline</span>
            </div>
            <span class="text-xs">:</span>
            <span class="text-xs text-right">{{ servers.offline }} Devices</span>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showSearchModal"
        class="fixed inset-0 z-[200] flex items-start justify-center pt-32 bg-slate-950/60 backdrop-blur-sm px-4"
        @click.self="showSearchModal = false">
        <div
          class="w-full max-w-2xl bg-slate-900 border border-white/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all">
          <div class="flex items-center p-4 gap-4 border-b border-white/5">
            <Search class="w-6 h-6 text-slate-400" />
            <input ref="searchInputRef" v-model="searchInput" type="text"
              placeholder="Search by location, POLRES name or IP..."
              class="flex-1 bg-transparent border-none text-white text-lg focus:ring-0 outline-none placeholder:text-slate-500" />
            <div
              class="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg border border-white/5 text-[10px] text-slate-400">
              ESC
            </div>
            <button @click="showSearchModal = false" class="p-1 hover:bg-white/5 rounded-full transition-colors">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div class="p-4 bg-slate-900/50">
            <div v-if="!searchInput" class="text-slate-500 text-sm">
              Type to search across all locations...
            </div>
            <div v-else class="text-blue-400 text-sm font-medium">
              Searching for: "{{ searchInput }}"
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <RightPanel :show="showPanel" :activeLocationId="selectedLocation?.children?.[0]?.id"
      :items="selectedLocation?.children || []" @close="showPanel = false" />
  </div>
</template>

<style>
/* Custom Popup Styling */
.custom-leaflet-popup .leaflet-popup-content-wrapper {
  background: linear-gradient(358.89deg, #2E58F2 -223.79%, #000000 227.98%) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
  padding: 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  overflow: hidden;
}

.custom-leaflet-popup .leaflet-popup-tip {
  display: none !important;
}

.custom-leaflet-popup .leaflet-popup-content {
  margin: 0 !important;
  width: 379px !important;
}

.popup-custom-content {
  background-image: url('@/assets/img/popup_mask.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.info-server {
  position: absolute;
  left: 18px;
  top: 80px;
  z-index: 1000;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>