<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { 
  X, MessageSquare, Send, UserCog, ShieldCheck, 
  Clock, Play, Trash2, ToggleLeft, ToggleRight, 
  FileText, Plus, RefreshCw, Calendar, Smartphone,
  Bot, MessageCircle, Users, Repeat, CalendarDays, Hash,
  ChevronDown, Check, UserPlus, Minus, Image, Video, Upload
} from 'lucide-vue-next';

import { 
  getTasks, 
  getAllDevices, 
  createTask, 
  updateTask, 
  deleteTask, 
  toggleTaskStatus, 
  executeTaskNow,
  getTaskLogs,
  uploadMedia,
  uploadProfileImage
} from '@/services/api.js';

// --- 1. STATE MANAGEMENT ---
const tasks = ref([]);
const devices = ref([]);
const loading = ref(false);
const uploading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);

const showLogsModal = ref(false);
let taskLogs = ref("");
const logPolling = ref(null);

// Schedule configuration
const scheduleConfig = ref({
  frequency: 'daily',
  hour: 9,
  minute: 0,
  dayOfWeek: 1, // Monday (0=Sunday, 1=Monday, ...)
  dayOfMonth: 1
});

const scheduleFrequencies = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom' }
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Initial current task
const currentTask = ref({
  id: null,
  name: '',
  task_type: 'wa_blast',
  platform: 'wa_normal',
  cron_expression: '0 9 * * *',
  message: '',
  sender_device: '',      // Device yang mengirim (dari daftar devices)
  receiver_number: '',    // Nomor tujuan yang menerima
  target_device: '',      // Backward compatibility
  media_path: '',
  media_file: null,
  caption: '',
  profile_data: {
    device_id: '',
    phone_number: '',
    profile_name: '',
    profile_image: ''
  },
  is_active: true
});

const taskOptions = [
  // WhatsApp Options
  { 
    id: 'wa_blast', 
    name: 'WA Send Text', 
    icon: MessageSquare, 
    color: 'text-green-400', 
    bg: 'bg-green-500/10',
    description: 'Send text message via WhatsApp',
    platform: 'wa_normal',
    requiresMedia: false,
    requiresProfile: false
  },
  { 
    id: 'wa_send_image', 
    name: 'WA Send Image', 
    icon: Image, 
    color: 'text-green-400', 
    bg: 'bg-green-500/10',
    description: 'Send image + text via WhatsApp',
    platform: 'wa_normal',
    requiresMedia: true,
    mediaType: 'image',
    requiresProfile: false
  },
  { 
    id: 'wa_send_video', 
    name: 'WA Send Video', 
    icon: Video, 
    color: 'text-green-400', 
    bg: 'bg-green-500/10',
    description: 'Send video + text via WhatsApp',
    platform: 'wa_normal',
    requiresMedia: true,
    mediaType: 'video',
    requiresProfile: false
  },
  { 
    id: 'wa_profile_update', 
    name: 'Update WA Profile', 
    icon: UserCog, 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-500/10',
    description: 'Update WhatsApp profile name and image',
    platform: 'wa_normal',
    requiresMedia: false,
    requiresProfile: true
  },
  
  // Telegram Options
  { 
    id: 'telegram_blast', 
    name: 'Tele Send Text', 
    icon: Send, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    description: 'Send text message via Telegram',
    platform: 'telegram',
    requiresMedia: false,
    requiresProfile: false
  },
  { 
    id: 'telegram_send_image', 
    name: 'Tele Send Image', 
    icon: Image, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    description: 'Send image + text via Telegram',
    platform: 'telegram',
    requiresMedia: true,
    mediaType: 'image',
    requiresProfile: false
  },
  { 
    id: 'telegram_send_video', 
    name: 'Tele Send Video', 
    icon: Video, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    description: 'Send video + text via Telegram',
    platform: 'telegram',
    requiresMedia: true,
    mediaType: 'video',
    requiresProfile: false
  },
  { 
    id: 'telegram_profile_update', 
    name: 'Update Tele Profile', 
    icon: ShieldCheck, 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/10',
    description: 'Update Telegram profile name and image',
    platform: 'telegram',
    requiresMedia: false,
    requiresProfile: true
  }
];

// Platform options for profile update
const platformOptions = [
  { id: 'wa_normal', name: 'WhatsApp Normal' },
  { id: 'wa_clone', name: 'WhatsApp Clone' },
  { id: 'wa_business', name: 'WhatsApp Business' },
  { id: 'telegram', name: 'Telegram' }
];

// Computed
const currentTaskOption = computed(() => {
  return taskOptions.find(opt => opt.id === currentTask.value.task_type);
});

const requiresMedia = computed(() => {
  return currentTaskOption.value?.requiresMedia || false;
});

const requiresProfile = computed(() => {
  return currentTaskOption.value?.requiresProfile || false;
});

const mediaType = computed(() => {
  return currentTaskOption.value?.mediaType || null;
});

const availableDevices = computed(() => {
  console.log(currentTask.value);
  const platform = currentTask.value.platform;
  return devices.value.filter(device => 
    device.platform === platform || !device.platform
  );
});

const getTaskTypeName = (taskType) => {
  const option = taskOptions.find(opt => opt.id === taskType);
  return option?.name || taskType.replace(/_/g, ' ');
};

const cronDescription = computed(() => {
  const { frequency, hour, minute, dayOfWeek, dayOfMonth } = scheduleConfig.value;
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  
  switch(frequency) {
    case 'daily':
      return `Runs every day at ${time}`;
    case 'weekly':
      return `Runs every ${daysOfWeek[dayOfWeek]} at ${time}`;
    case 'monthly':
      return `Runs on day ${dayOfMonth} of every month at ${time}`;
    case 'custom':
      return 'Custom cron expression';
    default:
      return '';
  }
});

