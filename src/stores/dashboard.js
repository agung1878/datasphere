import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getDashboard } from '../services/api';

export const useDashboardStore = defineStore('dashboard', () => {
    // --- State ---
    const summary = ref({
        phone_bank_total: 0,
        healthy_total: 0,
        issue_total: 0,
        offline_total: 0
    });
    const institutions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');

    // --- Getters ---
    const totalServers = computed(() => summary.value.phone_bank_total);
    const healthyServers = computed(() => summary.value.healthy_total);
    const issueServers = computed(() => summary.value.issue_total);
    const offlineServers = computed(() => summary.value.offline_total);

    const mapLocations = computed(() => {
        return institutions.value
            .filter(inst => inst.latitude && inst.longitude)
            .map(institution => ({
                id: institution.id,
                name: institution.name,
                lat: institution.latitude,
                lng: institution.longitude,
                ip: institution.ip || 'N/A',
                count: institution.phone_banks?.length || 0,
                address: institution.address || 'No address',
                type: institution.type,
                children: institution.children || [],
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
            }));
    });

    /**
     * Updated filteredMapLocations:
     * Filters the parent markers AND filters the children list inside them.
     */
    const filteredMapLocations = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        if (!query) return mapLocations.value;

        return mapLocations.value
            .map(loc => {
                // 1. Filter the children first
                const filteredChildren = loc.children.filter(child =>
                    child.name.toLowerCase().includes(query) ||
                    (child.ip && child.ip.toLowerCase().includes(query))
                );

                // 2. Check if parent matches
                const parentMatches = loc.name.toLowerCase().includes(query) ||
                    (loc.ip && loc.ip.toLowerCase().includes(query));

                // 3. If parent matches, show all children (or you can keep filteredChildren)
                // If parent doesn't match but children do, show only matching children
                if (parentMatches || filteredChildren.length > 0) {
                    return {
                        ...loc,
                        children: parentMatches && filteredChildren.length === 0 ? loc.children : filteredChildren,
                        childrenCount: parentMatches && filteredChildren.length === 0 ? loc.children.length : filteredChildren.length
                    };
                }
                return null;
            })
            .filter(loc => loc !== null); // Remove parents that don't match and have no matching children
    });

    // --- Helpers ---
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
        return phoneBanks.filter(pb => pb.status !== 'offline' && pb.status !== 'issue').length;
    };

    // --- Actions ---
    const setSearchQuery = (query) => {
        searchQuery.value = query;
    };

    const fetchDashboard = async () => {
        loading.value = true;
        try {
            const response = await getDashboard();
            if (response.success && response.data) {
                summary.value = response.data.summary;
                institutions.value = response.data.institutions;
            }
            loading.value = false;
            return { success: true };
        } catch (err) {
            loading.value = false;
            error.value = err.message;
            return { success: false };
        }
    };

    return {
        summary, institutions, loading, error, searchQuery,
        totalServers, healthyServers, issueServers, offlineServers,
        mapLocations, filteredMapLocations,
        fetchDashboard, setSearchQuery
    };
});