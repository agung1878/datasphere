<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { RefreshCw, Bell } from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const emit = defineEmits(['close']);
const notificationStore = useNotificationStore();

// Get last 3 notifications
const latestNotifications = computed(() => {
  return notificationStore.notifications.slice(0, 3);
});

// Map notification type to display type
const getDisplayType = (notification) => {
  if (notification.type === 'Issues') return 'error';
  if (notification.type === 'Update') return 'warning';
  return 'info';
};

// Format notification text
const getNotificationText = (notification) => {
  return `${notification.phone_bank_id}: ${notification.message}`;
};

const getBgColor = (type) => {
  switch(type) {
    case 'error': return 'bg-red-900/80 border-l-4 border-red-500 text-red-100';
    case 'warning': return 'bg-yellow-900/80 border-l-4 border-yellow-500 text-yellow-100';
    case 'info': return 'bg-blue-900/80 border-l-4 border-blue-500 text-blue-100';
    default: return 'bg-slate-700 text-white';
  }
};

const handleRefresh = async () => {
  await notificationStore.fetchNotifications();
};

const goToNotificationCenter = () => {
  emit('close');
  router.push({ name: 'notification-center' });
};

onMounted(() => {
  notificationStore.fetchNotifications();
});
</script>

<template>
  <div class="w-[400px] rounded-3xl overflow-hidden border-2 border-[#1F2023] bg-[#1F2023] shadow-2xl shadow-blue-500/20">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-slate-800/50 to-slate-900/50">
      <div class="flex items-center gap-2">
        <Bell class="w-4 h-4 text-gray-300" />
        <h3 class="font-semibold text-sm text-white">Notifications</h3>
      </div>
      <button 
        @click="handleRefresh" 
        :disabled="notificationStore.loading"
        class="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw :class="notificationStore.loading ? 'animate-spin' : ''" class="w-4 h-4" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
      <!-- Loading State -->
      <div v-if="notificationStore.loading" class="text-center py-8 text-gray-400 text-xs">
        <RefreshCw class="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading notifications...
      </div>

      <!-- Empty State -->
      <div v-else-if="latestNotifications.length === 0" class="text-center py-8 text-gray-400 text-xs">
        <Bell class="w-6 h-6 mx-auto mb-2 opacity-50" />
        No notifications available
      </div>

      <!-- Notifications List -->
      <div 
        v-else
        v-for="notification in latestNotifications" 
        :key="notification.id"
        :class="['p-3 rounded-lg text-xs font-medium shadow-lg transition-all hover:scale-[1.02] cursor-pointer', getBgColor(getDisplayType(notification))]"
      >
        {{ getNotificationText(notification) }}
      </div>
    </div>

    <!-- Footer -->
    <div class="px-5 py-3 bg-[#1F2023] border-t border-slate-700/50 flex justify-between items-center text-[11px]">
      <button class="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-2 transition-colors">
        Mark all as read
      </button>
      <button 
        @click="goToNotificationCenter"
        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-900/30 transition-all hover:shadow-blue-900/50 font-medium"
      >
        Go to Notification Center
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
}
</style>