// --- 2. CORE LOGIC & API ACTIONS ---
const fetchData = async () => {
  loading.value = true;
  try {
    const [taskData, deviceData] = await Promise.all([
      getTasks(),
      getAllDevices()
    ]);
    tasks.value = taskData;
    devices.value = deviceData.devices || [];
    console.log('Tasks:', tasks.value);
    console.log('Devices:', devices.value);
  } catch (err) {
    console.error("Failed to fetch data:", err);
    alert("Failed to load data: " + (err.message || "Check backend connection"));
  } finally {
    loading.value = false;
  }
};

const handleSaveTask = async () => {
  // Validation
  if (!currentTask.value.name || !currentTask.value.name.trim()) {
    return alert("Please enter a task name");
  }

  if (requiresMedia.value && !currentTask.value.media_path) {
    return alert(`Please upload a ${mediaType.value} file first`);
  }

  if (requiresProfile.value) {
    if (!currentTask.value.profile_data.device_id || !currentTask.value.profile_data.phone_number) {
      return alert ("Please fill in device_id and phone_number for profile update");
    }
  }

  if (!requiresProfile.value) {
    if (!currentTask.value.sender_device) {
      return alert("Please select sender device");
    }
    if (!currentTask.value.receiver_number) {
      return alert("Please select receiver device");
    }
    if (currentTask.value.sender_device === currentTask.value.receiver_number) {
      return alert("❌ Sender and receiver cannot be the same device!");
    }
  }

  loading.value = true;
  try {
    const payload = {
      name: currentTask.value.name,
      task_type: currentTask.value.task_type,
      platform: currentTask.value.platform,
      cron_expression: currentTask.value.cron_expression,
      is_active: currentTask.value.is_active
    };

    // Add fields based on task type
    if (requiresMedia.value) {
      // Media tasks (image/video)
      payload.media_path = currentTask.value.media_path;
      payload.caption = currentTask.value.caption || currentTask.value.message;
      payload.device_1 = currentTask.value.sender_device;    // Sender device
      payload.device_2 = currentTask.value.receiver_number;  // Receiver device
      payload.target_device = currentTask.value.receiver_number; // Backward compatibility
    } else if (requiresProfile.value) {
      // Profile update tasks
      payload.profile_data = currentTask.value.profile_data;
    } else {
      // Text blast tasks
      payload.device_1 = currentTask.value.sender_device;    // Sender device
      payload.device_2 = currentTask.value.receiver_number;  // Receiver device
      payload.caption = currentTask.value.message;
      payload.target_device = currentTask.value.receiver_number; // Backward compatibility
    }

    if (isEditing.value) {
      await updateTask(currentTask.value.id, payload);
    } else {
      await createTask(payload);
    }
    
    showModal.value = false;
    await fetchData();
  } catch (err) {
    console.error("Save task error:", err);
    alert("Failed to save task: " + (err.response?.data?.detail || err.message || "Unknown error"));
  } finally {
    loading.value = false;
  }
};

const handleToggle = async (task) => {
  const original = task.is_active;
  task.is_active = !original;
  try {
    await toggleTaskStatus(task.id);
  } catch (err) {
    task.is_active = original;
    alert("Failed to toggle task status");
  }
};

const handleExecuteNow = async (id) => {
  if (!confirm("Execute this task now?")) return;
  try {
    await executeTaskNow(id);
    alert("Task execution started successfully");
  } catch (err) {
    alert("Failed to execute task");
  }
};

const handleDelete = async (id) => {
  if (!confirm("Delete this task permanently?")) return;
  try {
    await deleteTask(id);
    await fetchData();
  } catch (err) {
    alert("Failed to delete task");
  }
};

// --- 3. MODAL & FILE UPLOAD LOGIC ---
const selectFrequency = (freq) => {
  scheduleConfig.value.frequency = freq;
  if (freq !== 'custom') {
    updateCronExpression();
  }
};

const updateCronExpression = () => {
  const { frequency, hour, minute, dayOfWeek, dayOfMonth } = scheduleConfig.value;
  
  switch(frequency) {
    case 'daily':
      currentTask.value.cron_expression = `${minute} ${hour} * * *`;
      break;
    case 'weekly':
      currentTask.value.cron_expression = `${minute} ${hour} * * ${dayOfWeek}`;
      break;
    case 'monthly':
      currentTask.value.cron_expression = `${minute} ${hour} ${dayOfMonth} * *`;
      break;
    // custom: user edits directly
  }
};

const parseCronExpression = (cron) => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  scheduleConfig.value.minute = parseInt(minute) || 0;
  scheduleConfig.value.hour = parseInt(hour) || 9;
  
  // Detect frequency
  if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    scheduleConfig.value.frequency = 'monthly';
    scheduleConfig.value.dayOfMonth = parseInt(dayOfMonth) || 1;
  } else if (dayOfWeek !== '*' && dayOfMonth === '*') {
    scheduleConfig.value.frequency = 'weekly';
    scheduleConfig.value.dayOfWeek = parseInt(dayOfWeek) || 1;
  } else if (dayOfMonth === '*' && dayOfWeek === '*') {
    scheduleConfig.value.frequency = 'daily';
  } else {
    scheduleConfig.value.frequency = 'custom';
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentTask.value = { 
    id: null, 
    name: '',
    task_type: 'wa_blast', 
    platform: 'wa_normal',
    cron_expression: '0 9 * * *',
    message: '',
    sender_device: '',
    receiver_number: '',
    target_device: '',
    media_path: '',
    media_file: null,
    caption: '',
    profile_data: {
      device_id: '',
      phone_number: '',
      profile_name: '',
      profile_image: ''
    },
    is_active: true
  };
  
  // Reset schedule config
  scheduleConfig.value = {
    frequency: 'daily',
    hour: 9,
    minute: 0,
    dayOfWeek: 1,
    dayOfMonth: 1
  };
  
  showModal.value = true;
};

