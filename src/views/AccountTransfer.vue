<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick,toRaw } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Plus, RefreshCw, Search, CheckCircle, ArrowRightLeft, 
  Server, Wifi, Trash2, X, ArrowLeft, Power, Volume2, Volume1
} from 'lucide-vue-next';
import { 
  getPhoneBanks, 
  getPhoneBank, 
  getCountTransferBatch,
  validatePhonebankTransfer,
  createPhonebankTransfer,
  getProcessTaskList,
  getTransferBatchesList,
  getBatchLog,
  getBatchProgress,
  executeTransferBatch,
  executeAllTransferBatches,
  getScrcpyStreamUrl,
  getProxyDevices
} from '@/services/api';
import socket from '@/services/socket';
import CustomSelect from '@/components/CustomSelect.vue';

const router = useRouter();

// --- STATE ---
const phoneBanks = ref([]);
const countTransfer = ref(null);
const sourceDevicesOptions = ref([]); // Pastikan selalu array
const sourceNumbers = ref([]);        // Daftar nomor mentah dari API
const selectedNumbers = ref([]);       // Nomor yang dipilih user (Multiple)
const tempNumber = ref('');            // Penampung sementara CustomSelect

const loading = ref(false);
const error = ref(null);

// --- PROCESS TASK POPUP STATE ---
const showProcessTask = ref(false);
const batchList = ref([]);             // data batch dari API
const logList = ref([]);
const sourceLogList = ref([]);         // Log khusus source
const targetLogList = ref([]);         // Log khusus target
const sourceStreamUrl = ref('');       // URL Scrcpy Source
const targetStreamUrl = ref('');       // URL Scrcpy Target
const processTaskLoading = ref(false);
const processTaskSearch = ref('');
const processTaskDateFilter = ref('');
const executingBatchId = ref(null);
const executeAllLoading = ref(false);
const executeResultMsg = ref('');
const showLogDetail = ref(false);
const selectedLogData = ref(null);
const currentLogTab = ref('split'); // 'global' | 'split'

// ─── Polling intervals ─────────────────────────────────────────────────────
let batchPollInterval = null;   // refresh batch list setiap N detik
let logPollInterval   = null;   // refresh log detail setiap N detik
const BATCH_POLL_MS   = 5000;   // 5 detik
const LOG_POLL_MS     = 2000;   // 2 detik (lebih cepat untuk realtime feel)

// ─── Auto-scroll log terminal ──────────────────────────────────────────────
const logScrollEl    = ref(null);   // ref ke elemen scroll log terminal
const isScrollPaused = ref(false);  // true = user scroll ke atas (auto-scroll paused)

const scrollToBottom = () => {
  const el = logScrollEl.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

// Deteksi apakah user sudah scroll meninggalkan bottom (toleransi 40px)
const onLogScroll = () => {
  const el = logScrollEl.value;
  if (!el) return;
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  isScrollPaused.value = distanceFromBottom > 40;
};

// Resume: scroll ke bawah + aktifkan auto-scroll kembali
const resumeScroll = () => {
  isScrollPaused.value = false;
  scrollToBottom();
};

const filteredBatchList = computed(() => {
  let list = batchList.value;
  const q = processTaskSearch.value.toLowerCase().trim();
  if (q) {
    list = list.filter(b =>
      String(b.batch_name || '').toLowerCase().includes(q) ||
      (b.status || '').toLowerCase().includes(q)
    );
  }
  if (processTaskDateFilter.value) {
    list = list.filter(b => (b.timestamp || '').startsWith(processTaskDateFilter.value));
  }
  return list;
});


// ─── Fetch batch list (dipanggil manual & oleh polling) ───────────────────
const fetchBatchList = async () => {
  try {
    batchList.value = await getTransferBatchesList({ limit: 100 });
  } catch (e) {
    batchList.value = [];
  }
};

// === Process Task Modal ===
const openProcessTask = async () => {
  showProcessTask.value = true;
  processTaskLoading.value = true;
  executeResultMsg.value = '';
  try {
    await fetchBatchList();
  } finally {
    processTaskLoading.value = false;
  }

  // ── Mulai polling batch list ──────────────────────────────────────────────
  if (!batchPollInterval) {
    batchPollInterval = setInterval(fetchBatchList, BATCH_POLL_MS);
  }
};

const closeProcessTask = () => {
  showProcessTask.value = false;
  processTaskSearch.value = '';
  processTaskDateFilter.value = '';
  executeResultMsg.value = '';

  // ── Stop polling batch list ───────────────────────────────────────────────
  if (batchPollInterval) {
    clearInterval(batchPollInterval);
    batchPollInterval = null;
  }
};

// ==== Open log modal ====

const fetchLogContent = async (batch) => {
  try {
    const [result, srcResult, tgtResult] = await Promise.all([
      getBatchLog(batch, "global"),
      getBatchLog(batch, "source"),
      getBatchLog(batch, "target")
    ]);

    logList.value = result;
    sourceLogList.value = srcResult;
    targetLogList.value = tgtResult;

    // Pastikan selectedLogData sudah terinisialisasi
    if (selectedLogData.value) {
      const sId = selectedLogData.value.source_device;
      const tId = selectedLogData.value.target_device;

      // Hanya cari jika ID device bukan "Loading..."
      if (sId && sId !== "Loading...") {
        const foundSource = phoneBanks.value.find(pb => 
          pb.phones.some(p => String(p.device_id) === String(sId))
        );
        if (foundSource) selectedLogData.value.source_ip = foundSource.ip;
      }

      if (tId && tId !== "Loading...") {
        const foundTarget = phoneBanks.value.find(pb => 
          pb.phones.some(p => String(p.device_id) === String(tId))
        );
        if (foundTarget) selectedLogData.value.target_ip = foundTarget.ip;
      }
    }
  } catch (e) {
    console.error("Gagal fetch logs:", e);
  }
};

const openLogDetail = async (batch) => {
  showLogDetail.value = true;
  processTaskLoading.value = true;
  
  // --- INISIALISASI DATA DEFAULT (Agar tidak null) ---
  selectedLogData.value = {
    batch_id: batch.batch_id || batch.batch_name,
    batch_name: batch.batch_name || batch.batch_id,
    source_device: batch.source_device || "Loading...",
    target_device: batch.target_device || "Loading...",
    source_ip: batch.source_ip || "Searching...",
    target_ip: batch.target_ip || "Searching...",
    status: batch.status || 'processing',
    progress_percentage: batch.progress_percentage || 0,
    total_requested: batch.total_requested || 0,
    total_success: batch.total_success || 0,
    total_failed: batch.total_failed || 0,
    transfers: [] // Default array kosong sesuai struktur data kamu
  };

  isScrollPaused.value = false;
  currentLogTab.value = 'split';

  try {
    sourceLogList.value = [];
    targetLogList.value = [];

    // Jalankan fetch log global/src/tgt
    await fetchLogContent(batch);

    // Ambil detail progress (transfers array)
    const result = await getBatchProgress(selectedLogData.value.batch_id);
    
    if (result.data) {
      const data = result.data;
      
      // Update selectedLogData dengan data detail terbaru dari API
      selectedLogData.value = {
        ...selectedLogData.value, // Pertahankan data lama jika ada
        ...data,                  // Masukkan data dari API (status, progress, transfers)
      };

      if (data.transfers && data.transfers.length > 0) {
        const firstTransfer = data.transfers[0];
        
        // Sekarang aman mengisi source_device tanpa "IF" karena objek sudah di-init di atas
        selectedLogData.value.source_device = firstTransfer.source_phone_id;
        selectedLogData.value.target_device = firstTransfer.target_phone_id;

        const sPb = phoneBanks.value.find(pb => 
          pb.phones.some(p => String(p.device_id) === String(firstTransfer.source_phone_id))
        );
        const tPb = phoneBanks.value.find(pb => 
          pb.phones.some(p => String(p.device_id) === String(firstTransfer.target_phone_id))
        );

        if (sPb) selectedLogData.value.source_ip = sPb.ip;
        if (tPb) selectedLogData.value.target_ip = tPb.ip;

        // Trigger Scrcpy Stream secara async
        getScrcpyStreamUrl(firstTransfer.source_phone_id)
          .then(res => sourceStreamUrl.value = res.stream_url)
          .catch(() => {});
          
        getScrcpyStreamUrl(firstTransfer.target_phone_id)
          .then(res => targetStreamUrl.value = res.stream_url)
          .catch(() => {});
          
        // Emit socket connect
        socket.emit('scrcpy_connect', { device_id: firstTransfer.source_phone_id });
        socket.emit('scrcpy_connect', { device_id: firstTransfer.target_phone_id });
      }
    }
  } catch (err) {
    console.error("Gagal memuat detail log:", err);
  } finally {
    processTaskLoading.value = false;
  }

  // Mulai polling
  if (!logPollInterval) {
    logPollInterval = setInterval(() => fetchLogContent(batch), LOG_POLL_MS);
  }
};

const refreshSourceStream = async () => {
  if (!selectedLogData.value?.source_device) return;
  try {
    const res = await getScrcpyStreamUrl(selectedLogData.value.source_device);
    // Force refresh by adding timestamp to fragment
    sourceStreamUrl.value = `${res.stream_url}&_t=${Date.now()}`;
    socket.emit('scrcpy_connect', { device_id: selectedLogData.value.source_device });
  } catch (e) {
    console.error("Refresh Source failed", e);
  }
};

const refreshTargetStream = async () => {
  if (!selectedLogData.value?.target_device) return;
  try {
    const res = await getScrcpyStreamUrl(selectedLogData.value.target_device);
    // Force refresh by adding timestamp to fragment
    targetStreamUrl.value = `${res.stream_url}&_t=${Date.now()}`;
    socket.emit('scrcpy_connect', { device_id: selectedLogData.value.target_device });
  } catch (e) {
    console.error("Refresh Target failed", e);
  }
};

const closeLogDetail = () => {
  showLogDetail.value = false;
  showProcessTask.value = true;
  processTaskSearch.value = '';
  processTaskDateFilter.value = '';
  executeResultMsg.value = '';

  // ── Stop polling log ──────────────────────────────────────────────────────
  if (logPollInterval) {
    clearInterval(logPollInterval);
    logPollInterval = null;
  }
};

// Auto-scroll ke bawah setiap kali log bertambah
const processLogLines = (rawContent) => {
  const content = rawContent || '';
  const lines = typeof content === 'string' ? content.split('\n') : [];

  return lines.map(line => {
    if (line.includes('=====')) {
      return { 
        type: 'step', 
        message: line.replace(/\[INFO\]|\[ERROR\]|=|/g, '').trim() || 'Process Started' 
      };
    }
    const logMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\] (.*)/);
    if (logMatch) {
      return {
        isStructured: true,
        timestamp: logMatch[1],
        level: logMatch[2],
        message: logMatch[3]
      };
    }
    return { isStructured: false, message: line };
  }).filter(log => log.message.trim() !== '');
};

