import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:9090',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor Request: Inject Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor Response: Handle 401 & Global Errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

/* =========================================
   AUTH & DASHBOARD (Existing)
   ========================================= */
export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', username);
    formData.append('password', password);
    // ... rest of your login logic
    const response = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
};

export const getDashboard = () => api.get('/dashboard').then(res => res.data);
export const getInstitution = (id) => api.get(`/institutions/${id}`).then(res => res.data);
export const getPhoneBank = (id) => api.get(`/phone-banks/${id}`).then(res => res.data);

/* =========================================
   TASK SCHEDULER (New Integration)
   ========================================= */

/**
 * Mengambil semua daftar task yang ada di database
 */
export const getTasks = async () => {
    const response = await api.get('/tasks/');
    return response.data;
};

export const getProxyDevices = (ip) => api.get('/api/account-transfer/proxy/devices', { params: { ip } }).then(res => res.data);

/**
 * Mengambil semua device yang tersedia untuk target automasi
 */
export const getAllDevices = async () => {
    const response = await api.get('/tasks/devices');
    return response.data;
};

/**
 * Membuat task baru (Blast/Update Profile)
 * @param {Object} taskData - { task_type, message, scheduled_at, targets }
 */
export const createTask = async (taskData) => {
    console.log("Payload", taskData);
    const response = await api.post('/tasks/', taskData);
    return response.data;
};

/**
 * Mengupdate task yang sudah ada
 */
export const updateTask = async (taskId, updateData) => {
    const response = await api.patch(`/tasks/${taskId}`, updateData);
    return response.data;
};

/**
 * Menghapus task
 */
export const deleteTask = async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
};

/**
 * Mengaktifkan atau menonaktifkan task (Toggle)
 */
export const toggleTaskStatus = async (taskId) => {
    const response = await api.post(`/tasks/${taskId}/toggle`);
    return response.data;
};

/**
 * Eksekusi task secara instan (Manual Trigger)
 */
export const executeTaskNow = async (taskId) => {
    const response = await api.post(`/tasks/${taskId}/execute`);
    return response.data;
};

/**
 * Mengambil log dari task tertentu
 */
export const getTaskLogs = async (taskId, maxLines = 100) => {
    const response = await api.get(`/tasks/${taskId}/logs`, {
        params: { max_lines: maxLines }
    });
    return response.data;
};

/**
 * Upload media file (image/video) untuk task
 * @param {File} file - File object dari input file
 */
export const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/tasks/upload-media', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Upload profile image untuk profile update task
 * @param {File} file - File object dari input file
 */
export const uploadProfileImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/tasks/upload-profile-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getNotifications = async () => {
    const response = await api.get('/notifications');
    return response.data;
};

export const updateApk = async (phoneBankId, type) => {
    const response = await api.post(`/phones/${phoneBankId}/update/${type}`);
    return response.data;
};

/* =========================================
   INSTITUTION CRUD
   ========================================= */

/**
 * Mengambil semua Institution
 */
export const getInstitutions = async () => {
    const response = await api.get('/institutions');
    return response.data;
};

/**
 * Mengambil Institutions berdasarkan ID (sudah ada di atas, tapi untuk konsistensi)
 * export const getInstitutions sudah didefinisikan di line 54
 */

/**
 * Membuat Institutions baru
 * @param {Object} phoneBankData - Data untuk Institutions baru
 */
export const createInstitution = async (institutionData) => {
    const response = await api.post('/institutions', institutionData);
    return response.data;
};

/**
 * Mengupdate Institutions
 * @param {String} id - ID Institutions
 * @param {Object} updateData - Data yang akan diupdate
 */
export const updateInstitution = async (id, updateData) => {
    const response = await api.put(`/institutions/${id}`, updateData);
    return response.data;
};

/**
 * Menghapus Institutions
 * @param {String} id - ID Institutions
 */
export const deleteInstitution = async (id) => {
    const response = await api.delete(`/institutions/${id}`);
    return response.data;
};

/* =========================================
   PHONE BANK CRUD
   ========================================= */

/**
 * Mengambil semua Phone Banks
 */
export const getPhoneBanks = async () => {
    const response = await api.get('/phone-banks');
    return response.data;
};

/**
 * Mengambil Phone Bank berdasarkan ID (sudah ada di atas, tapi untuk konsistensi)
 * export const getPhoneBank sudah didefinisikan di line 55
 */

/**
 * Membuat Phone Bank baru
 * @param {Object} phoneBankData - Data untuk Phone Bank baru
 */
export const createPhoneBank = async (phoneBankData) => {
    const response = await api.post('/phone-banks', phoneBankData);
    return response.data;
};