const openEditModal = (task) => {
  isEditing.value = true;
  currentTask.value = JSON.parse(JSON.stringify(task));
  
  // Map backend fields to frontend fields
  if (currentTask.value.device_1) {
    currentTask.value.sender_device = currentTask.value.device_1;
  }
  if (currentTask.value.device_2) {
    currentTask.value.receiver_number = currentTask.value.device_2;
  }
  
  // Ensure profile_data exists
  if (!currentTask.value.profile_data) {
    currentTask.value.profile_data = {
      device_id: '',
      phone_number: '',
      profile_name: '',
      profile_image: ''
    };
  }
  
  // Parse existing cron expression
  if (currentTask.value.cron_expression) {
    parseCronExpression(currentTask.value.cron_expression);
  }
  
  currentTask.value.media_file = null;
  showModal.value = true;
};

const selectTaskType = (taskType) => {
  const option = taskOptions.find(opt => opt.id === taskType);
  currentTask.value.task_type = taskType;
  currentTask.value.platform = option.platform;
  
  // Reset media fields
  currentTask.value.media_path = '';
  currentTask.value.media_file = null;
  currentTask.value.caption = '';
  
  // Reset profile fields
  if (!requiresProfile.value) {
    currentTask.value.profile_data = {
      device_id: '',
      phone_number: '',
      profile_name: '',
      profile_image: ''
    };
  }
};

// Media file upload
const handleMediaFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
  
  const validTypes = mediaType.value === 'image' ? validImageTypes : validVideoTypes;
  
  if (!validTypes.includes(file.type)) {
    alert(`Please select a valid ${mediaType.value} file`);
    event.target.value = '';
    return;
  }
  
  // Validate file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('File size must be less than 50MB');
    event.target.value = '';
    return;
  }
  
  currentTask.value.media_file = file;
  
  // Upload immediately
  await uploadMediaFile(file);
};

const uploadMediaFile = async (file) => {
  uploading.value = true;
  try {
    const result = await uploadMedia(file);
    currentTask.value.media_path = result.remote_path;
    alert(`${mediaType.value.charAt(0).toUpperCase() + mediaType.value.slice(1)} uploaded successfully!`);
  } catch(err) {
    console.error("Upload error:", err);
    alert("Failed to upload file: " + (err.response?.data?.detail || err.message));
    currentTask.value.media_file = null;
    currentTask.value.media_path = '';
  } finally {
    uploading.value = false;
  }
};

const clearMediaFile = () => {
  currentTask.value.media_file = null;
  currentTask.value.media_path = '';
};

// Profile image upload
const handleProfileImageChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    alert('Only JPG and PNG images are allowed');
    event.target.value = '';
    return;
  }
  
  // Validate file size (max 5MB for profile)
  if (file.size > 5 * 1024 * 1024) {
    alert('Profile image must be less than 5MB');
    event.target.value = '';
    return;
  }
  
  // Upload immediately
  uploading.value = true;
  try {
    const result = await uploadProfileImage(file);
    currentTask.value.profile_data.profile_image = result.remote_path;
    alert('Profile image uploaded successfully!');
  } catch (err) {
    console.error("Profile upload error:", err);
    alert("Failed to upload profile image: " + (err.response?.data?.detail || err.message));
  } finally {
    uploading.value = false;
  }
};

const clearProfileImage = () => {
  currentTask.value.profile_data.profile_image = '';
};

// Sync device selection
const onDeviceSelect = () => {
  const device = availableDevices.value.find(d => d.id === currentTask.value.profile_data.device_id);
  if (device) {
    currentTask.value.profile_data.phone_number = device.phone;
  }
};

const onPhoneSelect = () => {
  const device = availableDevices.value.find(d => d.phone === currentTask.value.profile_data.phone_number);
  if (device) {
    currentTask.value.profile_data.device_id = device.id;
  }
};

// Logs
const parseLogLine = (line) => {
  if (!line.trim()) return null;
  
  // Parse log format: "2026-02-05 10:53:00 - [INFO] - Message"
  const logRegex = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - \[(\w+)\] - (.+)$/;
  const match = line.match(logRegex);
  
  if (match) {
    const [, timestamp, level, message] = match;
    return {
      timestamp,
      level: level.toUpperCase(),
      message: message.trim(),
      isStructured: true
    };
  }
  
  // Handle separator lines
  if (line.includes('====')) {
    return {
      type: 'separator',
      isStructured: false
    };
  }
  
  // Handle step headers
  if (line.includes('STEP ')) {
    return {
      type: 'step',
      message: line.trim(),
      isStructured: false
    };
  }
  
  // Plain text
  return {
    type: 'plain',
    message: line,
    isStructured: false
  };
};

