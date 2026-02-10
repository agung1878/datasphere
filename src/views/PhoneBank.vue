<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ChevronLeft, Plus, Edit, Trash2, Search, Filter,
  Server, Wifi, HardDrive, Calendar, CheckCircle,
  AlertCircle, XCircle, RefreshCw, Eye
} from 'lucide-vue-next';
import { 
  getPhoneBanks, 
  createPhoneBank, 
  updatePhoneBank, 
  deletePhoneBank,
  getDashboard
} from '@/services/api';

const router = useRouter();

// State
const phoneBanks = ref([]);
const institutions = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const activeFilter = ref('All');

// Modal states
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedPhoneBank = ref(null);

// Form data
const formData = ref({
  institution_id: '',
  type: '',
  release_year: new Date().getFullYear(),
  ip: '',
  version: '',
  auto_update: true,
  username: '',
  password: ''
});

// Reset form
const resetForm = () => {
  formData.value = {
    institution_id: '',
    type: '',
    release_year: new Date().getFullYear(),
    ip: '',
    version: '',
    auto_update: true,
    username: '',
    password: ''
  };
};

// Fetch all phone banks
const fetchPhoneBanks = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await getPhoneBanks();
    phoneBanks.value = response.data || [];
    console.log('Phone banks:', phoneBanks.value);
  } catch (err) {
    error.value = err.message || 'Failed to fetch phone banks';
    console.error('Error fetching phone banks:', err);
  } finally {
    loading.value = false;
  }
};

// Fetch institutions
const fetchInstitutions = async () => {
  try {
    const response = await getDashboard();
    institutions.value = response.data?.institutions || [];
    console.log('Institutions:', institutions.value);
  } catch (err) {
    console.error('Error fetching institutions:', err);
  }
};

// Create phone bank
const handleCreate = async () => {
  try {
    loading.value = true;
    await createPhoneBank(formData.value);
    showCreateModal.value = false;
    resetForm();
    await fetchPhoneBanks();
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to create phone bank';
    console.error('Error creating phone bank:', err);
  } finally {
    loading.value = false;
  }
};

// Edit phone bank
const openEditModal = (phoneBank) => {
  selectedPhoneBank.value = phoneBank;
  formData.value = {
    institution_id: phoneBank.institution_id,
    type: phoneBank.type || '',
    release_year: phoneBank.release_year || new Date().getFullYear(),
    ip: phoneBank.ip || '',
    version: phoneBank.version || '',
    auto_update: phoneBank.auto_update ?? true,
    username: phoneBank.username || '',
    password: phoneBank.password || ''
  };
  showEditModal.value = true;
};

const handleEdit = async () => {
  if (!selectedPhoneBank.value) return;
  
  try {
    loading.value = true;
    await updatePhoneBank(selectedPhoneBank.value.id, formData.value);
    showEditModal.value = false;
    resetForm();
    selectedPhoneBank.value = null;
    await fetchPhoneBanks();
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to update phone bank';
    console.error('Error updating phone bank:', err);
  } finally {
    loading.value = false;
  }
};

// Delete phone bank
const openDeleteModal = (phoneBank) => {
  selectedPhoneBank.value = phoneBank;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!selectedPhoneBank.value) return;
  
  try {
    loading.value = true;
    await deletePhoneBank(selectedPhoneBank.value.id);
    showDeleteModal.value = false;
    selectedPhoneBank.value = null;
    await fetchPhoneBanks();
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to delete phone bank';
    console.error('Error deleting phone bank:', err);
  } finally {
    loading.value = false;
  }
};

// Get institution name by ID
const getInstitutionName = (institutionId) => {
  const institution = institutions.value.find(i => i.id === institutionId);
  return institution?.name || 'Unknown';
};

// Computed stats
const stats = computed(() => {
  const total = phoneBanks.value.length;
  const active = phoneBanks.value.filter(pb => pb.health?.status === 'healthy').length;
  const issues = phoneBanks.value.filter(pb => pb.health?.status === 'issue').length;
  const offline = phoneBanks.value.filter(pb => !pb.health || pb.health?.status === 'offline').length;
  
  return { total, active, issues, offline };
});

// Filtered phone banks
const filteredPhoneBanks = computed(() => {
  let filtered = phoneBanks.value;
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(pb => 
      (pb.ip || '').toLowerCase().includes(query) ||
      (pb.type || '').toLowerCase().includes(query) ||
      (pb.version || '').toLowerCase().includes(query) ||
      getInstitutionName(pb.institution_id).toLowerCase().includes(query)
    );
  }
  
  // Apply status filter
  if (activeFilter.value !== 'All') {
    const statusMap = {
      'Active': 'healthy',
      'Issue': 'issue',
      'Offline': 'offline'
    };
    const targetStatus = statusMap[activeFilter.value];
    filtered = filtered.filter(pb => {
      if (!pb.health && targetStatus === 'offline') return true;
      return pb.health?.status === targetStatus;
    });
  }
  
  return filtered;
});

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '');
};

