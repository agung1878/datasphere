<template>
  <div class="export-excel-container">
    <button 
      @click="handleExport"
      class="btn-export"
      :disabled="isExporting"
    >
      <svg 
        v-if="!isExporting" 
        class="icon" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span v-if="isExporting" class="spinner"></span>
      <span class="text">{{ isExporting ? 'Exporting...' : 'Export to Excel' }}</span>
    </button>

    <!-- Toast Notification -->
    <div v-if="notification.show" :class="['toast', notification.type]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { exportTasksToExcel } from '@/services/api';

export default {
  name: 'ExportExcelButton',
  
  data() {
    return {
      isExporting: false,
      notification: {
        show: false,
        type: '', // 'success' or 'error'
        message: ''
      }
    }
  },

  methods: {
    async handleExport() {
      this.isExporting = true;

      try {
        // Call API to get Excel blob
        const blob = await exportTasksToExcel();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `latest_tests_${timestamp}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Show success notification
        this.showNotification('success', `✅ Tasks exported successfully!`);
        
      } catch (error) {
        console.error('Export error:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
        this.showNotification('error', `❌ Export failed: ${errorMessage}`);
      } finally {
        this.isExporting = false;
      }
    },

    showNotification(type, message) {
      this.notification = {
        show: true,
        type,
        message
      };

      // Auto hide after 3 seconds
      setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    }
  }
}
</script>

<style scoped>
.export-excel-container {
  display: inline-block;
}

/* Export Button */
.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-export:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-export:active:not(:disabled) {
  transform: translateY(0);
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-export .icon {
  transition: transform 0.3s ease;
}

.btn-export:hover:not(:disabled) .icon {
  transform: translateY(2px);
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease;
  z-index: 2000;
}

.toast.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.toast.error {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
