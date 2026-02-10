import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:9091',
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

export default api;