// Get status color
const getStatusColor = (health) => {
  if (!health) return 'red';
  if (health.status === 'healthy') return 'green';
  if (health.status === 'issue') return 'orange';
  return 'red';
};

// Get status text
const getStatusText = (health) => {
  if (!health) return 'OFFLINE';
  if (health.status === 'healthy') return 'HEALTHY';
  if (health.status === 'issue') return 'ISSUE';
  return 'OFFLINE';
};

const goBack = () => {
  router.push('/');
};

onMounted(() => {
  fetchPhoneBanks();
  fetchInstitutions();
});
</script>

<template>
  <div class="relative h-full w-full bg-slate-900">
    <!-- Background Image -->
    <div class="absolute inset-0 z-0">
      <img src="@/assets/img/background_location.png" class="w-full h-full object-cover opacity-100" alt="" />
      <div class="absolute inset-0 bg-slate-900/40"></div>
    </div>
    
    <!-- Main Content -->
    <div class="relative z-10 h-full flex flex-col pt-[74px] pb-6 overflow-y-auto md:overflow-hidden">
    <!-- Breadcrumb & Back -->
    <div class="relative w-full h-[62px] hidden md:flex items-center px-4 mb-6 flex-shrink-0">
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
            <span class="text-blue-500 font-bold underline decoration-blue-500/30 underline-offset-4">Phone Banks</span>
          </div>

          <!-- Refresh Action -->
          <div class="ml-auto flex items-center h-full">
             <div class="h-6 w-px bg-slate-700/50"></div>
             <button
               @click="fetchPhoneBanks"
               :disabled="loading"
               class="flex items-center justify-center gap-2
                        bg-[url('@/assets/img/bg_refresh.png')]
                        bg-no-repeat bg-[length:100%_100%]
                        min-w-[209px] min-h-[37px]
                        hover:bg-blue-500 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed"
               >
               <RefreshCw :class="loading ? 'animate-spin' : ''" class="w-4 h-4 text-white" />
               <span class="text-xs font-bold text-white">
                  {{ loading ? 'Refreshing...' : 'Refresh Data' }}
               </span>
               </button>
          </div>
       </div>
    </div>

    <!-- Stats Dashboard -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mx-4 md:mx-6 flex-shrink-0">
      <!-- Total -->
      <div class="bg-blued border border-blue-neon rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Phone Banks</p>
            <p class="text-3xl font-bold text-white">{{ stats.total }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Server class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <!-- Active -->
      <div class="bg-blued border border-blue-neon rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Active</p>
            <p class="text-3xl font-bold text-green-400">{{ stats.active }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      <!-- Issues -->
      <div class="bg-blued border border-blue-neon rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.1)]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Issues</p>
            <p class="text-3xl font-bold text-orange-400">{{ stats.issues }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertCircle class="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </div>

      <!-- Offline -->
      <div class="bg-blued border border-blue-neon rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.1)]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Offline</p>
            <p class="text-3xl font-bold text-red-400">{{ stats.offline }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle class="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Phone Banks List Section -->
    <div class="bg-blued border border-blue-neon rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] flex-none h-auto md:flex-1 md:min-h-0 mx-6 flex flex-col">
      
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
         <div class="flex items-center justify-center gap-4 w-full md:w-auto">
            <!-- Add Button -->
            <button 
              @click="showCreateModal = true"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
              <Plus class="w-4 h-4" />
              Add Phone Bank
            </button>
            
            <!-- Filter Buttons -->
            <div class="flex flex-row overflow-x-auto custom-scrollbar md:overflow-visible bg-transparent justify-between rounded-lg p-1 border border-[#2E58F2] w-auto h-auto md:h-[35px] gap-2 md:gap-0">
               <button 
                 @click="activeFilter = 'All'"
                 class="px-4 py-1 rounded text-xs font-bold transition-colors"
                 :class="activeFilter === 'All' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'"
               >All</button>
               <button 
                 @click="activeFilter = 'Active'"
                 class="px-4 py-1 rounded text-xs font-bold transition-colors"
                 :class="activeFilter === 'Active' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'"
               >Active</button>
               <button 
                 @click="activeFilter = 'Issue'"
                 class="px-4 py-1 rounded text-xs font-bold transition-colors"
                 :class="activeFilter === 'Issue' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'"
               >Issue</button>
               <button 
                 @click="activeFilter = 'Offline'"
                 class="px-4 py-1 rounded text-xs font-bold transition-colors"
                 :class="activeFilter === 'Offline' ? 'bg-[#0D39D9] text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'"
               >Offline</button>
            </div>
         </div>

         <!-- Search -->
         <div class="relative group border border-[#2E58F2] w-full md:w-[329px] h-[35px] rounded-lg">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by IP, Type, Version..." 
              class="bg-transparent w-full h-[35px] border border-[#2E58F2] rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 focus:shadow-[0_0_10px_rgba(59,130,246,0.1)]">
         </div>
      </div>

      <!-- Table Container -->
      <div class="h-auto md:flex-1 overflow-auto custom-scrollbar relative">
         <div class="min-w-[1000px]">
             <!-- Table Header -->
             <div class="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pb-3 border-b border-white/10 sticky top-0 bg-[#040D2A] z-10">
                <div class="col-span-2">Institution</div>
                <div class="col-span-1">Type</div>
                <div class="col-span-2">IP Address</div>
                <div class="col-span-1">Version</div>
                <div class="col-span-1">Year</div>
                <div class="col-span-1">Status</div>
                <div class="col-span-2">Last Update</div>
                <div class="col-span-1">Auto Update</div>
                <div class="col-span-1 text-center">Actions</div>
             </div>

             <!-- Table Body -->
             <div class="pb-2">
                <div v-if="loading && phoneBanks.length === 0" class="text-center py-12">
                  <RefreshCw class="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                  <p class="text-gray-400">Loading phone banks...</p>
                </div>
                
                <div v-else-if="filteredPhoneBanks.length === 0" class="text-center py-12">
                  <Server class="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p class="text-gray-400">No phone banks found</p>
                </div>
                
                <div v-else v-for="pb in filteredPhoneBanks" :key="pb.id" class="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors text-sm group">
                   
                   <div class="col-span-2 text-gray-300 font-semibold truncate" :title="getInstitutionName(pb.institution_id)">
                     {{ getInstitutionName(pb.institution_id) }}
                   </div>
                   
                   <div class="col-span-1 text-gray-300 truncate" :title="pb.type">
                     {{ pb.type || 'N/A' }}
                   </div>
                   
                   <div class="col-span-2 text-gray-300 font-mono text-xs truncate flex items-center gap-2" :title="pb.ip">
                     <Wifi class="w-4 h-4 text-blue-400 flex-shrink-0" />
                     {{ pb.ip || 'N/A' }}
                   </div>
                   
                   <div class="col-span-1 text-gray-300 truncate" :title="pb.version">
                     {{ pb.version || 'N/A' }}
                   </div>
                   
                   <div class="col-span-1 text-gray-300 truncate">
                     {{ pb.release_year || 'N/A' }}
                   </div>
                   
                   <div class="col-span-1">
                      <span 
                         class="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center w-fit gap-1"
                         :class="{
                            'bg-green-500/10 text-green-400 border-green-500/20': getStatusColor(pb.health) === 'green',
                            'bg-orange-500/10 text-orange-400 border-orange-500/20': getStatusColor(pb.health) === 'orange',
                            'bg-red-500/10 text-red-400 border-red-500/20': getStatusColor(pb.health) === 'red'
                         }"
                      >
                         <div class="w-1.5 h-1.5 rounded-full" :class="{
                            'bg-green-500': getStatusColor(pb.health) === 'green',
                            'bg-orange-500': getStatusColor(pb.health) === 'orange',
                            'bg-red-500': getStatusColor(pb.health) === 'red'
                         }"></div>
                         {{ getStatusText(pb.health) }}
                      </span>
                   </div>
                   
                   <div class="col-span-2 text-gray-300 text-xs truncate" :title="formatDate(pb.updated_at)">
                     {{ formatDate(pb.updated_at) }}
                   </div>
                   
                   <div class="col-span-1">
                     <span v-if="pb.auto_update" class="text-green-400 text-xs">✓ Enabled</span>
                     <span v-else class="text-gray-500 text-xs">✗ Disabled</span>
                   </div>
                   
                   <div class="col-span-1 flex items-center justify-center gap-2">
                     <button 
                       @click="openEditModal(pb)"
                       class="p-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 text-blue-400 rounded-lg transition-all"
                       title="Edit">
                       <Edit class="w-4 h-4" />
                     </button>
                     <button 
                       @click="openDeleteModal(pb)"
                       class="p-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 rounded-lg transition-all"
                       title="Delete">
                       <Trash2 class="w-4 h-4" />
                     </button>
                   </div>
                </div>
             </div>
         </div>
      </div>
   </div>

    </div>
  </div>

  <!-- Create Modal -->
  <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-[#040D2A] border-2 border-[#082282] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <h2 class="text-2xl font-bold text-white mb-6">Add New Phone Bank</h2>
      
      <div class="space-y-4">
        <!-- Institution -->
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-2">Institution *</label>
          <select 
            v-model="formData.institution_id" 
            class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all"
            required>
            <option value="">Select Institution</option>
            <option v-for="inst in institutions" :key="inst.id" :value="inst.id">{{ inst.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Type -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Type</label>
            <input 
              v-model="formData.type" 
              type="text" 
              placeholder="e.g., Primary, Secondary"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>

          <!-- Release Year -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Release Year</label>
            <input 
              v-model.number="formData.release_year" 
              type="number" 
              min="2000"
              :max="new Date().getFullYear() + 1"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- IP Address -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">IP Address</label>
            <input 
              v-model="formData.ip" 
              type="text" 
              placeholder="192.168.1.1"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>

          <!-- Version -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Version</label>
            <input 
              v-model="formData.version" 
              type="text" 
              placeholder="1.0.0"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Username</label>
            <input 
              v-model="formData.username" 
              type="text" 
              placeholder="admin"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Password</label>
            <input 
              v-model="formData.password" 
              type="password" 
              placeholder="••••••••"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>
        </div>

        <!-- Auto Update -->
        <div class="flex items-center gap-3">
          <input 
            v-model="formData.auto_update" 
            type="checkbox" 
            id="auto_update_create"
            class="w-5 h-5 bg-slate-800/50 border border-blue-500/30 rounded text-blue-600 focus:ring-blue-500 focus:ring-2">
          <label for="auto_update_create" class="text-sm font-semibold text-gray-300 cursor-pointer">Enable Auto Update</label>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-6">
        <button 
          @click="showCreateModal = false; resetForm(); error = null"
          class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all">
          Cancel
        </button>
        <button 
          @click="handleCreate"
          :disabled="loading || !formData.institution_id"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {{ loading ? 'Creating...' : 'Create Phone Bank' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Edit Modal -->
  <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-[#040D2A] border-2 border-[#082282] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <h2 class="text-2xl font-bold text-white mb-6">Edit Phone Bank</h2>
      
      <div class="space-y-4">
        <!-- Institution -->
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-2">Institution *</label>
          <select 
            v-model="formData.institution_id" 
            class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all"
            required>
            <option value="">Select Institution</option>
            <option v-for="inst in institutions" :key="inst.id" :value="inst.id">{{ inst.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Type -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Type</label>
            <input 
              v-model="formData.type" 
              type="text" 
              placeholder="e.g., Primary, Secondary"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>

          <!-- Release Year -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Release Year</label>
            <input 
              v-model.number="formData.release_year" 
              type="number" 
              min="2000"
              :max="new Date().getFullYear() + 1"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- IP Address -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">IP Address</label>
            <input 
              v-model="formData.ip" 
              type="text" 
              placeholder="192.168.1.1"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>

          <!-- Version -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Version</label>
            <input 
              v-model="formData.version" 
              type="text" 
              placeholder="1.0.0"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Username</label>
            <input 
              v-model="formData.username" 
              type="text" 
              placeholder="admin"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Password</label>
            <input 
              v-model="formData.password" 
              type="password" 
              placeholder="Leave empty to keep current"
              class="w-full bg-slate-800/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-all">
          </div>
        </div>

        <!-- Auto Update -->
        <div class="flex items-center gap-3">
          <input 
            v-model="formData.auto_update" 
            type="checkbox" 
            id="auto_update_edit"
            class="w-5 h-5 bg-slate-800/50 border border-blue-500/30 rounded text-blue-600 focus:ring-blue-500 focus:ring-2">
          <label for="auto_update_edit" class="text-sm font-semibold text-gray-300 cursor-pointer">Enable Auto Update</label>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-6">
        <button 
          @click="showEditModal = false; resetForm(); selectedPhoneBank = null; error = null"
          class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all">
          Cancel
        </button>
        <button 
          @click="handleEdit"
          :disabled="loading || !formData.institution_id"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {{ loading ? 'Updating...' : 'Update Phone Bank' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-[#040D2A] border-2 border-red-500/30 rounded-2xl p-6 w-full max-w-md">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <Trash2 class="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Delete Phone Bank</h2>
          <p class="text-sm text-gray-400">This action cannot be undone</p>
        </div>
      </div>
      
      <p class="text-gray-300 mb-6">
        Are you sure you want to delete this phone bank? 
        <span class="font-semibold text-white">{{ selectedPhoneBank ? getInstitutionName(selectedPhoneBank.institution_id) : '' }}</span>
      </p>

      <!-- Error Message -->
      <div v-if="error" class="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button 
          @click="showDeleteModal = false; selectedPhoneBank = null; error = null"
          class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all">
          Cancel
        </button>
        <button 
          @click="handleDelete"
          :disabled="loading"
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {{ loading ? 'Deleting...' : 'Delete' }}
        </button>
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
   border-width: 2px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
