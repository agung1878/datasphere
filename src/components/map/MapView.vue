<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Wifi } from 'lucide-vue-next';
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

// State for Right Panel
const showPanel = ref(false);
const selectedLocation = ref(null);

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

// Initialize map
const initializeMap = () => {
  if (!mapContainer.value || map) return;

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([-3.550989154516016, 120.3330422389674], 5); // Centers on Lampung roughly

  // Dark Matter Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Create a layer group for markers
  markersLayer = L.layerGroup().addTo(map);

  // Custom Zoom Control at bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map);
};

// Render markers from dashboard data
const renderMarkers = () => {
  if (!map || !markersLayer) return;

  // Clear existing markers
  markersLayer.clearLayers();

  const locations = dashboardStore.mapLocations;
  
  if (locations.length === 0) return;

  // Render Markers
  locations.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng], { 
      icon: createCustomIcon(loc.count, loc.status) 
    }).addTo(markersLayer);
    
    // Popup Content - Show children (POLRES) list
    const childrenCount = loc.childrenCount || 0;
    
    // Build children list HTML
    let childrenListHTML = '';
    if (loc.children && loc.children.length > 0) {
      // Show up to 3 children in popup
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
            <div class="bg-[#2563eb] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-400/30 text-white tracking-wider ml-2">${child.ip}</div>
          </div>
        `;
      }).join('');
      
      // Add "more" indicator if there are more than 3 children
      if (loc.children.length > 3) {
        childrenListHTML += `
          <div class="text-center text-[10px] text-slate-400">
            +${loc.children.length - 3} more...
          </div>
        `;
      }
    }
    
    const popupContent = `
      <div class="popup-custom-content relative w-full h-full text-white p-4 pl-6 font-sans flex flex-col justify-center">
        <!-- Header -->
        <div class="flex justify-between items-center">
             <h2 class="font-extrabold text-xl uppercase tracking-wider text-white truncate max-w-[220px] leading-tight">${loc.name}</h2>
             <div class="bg-[#1e3a8a] text-white text-[7px] font-bold px-2 py-0.5 rounded border border-blue-400/50 shadow-blue-900/50 min-w-max">PDN 23</div>
        </div>

        <span class="text-blue-300 text-xs">${childrenCount} Polres</span>
        
        <!-- Children (POLRES) List -->
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

    marker.on('mouseover', () => {
      marker.openPopup();
    });

    marker.on('mouseout', () => {
      marker.closePopup();
    });

    marker.on('click', () => {
      // Toggle Logic using ID
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
});

// Watch for changes in dashboard data and re-render markers
watch(() => dashboardStore.mapLocations, () => {
  renderMarkers();
}, { deep: true });
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="w-full h-full z-0 absolute inset-0 bg-slate-900"></div>

    <div class="info-server">
            <div class="w-80 bg-[#00000080]/50 rounded-2xl shadow-2xl p-6 text-white font-medium">
                <div class="text-xs mb-4">
                    Total Phone Bank : <span>{{servers.total}}</span> Devices
                </div>
                <div class="space-y-1">
                    <div class="flex items-start justify-between px-8">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                            <span class="text-xs">Healthy</span>
                        </div>
                        <span class="text-xs">:</span>
                        <div class="text-right">
                            <span class="text-xs">{{ servers.online + ' Devices'}}</span>
                        </div>
                    </div>
                    <div class="flex items-start justify-between px-8">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
                            <span class="text-xs">Issues</span>
                        </div>
                        <span class="text-xs">:</span>
                        <div class="text-right">
                            <span class="text-xs">{{ servers.warning + ' Devices'}}</span>
                        </div>
                    </div>
                    <div class="flex items-start justify-between px-8">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-red-600 rounded-full shadow-lg shadow-red-600/50"></div>
                            <span class="text-xs">Offline</span>
                        </div>
                        <span class="text-xs">:</span>
                        <div class="text-right">
                            <span class="text-xs">{{ servers.offline + ' Devices'}}</span>
                        </div>
                    </div>
                </div>
            </div>
    </div>
    
    <!-- Right Panel Component -->
    <!-- Show children (POLRES) of the selected POLDA -->
    <RightPanel 
      :show="showPanel" 
      :activeLocationId="selectedLocation?.children?.[0]?.id"
      :items="selectedLocation?.children || []"
      @close="showPanel = false" 
    />
  </div>
</template>

<style>
/* Custom Popup Styling */
.custom-leaflet-popup .leaflet-popup-content-wrapper {
  background: linear-gradient(358.89deg, #2E58F2 -223.79%, #000000 227.98%) !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
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
  /* height: 166px !important; */
}

.popup-custom-content {
  background-image: url('@/assets/img/popup_mask.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* Blend mode to mix with gradient if needed, or just let transparency work */
}

.info-server {
    position: absolute;
    left: 18px;
    top: 80px;
    z-index: 1000;
}
</style>