const formattedLogs = computed(() => processLogLines(logList.value?.content));
const formattedSourceLogs = computed(() => processLogLines(sourceLogList.value?.content));
const formattedTargetLogs = computed(() => processLogLines(targetLogList.value?.content));

watch(formattedLogs, async () => {
  if (isScrollPaused.value) return;
  await nextTick();
  scrollToBottom();
});

// --- LIFECYCLE / SOCKETS ---
onMounted(() => {
  fetchInitialData();

  socket.on('device_status_update', (data) => {
    // Update status di phoneBanks list jika id cocok
    const pb = phoneBanks.value.find(p => String(p.id) === String(data.device_id));
    if (pb) {
      // Kita bisa tambah field status_color/status_text jika belum ada
      pb.status_color = data.color;
      pb.status_text = data.status;
    }
  });
});

onUnmounted(() => {
  socket.off('device_status_update');
  if (batchPollInterval) clearInterval(batchPollInterval);
  if (logPollInterval) clearInterval(logPollInterval);
});



// ==== Open logs ====

const formatTaskDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const day = d.getDate();
  const mon = d.toLocaleString('id-ID', { month: 'short' });
  const yr = String(d.getFullYear()).slice(2);
  const hm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  return { date: `${day} ${mon} ${yr}`, time: hm };
};

// Execute satu batch by batch_name
const executeBatch = async (batchName) => {
  executingBatchId.value = batchName;
  executeResultMsg.value = '';
  try {
    const res = await executeTransferBatch(batchName);
    executeResultMsg.value = res.message || `Batch '${batchName}' berhasil dijalankan!`;
    await fetchBatchList();
  } catch (e) {
    executeResultMsg.value = e?.response?.data?.detail || `Gagal menjalankan batch '${batchName}'`;
  } finally {
    executingBatchId.value = null;
  }
};

// Execute semua batch
const executeAll = async () => {
  executeAllLoading.value = true;
  executeResultMsg.value = '';
  try {
    const res = await executeAllTransferBatches();
    executeResultMsg.value = res.message || 'Semua batch sedang diproses!';
    await fetchBatchList();
  } catch (e) {
    executeResultMsg.value = e?.response?.data?.detail || 'Gagal menjalankan semua batch';
  } finally {
    executeAllLoading.value = false;
  }
};

// Status helpers
const statusBadgeClass = (s) => {
  if (s === 'completed') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
  if (s === 'partial_success') return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
  if (s === 'processing') return 'bg-orange-500/20 text-orange-300 border border-orange-500/40';
  if (s === 'failed') return 'bg-red-500/20 text-red-300 border border-red-500/40';
  return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
};
const statusLabel = (s) => {
  if (s === 'completed') return '✓ Selesai';
  if (s === 'partial_success') return '⚡ Partial';
  if (s === 'processing') return '⟳ Running';
  if (s === 'failed') return '✕ Gagal';
  return '⏳ Pending';
};


// Form Selection State
const selectedSourceId = ref('');
const selectedDeviceId = ref('');
const selectedWhatsapp = ref(null);
const selectedTargetId = ref('');
const isTargetSelected = ref(false);
const selectedTargetLabel = ref('');
const selectedTargetIP = ref('');
const targetDevicesOptions = ref([]);
const searchQueryTarget = ref(''); // Variable query target pb
const searchQueryTargetDevice = ref(''); // Variable query target pb
// const filteredDevices = ref([]); // Sekarang pakai ref, bukan computed
let debounceTimer = null;

// Modal state
const showModal = ref(false);
const modalStep = ref('validate'); // 'validate' | 'success' | 'error'
const modalLoading = ref(false);
const validationResult = ref(null);
const transferResult = ref(null);
const modalError = ref('');

// Target device selection
const selectedTargetDeviceId = ref('');


// --- LOGIKA FETCH DATA ---

const fetchInitialData = async () => {
  try {
    loading.value = true;
    const response = await getPhoneBanks();
    const countBatch = await getCountTransferBatch();
    countTransfer.value = countBatch.total || "Error";
    console.log("response ")
    console.log(countBatch);
    console.log(countTransfer.value);
    phoneBanks.value = response.data || response || [];
  } catch (err) {
    error.value = "Failed to fetch phone banks";
    phoneBanks.value = [];
  } finally {
    loading.value = false;
  }
};


// Choose Source -----

// 1. Handle saat Phonebank dipilih
const handlePhoneBankChange = async (pbId) => {
  selectedDeviceId.value = '';
  sourceDevicesOptions.value = [];
  sourceNumbers.value = [];
  selectedNumbers.value = [];
  selectedSourceId.value = pbId || ''; // ← set source PB ID
  
  if (!pbId) return;

  try {
    loading.value = true;
    const pbDetail = await getPhoneBank(pbId);
    const ip = pbDetail?.data?.ip || pbDetail?.ip;

    const result = await getProxyDevices(ip);
    const rawData = result.data || result || {};


    // Karena rawData sekarang adalah Object, kita olah seperti ini:
    const processedDevices = Object.entries(rawData).map(([deviceId, accounts]) => {
      return {
        value: deviceId,
        label: deviceId,
        icon: '📱',
        meta: `${accounts.length} Accounts`,
        // Mapping isi array akun di dalam tiap device
        allNumbers: accounts
          .filter(acc => acc.phone_number) // Abaikan jika phone_number null (seperti pada data R9CW800XQPN)
          .map(acc => ({
            number: acc.phone_number,
            accountName: acc.account_name,
            packageName: acc.package_name
          }))
      };
    });

    // Filter device yang benar-benar punya nomor (opsional)
    sourceDevicesOptions.value = processedDevices.filter(d => d.allNumbers.length > 0);


  } catch (err) {
    console.error("Fetch Error:", err);
    error.value = "Failed to fetch devices.";
  } finally {
    loading.value = false;
  }
};

// 2. Handle saat Device dipilih
const handleDeviceChange = (devId) => {
  tempNumber.value = '';
  selectedNumbers.value = [];
  
  if (!devId) {
    sourceNumbers.value = [];
    selectedDeviceId.value = '';
    return;
  }

  selectedDeviceId.value = devId; // ← PENTING: aktifkan dropdown nomor

  const device = sourceDevicesOptions.value.find(d => d.value === devId);
  
  if (device && device.allNumbers) {
    // Transformasi allNumbers menjadi format yang dibaca CustomSelect Nomor
    sourceNumbers.value = device.allNumbers.map(item => ({
      value: item.number,
      label: `${item.number} (${item.account_name})`, // Menampilkan nama akun agar lebih informatif
      packageName: item.packageName,
      icon: '📞'
    }));
  }
};

