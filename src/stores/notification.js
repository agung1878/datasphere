import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getNotifications } from '../services/api';

export const useNotificationStore = defineStore('notification', () => {

    const loading = ref(false);
    const error = ref(null);
    
    const notifications = ref([]);

    const fetchNotifications = async () => {
        try {
            loading.value = true;
            const response = await getNotifications();
            notifications.value = response.data;

            console.log("data notif: ", notifications.value);
        } catch (error) {
            error.value = error;
        } finally {
            loading.value = false;
        }
    }; 

    return {
        loading,
        error,
        notifications,
        fetchNotifications,
    };
});
    