/**
 * Mengupdate Phone Bank
 * @param {String} id - ID Phone Bank
 * @param {Object} updateData - Data yang akan diupdate
 */
export const updatePhoneBank = async (id, updateData) => {
    const response = await api.put(`/phone-banks/${id}`, updateData);
    return response.data;
};

/**
 * Menghapus Phone Bank
 * @param {String} id - ID Phone Bank
 */

export const deletePhoneBank = async (id) => {
    const response = await api.delete(`/phone-banks/${id}`);
    return response.data;
};

/* =========================================
   PHONES CRUD
   ========================================= */

/**
 * Mengambil semua Phones
 */
export const getPhones = async () => {
    const response = await api.get('/phones');
    return response.data;
};

/**
 * Mengambil Phone berdasarkan ID
 * @param {String} id - ID Phone
 */
export const getPhone = async (id) => {
    const response = await api.get(`/phones/${id}`);
    return response.data;
};

/**
 * Membuat Phone baru
 * @param {Object} phoneData - Data untuk Phone baru
 */
export const createPhone = async (phoneData) => {
    const response = await api.post('/phones', phoneData);
    return response.data;
};

/**
 * Mengupdate Phone
 * @param {String} id - ID Phone
 * @param {Object} updateData - Data yang akan diupdate
 */
export const updatePhone = async (id, updateData) => {
    const response = await api.put(`/phones/${id}`, updateData);
    return response.data;
};

/**
 * Menghapus Phone
 * @param {String} id - ID Phone
 */
export const deletePhone = async (id) => {
    const response = await api.delete(`/phones/${id}`);
    return response.data;
};

/* =========================================
   ACCOUNT TRANSFER (Updated to match new CRUD backend)
   ========================================= */

/**
 * Generate unique batch ID
 */
export const generateBatchId = async () => {
    const response = await api.get('/api/account-transfer/generate-batch-id');
    return response.data;
};

/**
 * Membuat batch transfer baru
 * Step 1: Generate batch_id
 * Step 2: Create batch transfers using the new CRUD endpoint
 * @param {Object} batchData - { account_type, total_requested, batch_name, source_phones, target_phones }
 */
export const createTransferBatch = async (batchData) => {
    // Generate batch ID jika tidak ada
    let batchId;
    if (!batchData.batch_name) {
        const batchIdResponse = await generateBatchId();
        batchId = batchIdResponse.batch_id;
    } else {
        batchId = batchData.batch_name;
    }

    // Create transfers array dari source & target phones
    const transfers = [];
    const pairs = Math.min(
        batchData.source_phones?.length || 0,
        batchData.target_phones?.length || 0
    );

    for (let i = 0; i < pairs; i++) {
        transfers.push({
            batch_id: batchId,
            account_type: batchData.account_type,
            source_phone_id: batchData.source_phones[i],
            target_phone_id: batchData.target_phones[i]
        });
    }

    // Create batch transfers
    const response = await api.post('/api/account-transfer/transfers/batch', {
        transfers: transfers
    });

    return {
        data: {
            batch_id: batchId,
            transfers: response.data,
            total: pairs
        }
    };
};

/**
 * Mengambil semua transfer batches
 * Backend baru tidak punya endpoint /batches langsung, jadi kita ambil semua transfers dan group by batch_id
 * @param {Number} limit - Jumlah maksimal transfers yang ditampilkan
 */
export const getTransferBatches = async (limit = 100) => {
    const response = await api.get('/api/account-transfer/transfers', {
        params: { limit: limit }
    });

    // Group transfers by batch_id to create batch list
    const transfersData = response.data;
    const batches = {};

    // Handle both array and paginated response (flexible for backend)
    const transfersList = Array.isArray(transfersData) ? transfersData : (transfersData.items || []);

    if (transfersList.length > 0) {
        transfersList.forEach(transfer => {
            const batchId = transfer.batch_id;
            if (!batches[batchId]) {
                batches[batchId] = {
                    id: batchId,
                    batch_name: batchId,
                    total_requested: 0,
                    total_success: 0,
                    total_failed: 0,
                    total_pending: 0,
                    total_in_progress: 0,
                    status: 'processing',
                    created_at: transfer.created_at,
                    updated_at: transfer.updated_at
                };
            }

            batches[batchId].total_requested++;

            if (transfer.status === 'completed') {
                batches[batchId].total_success++;
            } else if (transfer.status === 'failed') {
                batches[batchId].total_failed++;
            } else if (transfer.status === 'pending') {
                batches[batchId].total_pending++;
            } else if (transfer.status === 'processing' || transfer.status === 'waiting_otp') {
                batches[batchId].total_in_progress++;
            }

            // Update latest timestamp
            if (new Date(transfer.updated_at) > new Date(batches[batchId].updated_at)) {
                batches[batchId].updated_at = transfer.updated_at;
            }
        });

        // Determine batch status
        Object.values(batches).forEach(batch => {
            if (batch.total_success === batch.total_requested) {
                batch.status = 'completed';
            } else if (batch.total_success > 0 && batch.total_failed > 0) {
                batch.status = 'partial_success';
            } else if (batch.total_in_progress > 0) {
                batch.status = 'processing';
            }
        });
    }

    return {
        data: Object.values(batches).sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        )
    };
};

