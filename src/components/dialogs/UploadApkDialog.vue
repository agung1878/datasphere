<script setup>
import { ref, computed } from 'vue';
import { X, Upload, Smartphone, CheckCircle, ChevronDown } from 'lucide-vue-next';
import { updateApk } from '@/services/api';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  phoneBanks: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'submit']);

const selectedPhoneBank = ref(null);
const selectedType = ref('WHATSAPP');
const isSubmitting = ref(false);
const submitSuccess = ref(false);
const submitError = ref(null);
const showDropdown = ref(false);

const appTypes = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'WHATSAPP_BUSINESS', label: 'WhatsApp Business', icon: '💼' },
  { value: 'TELEGRAM', label: 'Telegram', icon: '✈️' }
];

const isFormValid = computed(() => {
  return selectedPhoneBank.value !== null;
});

const selectPhoneBank = (device) => {
  selectedPhoneBank.value = device;
  showDropdown.value = false;
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  
  isSubmitting.value = true;
  submitError.value = null;
  
  try {
    // Call the API to update APK
    await updateApk(selectedPhoneBank.value.id, selectedType.value);
    
    isSubmitting.value = false;
    submitSuccess.value = true;
    
    // Emit submit event with phone bank ID and type
    emit('submit', {
      phoneBankId: selectedPhoneBank.value.id,
      type: selectedType.value
    });
    
    // Auto close after 1.5 seconds
    setTimeout(() => {
      handleClose();
    }, 1500);
  } catch (error) {
    isSubmitting.value = false;
    submitError.value = error.response?.data?.message || 'Failed to update application. Please try again.';
    console.error('Error updating APK:', error);
  }
};

const handleClose = () => {
  if (isSubmitting.value) return;
  selectedPhoneBank.value = null;
  selectedType.value = 'WHATSAPP';
  isSubmitting.value = false;
  submitSuccess.value = false;
  submitError.value = null;
  showDropdown.value = false;
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="handleClose"></div>
    
    <!-- Modal Content -->
    <div class="relative w-full max-w-2xl bg-[#040D2A] border-2 border-[#082282] rounded-2xl shadow-[0_0_50px_rgba(30,58,138,0.3)] overflow-hidden">
      
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-blue-900/30 bg-gradient-to-r from-blue-900/20 to-transparent">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Smartphone class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Update Application</h2>
            <p class="text-xs text-gray-400">Select phone bank and application type</p>
          </div>
        </div>
        <button 
          @click="handleClose" 
          :disabled="isSubmitting"
          class="p-2 rounded-full hover:bg-blue-900/30 transition-colors text-blue-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        
        <!-- Phone Bank Selection -->
        <div>
          <label class="block text-sm font-bold text-gray-300 mb-2">Select Phone Bank</label>
          <div class="relative">
            <button
              @click="showDropdown = !showDropdown"
              class="w-full bg-blue-900/10 border border-blue-900/30 rounded-lg px-4 py-3 text-left text-white hover:bg-blue-900/20 transition-colors flex items-center justify-between"
            >
              <span v-if="selectedPhoneBank" class="flex items-center gap-2">
                <Smartphone class="w-4 h-4 text-blue-400" />
                {{ selectedPhoneBank.id }}
              </span>
              <span v-else class="text-gray-400">Choose a phone bank...</span>
              <ChevronDown class="w-5 h-5 text-gray-400" :class="showDropdown ? 'rotate-180' : ''" />
            </button>

            <!-- Dropdown -->
            <div
              v-if="showDropdown"
              class="absolute top-full left-0 right-0 mt-2 bg-[#0B1739] border border-blue-900/30 rounded-lg shadow-xl max-h-60 overflow-y-auto z-10 custom-scrollbar"
            >
              <div
                v-for="phoneBank in phoneBanks"
                :key="phoneBank.id"
                @click="selectPhoneBank(phoneBank)"
                class="px-4 py-3 hover:bg-blue-900/20 cursor-pointer transition-colors border-b border-blue-900/10 last:border-b-0"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Smartphone class="w-4 h-4 text-blue-400" />
                    <span class="text-white font-medium">{{ phoneBank.id }}</span>
                  </div>
                  <span
                    class="text-xs px-2 py-1 rounded"
                    :class="{
                      'bg-green-500/20 text-green-400': phoneBank.status?.toLowerCase() === 'healthy',
                      'bg-orange-500/20 text-orange-400': phoneBank.status?.toLowerCase() === 'issue',
                      'bg-red-500/20 text-red-400': phoneBank.status?.toLowerCase() === 'offline'
                    }"
                  >
                    {{ phoneBank.status || 'Unknown' }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ phoneBank.type || 'Phone Bank' }}</p>
              </div>
              <div v-if="phoneBanks.length === 0" class="px-4 py-8 text-center text-gray-400 text-sm">
                No phone banks available
              </div>
            </div>
          </div>
        </div>

        <!-- Application Type Selection -->
        <div>
          <label class="block text-sm font-bold text-gray-300 mb-3">Application Type</label>
          <div class="space-y-2">
            <div
              v-for="appType in appTypes"
              :key="appType.value"
              @click="selectedType = appType.value"
              class="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all"
              :class="selectedType === appType.value
                ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-900/20'
                : 'bg-blue-900/5 border-blue-900/30 hover:bg-blue-900/10 hover:border-blue-900/50'"
            >
              <div
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                :class="selectedType === appType.value
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-500'"
              >
                <div v-if="selectedType === appType.value" class="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <!-- <span class="text-2xl">{{ appType.icon }}</span> -->
              <span class="text-white font-medium">{{ appType.label }}</span>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="submitSuccess" class="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle class="w-5 h-5 text-green-400" />
          <div>
            <p class="text-green-400 font-medium">Update request sent successfully!</p>
            <p class="text-xs text-green-400/70">The application will be updated shortly.</p>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="submitError" class="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <X class="w-5 h-5 text-red-400" />
          <div>
            <p class="text-red-400 font-medium">Update failed</p>
            <p class="text-xs text-red-400/70">{{ submitError }}</p>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-blue-900/30 bg-blue-900/5 flex justify-end gap-3">
        <button 
          @click="handleClose"
          :disabled="isSubmitting"
          class="px-6 py-2.5 rounded-lg border border-red-500/50 text-white hover:bg-red-900/20 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button 
          @click="handleSubmit"
          :disabled="!isFormValid || isSubmitting || submitSuccess"
          class="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Upload class="w-4 h-4" />
          {{ isSubmitting ? 'Submitting...' : 'Update Application' }}
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