// 3. Handle saat Nomor dipilih (Add to List)
const handleNumberSelect = (val) => {
  if (!val) return;
  
  // Pastikan yang disimpan adalah nomor unik
  if (!selectedNumbers.value.includes(val)) {
    selectedNumbers.value.push(val);
  }
  
  // Reset agar dropdown nomor bisa dipilih lagi
  setTimeout(() => {
    tempNumber.value = '';
  }, 100);
};

// 4. Hapus nomor dari daftar pilihan
const removeNumber = (num) => {
  selectedNumbers.value = selectedNumbers.value.filter(n => n !== num);
};

// --- COMPUTED OPTIONS ---

// Penting: Pastikan return array kosong jika data belum ada agar CustomSelect tidak error .find()
const phoneBankOptions = computed(() => {
  if (!phoneBanks.value) return [];
  return phoneBanks.value.map(pb => ({
    value: pb.id,
    label: `${pb.ip} | ${pb.institution_name} | ${pb.type}`,
    icon: '🖥️',
    meta: `${pb.phones?.length || 0} Devices`,
    disabled: false
  }));
});

const phonebankDestination = computed(() => {
  if (!phoneBanks.value) return [];
  return phoneBanks.value.map(pb => ({
    value: pb.id,
    institution_name : pb.institution_name,
    ip: pb.ip,
    label: `${pb.ip} | ${pb.type}`,
    icon: '🖥️',
    totalDevices: pb.phones.length || 30,
    meta: `${pb.phones?.length || 0} Devices`,
    disabled: false
  }));
});

// Mapping daftar nomor telepon ke format CustomSelect
const numberOptions = computed(() => {
  if (!sourceNumbers.value || !Array.isArray(sourceNumbers.value)) {
    console.log("Valuenya mledug boy", sourceNumbers)
    return [];  
  }
  return sourceNumbers.value.map(num => ({
    value: num.value,
    label: `0${num.value} - ${num.packageName}`,
    icon: num.icon,
    meta: num.packageName,
    // Disable jika sudah dipilih agar tidak dipilih dua kali
    disabled: selectedNumbers.value.includes(num)
  }));
});

// End Choose Source ---------

// Choose Target -------
const handlePhoneBankTarget = async (pbId) => {
  if (!pbId) {
    isTargetSelected.value = false;
    return;
  }
  
  selectedTargetId.value = pbId;
  targetDevicesOptions.value = [];
  
  try {
    loading.value = true;
    error.value = null;

    // 1. Ambil detail Phonebank untuk mendapatkan IP
    const pbDetail = await getPhoneBank(pbId);
    const ip = pbDetail.data?.ip || pbDetail.ip;
    selectedTargetLabel.value = pbDetail.data?.name || pbDetail.data.type || 'Unknown Device';
    selectedTargetIP.value = ip;

    // 2. Fetch ke API target menggunakan backend proxy (menghindari CORS)
    const result = await getProxyDevices(ip);
    
    const rawDataTarget = result.data || {};
    // 3. Mapping data ke targetDevicesOptions
    targetDevicesOptions.value = Object.keys(rawDataTarget).map(deviceId => {
      const accounts = rawDataTarget[deviceId] || [];
      // 1. Filter akun yang benar-benar ada nomornya (bukan null/No Account)
      const registeredAccounts = accounts.filter(acc => 
        acc.phone_number !== null && acc.account_name !== "No Account"
      );
      // 2. Akun yang belum terdaftar (No Account)
      const notRegistered = accounts.filter(acc => 
        acc.phone_number === null || acc.account_name === "No Account"
      );

      return {
        device_id: deviceId,
        label: deviceId,
        ip_address: ip,
        // Simpan semua data akun untuk detail jika perlu
        rawNumbers: accounts, 
        // Data akun yang valid saja
        registeredCount: registeredAccounts.length,
        // Logic tampilan
        availability: `${registeredAccounts.length}/${accounts.length}`, 
        // Warna hijau jika ada akun terdaftar, kuning jika sedikit, merah jika kosong semua
        statusColor: registeredAccounts.length > 0 ? 'text-green-400' : 'text-red-400'
      };
    });
    // 4. Munculkan section bawah jika berhasil
    isTargetSelected.value = true;

  } catch (err) {
    console.error("Fetch Error:", err);
    error.value = "Failed to fetch devices.";
    isTargetSelected.value = false; // Tetap sembunyikan jika gagal
  } finally {
    loading.value = false;
  }
};

const filteredDevices = computed(() => {
  // Jika input kosong, tampilkan semua data
  if (!searchQueryTarget.value) {
    return phonebankDestination.value;
  }
  
  const query = searchQueryTarget.value.toLowerCase();
  
  return phonebankDestination.value.filter(device => {
    return (
      device.institution_name?.toLowerCase().includes(query) || 
      device.value?.toLowerCase().includes(query) ||
      device.ip?.toLowerCase().includes(query)
    );
  });
});


const filteredTargetDevices = computed(() => {
  if (!searchQueryTarget.value) {
    return phonebankDestination.value;
  }
  const query = searchQueryTarget.value.toLowerCase();
  return phonebankDestination.value.filter(device => {
    return (
      device.institution_name?.toLowerCase().includes(query) || 
      device.value?.toLowerCase().includes(query) ||
      device.ip?.toLowerCase().includes(query)
    );
  });
});

const filteredTargetDevicesInPB = computed(() => {
  if (!searchQueryTargetDevice.value) {
    return targetDevicesOptions.value;
  }
  const query = searchQueryTargetDevice.value.toLowerCase();
  return targetDevicesOptions.value.filter(device => {
    return (
      device.device_id?.toLowerCase().includes(query) ||
      device.ip_address?.toLowerCase().includes(query)
    );
  });
});




const resetTargetSelection = () => {
  isTargetSelected.value = false;
  selectedTargetId.value = '';
  targetDevicesOptions.value = [];
  selectedTargetLabel.value = '';
  selectedTargetIP.value = '';
  selectedTargetDeviceId.value = '';
};

// End Choose Target -------

// --- PROCEED TRANSFER FLOW ---

const proceedTransfer = async () => {
  if (selectedNumbers.value.length === 0) return;

  // Reset & buka modal
  validationResult.value = null;
  transferResult.value = null;
  modalError.value = '';
  modalStep.value = 'validate';
  showModal.value = true;
  modalLoading.value = true;

  try {
    const payload = {
      source_phonebank_id: selectedSourceId.value,
      target_phonebank_id: selectedTargetId.value,
      transfer_count: selectedNumbers.value.length,
      source_phones: selectedNumbers.value.map(num => {
        const found = sourceNumbers.value.find(n => n.value === num);
        return { number: num, packageName: found?.packageName || 'whatsapp' };
      }),
      source_device_id: selectedDeviceId.value,
      target_device_id: selectedTargetDeviceId.value
    };

    const result = await validatePhonebankTransfer(payload);
    validationResult.value = result;
  } catch (err) {
    modalError.value = err?.response?.data?.detail || 'Validation gagal. Periksa koneksi server.';
    modalStep.value = 'error';
  } finally {
    modalLoading.value = false;
  }
};

