<script setup>
import { onMounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Wifi } from 'lucide-vue-next';
import RightPanel from './RightPanel.vue';

// State for Right Panel
const showPanel = ref(false);
const selectedLocation = ref(null);

const createCustomIcon = (count) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="relative group cursor-pointer">
        <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50 border-2 border-white/20 z-10 relative transition-transform duration-300 hover:scale-110">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
        </div>
        <div class="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-700 z-20">
          ${count}
        </div>
        <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const mapContainer = ref(null);
let map = null;

// Unified Data Source
const locations = [
  { 
    id: 1,
    name: "Polres Bandar Lampung", 
    lat: -5.4496, 
    lng: 105.2725, 
    count: 30, 
    address: "Jl. MT Haryono No.1",
    status: 'Healthy',
    statusLabel: 'Healthy',
    subtext: 'All Devices Running Properly',
    devices: { active: 30, total: 30 },
    autoUpdate: 'Enable',
    checks: [
      { label: 'Automation Git Health', status: false },
      { label: 'Automation Symlink', status: true },
      { label: 'Grazling Git Health', status: false },
      { label: 'Grazling Symlink', status: true },
      { label: 'Cron Status', status: false },
    ]
  },
  { 
    id: 2,
    name: "Polres Lampung Tengah", 
    lat: -4.9496, 
    lng: 105.2025, // Tweaked coords to be visible nearby
    count: 26, 
    address: "Jl. Raya Lintas Sumatera",
    status: 'Issue',
    statusLabel: '2 Issue',
    subtext: 'WhatsApp Outdated (2 devices)',
    devices: { active: 30, total: 30 },
    autoUpdate: 'Enable',
    checks: [
      { label: 'Automation Git Health', status: true },
      { label: 'Automation Symlink', status: true },
      { label: 'Grazling Git Health', status: true },
      { label: 'Grazling Symlink', status: true },
      { label: 'Cron Status', status: true },
    ]
  },
  { 
    id: 3,
    name: "Polres Mesuji", 
    lat: -4.0496, 
    lng: 105.4025, // Tweaked coords
    count: 0, 
    address: "Jl. Lintas Timur",
    status: 'Offline',
    statusLabel: 'Offline',
    subtext: 'Offline',
    devices: { active: 0, total: 30 },
    autoUpdate: 'Disable',
    checks: [
      { label: 'Automation Git Health', status: false },
      { label: 'Automation Symlink', status: false },
      { label: 'Grazling Git Health', status: false },
      { label: 'Grazling Symlink', status: false },
      { label: 'Cron Status', status: false },
    ]
  }
];

onMounted(() => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([-5.4500, 105.2663], 9); // Centers on Lampung roughly

  // Dark Matter Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Render Markers
  locations.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng], { icon: createCustomIcon(loc.count) }).addTo(map);
    
    // Popup Content matches the selected location data
    const popupContent = `
      <div class="popup-custom-content relative w-full h-full text-white p-4 pl-6 font-sans flex flex-col justify-center">
        <!-- Header -->
        <div class="flex justify-between items-center">
             <h3 class="font-extrabold text-xl uppercase tracking-wider text-white truncate max-w-[220px] leading-tight">${loc.name}</h3>
             <div class="bg-[#1e3a8a] text-white text-[9px] font-bold px-2 py-0.5 rounded border border-blue-400/50 shadow-blue-900/50 min-w-max">PDN 23</div>
        </div>

        <span class="text-blue-300 text-sm font-medium ">${loc.address}</span>
        
        <!-- List Items -->
        <div class="space-y-1.5 mt-1">
             <!-- Item 1 -->
             <div class="flex justify-between items-center group">
                <div class="leading-tight">
                   <span class="block text-white text-xs tracking-wide truncate max-w-[180px]">Polres Bandar Lampung</span>
                   <span class="text-[10px] text-slate-400 font-medium">30/30 Devices</span>
                </div>
                 <div class="bg-[#2563eb] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-400/30 text-white tracking-wider ml-2">11.11.11.86</div>
             </div>
             
             <!-- Item 2 -->
             <div class="flex justify-between items-center group">
                <div class="leading-tight">
                   <span class="block text-white text-xs tracking-wide truncate max-w-[180px]">Polres Lampung Tengah</span>
                   <span class="text-[10px] text-slate-400 font-medium">26/30 Devices</span>
                </div>
                 <div class="bg-[#2563eb] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-400/30 text-white tracking-wider ml-2">11.11.11.88</div>
             </div>

             <!-- Item 3 -->
             <div class="flex justify-between items-center group">

                <div class="leading-tight">
                   <span class="block text-white text-xs tracking-wide truncate max-w-[180px]">Polres Lampung Tengah</span>
                   <span class="text-[10px] text-slate-400 font-medium">26/30 Devices</span>
                </div>
                 <div class="bg-[#2563eb] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-400/30 text-white tracking-wider ml-2">11.11.11.88</div>
             </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      className: 'custom-leaflet-popup',
      closeButton: false,
      maxWidth: 379,
      minWidth: 379,
      offset: [0, -10]
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

  // Handle map click to close panel if needed? 
  // For now let's keep it open or use the close button in panel.
  
  // Custom Zoom Control at bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map);
});
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="w-full h-full z-0 absolute inset-0 bg-slate-900"></div>
    
    <!-- Right Panel Component -->
    <RightPanel 
      :show="showPanel" 
      :activeLocationId="selectedLocation?.id"
      :items="locations"
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
  height: 166px !important;
}

.popup-custom-content {
  background-image: url('@/assets/img/popup_mask.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* Blend mode to mix with gradient if needed, or just let transparency work */
}
</style>