/**
 * Mengambil progress batch dengan detail transfers menggunakan batch summary endpoint
 * @param {String} batchId - Batch ID string
 */
export const getBatchProgress = async (batchId) => {
    // Get batch summary
    const summaryResponse = await api.get(`/api/account-transfer/batch/${batchId}/summary`);

    // Get all transfers in this batch
    const transfersResponse = await api.get(`/api/account-transfer/batch/${batchId}/transfers`);

    // Combine data
    const summary = summaryResponse.data;
    const transfers = transfersResponse.data;
    console.log("HASIL TRANSFER DATA");
    console.log(transfers);

    // Calculate progress_percentage
    const totalCompleted = summary.completed + summary.failed;
    const progressPercentage = summary.total > 0 ? (totalCompleted / summary.total) * 100 : 0;

    return {
        data: {
            batch_name: summary.batch_id,
            batch_id: summary.batch_id,
            total_requested: summary.total,
            total_success: summary.completed,
            total_failed: summary.failed,
            total_pending: summary.pending,
            total_in_progress: summary.processing + summary.waiting_otp,
            progress_percentage: progressPercentage,
            status: totalCompleted === summary.total ?
                (summary.failed > 0 ? 'partial_success' : 'completed') :
                'processing',
            transfers: transfers
        }
    };
};

/**
 * Retry semua failed transfers dalam batch menggunakan endpoint baru
 * @param {String} batchId - Batch ID string
 */
export const retryFailedTransfers = async (batchId) => {
    const response = await api.post(`/api/account-transfer/batch/${batchId}/retry`);
    return response.data;
};

/**
 * Auto-discover phones untuk transfer
 * Note: Backend baru tidak punya /auto-discover endpoint
 * Kita akan menggunakan logika manual untuk discovery
 * @param {Object} request - { account_type, count }
 */
export const autoDiscoverPhones = async (request) => {
    // Get all phone banks
    const phoneBanksResponse = await getPhoneBanks();
    const phoneBanks = phoneBanksResponse.data || [];

    const sourcePhonesWithAccount = [];
    const targetPhonesWithoutAccount = [];

    // Iterate through phone banks to find suitable devices
    for (const phoneBank of phoneBanks) {
        const phoneBankDetail = await getPhoneBank(phoneBank.id);
        const phones = phoneBankDetail.data?.phones || phoneBankDetail.phones || [];

        phones.forEach(phone => {
            const hasAccount = phone.data?.versioning?.[request.account_type];
            const isHealthy = phone.data?.status === 'HEALTHY';

            if (isHealthy) {
                if (hasAccount && sourcePhonesWithAccount.length < request.count) {
                    sourcePhonesWithAccount.push(phone.device_id);
                } else if (!hasAccount && targetPhonesWithoutAccount.length < request.count) {
                    targetPhonesWithoutAccount.push(phone.device_id);
                }
            }
        });

        // Stop jika sudah cukup
        if (sourcePhonesWithAccount.length >= request.count &&
            targetPhonesWithoutAccount.length >= request.count) {
            break;
        }
    }

    const foundPairs = Math.min(sourcePhonesWithAccount.length, targetPhonesWithoutAccount.length);
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');

    return {
        data: {
            found_pairs: foundPairs,
            source_phones: sourcePhonesWithAccount.slice(0, foundPairs),
            target_phones: targetPhonesWithoutAccount.slice(0, foundPairs),
            batch_name: `#TRAN-${timestamp}-${request.account_type.toUpperCase()}-AUTO`
        }
    };
};

/**
 * Validate phonebank transfer sebelum create (Rebalancing)
 * @param {Object} data - { source_phonebank_id, target_phonebank_id, transfer_count, account_type }
 */
export const validatePhonebankTransfer = async (data) => {
    const response = await api.post('/api/account-transfer/phonebank/validate', data);
    return response.data;
};

/**
 * Create simplified phonebank transfer
 * @param {Object} data - { source_phonebank_id, target_phonebank_id, transfer_count, account_type }
 */
export const createPhonebankTransfer = async (data) => {
    const response = await api.post('/api/account-transfer/phonebank/transfers', data);
    return response.data;
};

