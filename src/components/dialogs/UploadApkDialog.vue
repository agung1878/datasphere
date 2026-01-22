<script setup>
import { ref } from 'vue';
import { X, Upload, FileText, CheckCircle } from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'upload']);

const selectedFile = ref(null);
const isDragging = ref(false);
const uploadProgress = ref(0);
const isUploading = ref(false);
const uploadSuccess = ref(false);

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  validateAndSetFile(file);
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  validateAndSetFile(file);
};

const validateAndSetFile = (file) => {
  if (!file) return;
  
  // Check if file is APK
  if (!file.name.endsWith('.apk')) {
    alert('Please select a valid APK file');
    return;
  }
  
  selectedFile.value = file;
  uploadSuccess.value = false;
};

const handleDragOver = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const removeFile = () => {
  selectedFile.value = null;
  uploadSuccess.value = false;
  uploadProgress.value = 0;
};

const handleUpload = () => {
  if (!selectedFile.value) return;
  
  isUploading.value = true;
  uploadProgress.value = 0;
  
  // Simulate upload progress
  const interval = setInterval(() => {
    uploadProgress.value += 10;
    
    if (uploadProgress.value >= 100) {
      clearInterval(interval);
      isUploading.value = false;
      uploadSuccess.value = true;
      
      // Emit upload event with file
      emit('upload', selectedFile.value);
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  }, 200);
};

const handleClose = () => {
  selectedFile.value = null;
  uploadProgress.value = 0;
  isUploading.value = false;
  uploadSuccess.value = false;
  isDragging.value = false;
  emit('close');
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
            <Upload class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Upload APK File</h2>
            <p class="text-xs text-gray-400">Select or drag and drop your APK file</p>
          </div>
        </div>
        <button @click="handleClose" class="p-2 rounded-full hover:bg-blue-900/30 transition-colors text-blue-400 hover:text-white">
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">
        <!-- Upload Area -->
        <div
          v-if="!selectedFile"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
          :class="isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-blue-900/50 bg-blue-900/5 hover:border-blue-500/50 hover:bg-blue-900/10'"
        >
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Upload class="w-8 h-8 text-blue-400" />
            </div>
            
            <div>
              <p class="text-white font-medium mb-1">Drop your APK file here or click to browse</p>
              <p class="text-sm text-gray-400">Only .apk files are accepted</p>
            </div>
            
            <label class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm cursor-pointer transition-all shadow-lg shadow-blue-900/30">
              Browse Files
              <input 
                type="file" 
                accept=".apk"
                @change="handleFileSelect"
                class="hidden"
              />
            </label>
          </div>
        </div>

        <!-- Selected File -->
        <div v-else class="space-y-4">
          <div class="bg-blue-900/10 border border-blue-900/30 rounded-xl p-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <FileText class="w-6 h-6 text-blue-400" />
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-white font-medium truncate">{{ selectedFile.name }}</p>
                    <p class="text-sm text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                  
                  <button 
                    v-if="!isUploading && !uploadSuccess"
                    @click="removeFile"
                    class="p-1 hover:bg-red-900/30 rounded text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>

                <!-- Progress Bar -->
                <div v-if="isUploading" class="mt-3">
                  <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{{ uploadProgress }}%</span>
                  </div>
                  <div class="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                      :style="{ width: uploadProgress + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- Success Message -->
                <div v-if="uploadSuccess" class="mt-3 flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle class="w-4 h-4" />
                  <span>Upload successful!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-blue-900/30 bg-blue-900/5 flex justify-end gap-3">
        <button 
          @click="handleClose"
          :disabled="isUploading"
          class="px-6 py-2.5 rounded-lg border border-red-500/50 text-white hover:bg-red-900/20 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button 
          @click="handleUpload"
          :disabled="!selectedFile || isUploading || uploadSuccess"
          class="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Upload class="w-4 h-4" />
          {{ isUploading ? 'Uploading...' : 'Upload APK' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar if needed */
</style>