const confirmTransfer = async () => {
  modalLoading.value = true;
  modalError.value = '';

  try {
    const payload = {
      source_phonebank_id: selectedSourceId.value,
      target_phonebank_id: selectedTargetId.value,
      transfer_count: selectedNumbers.value.length,
      source_phones: selectedNumbers.value.map(num => {
        const found = sourceNumbers.value.find(n => n.value === num);
        return { number: num, packageName: found?.packageName || 'whatsapp' };
      }),
      source_device_id: selectedDeviceId.value,
      target_device_id: selectedTargetDeviceId.value
    };

    const result = await createPhonebankTransfer(payload);
    transferResult.value = result;
    modalStep.value = 'success';

    // Reset selections after success
    selectedNumbers.value = [];
  } catch (err) {
    modalError.value = err?.response?.data?.detail || 'Gagal membuat transfer. Coba lagi.';
    modalStep.value = 'error';
  } finally {
    modalLoading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  validationResult.value = null;
  transferResult.value = null;
  modalError.value = '';
  modalStep.value = 'validate';
};

const goBack = () => router.push('/');

// ─── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(fetchInitialData);

// Bersihkan semua interval saat komponen di-unmount (pindah halaman)
onUnmounted(() => {
  if (batchPollInterval) clearInterval(batchPollInterval);
  if (logPollInterval)   clearInterval(logPollInterval);
});
</script>

<template>
  <div class="relative min-h-screen w-full bg-slate-950 text-white overflow-hidden">
    <div class="absolute inset-0 z-0">
      <img src="@/assets/img/background_location.png" class="w-full h-full object-cover opacity-100" alt="" />
      <div class="absolute inset-0 bg-slate-900/40"></div>
    </div>

    <main class="relative z-10 min-h-screen flex flex-col pt-[74px] pb-8 overflow-y-auto bg-transparent scroll-smooth">
      
      <!-- Breadcrumb -->
      <div class="relative w-full h-[62px] hidden md:flex items-center px-4 mb-4 flex-shrink-0">
        <img src="@/assets/img/bg_brb_2.png" class="absolute inset-0 w-full h-full object-fill" alt="" />
        
        <div class="relative z-10 flex items-center w-full h-full">
          <button @click="goBack" class="mr-4 hover:opacity-80 transition-opacity">
            <img src="@/assets/img/left_arrow.png" class="w-2.5 h-4" alt="Back" />
          </button>

          <div class="h-6 w-px bg-slate-700/50 mr-4"></div>
          <img src="@/assets/img/icon_globe.png" class="w-5 h-5" alt="Globe" />

          <div class="flex items-center text-sm font-medium tracking-wide ml-4">
            <span class="text-gray-400 cursor-pointer hover:text-white transition-colors" @click="goBack">Home</span>
            <span class="mx-2 text-gray-600">/</span>
            <span class="text-blue-500 font-bold underline decoration-blue-500/30 underline-offset-4">Transfer Account</span>
          </div>

          <div class="ml-auto flex items-center h-full gap-4">
            <div class="h-6 w-px bg-slate-700/50 mr-2"></div>
            
            <button class="flex items-center justify-center gap-3 bg-[url('@/assets/img/bg_refresh.png')] bg-no-repeat bg-[length:100%_100%] min-w-[170px] h-[35px] px-3 hover:brightness-125 transition-all">
              <div class="text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12h-15a.75.75 0 0 1-.75-.75V9H21v11.25a.75.75 0 0 1-.75.75Z" />
                </svg>
              </div>
              <div class="flex flex-col items-start leading-tight">
                <span class="text-[8px] text-blue-300/60 uppercase font-black tracking-tighter">Bank Account</span>
                <span class="text-xs font-bold text-white">128 Data</span>
              </div>
            </button>

            <button @click="openProcessTask" :disabled="loading" class="flex items-center justify-center gap-3 bg-[url('@/assets/img/bg_refresh.png')] bg-no-repeat bg-[length:100%_100%] min-w-[170px] h-[35px] px-3 hover:brightness-125 transition-all disabled:opacity-50">
              <span class="text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 inline">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
              <div class="flex flex-col items-start leading-tight" >
                <span class="text-[8px] text-blue-300/60 uppercase font-black tracking-tighter">Task Process</span>
                <span class="text-xs font-bold text-white">{{ loading ? 'Running...' : countTransfer  + ' Active' }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
     
      <!-- Main Card - Reduced Height -->
      <div class="flex flex-col md:flex-row items-stretch justify-center gap-5 md:gap-6 max-w-7xl mx-auto w-full px-4 md:px-6 mb-6">
        
        <!-- Select Origin - Reduced Height -->
        <div class="flex-1 group">
          <h6 class="text-base font-semibold text-center mb-3 text-blue-100/80 tracking-widest uppercase">Select Origin</h6>
          
          <div class="h-[420px] bg-[#040e2a] border border-[#2346c0] rounded-xl p-5 relativey shadow-2xl flex flex-col gap-4">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

            <div class="space-y-3 flex-1 flex flex-col">
              <div class="space-y-1.5 relative" style="z-index: 30;">
                <label class="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Select Phonebank</label>
                <div class="relative w-full" style="z-index: 30;">
                  <CustomSelect 
                    v-model="selectedSourceId"
                    :options="phoneBankOptions"
                    @update:modelValue="handlePhoneBankChange"
                    class="text-xs origin-left"
                  />
                </div>
              </div>

              <!-- Select Device -->
              <div class="space-y-1.5 relative" style="z-index: 20;">
                <label class="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Select Device</label>
                <div class="relative w-full" style="z-index: 20;">
                  <CustomSelect 
                    v-model="selectedDeviceId"
                    :options="sourceDevicesOptions"
                    :disabled="!selectedSourceId"
                    @update:modelValue="handleDeviceChange"
                    class="text-xs origin-left"
                  />
                </div>
              </div>

              <!-- Select Numbers -->
              <div class="space-y-1.5 relative" style="z-index: 10;">
                <label class="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
                  Select Numbers (Add Multiple)
                </label>
                <div class="relative w-full" style="z-index: 10;">
                  <CustomSelect 
                    v-model="tempNumber"
                    :options="numberOptions"
                    :disabled="!selectedDeviceId || loading"
                    :placeholder="loading ? 'Fetching numbers...' : 'Search & Add Number...'"
                    @update:modelValue="handleNumberSelect"
                    class="text-xs origin-left"
                  />
                </div>
              </div>
            </div>

            <div class="flex-1 flex flex-col min-h-0">
              <hr class="border-gray-500 mb-2">
              <label class="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">
                Queue ({{ selectedNumbers.length }})
              </label>
              
              <div class="bg-slate-950/50 border border-blue-500/20 rounded-xl p-[1.75rem]">
                <div class="flex flex-wrap gap-1.5 overflow-y-auto custom-scrollbar max-h-[80px]">
                  
                  <div v-if="selectedNumbers.length === 0" class="w-full text-center py-2 opacity-30 italic text-[9px]">
                    Empty
                  </div>
                  
                  <div v-for="num in selectedNumbers" :key="num"
                      class="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded-md group">
                    <span class="text-[9px] font-mono text-blue-100">{{ num }}</span>
                    <button @click="removeNumber(num)" class="text-gray-500 hover:text-red-400 transition-colors">
                      <X class="w-2.5 h-2.5" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Arrow Divider -->
        <div class="flex items-center justify-center z-20">
          <div class="bg-slate-950 border border-blue-500/50 p-3 rounded-full text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <ArrowRightLeft class="w-5 h-5 rotate-90 md:rotate-0" />
          </div>
        </div>

        <!-- Select Destination - Reduced Height -->
        <div class="flex-1 group">
          <h6 class="text-base md:text-lg font-semibold text-center mb-3 text-blue-100/80 tracking-widest uppercase">Select Destination</h6>
          
          <div class="h-[420px] bg-[#040e2a] border border-[#2346c0] rounded-xl p-5 relativey shadow-2xl flex flex-col gap-4">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <transition name="fade" mode="out-in">
              <section v-if="!isTargetSelected" key="select" class="chooseTarget h-full flex flex-col justify-center">
                <div class="space-y-3 flex-1 flex flex-col min-h-0"> 
                <div class="flex items-center justify-between gap-4">
                  <label class="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
                    Choose Target Device
                  </label>
                  
                  <div class="relative group">
                    <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-[#9ea3a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input 
                      v-model="searchQueryTarget" 
                      type="text" 
                      placeholder="Search..."
                      class="bg-[#020c36] text-[10px] text-white placeholder-[#9ea3a0] pl-8 pr-3 py-1.5 rounded-md border border-[#294fd9]/50 focus:border-[#294fd9] focus:outline-none focus:ring-1 focus:ring-[#294fd9] transition-all w-48"
                    />
                  </div>
                </div>

                <div class="flex-1 flex flex-col overflow-hidden border border-white/5 rounded-md bg-slate-900/50">
                  
                  <div class="grid grid-cols-3 gap-3 text-[10px] font-bold text-white-400 uppercase px-4 py-3 border-b border-white/10 bg-[#082282] backdrop-blur-md z-10">
                    <div>Phonebank</div>
                    <div class="text-center">Device</div>
                    <div class="text-center">Choose</div>
                  </div>
                  
                  <div class="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[350px]"> <div class="space-y-1.5">
                      <div v-for="(device, index) in filteredTargetDevices" :key="index" 
                        class="grid grid-cols-3 gap-3 items-center px-3 py-2.5 hover:bg-white/5 transition-colors rounded-lg border border-transparent"
                        :class="{ 'bg-blue-500/10 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]': selectedTargetDeviceId === device.value }">
                      
                      <div class="min-w-0">
                        <div class="text-[8px] font-semibold text-white truncate">{{ device.institution_name }}</div>
                        <div class="text-[9px] text-blue-500/70 font-mono">IP: {{ device.ip || 'ONLINE' }}</div>
                      </div>

                      <div class="min-w-0">
                        <div class="text-[10px] text-center font-mono text-gray-200 truncate">{{ device.totalDevices }}</div>
                      </div>
                      
                      <div class="flex justify-center">
                        <button 
                          @click="selectedTargetDeviceId = device.value"
                          type="button"
                          :class="[
                            'px-3 py-1.5 border rounded-lg text-[9px] font-bold transition-all w-full max-w-[80px]',
                            selectedTargetDeviceId === device.value
                              ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                              : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-gray-400'
                          ]"
                        >
                          {{ selectedTargetDeviceId === device.value ? 'SELECTED' : 'SELECT' }}
                        </button>
                      </div>
                    </div>
                      
                      <div v-if="filteredDevices.length === 0" class="flex flex-col items-center justify-center py-12 opacity-30">
                        <span class="text-[10px] italic text-blue-300">
                          {{ searchQuery ? `No matches found for "${searchQuery}"` : 'No devices found' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="pt-2">
                  <button 
                    @click="handlePhoneBankTarget(selectedTargetDeviceId)"
                    :disabled="loading || !selectedTargetDeviceId"
                    class="w-full rounded-xl py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white/70 text-[10px] tracking-widest font-black uppercase hover:from-blue-500 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-gray-600 transition-all shadow-xl active:scale-[0.97]"
                  >
                    {{ loading ? 'Configuring System...' : 'Lock Target & Continue' }}
                  </button>
                </div>
              </div>
                <!-- <div class="space-y-1.5 relative" style="z-index: 10;">
                  <label class="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
                    Choose Target
                  </label>
                  <div class="relative w-full">
                    
                    <CustomSelect 
                      v-model="selectedTargetId"
                      :options="phoneBankOptions"
                      class="text-xs origin-left"
                    />
                    <button 
                      @click="handlePhoneBankTarget(selectedTargetId)"
                      :disabled="loading"
                      class="w-full mt-4 rounded-md py-3 bg-blue-400 text-white font-bold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"
                    >
                      {{ loading ? 'Loading...' : 'Choose' }}
                    </button>
                  </div>
                </div> -->
              </section>

              <section v-else key="result" class="showSection h-full flex flex-col">
                <div class="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                  <button @click="resetTargetSelection" class="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-blue-400">
                    <ArrowLeft class="w-4 h-4" />
                  </button>

                  <div class="flex-1 flex items-end justify-between gap-4">
                    
                    <div class="flex-shrink-0">
                      <div class="text-[10px] text-gray-400 uppercase tracking-wider">Result for</div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-white">{{ selectedTargetLabel }}</span>
                        <span v-if="selectedTargetIP" class="text-[10px] text-gray-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">
                          {{ selectedTargetIP }}
                        </span>
                      </div>
                    </div>

                    <div class="relative group">
                      <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-[#9ea3a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input 
                        v-model="searchQueryTargetDevice" 
                        type="text" 
                        placeholder="Search device..."
                        class="bg-[#020c36] text-[10px] text-white placeholder-[#9ea3a0] pl-8 pr-3 py-1.5 rounded-md border border-[#294fd9]/50 focus:border-[#294fd9] focus:outline-none focus:ring-1 focus:ring-[#294fd9] transition-all w-48"
                      />
                    </div>

                  </div>
                </div>
                
                <div class="flex-1 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl p-2 bg-slate-900/50">
                  <div class="grid grid-cols-4 gap-3 text-[10px] font-bold text-gray-400 uppercase px-1 py-2 border-b border-white/10">
                    <div>Phonebank</div>
                    <div>Device ID</div>
                    <div class="text-center">Accounts</div>
                    <div class="text-center">Action</div>
                  </div>
                  
                  <div class="space-y-1 py-1.5">
                    <div v-for="(device, index) in filteredTargetDevicesInPB" :key="index" 
                        class="grid grid-cols-4 gap-3 items-center px-1 py-2 hover:bg-white/5 transition-colors rounded-lg">
                      <!-- Target Label -->
                      <div>
                        <div class="text-xs font-semibold text-white">{{ selectedTargetLabel }}</div>
                        <div class="text-[9px] text-gray-400 font-mono">IP: {{ device.ip_address }}</div>
                      </div>
                      <!-- Device ID -->
                      <div>
                        <div class="text-[10px] font-mono text-white">{{ device.device_id }}</div>
                      </div>
                      <!-- Total Account -->
                      <div class="text-center">
                        <span :class="['text-[10px] font-bold', device.statusColor]">
                          {{ device.registeredCount }} / {{ device.rawNumbers.length }} Acc
                        </span>
                        <div class="text-[8px] text-gray-500" v-if="device.rawNumbers.length - device.registeredCount > 0">
                          {{ device.rawNumbers.length - device.registeredCount }} Empty Slots
                        </div>
                      </div>
                      
                      <div class="text-center">
                        <button 
                          @click="selectedTargetDeviceId = device.device_id"
                          :class="[
                            'px-2.5 py-1 border rounded-lg text-[9px] font-bold transition-all',
                            selectedTargetDeviceId === device.device_id
                              ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'
                              : 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-400'
                          ]"
                        >
                          {{ selectedTargetDeviceId === device.device_id ? '✓ Selected' : 'Select' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </transition>
            
          </div>
        </div>
      </div>

      <!-- Proceed Button - Compact -->
      <div class="max-w-7xl mx-auto w-full px-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
        <div class="flex flex-col">
          <p class="text-[8px] text-blue-400 uppercase tracking-widest font-bold mb-0.5">Transfer Summary</p>
          <div class="flex items-baseline gap-2">
            <span class="text-gray-400 text-xs">Total Selected:</span>
            <span class="text-xl font-black text-white tracking-widest">
              {{ selectedNumbers.length }} <span class="text-[9px] text-gray-600 font-normal">Numbers</span>
            </span>
          </div>
        </div>

        <button 
          @click="proceedTransfer"
          :disabled="selectedNumbers.length === 0 || !selectedSourceId || !selectedTargetId"
          class="px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] border-2 transition-all duration-300"
          :class="(selectedNumbers.length > 0 && selectedSourceId && selectedTargetId)
            ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500' 
            : 'bg-slate-800 text-gray-500 border-slate-700 opacity-50 cursor-not-allowed'"
        >
          Proceed {{ selectedNumbers.length }} Numbers
        </button>

        <!-- Process Task Button -->
        <!-- <button
          @click="openProcessTask"
          class="px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] border-2 border-indigo-500/40 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 hover:border-indigo-400 transition-all duration-300 flex items-center gap-2"
        >
          <Search class="w-3.5 h-3.5" />
          Process Task
        </button> -->
      </div>
    </main>

    <!-- ==================== PROCESS TASK POPUP ==================== -->
    <Transition name="modal">
      <div v-if="showProcessTask" class="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="closeProcessTask"></div>

        <!-- Modal -->
        <div class="relative z-10 w-full max-w-4xl bg-[#080f2e] border border-blue-600/40 rounded-2xl shadow-[0_0_60px_rgba(37,99,235,0.25)] overflow-hidden flex flex-col" style="max-height:90vh">
          <!-- Top accent line -->
          <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 class="text-lg font-black text-white tracking-wide">Process Task</h2>
            <div class="flex items-center gap-3">
              
              <!-- Close -->
              <button @click="closeProcessTask" class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors">
                <X class="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <!-- Execute Result Message -->
          <div v-if="executeResultMsg"
            class="mx-6 mt-3 px-4 py-2 rounded-lg text-[11px] font-medium flex items-center gap-2"
            :class="executeResultMsg.toLowerCase().includes('gagal')
              ? 'bg-red-500/10 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'"
          >
            <span>{{ executeResultMsg.toLowerCase().includes('gagal') ? '❌' : '✅' }}</span>
            {{ executeResultMsg }}
          </div>

          <!-- Toolbar -->
          <div class="flex items-center gap-3 px-6 py-3 border-b border-white/5">
            <div class="relative flex-1 max-w-sm">
              <span class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input v-model="processTaskSearch" type="text" placeholder="Search batch name or status..."
                class="w-full bg-[#0d1a4a] text-sm text-white placeholder-gray-500 pl-9 pr-3 py-2 rounded-lg border border-blue-600/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all" />
            </div>
            <div class="flex items-center gap-2 ml-auto">
              <input v-model="processTaskDateFilter" type="date"
                class="bg-[#0d1a4a] text-[11px] text-gray-300 px-3 py-2 rounded-lg border border-blue-600/30 focus:border-blue-500 focus:outline-none cursor-pointer" />
              <button @click="openProcessTask" :disabled="processTaskLoading"
                class="flex items-center gap-2 px-3 py-2 bg-[#0d1a4a] border border-blue-600/40 rounded-lg text-[11px] text-white font-semibold hover:bg-blue-600/20 transition-colors disabled:opacity-50">
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': processTaskLoading }" />
                Refresh
              </button>
            </div>
          </div>

          <!-- Table Header -->
          <div class="grid grid-cols-6 gap-2 px-6 py-2.5 bg-blue-700/30 border-b border-blue-600/40 text-[11px] font-bold text-white uppercase tracking-wider">
            <div>Time Stamp</div>
            <div class="col-span-2">Batch Name</div>
            <div class="text-center">Progress</div>
            <div class="text-center">Status</div>
            <div class="text-center">Action</div>
          </div>

          <!-- Table Body -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div v-if="processTaskLoading" class="flex items-center justify-center py-16 text-gray-500 text-sm">
              <RefreshCw class="w-4 h-4 animate-spin mr-2" /> Loading...
            </div>
            <div v-else-if="filteredBatchList.length === 0" class="flex flex-col items-center justify-center py-16 opacity-40">
              <span class="text-2xl mb-2">📭</span>
              <span class="text-sm text-gray-400">No records found</span>
            </div>
            <div v-else>
              <div v-for="(batch, idx) in filteredBatchList" :key="batch.batch_id || idx"
                class="grid grid-cols-6 gap-2 px-6 py-3 border-b border-blue-900/40 hover:bg-blue-900/10 transition-colors items-center">

                <!-- Timestamp -->
                <div class="flex flex-col justify-center">
                  <template v-if="formatTaskDate(batch.timestamp)">
                    <span class="text-[12px] text-white font-semibold">{{ formatTaskDate(batch.timestamp).date }}</span>
                    <span class="text-[11px] text-gray-500">{{ formatTaskDate(batch.timestamp).time }}</span>
                  </template>
                  <span v-else class="text-[11px] text-gray-600">-</span>
                </div>

                <!-- Batch Name -->
                <div class="col-span-2 flex flex-col justify-center min-w-0">
                  <span class="text-[12px] text-white font-semibold font-mono truncate">
                    {{ batch.batch_name || ('#' + batch.batch_id) }}
                  </span>
                  <span class="text-[10px] text-blue-400/70 font-mono">ID: {{ batch.batch_id }} </span>
                </div>

                <!-- Progress -->
                <div class="flex flex-col items-center justify-center gap-1">
                  <div class="text-[11px] font-mono text-gray-300">
                    <span :class="batch.progress.failed == 1 ? 'text-red-500' : batch.progress.success === 1 ? 'text-emerald-500' : 'text-yellow-500'" class="font-bold">{{ batch.progress?.success ?? 0 }}</span>
                    <span class="text-gray-600">/{{ batch.progress?.total ?? 0 }}</span>
                  </div>
                  <div class="w-full max-w-[80px] bg-slate-800 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all"
                      :style="{ width: (batch.progress?.percent ?? 0) + '%' }"
                      :class="batch.progress.failed == 1 ? 'bg-red-500' : batch.progress.success === 1 ? 'bg-emerald-500' : 'bg-yellow-500'"
                    ></div>
                  </div>
                  <div class="text-[9px] text-gray-600">
                    <span class="text-red-400">{{ batch.progress?.failed ?? 0 }}F</span>
                    <span class="mx-0.5 text-gray-500">|</span>
                    <span class="text-emerald-400">{{ batch.progress?.success ?? 0 }}S</span>
                  </div>
                </div>

                <!-- Status -->
                <div class="flex items-center justify-center">
                  <span :class="['text-[11px] font-bold px-2.5 py-1 rounded-lg', statusBadgeClass(batch.status)]">
                    {{ statusLabel(batch.status) }}
                  </span>
                </div>

                <!-- Execute Button -->
                <div class="flex items-center justify-center">
                  <!-- Button execute -->
                  <button
                    @click="executeBatch(batch.batch_name)"
                    :disabled="executingBatchId === batch.batch_name"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border"
                    :class="executingBatchId === batch.batch_name
                      ? 'bg-orange-900/30 border-orange-600/30 text-orange-400 opacity-70 cursor-not-allowed'
                      : 'bg-orange-600/20 border-orange-500/40 text-orange-300 hover:bg-orange-600/40 hover:text-white hover:shadow-[0_0_12px_rgba(234,88,12,0.4)]'"
                  >
                    <svg v-if="executingBatchId === batch.batch_name" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    {{ executingBatchId === batch.batch_name ? 'Running' : 'Execute' }}
                  </button>

                  <!-- Button open terminal -->
                  <button
                    @click="openLogDetail(batch)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/40 hover:text-white hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Logs
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-2.5 border-t border-white/5 text-[10px] text-gray-500 flex justify-between">
            <span>Showing {{ filteredBatchList.length }} of {{ batchList.length }} batches</span>
            <span>Source: transfer_batches table</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ==================== TRANSFER MODAL ==================== -->

    <Transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeModal"></div>
        
        <!-- Modal Card -->
        <div class="relative z-10 w-full max-w-md bg-slate-900 border border-blue-500/30 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.2)] overflow-hidden">
          <!-- Header -->
          <div class="relative px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            <div>
              <p class="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
                {{ modalStep === 'validate' ? 'Step 1 — Validation' : modalStep === 'success' ? 'Transfer Created' : 'Error' }}
              </p>
              <h3 class="text-sm font-bold text-white mt-0.5">
                {{ modalStep === 'validate' ? 'Konfirmasi Transfer' : modalStep === 'success' ? '✅ Berhasil!' : '❌ Gagal' }}
              </h3>
            </div>
            <button @click="closeModal" class="text-gray-500 hover:text-white transition-colors p-1">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 space-y-4">
            <!-- Loading -->
            <div v-if="modalLoading" class="flex flex-col items-center py-6 gap-3">
              <div class="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-xs text-gray-400">{{ modalStep === 'validate' ? 'Memvalidasi...' : 'Membuat transfer...' }}</p>
            </div>

            <!-- Validate Result -->
            <div v-else-if="modalStep === 'validate' && validationResult" class="space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <div class="bg-slate-800 rounded-xl p-3 text-center">
                  <div class="text-lg font-black text-white">{{ validationResult.requested_count }}</div>
                  <div class="text-[8px] text-gray-400 uppercase tracking-wider">Requested</div>
                </div>
                <div class="bg-slate-800 rounded-xl p-3 text-center">
                  <div class="text-lg font-black" :class="validationResult.source_available_count > 0 ? 'text-green-400' : 'text-red-400'">{{ validationResult.source_available_count }}</div>
                  <div class="text-[8px] text-gray-400 uppercase tracking-wider">Source Avail.</div>
                </div>
                <div class="bg-slate-800 rounded-xl p-3 text-center">
                  <div class="text-lg font-black" :class="validationResult.target_available_count > 0 ? 'text-blue-400' : 'text-red-400'">{{ validationResult.target_available_count }}</div>
                  <div class="text-[8px] text-gray-400 uppercase tracking-wider">Target Avail.</div>
                </div>
              </div>
              <div :class="['rounded-lg px-3 py-2 text-[10px] font-medium', validationResult.can_proceed ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300']">
                {{ validationResult.message }}
              </div>
              <div v-if="validationResult.warnings?.length" class="space-y-1">
                <div v-for="(w, i) in validationResult.warnings" :key="i" class="text-[9px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 rounded-lg">⚠️ {{ w }}</div>
              </div>
              <div v-if="validationResult.pairs_preview?.length" class="space-y-1">
                <p class="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Preview Pairs ({{ validationResult.pairs_preview.length }})</p>
                <div class="max-h-[120px] overflow-y-auto custom-scrollbar space-y-1">
                  <div v-for="(pair, i) in validationResult.pairs_preview" :key="i"
                      class="flex items-center justify-between bg-slate-800/50 rounded-lg px-2.5 py-1.5 gap-2">
                    <span class="text-[9px] font-mono text-blue-300 flex-1 truncate">{{ pair.source_phone }}</span>
                    <ArrowRightLeft class="w-3 h-3 text-gray-600 flex-shrink-0" />
                    <span class="text-[9px] font-mono text-gray-400 flex-1 truncate text-right">{{ pair.target_phone }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Success Result -->
            <div v-else-if="modalStep === 'success' && transferResult" class="space-y-3">
              <div class="text-center py-2">
                <div class="text-3xl mb-2">🎉</div>
                <p class="text-xs text-gray-300">Transfer batch berhasil dibuat di database!</p>
              </div>
              <div class="bg-slate-800 rounded-xl p-3 space-y-1.5">
                <div class="flex justify-between text-[10px]">
                  <span class="text-gray-400">Batch ID</span>
                  <span class="text-blue-300 font-mono font-bold">{{ transferResult.batch_id }}</span>
                </div>
                <div class="flex justify-between text-[10px]">
                  <span class="text-gray-400">Total Transfers</span>
                  <span class="text-green-400 font-bold">{{ transferResult.total_transfers_created }}</span>
                </div>
                <div class="flex justify-between text-[10px]">
                  <span class="text-gray-400">Account Type</span>
                  <span class="text-white font-bold uppercase">{{ transferResult.account_type }}</span>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-else-if="modalStep === 'error'" class="space-y-3">
              <div class="text-center py-2">
                <div class="text-3xl mb-2">😵</div>
              </div>
              <div class="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-[10px] text-red-300">
                {{ modalError }}
              </div>
            </div>
          </div>

          <!-- Footer buttons -->
          <div v-if="!modalLoading" class="px-5 py-3 border-t border-white/10 flex gap-2 justify-end">
            <button @click="closeModal" class="px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              {{ modalStep === 'success' ? 'Close' : 'Batal' }}
            </button>
            <button v-if="modalStep === 'validate' && validationResult?.can_proceed" @click="confirmTransfer"
              class="px-5 py-2 text-[10px] font-black text-white uppercase tracking-wider bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              ✅ Konfirmasi & Buat Transfer
            </button>
            <button v-if="modalStep === 'error'" @click="proceedTransfer"
              class="px-5 py-2 text-[10px] font-black text-white uppercase tracking-wider bg-orange-600 hover:bg-orange-500 rounded-lg transition-all">
              🔄 Coba Lagi
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ==================== CYBERPUNK MONITORING DASHBOARD ===================== -->
    <Transition name="modal-scale">
      <div v-if="showLogDetail" class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/90 backdrop-blur-xl" @click="closeLogDetail"></div>
        
        <!-- Dashboard Container -->
        <div class="relative z-10 w-full max-w-[95vw] h-[92vh] bg-[#020817] border border-cyan-500/20 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden flex flex-col font-mono text-cyan-50">
          
          <!-- Cyber Header -->
          <div class="px-6 py-3 bg-slate-900/40 border-b border-cyan-500/20 flex justify-between items-center bg-gradient-to-r from-slate-900/40 via-cyan-900/10 to-slate-900/40 relative overflow-hidden">
            <!-- Decorative scanline -->
            <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent h-px animate-[scanline_4s_linear_infinite]"></div>
            
            <div class="flex items-center gap-6 relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <div class="w-2 h-2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></div>
                </div>
                <div>
                  <h2 class="text-xs font-black text-cyan-400 tracking-[0.2em] uppercase leading-none">Sphere Core Terminal</h2>
                  <span class="text-[9px] text-cyan-600 font-bold uppercase tracking-[0.1em]">Protocol v2.0.42_STABLE</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-8 relative z-10">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span class="text-[10px] font-bold text-green-400 uppercase tracking-widest">Active</span>
              </div>
              <div class="h-4 w-px bg-white/10 uppercase font-bold text-[8px] flex items-center px-1 text-gray-700">|</div>
              <div class="flex items-center gap-2 text-cyan-400/80">
                <Server class="w-3.5 h-3.5" />
                <span class="text-[10px] font-bold uppercase tracking-widest">2 Units Linked</span>
              </div>
              <button @click="closeLogDetail" class="ml-4 text-cyan-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded border border-transparent hover:border-cyan-500/30">
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Main Scrollable Section -->
          <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[radial-gradient(circle_at_50%_50%,_rgba(6,182,212,0.03)_0%,_transparent_100%)]">
            
            <!-- Top Grid (3 Columns) -->
            <div class="grid grid-cols-12 gap-6 items-stretch">
              
              <!-- Column 1: Source Phone -->
              <div class="col-span-12 lg:col-span-6 bg-slate-900/30 border border-cyan-500/10 rounded-xl p-5 relative group hover:border-cyan-500/30 transition-all flex flex-col">
                <div class="flex justify-between items-start mb-6">
                  <h3 class="text-xs font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
                    <div class="w-1 h-3 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                    Handphone Sumber
                  </h3>
                  <div class="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1.5">
                    <div class="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                    <span class="text-[8px] font-bold text-green-400 uppercase tracking-widest">Online</span>
                  </div>
                </div>

                <!-- Device Info Column -->
                <div class="mb-8 text-center">
                  <div class="px-4 py-2 bg-cyan-500/5 border border-cyan-500/20 rounded-lg inline-block mb-3">
                    <span class="text-[8px] text-cyan-700 font-bold uppercase tracking-[0.2em] block mb-0.5">Model / System</span>
                    <span class="text-xs text-white/90 font-black tracking-widest">{{ selectedLogData?.source_device || 'Detecting...' }}</span>
                  </div>
                  
                  <div class="flex items-center justify-center gap-3 text-[10px] font-mono">
                    <span class="text-cyan-400">{{ selectedLogData?.source_ip || '---.---.---.---' }}</span>
                  </div>
                </div>
                
                <!-- Device Stream column -->
                <div class="h-full overflow-y-auto custom-scrollbar p-6">
                  <div class="flex flex-wrap justify-center gap-4">
                      <div class="bg-[#050C25] w-full max-w-[425px] h-[760px] border border-blue-900/50 rounded-xl overflow-hidden flex flex-col items-center relative shadow-[0_0_30px_rgba(8,34,130,0.3)]">
                        
                        <!-- Header (Only for Active/Offline) -->
                        <div class="w-full py-2.5 bg-[#081736] border-b border-cyan-500/20 text-center relative shrink-0">
                          <span class="text-cyan-400 font-bold tracking-widest text-[10px] uppercase">Source Stream</span>
                          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          </div>
                        </div>
                        <!-- Content Area -->
                        <div class="flex-1 w-full relative h-full flex overflow-hidden aspect-video">
                            
                            <!-- ACTIVE STATE -->
                          <template v-if="sourceStreamUrl">
                              <iframe 
                                  :src="sourceStreamUrl" 
                                  class="absolute inset-0 w-full h-full border-none"
                                  allowfullscreen
                                ></iframe>
                          </template>
                        </div>
                      </div>
                  </div>
                </div>

                <button 
                  @click="refreshSourceStream"
                  class="mt-6 w-full py-3 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <RefreshCw class="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-700" />
                  Signal Refresh
                </button>
              </div>

              <!-- Column 2: Target Phone -->
              <div class="col-span-12 lg:col-span-6 bg-slate-900/30 border border-cyan-500/10 rounded-xl p-5 relative group hover:border-cyan-500/30 transition-all flex flex-col">
                <div class="flex justify-between items-start mb-6">
                  <h3 class="text-xs font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
                    <div class="w-1 h-3 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    Handphone Target
                  </h3>
                  <div class="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1.5">
                    <div class="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                    <span class="text-[8px] font-bold text-green-400 uppercase tracking-widest">Active Link</span>
                  </div>
                </div>
                <!-- Device Info Column -->
                <div class="mb-8 text-center">
                   <div class="px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg inline-block mb-3">
                    <span class="text-[8px] text-blue-700 font-bold uppercase tracking-[0.2em] block mb-0.5">Model / System</span>
                    <span class="text-xs text-white/90 font-black tracking-widest">{{ selectedLogData?.target_device || 'Detecting...' }}</span>
                  </div>
                  
                  <div class="flex items-center justify-center gap-3 text-[10px] font-mono text-right">
                    <span class="text-blue-400">{{ selectedLogData?.target_ip || '---.---.---.---' }}</span>
                  </div>
                </div>
                <div class="h-full overflow-y-auto custom-scrollbar p-6">
                  <div class="flex flex-wrap justify-center gap-4">
                      <div class="bg-[#050C25] w-full max-w-[425px] h-[760px] border border-blue-900/50 rounded-xl overflow-hidden flex flex-col items-center relative shadow-[0_0_30px_rgba(8,34,130,0.3)]">
                        
                        <!-- Header (Only for Active/Offline) -->
                        <div class="w-full py-2.5 bg-[#081736] border-b border-blue-500/20 text-center relative shrink-0">
                          <span class="text-blue-400 font-bold tracking-widest text-[10px] uppercase">Target Stream</span>
                          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <div class="w-1.5 h-1.5 rounded-full" :class="targetStreamUrl ? 'bg-green-500' : 'bg-red-500'"></div>
                          </div>
                        </div>
                        <!-- Content Area -->
                        <div class="flex-1 w-full relative h-full flex overflow-hidden aspect-video">
                            
                            <!-- ACTIVE STATE -->
                          <template v-if="targetStreamUrl">
                              <iframe 
                                  :src="targetStreamUrl" 
                                  class="absolute inset-0 w-full h-full border-none"
                                  allowfullscreen
                                ></iframe>
                          </template>
                        </div>
                      </div>
                  </div>
                </div>


                <button 
                  @click="refreshTargetStream"
                  class="mt-6 w-full py-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <RefreshCw class="w-3.5 h-3.5 group-hover/btn:-rotate-180 transition-transform duration-700" />
                  Remote Refresh
                </button>
              </div>
            </div>

             <div class="bg-black/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.1)] relative overflow-hidden group/terminal">
               <div class="flex justify-between items-center px-6 py-4 bg-slate-900/50 border-b border-cyan-500/10 relative z-10">
                 <div class="flex items-center gap-4">
                    <div class="flex gap-1.5">
                       <div class="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50"></div>
                       <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/50"></div>
                       <div class="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/50"></div>
                    </div>
                    <div class="h-4 w-px bg-white/10 mx-2"></div>
                    <h3 class="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-3">
                       <Activity class="w-3.5 h-3.5 animate-pulse" />
                       Protocol Trace Logs
                    </h3>
                 </div>
                 
                 <div class="flex items-center gap-3">
                    <div class="flex p-1 bg-black/40 rounded-xl border border-white/5">
                       <button 
                         @click="currentLogTab = 'global'"
                         :class="currentLogTab === 'global' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-gray-500 hover:text-cyan-400'"
                         class="px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300"
                       >
                         Global
                       </button>
                       <button 
                         @click="currentLogTab = 'split'"
                         :class="currentLogTab === 'split' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-gray-500 hover:text-cyan-400'"
                         class="px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300"
                       >
                         Split
                       </button>
                    </div>
                    <button 
                      @click="logList = { content: '' }; sourceLogList = { content: '' }; targetLogList = { content: '' }"
                      class="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest border border-red-500/20 transition-all active:scale-95"
                    >
                       <Trash2 class="w-3 h-3" />
                       Clear
                    </button>
                 </div>
               </div>

               <!-- Global Log View -->
               <div v-if="currentLogTab === 'global'" class="h-[320px] relative">
                  <div ref="logScrollEl" @scroll="onLogScroll" class="h-full p-6 overflow-y-auto custom-scrollbar font-mono space-y-1.5 text-[10px] bg-black/20">
                     <div v-for="(log, idx) in formattedLogs" :key="idx" class="flex gap-4 group/line py-0.5 border-l-2 border-transparent hover:border-cyan-500/50 hover:bg-cyan-500/5 px-2 transition-all">
                        <span class="text-cyan-900 shrink-0 font-bold font-mono opacity-50">{{ log.timestamp?.split(' ')[1] || '---' }}</span>
                        <span :class="{
                           'text-cyan-400': log.level === 'INFO', 
                           'text-emerald-400': log.level === 'SUCCESS' || log.level === 'COMPLETED', 
                           'text-red-500 font-black': log.level === 'ERROR' || log.level === 'FAILED',
                           'text-yellow-400': log.level === 'WARNING'
                        }" class="w-16 shrink-0 font-black text-[9px] leading-tight mt-0.5 tracking-tighter italic">[{{ log.level || 'INFO' }}]</span>
                        <span class="text-gray-400 leading-relaxed group-hover/line:text-cyan-100 transition-colors flex-1">{{ log.message }}</span>
                     </div>
                     <div v-if="!isScrollPaused" class="flex items-center gap-2 pt-2 opacity-30">
                        <span class="w-1.5 h-3 bg-cyan-500 animate-[blink_1s_infinite]"></span>
                        <span class="text-[8px] text-cyan-500 font-bold uppercase tracking-widest">Awaiting system output...</span>
                     </div>
                  </div>
                  
                  <!-- Pause Indicator -->
                  <div v-if="isScrollPaused" class="absolute bottom-4 right-8 px-4 py-2 bg-yellow-500/90 text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-xl flex items-center gap-2 cursor-pointer hover:bg-yellow-400 transition-all z-20" @click="resumeScroll">
                     <RefreshCw class="w-3 h-3 animate-spin-slow" />
                     Auto-scroll Paused - Click to Resume
                  </div>
               </div>

                <!-- Side-by-Side (Split) View -->
                <div v-else class='grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-cyan-500/10 border-t border-cyan-500/10 h-[320px] relative z-10'>
                   <!-- Source Log Panel -->
                   <div class='flex flex-col bg-black/40 group/source-log transition-all'>
                     <div class='px-4 py-2 bg-slate-900/80 flex justify-between items-center text-left'>
                        <span class='text-[8px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-3'>
                           <div class='w-1 h-3 bg-cyan-500'></div>
                           Source Trace: {{ selectedLogData?.source_ip || '...' }}
                        </span>
                     </div>
                     <div ref='logScrollEl' @scroll='onLogScroll' class='flex-1 p-5 overflow-y-auto custom-scrollbar font-mono space-y-2 text-[10px] text-left'>
                        <div v-for='(log, idx) in formattedSourceLogs' :key='idx' class='flex gap-3 group/line px-1'>
                           <span :class='{
                              "text-cyan-400": log.level === "INFO", 
                              "text-emerald-400": log.level === "SUCCESS" || log.level === "COMPLETED", 
                              "text-red-500": log.level === "ERROR" || log.level === "FAILED"
                           }' class='shrink-0 font-black text-[8px] italic'>></span>
                           <span class='text-gray-400 leading-relaxed group-hover/line:text-cyan-100 transition-colors'>{{ log.message }}</span>
                        </div>
                     </div>
                   </div>
 
                   <!-- Target Log Panel -->
                   <div class='flex flex-col bg-black/40 group/target-log transition-all border-l border-cyan-500/10'>
                      <div class='px-4 py-2 bg-slate-900/80 flex justify-between items-center text-left'>
                         <span class='text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3'>
                            <div class='w-1 h-3 bg-blue-500 text-blue-500'></div>
                            Target Trace: {{ selectedLogData?.target_ip || '...' }}
                         </span>
                      </div>
                      <div class='flex-1 p-5 overflow-y-auto custom-scrollbar font-mono space-y-2 text-[10px] text-left'>
                         <div v-for='(log, idx) in formattedTargetLogs' :key='idx' class='flex gap-3 group/line px-1'>
                             <span :class='{
                               "text-cyan-400": log.level === "INFO", 
                               "text-emerald-400": log.level === "SUCCESS" || log.level === "COMPLETED", 
                               "text-red-500": log.level === "ERROR" || log.level === "FAILED"
                            }' class='shrink-0 font-black text-[8px] italic'>></span>
                            <span class='text-gray-400 leading-relaxed group-hover/line:text-blue-100 transition-colors'>{{ log.message }}</span>
                         </div>
                      </div>
                   </div>
                </div>

            </div>
          </div>

          <!-- Footer Status Bar -->
          <div class="px-6 py-2 bg-[#020611] border-t border-cyan-500/20 flex justify-between items-center text-[8px] font-black text-gray-700 uppercase tracking-[0.4em]">
            <div class="flex items-center gap-8">
              <span class="text-cyan-900">Sphere Core System v2.0.42</span>
              <div class="flex gap-6">
                 <span>MEM_ALLOC: 128.4 MB</span>
                 <span>PROC_LOAD: 04.12%</span>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                <span class="text-green-900">Encrypted</span>
              </div>
              <div class="flex gap-2">
                <span>TIMESTAMP:</span>
                <span class="text-cyan-900">2026.04.23_16:53:29</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Transition>



  </div>
</template>


<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.2);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.4);
}

/* Fix untuk dropdown agar muncul di atas card */
:deep(.custom-select__dropdown) {
  position: fixed !important;
  z-index: 9999 !important;
  max-height: 250px !important;
  overflow-y: auto !important;
  background: #0A1A3F !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.2) !important;
  width: auto !important;
  min-width: 200px !important;
}

/* Styling untuk option */
:deep(.custom-select__option) {
  padding: 0.5rem 1rem !important;
  font-size: 0.75rem !important;
  color: #e2e8f0 !important;
  cursor: pointer !important;
  transition: all 0.15s !important;
}

:deep(.custom-select__option:hover) {
  background: rgba(59, 130, 246, 0.2) !important;
  color: white !important;
}

:deep(.custom-select__option--selected) {
  background: rgba(59, 130, 246, 0.3) !important;
  color: white !important;
  font-weight: 600 !important;
}

/* Styling untuk search input jika ada */
:deep(.custom-select__search) {
  padding: 0.5rem !important;
  background: #0F1A3F !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2) !important;
}

:deep(.custom-select__search input) {
  background: #1A264F !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  border-radius: 0.25rem !important;
  padding: 0.25rem 0.5rem !important;
  color: white !important;
  font-size: 0.75rem !important;
  width: 100% !important;
}

:deep(.custom-select__search input:focus) {
  outline: none !important;
  border-color: #3b82f6 !important;
}

/* Animasi */
:deep(.custom-select__dropdown) {
  animation: dropdownFadeIn 0.15s ease-out !important;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(1000%); }
}

@keyframes data-flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-enter-from .relative {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>