const formattedLogs = computed(() => {
  // 1. Validasi awal
  if (!taskLogs.value || typeof taskLogs.value !== 'string') {
    return [];
  }
  console.log("2")
  const logs = [];
  const lines = taskLogs.value.split('\n').filter(line => line.trim());

  let tracebackBuffer = [];
  let inTraceback = false;
  console.log("3")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // A. Deteksi STEP / Separator
    if (line.includes('STEP') || /^={10,}/.test(line) || line.includes('TASK EXECUTION')) {
      const cleanMsg = line.replace(/={2,}/g, '').trim();
      if (cleanMsg) {
        logs.push({ 
          type: 'step', 
          message: cleanMsg 
        });
      }
      continue;
    }

    // B. Deteksi awal Traceback (bisa dari ERROR message atau standalone)
    if (line.includes('Traceback (most recent call last)')) {
      inTraceback = true;
      tracebackBuffer = [line];
      continue;
    }

    // C. Jika sedang dalam mode traceback
    if (inTraceback) {
      tracebackBuffer.push(line);
      
      // Cek apakah ini baris terakhir traceback
      const nextLine = lines[i + 1]?.trim() || '';
      const isEndOfTraceback = !nextLine || 
        nextLine.match(/^\d{4}-\d{2}-\d{2}/) || 
        nextLine.includes('STEP') ||
        /^={10,}/.test(nextLine);
      
      if (isEndOfTraceback) {
        logs.push({ 
          type: 'error_traceback', 
          message: tracebackBuffer.join('\n') 
        });
        inTraceback = false;
        tracebackBuffer = [];
      }
      continue;
    }

    // D. Parse Structured Log dengan regex yang FLEKSIBEL untuk spasi
    // Format: YYYY-MM-DD HH:MM:SS - [LEVEL] - Message
    const match = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*-\s*\[([A-Z]+)\]\s*-\s*(.*)$/);
    
    if (match) {
      const [, timestamp, level, message] = match;
      
      // Jika message mengandung "Traceback", pisahkan
      if (message.includes('Traceback (most recent call last)')) {
        // Split antara prefix message dan traceback
        const parts = message.split('Traceback (most recent call last)');
        
        // Tambahkan message prefix jika ada
        if (parts[0].trim()) {
          logs.push({
            isStructured: true,
            timestamp: timestamp.trim(),
            level: level.trim(),
            message: parts[0].trim()
          });
        }
        
        // Mulai traceback buffer
        inTraceback = true;
        tracebackBuffer = ['Traceback (most recent call last)' + (parts[1] || '')];
        continue;
      }
      
      logs.push({
        isStructured: true,
        timestamp: timestamp.trim(),
        level: level.trim(),
        message: message.trim()
      });
      continue;
    }

    // E. Plain text (continuation lines, dll)
    logs.push({ 
      type: 'plain', 
      message: line 
    });
  }

  console.log("✅ Parsed Logs:", logs.length);
  return logs.reverse(); // Terbaru di atas
});

const openLogs = async (taskId) => {
  showLogsModal.value = true;
  taskLogs.value = "Loading logs...";
  
  const fetchLogs = async () => {
    try {
      const res = await getTaskLogs(taskId);
      
      if (res && res.logs) {
        if (typeof res.logs === 'string') {
          taskLogs.value = res.logs;
        } else if (Array.isArray(res.logs)) {
          taskLogs.value = res.logs.join('\n');
        } else {
          taskLogs.value = "Unsupported log format";
        }
      } else {
        taskLogs.value = "No logs available";
      }
    } catch (e) { 
      taskLogs.value = `Failed to fetch logs: ${e.message}`; 
    }
  };
  
  await fetchLogs();
  if (logPolling.value) clearInterval(logPolling.value);
  logPolling.value = setInterval(fetchLogs, 3000);
};

const closeLogs = () => {
  showLogsModal.value = false;
  if (logPolling.value) {
    clearInterval(logPolling.value);
    logPolling.value = null;
  }
};

