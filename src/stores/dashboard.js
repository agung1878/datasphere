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
                count: countActivePhoneBanks(institution.phone_banks, institution.children),
                address: institution.address || 'No address',
                type: institution.type,
                children: institution.children || [],
                childrenCount: institution.children?.length || 0,
                status: calculateStatus(institution.phone_banks, institution.children),
                statusLabel: calculateStatusLabel(institution.phone_banks, institution.children),
                subtext: calculateSubtext(institution.phone_banks, institution.children),
                devices: {
                    active: countActiveDevices(institution.phone_banks),
                    total: institution.phone_banks?.length || 0
                },
                autoUpdate: 'Enable',
                checks: [],
                phone_banks: institution.phone_banks || [],
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
                    (child.phone_banks && child.phone_banks.some(pb => pb.ip && pb.ip.toLowerCase().includes(query)))
                );

                // 2. Check if parent matches
                const parentMatches = loc.name.toLowerCase().includes(query) ||
                    (loc.phone_banks && loc.phone_banks.some(pb => pb.ip && pb.ip.toLowerCase().includes(query)));

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
    const calculateStatus = (phoneBanks, children) => {
        // Check if parent has any phone banks that are NOT offline
        let hasActiveParentPhoneBanks = false;
        if (phoneBanks && phoneBanks.length > 0) {
            hasActiveParentPhoneBanks = phoneBanks.some(pb =>
                pb.status && pb.status.toLowerCase() !== 'offline'
            );
        }

        // Check if any children have phone banks that are NOT offline
        let hasActiveChildrenPhoneBanks = false;
        if (children && children.length > 0) {
            hasActiveChildrenPhoneBanks = children.some(child => {
                if (child.phone_banks && child.phone_banks.length > 0) {
                    return child.phone_banks.some(pb =>
                        pb.status && pb.status.toLowerCase() !== 'offline'
                    );
                }
                return false;
            });
        }

        console.log('Status check:', {
            hasActiveParentPhoneBanks,
            hasActiveChildrenPhoneBanks,
            parentPhoneBanks: phoneBanks?.map(pb => pb.status) || [],
            childrenCount: children?.length || 0
        });

        // If parent or any child has at least one phone bank that's NOT offline, show as online (blue icon)
        if (hasActiveParentPhoneBanks || hasActiveChildrenPhoneBanks) {
            return 'Issue'; // Show as online (blue icon)
        }

        return 'Offline'; // All phone banks are offline or no phone banks exist (grey icon)
    };

    const calculateStatusLabel = (phoneBanks, children) => {
        const status = calculateStatus(phoneBanks, children);
        if (status === 'Offline') return 'Offline';
        if (status === 'Healthy') return 'Healthy';
        const issueCount = (phoneBanks?.length || 0) - countActiveDevices(phoneBanks);
        return `${issueCount} Issue${issueCount > 1 ? 's' : ''}`;
    };

    const calculateSubtext = (phoneBanks, children) => {
        const status = calculateStatus(phoneBanks, children);
        if (status === 'Offline') return 'Offline';
        if (status === 'Healthy') return 'All Devices Running Properly';
        const issueCount = (phoneBanks?.length || 0) - countActiveDevices(phoneBanks);
        return `${issueCount} device${issueCount > 1 ? 's' : ''} with issues`;
    };

    const countActiveDevices = (phoneBanks) => {
        if (!phoneBanks) {
            console.log('No phoneBanks provided');
            return 0;
        }

        console.log('Checking phoneBanks:', phoneBanks);

        // Simply check if phone banks exist - if they exist, they're considered active
        // The API returns phone_banks array for institutions that have them
        const activeCount = phoneBanks.length;

        console.log('Active phone banks count:', activeCount);
        return activeCount;
    };

    // Count active phone banks (healthy + issue, excluding offline) from parent and children
    const countActivePhoneBanks = (phoneBanks, children) => {
        let count = 0;

        // Count parent phone banks that are not offline
        if (phoneBanks && phoneBanks.length > 0) {
            count += phoneBanks.filter(pb =>
                pb.status && pb.status.toLowerCase() !== 'offline'
            ).length;
        }

        // Count children phone banks that are not offline
        if (children && children.length > 0) {
            children.forEach(child => {
                if (child.phone_banks && child.phone_banks.length > 0) {
                    count += child.phone_banks.filter(pb =>
                        pb.status && pb.status.toLowerCase() !== 'offline'
                    ).length;
                }
            });
        }

        return count;
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