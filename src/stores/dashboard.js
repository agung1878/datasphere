import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getDashboard } from '../services/api';

export const useDashboardStore = defineStore('dashboard', () => {
    // State
    const summary = ref({
        phone_bank_total: 0,
        healthy_total: 0,
        issue_total: 0,
        offline_total: 0
    });
    const institutions = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Getters
    const totalServers = computed(() => summary.value.phone_bank_total);
    const healthyServers = computed(() => summary.value.healthy_total);
    const issueServers = computed(() => summary.value.issue_total);
    const offlineServers = computed(() => summary.value.offline_total);

    // Transform institutions into map locations format
    const mapLocations = computed(() => {
        const locations = [];

        institutions.value.forEach(institution => {
            // Only add POLDA (parent) institutions to the map
            // Skip if latitude or longitude is null, undefined, or empty
            if (!institution.latitude || !institution.longitude) {
                console.warn(`Skipping institution "${institution.name}" - missing coordinates`);
                return; // Skip this institution
            }

            // Children (POLRES) will be shown in popup and right panel
            locations.push({
                id: institution.id,
                name: institution.name,
                lat: institution.latitude,
                lng: institution.longitude,
                count: institution.phone_banks?.length || 0,
                address: institution.address || 'No address',
                type: institution.type,
                children: institution.children || [], // Include children for popup/panel
                childrenCount: institution.children?.length || 0,
                status: calculateStatus(institution.phone_banks),
                statusLabel: calculateStatusLabel(institution.phone_banks),
                subtext: calculateSubtext(institution.phone_banks),
                devices: {
                    active: countActiveDevices(institution.phone_banks),
                    total: institution.phone_banks?.length || 0
                },
                autoUpdate: 'Enable',
                checks: []
            });
        });

        return locations;
    });

    // Helper function to calculate status based on phone banks
    const calculateStatus = (phoneBanks) => {
        if (!phoneBanks || phoneBanks.length === 0) return 'Offline';

        const activeCount = countActiveDevices(phoneBanks);
        if (activeCount === 0) return 'Offline';
        if (activeCount < phoneBanks.length) return 'Issue';
        return 'Healthy';
    };

    const calculateStatusLabel = (phoneBanks) => {
        const status = calculateStatus(phoneBanks);
        if (status === 'Offline') return 'Offline';
        if (status === 'Healthy') return 'Healthy';

        const issueCount = (phoneBanks?.length || 0) - countActiveDevices(phoneBanks);
        return `${issueCount} Issue${issueCount > 1 ? 's' : ''}`;
    };

    const calculateSubtext = (phoneBanks) => {
        const status = calculateStatus(phoneBanks);
        if (status === 'Offline') return 'Offline';
        if (status === 'Healthy') return 'All Devices Running Properly';

        const issueCount = (phoneBanks?.length || 0) - countActiveDevices(phoneBanks);
        return `${issueCount} device${issueCount > 1 ? 's' : ''} with issues`;
    };

    const countActiveDevices = (phoneBanks) => {
        if (!phoneBanks) return 0;
        // Assuming phone banks without explicit status are active
        // Adjust this logic based on actual API response structure
        return phoneBanks.filter(pb => pb.status !== 'offline' && pb.status !== 'issue').length;
    };

    // Actions
    const fetchDashboard = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await getDashboard();

            if (response.success && response.data) {
                summary.value = response.data.summary;
                institutions.value = response.data.institutions;

                console.log("summary: ", summary.value);
                console.log("institutions: ", institutions.value);
            } else {
                throw new Error('Invalid response format');
            }

            loading.value = false;
            return { success: true };
        } catch (err) {
            loading.value = false;
            error.value = err.response?.data?.message || err.message || 'Failed to fetch dashboard data';
            console.error('Dashboard fetch error:', err);
            return { success: false, error: error.value };
        }
    };

    const refreshDashboard = async () => {
        return await fetchDashboard();
    };

    return {
        // State
        summary,
        institutions,
        loading,
        error,
        // Getters
        totalServers,
        healthyServers,
        issueServers,
        offlineServers,
        mapLocations,
        // Actions
        fetchDashboard,
        refreshDashboard,
    };
});