// Format time
const formatTime = (dateStr) => {
  if (!dateStr) return 'Not run yet';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

watch([showModal, showLogsModal], ([m, l]) => {
  document.body.style.overflow = (m || l) ? 'hidden' : '';
});

onMounted(fetchData);
onUnmounted(() => clearInterval(logPolling.value));
</script>

<template>
<div class="min-h-screen bg-[#040D2A] text-gray-200 p-6 pt-24 md:pt-32 font-sans relative overflow-hidden">
  <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>

  <div class="max-w-8xl mx-auto relative z-10 px-4">
    
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-blue-500/10 pb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-white uppercase italic">
            Task <span class="text-blue-500">Scheduler</span>
          </h1>
          <div class="flex items-center gap-2 mt-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p class="text-blue-400 text-xs font-mono uppercase tracking-widest">Advanced Automation</p>
          </div>
        </div>

        <div class="flex gap-3 w-full md:w-auto">
          <button @click="fetchData" 
            class="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg hover:bg-blue-900/40 transition-all">
            <RefreshCw :class="{'animate-spin': loading}" class="w-4 h-4 text-blue-400" />
          </button>
          
          <button @click="openCreateModal" 
            class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all">
            <Plus class="w-4 h-4" /> 
            <span>New Task</span>
          </button>
        </div>
      </div>

      <!-- Task Grid -->
      <div class="max-h-[calc(90vh-180px)] overflow-y-auto">
        <div v-if="tasks.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div v-for="task in tasks" :key="task.id" 
            class="bg-black/40 border border-blue-900/40 rounded-2xl p-4 hover:border-blue-500/50 transition-all">
            
            <!-- Task Header -->
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-3">
                <div :class="['p-3 rounded-lg border', taskOptions.find(o => o.id === task.task_type)?.bg || 'bg-blue-500/10']">
                  <component :is="taskOptions.find(o => o.id === task.task_type)?.icon || MessageSquare" 
                    :class="['w-5 h-5', taskOptions.find(o => o.id === task.task_type)?.color || 'text-blue-400']" />
                </div>
                <div @click="openEditModal(task)" class="cursor-pointer">
                  <h3 class="font-semibold text-white text-sm">
                    {{ task.name || getTaskTypeName(task.task_type) }}
                  </h3>
                  <div class="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock class="w-3 h-3" /> 
                    <span class="font-mono">{{ task.cron_expression }}</span>
                  </div>
                </div>
              </div>
              
              <button @click="handleToggle(task)" class="focus:outline-none">
                <ToggleRight v-if="task.is_active" class="w-8 h-8 text-emerald-500" />
                <ToggleLeft v-else class="w-8 h-8 text-gray-600" />
              </button>
            </div>

            <!-- Media Info -->
            <div v-if="task.media_path" class="mb-3 p-3 bg-purple-900/10 rounded-lg text-xs">
              <div class="flex items-center gap-2 mb-1">
                <component :is="task.task_type.includes('image') ? Image : Video" class="w-4 h-4 text-purple-400" />
                <span class="text-purple-400 font-medium">
                  {{ task.task_type.includes('image') ? 'Image' : 'Video' }}
                </span>
              </div>
              <p class="text-gray-400 truncate">{{ task.media_path }}</p>
            </div>

            <!-- Caption -->
            <div v-if="task.caption" class="mb-3">
              <p class="text-sm text-gray-300 line-clamp-2">"{{ task.caption }}"</p>
            </div>

            <!-- Sender/Receiver -->
            <div v-if="task.device_1 || task.device_2" class="mb-4 p-3 bg-gradient-to-r from-blue-900/10 to-green-900/10 rounded-lg">
              <div class="flex items-center justify-between text-xs">
                <div class="text-blue-400 font-medium">
                  {{ task.device_1 || 'N/A' }}
                </div>
                <span class="text-gray-500">→</span>
                <div class="text-green-400 font-medium">
                  {{ task.device_2 || 'N/A' }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center border-t border-white/5 pt-3">
              <div class="flex gap-4">
                <button @click="handleExecuteNow(task.id)" 
                  class="text-xs text-blue-400 hover:text-white flex items-center gap-1">
                  <Play class="w-4 h-4" /> Run
                </button>
                <button @click="openLogs(task.id)" 
                  class="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                  <FileText class="w-4 h-4" /> Logs
                </button>
              </div>
              <button @click="handleDelete(task.id)" 
                class="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading" 
          class="flex flex-col items-center justify-center py-16 border-2 border-dashed border-blue-900/20 rounded-xl">
          <CalendarDays class="w-12 h-12 text-blue-500/20 mb-4" />
          <h2 class="text-lg font-semibold text-gray-600 uppercase">No Tasks</h2>
          <p class="text-gray-700 text-sm mt-2">Create your first automated task</p>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <!-- Task Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-slate-950/80">
        <div class="bg-[#040D2A] border-2 border-blue-500/20 w-full max-w-6xl rounded-[1rem] shadow-[0_0_100px_rgba(30,58,138,0.4)] overflow-hidden flex flex-col max-h-[95vh]">
          <div class="p-10 border-b border-white/5 flex justify-between items-center bg-blue-500/5">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl">
                <CalendarDays class="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 class="text-2xl font-black text-white tracking-widest uppercase italic">{{ isEditing ? 'Edit Task' : 'Create Task' }}</h3>
                <p class="text-[11px] text-blue-400 font-mono tracking-widest uppercase">Advanced Task Configuration</p>
              </div>
            </div>
            <button @click="showModal = false" class="p-4 hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white"><X /></button>
          </div>
          
          <div class="p-10 overflow-y-auto space-y-12 custom-scrollbar">
            <!-- Task Name -->
            <div class="space-y-4">
              <label class="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] ml-3">Task Name</label>
              <input 
                v-model="currentTask.name" 
                type="text"
                placeholder="Enter task name..."
                class="w-full bg-black/40 border-2 border-blue-900/20 rounded-[2rem] p-7 text-lg text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-800"
              />
            </div>

            <!-- Task Type Selection -->
            <div class="space-y-6">
              <label class="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] ml-3">Task Type</label>
              <div class="grid grid-cols-2 gap-6">
                <button v-for="opt in taskOptions" :key="opt.id" @click="selectTaskType(opt.id)"
                  :class="['flex items-start gap-6 p-7 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden group',
                    currentTask.task_type === opt.id ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg' : 'border-white/5 bg-black/30 text-gray-600'
                  ]">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-4">
                      <component :is="opt.icon" :class="['w-7 h-7', currentTask.task_type === opt.id ? opt.color : 'text-gray-600']" />
                      <span class="text-xs font-black uppercase tracking-[0.2em]">{{ opt.name }}</span>
                    </div>
                    <p class="text-[10px] text-gray-500 leading-tight max-w-xs">{{ opt.description }}</p>
                  </div>
                  <div v-if="currentTask.task_type === opt.id" class="absolute top-0 right-0 w-12 h-12 bg-blue-500 rounded-bl-3xl flex items-center justify-center shadow-xl">
                    <Check class="w-6 h-6 text-white" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Platform Selection (for profile update) -->
            <div v-if="requiresProfile" class="space-y-4">
              <label class="text-[11px] font-black text-purple-400 uppercase tracking-[0.4em] ml-3">Platform</label>
              <select 
                v-model="currentTask.platform"
                class="w-full bg-black/40 border-2 border-purple-900/20 rounded-[2rem] p-7 text-lg text-white focus:outline-none focus:border-purple-500 transition-all"
              >
                <option v-for="platform in platformOptions" :key="platform.id" :value="platform.id">
                  {{ platform.name }}
                </option>
              </select>
            </div>

            <!-- Media Upload Section -->
            <div v-if="requiresMedia" class="space-y-6">
              <div class="flex items-center gap-4">
                <component :is="mediaType === 'image' ? Image : Video" class="w-6 h-6 text-purple-400" />
                <label class="text-[11px] font-black text-purple-400 uppercase tracking-[0.4em]">
                  {{ mediaType === 'image' ? 'Image' : 'Video' }} Upload
                </label>
              </div>

              <div class="bg-purple-900/10 border-2 border-purple-500/20 rounded-[2.5rem] p-8 space-y-6">
                <div class="relative">
                  <input 
                    type="file" 
                    @change="handleMediaFileChange"
                    :accept="mediaType === 'image' ? 'image/*' : 'video/*'"
                    class="hidden" 
                    id="media-upload"
                    :disabled="uploading"
                  />
                  <label 
                    for="media-upload" 
                    :class="['flex items-center justify-center gap-4 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                      uploading ? 'border-purple-500/10 bg-purple-500/5 cursor-wait' : 'border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5'
                    ]"
                  >
                    <Upload class="w-8 h-8 text-purple-400" :class="{'animate-bounce': uploading}" />
                    <div class="text-center">
                      <p class="text-sm font-black text-purple-300">
                        {{ uploading ? 'Uploading...' : (currentTask.media_path ? '✓ Uploaded' : `Click to upload ${mediaType}`) }}
                      </p>
                      <p class="text-[10px] text-gray-500 mt-1">Max size: 2MB</p>
                      <p v-if="currentTask.media_path" class="text-[10px] text-green-400 mt-2 font-mono truncate max-w-md">
                        {{ currentTask.media_path }}
                      </p>
                    </div>
                  </label>
                  <button 
                    v-if="currentTask.media_path && !uploading"
                    @click="clearMediaFile"
                    class="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400 transition-all"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Profile Update Section -->
            <div v-if="requiresProfile" class="space-y-6">
              <div class="flex items-center gap-4">
                <UserCog class="w-6 h-6 text-indigo-400" />
                <label class="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Profile Information</label>
              </div>

              <div class="bg-indigo-900/10 border-2 border-indigo-500/20 rounded-[2.5rem] p-8 space-y-6">
                <!-- Single Device Selector -->
                <div class="space-y-2">
                  <label class="text-xs text-indigo-300 uppercase tracking-wider">Select Device to Update Profile</label>
                  <select 
                    v-model="currentTask.profile_data.device_id"
                    @change="onDeviceSelect"
                    class="w-full bg-black/40 border-2 border-indigo-900/20 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="" disabled>Choose a device...</option>
                    <option v-for="device in availableDevices" :key="device.id" :value="device.id">
                      📱 {{ device.phone }} - {{ device.platform || 'Unknown' }} ({{ device.id }})
                    </option>
                  </select>
                  <p class="text-[10px] text-gray-500 italic">Select the device whose profile you want to update</p>
                </div>

                <!-- Display selected device info -->
                

                <div class="space-y-2">
                  <label class="text-xs text-indigo-300 uppercase tracking-wider">Profile Name</label>
                  <input 
                    v-model="currentTask.profile_data.profile_name"
                    type="text"
                    placeholder="Enter new profile name"
                    class="w-full bg-black/40 border-2 border-indigo-900/20 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-700"
                  />
                </div>

                <!-- Profile Image Upload -->
                <div class="space-y-2">
                  <label class="text-xs text-indigo-300 uppercase tracking-wider">Profile Image</label>
                  <div class="relative">
                    <input 
                      type="file" 
                      @change="handleProfileImageChange"
                      accept="image/jpeg,image/png"
                      class="hidden" 
                      id="profile-upload"
                      :disabled="uploading"
                    />
                    <label 
                      for="profile-upload" 
                      :class="['flex items-center justify-center gap-4 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                        uploading ? 'border-indigo-500/10 bg-indigo-500/5 cursor-wait' : 'border-indigo-500/30 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                      ]"
                    >
                      <Upload class="w-6 h-6 text-indigo-400" :class="{'animate-bounce': uploading}" />
                      <div class="text-center">
                        <p class="text-sm font-black text-indigo-300">
                          {{ uploading ? 'Uploading...' : (currentTask.profile_data.profile_image ? '✓ Image Uploaded' : 'Click to upload profile image') }}
                        </p>
                        <p class="text-[10px] text-gray-500 mt-1">JPG or PNG, max 5MB</p>
                        <p v-if="currentTask.profile_data.profile_image" class="text-[10px] text-green-400 mt-2 font-mono truncate max-w-md">
                          {{ currentTask.profile_data.profile_image }}
                        </p>
                      </div>
                    </label>
                    <button 
                      v-if="currentTask.profile_data.profile_image && !uploading"
                      @click="clearProfileImage"
                      class="absolute top-3 right-3 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400 transition-all"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Schedule Builder -->
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <Clock class="w-6 h-6 text-emerald-400" />
                <label class="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em]">Schedule</label>
              </div>

              <div class="bg-emerald-900/10 border-2 border-emerald-500/20 rounded-[2.5rem] p-8 space-y-6">
                <!-- Frequency Selection -->
                <div class="space-y-3">
                  <label class="text-xs text-emerald-300 uppercase tracking-wider">Frequency</label>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button 
                      v-for="freq in scheduleFrequencies" 
                      :key="freq.id"
                      @click="selectFrequency(freq.id)"
                      type="button"
                      :class="['p-4 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-wider',
                        scheduleConfig.frequency === freq.id 
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' 
                          : 'border-emerald-900/20 bg-black/30 text-gray-600 hover:border-emerald-500/30'
                      ]"
                    >
                      {{ freq.label }}
                    </button>
                  </div>
                </div>

                <!-- Time Selection -->
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs text-emerald-300 uppercase tracking-wider">Hour (0-23)</label>
                    <input 
                      v-model.number="scheduleConfig.hour"
                      @input="updateCronExpression"
                      type="number"
                      min="0"
                      max="23"
                      class="w-full bg-black/40 border-2 border-emerald-900/20 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs text-emerald-300 uppercase tracking-wider">Minute (0-59)</label>
                    <input 
                      v-model.number="scheduleConfig.minute"
                      @input="updateCronExpression"
                      type="number"
                      min="0"
                      max="59"
                      class="w-full bg-black/40 border-2 border-emerald-900/20 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <!-- Day of Week (for weekly) -->
                <div v-if="scheduleConfig.frequency === 'weekly'" class="space-y-3">
                  <label class="text-xs text-emerald-300 uppercase tracking-wider">Day of Week</label>
                  <div class="grid grid-cols-7 gap-2">
                    <button 
                      v-for="(day, idx) in daysOfWeek" 
                      :key="idx"
                      @click="scheduleConfig.dayOfWeek = idx; updateCronExpression()"
                      type="button"
                      :class="['p-3 rounded-xl border-2 transition-all text-xs font-black uppercase',
                        scheduleConfig.dayOfWeek === idx 
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' 
                          : 'border-emerald-900/20 bg-black/30 text-gray-600 hover:border-emerald-500/30'
                      ]"
                    >
                      {{ day }}
                    </button>
                  </div>
                </div>

                <!-- Day of Month (for monthly) -->
                <div v-if="scheduleConfig.frequency === 'monthly'" class="space-y-2">
                  <label class="text-xs text-emerald-300 uppercase tracking-wider">Day of Month (1-31)</label>
                  <input 
                    v-model.number="scheduleConfig.dayOfMonth"
                    @input="updateCronExpression"
                    type="number"
                    min="1"
                    max="31"
                    class="w-full bg-black/40 border-2 border-emerald-900/20 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <!-- Custom Cron (for custom frequency) -->
                <div v-if="scheduleConfig.frequency === 'custom'" class="space-y-2">
                  <label class="text-xs text-emerald-300 uppercase tracking-wider">Custom Cron Expression</label>
                  <input 
                    v-model="currentTask.cron_expression"
                    type="text"
                    placeholder="e.g., */5 * * * * (every 5 minutes)"
                    class="w-full bg-black/40 border-2 border-emerald-900/20 rounded-2xl p-5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-gray-700"
                  />
                </div>

                <!-- Generated Cron Preview -->
                <div class="bg-black/40 rounded-2xl p-5 border border-emerald-500/10">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-emerald-400 uppercase tracking-wider">Generated Cron:</span>
                    <code class="text-sm font-mono text-white bg-emerald-500/10 px-4 py-2 rounded-lg">{{ currentTask.cron_expression }}</code>
                  </div>
                  <p class="text-[10px] text-gray-500 mt-2">{{ cronDescription }}</p>
                </div>
              </div>
            </div>

            <!-- Sender & Receiver (for non-profile tasks) -->
            <div v-if="!requiresProfile" class="space-y-6">
              <div class="flex items-center gap-4">
                <Smartphone class="w-6 h-6 text-blue-400" />
                <label class="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em]">Sender & Receiver</label>
              </div>

              <div class="bg-blue-900/10 border-2 border-blue-500/20 rounded-[2.5rem] p-8 space-y-6">
                <!-- Sender Device -->
                <div class="space-y-3">
                  <label class="text-xs text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <span class="bg-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-black">FROM</span>
                    Sender Device
                  </label>
                  <select 
                    v-model="currentTask.sender_device" 
                    class="w-full bg-black/40 border-2 border-blue-900/20 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="" disabled>Select sender device...</option>
                    <option 
                      v-for="device in availableDevices" 
                      :key="'sender-' + device.phone" 
                      :value="device.phone"
                      :disabled="device.phone === currentTask.receiver_number"
                    >
                      {{ device.phone === currentTask.receiver_number ? '🚫' : '📱' }} {{ device.phone }} - {{ device.platform || 'Unknown' }} ({{ device.id || 'N/A' }}){{ device.phone === currentTask.receiver_number ? ' - Already selected as receiver' : '' }}
                    </option>
                  </select>
                  <p class="text-[10px] text-gray-500 italic">Device that will send the message</p>
                </div>

                <!-- Receiver Device -->
                <div class="space-y-3">
                  <label class="text-xs text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <span class="bg-green-500/20 px-3 py-1 rounded-lg text-[10px] font-black text-green-400">TO</span>
                    Receiver Device
                  </label>
                  <select 
                    v-model="currentTask.receiver_number" 
                    class="w-full bg-black/40 border-2 border-blue-900/20 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="" disabled>Select receiver device...</option>
                    <option 
                      v-for="device in availableDevices" 
                      :key="'receiver-' + device.phone" 
                      :value="device.phone"
                      :disabled="device.phone === currentTask.sender_device"
                    >
                      {{ device.phone === currentTask.sender_device ? '🚫' : '📱' }} {{ device.phone }} - {{ device.platform || 'Unknown' }} ({{ device.id || 'N/A' }}){{ device.phone === currentTask.sender_device ? ' - Already selected as sender' : '' }}
                    </option>
                  </select>
                  <p class="text-[10px] text-gray-500 italic">Device that will receive the message</p>
                </div>

                <!-- Preview -->
                <div v-if="currentTask.sender_device && currentTask.receiver_number" class="bg-black/40 rounded-2xl p-4 border border-blue-500/10">
                  <div class="flex items-center justify-center gap-3 text-sm">
                    <span class="text-blue-400 font-mono">{{ currentTask.sender_device }}</span>
                    <span class="text-gray-600">→</span>
                    <span class="text-green-400 font-mono">{{ currentTask.receiver_number }}</span>
                  </div>
                </div>

                <!-- Warning if same device -->
                <div v-if="currentTask.sender_device === currentTask.receiver_number && currentTask.sender_device" 
                  class="bg-red-900/20 border border-red-500/30 rounded-2xl p-4">
                  <div class="flex items-center gap-2 text-red-400 text-xs">
                    <span class="text-lg">⚠️</span>
                    <span class="font-black">Cannot send to the same device!</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message/Caption -->
            <!-- <div class="space-y-4">
              <label class="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] ml-3">
                {{ requiresMedia ? 'Caption' : 'Message' }}
              </label>
              <textarea v-model="currentTask.message" rows="4" 
                class="w-full bg-black/40 border-2 border-blue-900/20 rounded-[2rem] p-7 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-800" 
                :placeholder="requiresMedia ? 'Add caption for your media...' : 'Enter your message...'"></textarea>
            </div> -->
          </div>
          
          <div class="p-10 bg-blue-500/5 border-t border-white/5 flex gap-8">
            <button @click="showModal = false" 
              class="flex-1 py-6 text-xs font-black text-gray-500 uppercase tracking-[0.5em] hover:text-white transition-all">
              Cancel
            </button>
            <button @click="handleSaveTask" 
              :disabled="loading || uploading"
              :class="['flex-[2] py-6 rounded-[2rem] shadow-2xl text-xs uppercase tracking-[0.5em] transition-all border',
                (loading || uploading)
                  ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/30 shadow-blue-900/40'
              ]">
              {{ loading ? 'Saving...' : uploading ? 'Uploading...' : (isEditing ? 'Update Task' : 'Create Task') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Logs Modal -->
    <Transition name="fade">
      <div v-if="showLogsModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60">
        <div class="bg-[#020617] border border-blue-500/30 w-full max-w-4xl rounded-2xl shadow-[0_0_80px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col h-[85vh]">
          
          <div class="px-6 py-4 bg-slate-900/40 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
            <div class="flex items-center gap-6">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/20"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/20"></div>
                <div class="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/20"></div>
              </div>
              
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-mono text-blue-400 uppercase tracking-[0.4em] font-bold">Terminal Logs</span>
                <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div class="animate-pulse w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span class="text-emerald-500 text-[9px] font-bold">LIVE</span>
                </div>
              </div>
            </div>
            
            <button @click="closeLogs" class="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 p-8 font-mono text-[12px] overflow-y-auto custom-scrollbar bg-[#020617]">
            
            <div v-if="taskLogs === 'Loading logs...'" class="flex items-center gap-3 text-blue-400/70 py-4 italic">
              <div class="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              Synchronizing process logs...
            </div>
            
            <div v-else-if="!formattedLogs.length" class="text-gray-600 italic text-center py-20">
              No activities recorded for this task.
            </div>
            
            <div v-else class="space-y-0.5">
              <div v-for="(log, index) in formattedLogs" :key="index" class="group">
                
                <!-- STEP Separator -->
                <div v-if="log.type === 'step'" 
                  class="flex items-center gap-4 text-blue-400/80 font-mono text-[11px] py-4 uppercase tracking-[0.15em]">
                  <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-blue-500/20"></div>
                  <span class="px-3">{{ log.message }}</span>
                  <div class="h-[1px] flex-1 bg-gradient-to-l from-transparent via-blue-500/30 to-blue-500/20"></div>
                </div>
                
                <!-- Error Traceback Block -->
                <div v-else-if="log.type === 'error_traceback'" 
                  class="bg-red-950/30 border-l-4 border-red-500/60 pl-5 pr-3 py-4 my-3 rounded-r-lg backdrop-blur-sm">
                  <div class="text-red-400 font-bold mb-2 text-[10px] uppercase tracking-wider flex items-center gap-2">
                    <span class="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Python Traceback
                  </div>
                  <pre class="text-red-200/90 text-[11px] leading-[1.6] whitespace-pre-wrap font-mono overflow-x-auto">{{ log.message }}</pre>
                </div>
                
                <!-- Structured Log Line -->
                <div v-else-if="log.isStructured" 
                  class="flex items-start gap-3 py-1.5 px-3 rounded-md hover:bg-white/[0.02] transition-all duration-150">
                  
                  <!-- Timestamp -->
                  <span class="text-gray-600 text-[10px] w-[68px] shrink-0 mt-0.5 font-light tabular-nums tracking-tight">
                    {{ log.timestamp.split(' ')[1] }}
                  </span>
                  
                  <!-- Level Badge -->
                  <div class="w-14 shrink-0">
                    <span :class="{
                      'text-blue-400 bg-blue-500/10': log.level === 'INFO',
                      'text-red-400 bg-red-500/10 font-bold': log.level === 'ERROR',
                      'text-purple-400 bg-purple-500/10': log.level === 'DEBUG',
                      'text-yellow-400 bg-yellow-500/10': ['WARN', 'WARNING'].includes(log.level)
                    }" class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md inline-block">
                      {{ log.level }}
                    </span>
                  </div>
                  
                  <!-- Message -->
                  <span :class="{
                    'text-red-300 font-medium': log.level === 'ERROR',
                    'text-green-400': log.message.includes('✅') || /success|completed|updated successfully/i.test(log.message),
                    'text-yellow-300': log.message.includes('⚠️') || log.message.includes('failed'),
                    'text-gray-300': !log.message.includes('✅') && !log.message.includes('❌')
                  }" class="flex-1 leading-[1.6] break-words">
                    {{ log.message }}
                  </span>
                </div>
                
                <!-- Plain Text -->
                <div v-else 
                  class="text-gray-500/60 ml-[140px] py-0.5 text-[10px] leading-tight font-mono">
                  {{ log.message }}
                </div>
              </div>
            </div>
          </div>

          <div class="px-8 py-3 bg-slate-900/20 border-t border-white/5 text-[10px] text-gray-500 flex justify-between items-center font-mono">
            <span>{{ formattedLogs.length }} LINES RECORDED</span>
            <span class="text-gray-600 uppercase tracking-widest font-bold italic">Sphere Core Engine</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</div>
</template>

<style scoped>
/* Animasi Fade untuk Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom Scrollbar agar senada dengan tema gelap */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.4);
}
</style>

<!-- <style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> -->