/**
 * Ambil semua account_transfers untuk Process Task popup
 * @param {Object} params - { limit, skip, status }
 */
export const getProcessTaskList = async (params = {}) => {
    const response = await api.get('/api/account-transfer/transfers', { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data.items || data.transfers || []);
};

/**
 * Ambil semua transfer batches langsung dari tabel transfer_batches
 * @param {Object} params - { limit, skip }
 */

export const getCountTransferBatch = async (params = {}) => {
    try {
        const response = await api.get('/api/account-transfer/transfer-batches-count')
        const data = response.data;
        console.log("Data Count TransferBatch")
        console.log(data);
        return data ? data : "Error Unknown Data";
    } catch (error) {
        return error;
    }
}

export const getTransferBatchesList = async (params = {}) => {
    try {
        // Coba endpoint khusus transfer-batches untuk data dari tabel transfer_batches
        const response = await api.get('/api/account-transfer/transfer-batches', {
            params: { limit: params.limit || 100, skip: params.skip || 0 }
        });
        const data = response.data;
        return data.items || [];
    } catch (err) {
        // Fallback: group dari tabel account_transfers jika endpoint belum ada
        const response = await api.get('/api/account-transfer/transfers', {
            params: { limit: params.limit || 500, skip: params.skip || 0 }
        });
        const data = response.data;
        const transfers = Array.isArray(data) ? data : (data.items || []);

        const batchMap = {};
        transfers.forEach(t => {
            const bid = t.batch_id || 'unknown';
            if (!batchMap[bid]) {
                batchMap[bid] = {
                    batch_name: bid,
                    batch_id: bid,
                    account_type: t.account_type,
                    status: 'pending',
                    updated_at: t.updated_at,
                    total_requested: 0,
                    total_success: 0, total_failed: 0, processing: 0, pending: 0
                };
            }
            const b = batchMap[bid];
            b.total_requested++;
            if (t.status === 'completed') b.total_success++;
            else if (t.status === 'failed') b.total_failed++;
            else if (t.status === 'processing') b.processing++;
            else b.pending++;
            if (t.updated_at && new Date(t.updated_at) > new Date(b.updated_at)) b.updated_at = t.updated_at;
        });

        Object.values(batchMap).forEach(b => {
            if (b.total_success === b.total_requested) b.status = 'completed';
            else if (b.total_failed > 0 && b.total_success > 0) b.status = 'partial_success';
            else if (b.processing > 0) b.status = 'processing';
            else b.status = 'pending';
        });

        return Object.values(batchMap).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
};

/**
 * Mendapatkan URL streaming scrcpy untuk sebuah device
 * @param {string} deviceId 
 */
export const getScrcpyStreamUrl = async (deviceId) => {
    const response = await api.get(`/scrcpy/stream-url/${deviceId}`);
    return response.data;
};

/**
 * Get Batch Log Running Transfers 
 */

export const getBatchLog = async (batch, type = "global") => {
    try {
        const batchName = batch.batch_name || batch.id;
        const response = await api.get(`/api/account-transfer/logs/${batchName}/show`, {
            params: { type }
        });

        const data = response.data;
        if (!data || !data.content) {
            return { content: "", type: type };
        }

        // Descending content for terminal feel (optional, can be done in component)
        const descendingContent = data.content
            .split('\n')
            .reverse()
            .join('\n');

        return { ...data, content: descendingContent };
    } catch (err) {
        console.error(`Failed to fetch ${type} logs:`, err);
        return { content: `Waiting for ${type} logs...`, type: type };
    }
};




/**
 * Execute satu batch transfer via executor by batch_name (string)
 * @param {String} batchName - batch_name dari transfer_batches
 */
export const executeTransferBatch = async (batchName) => {
    const response = await api.post(`/api/account-transfer/executor/run-by-name/${encodeURIComponent(batchName)}`);
    return response.data;
};

/**
 * Execute semua batch yang berstatus 'processing'
 */
export const executeAllTransferBatches = async () => {
    const response = await api.post('/api/account-transfer/executor/run');
    return response.data;
};



/**
 * Retry single transfer yang failed
 * @param {Number} transferId - ID transfer
 */
export const retrySingleTransfer = async (transferId) => {
    const response = await api.post(`/api/account-transfer/transfers/${transferId}/retry`);
    return response.data;
};

/* =========================================
   TASK EXPORT
   ========================================= */

/**
 * Export all tasks to Excel file
 * Backend akan export semua tasks tanpa limit
 */
export const exportTasksToExcel = async () => {
    const response = await api.get('/tasks/export-excel', {
        responseType: 'blob' // Important untuk download file
    });
    return response.data;
};

export default api;