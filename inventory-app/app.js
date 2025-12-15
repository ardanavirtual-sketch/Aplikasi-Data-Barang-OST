// Aplikasi Inventori - Main JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Aplikasi Inventori dimuat');
    
    try {
        // Setup event listeners terlebih dahulu
        setupEventListeners();
        
        // Kemudian inisialisasi aplikasi
        await initializeApp();
        
        // Load data awal
        loadDashboardData();
        
    } catch (error) {
        console.error('Error inisialisasi aplikasi:', error);
        showNotification('Gagal menginisialisasi aplikasi. Periksa koneksi database.', 'error');
    }
});

// Inisialisasi aplikasi
async function initializeApp() {
    console.log('Menginisialisasi aplikasi...');
    
    try {
        // Set tanggal default untuk form
        const today = new Date().toISOString().split('T')[0];
        
        // Set tanggal untuk form modal
        const tanggalInputs = [
            'modal-tanggal-masuk',
            'modal-tanggal-keluar',
            'multi-tanggal-masuk',
            'multi-tanggal-keluar'
        ];
        
        tanggalInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = today;
        });
        
        // Set tanggal untuk filter laporan (bulan ini)
        const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
        
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');
        
        if (startDateInput) startDateInput.value = firstDay;
        if (endDateInput) endDateInput.value = lastDay;
        
        // Cek koneksi Supabase
        const isInitialized = await window.supabaseFunctions.initializeDatabase();
        
        if (!isInitialized) {
            console.warn('Database belum diinisialisasi. Pastikan tabel sudah dibuat di Supabase.');
            showNotification('Database belum sepenuhnya diinisialisasi. Pastikan tabel sudah dibuat dengan SQL yang disediakan.', 'warning');
        } else {
            console.log('Aplikasi siap digunakan');
            showNotification('Aplikasi Inventori siap digunakan!', 'success');
        }
        
    } catch (error) {
        console.error('Error inisialisasi:', error);
        throw error;
    }
}

// Setup semua event listener
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation tabs
    const navItems = document.querySelectorAll('.sidebar li');
    navItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            console.log('Tab diklik:', tabId);
            switchTab(tabId);
        });
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('Refresh diklik');
            loadDashboardData();
            showNotification('Data diperbarui', 'success');
        });
    }
    
    // Tambah barang button
    const tambahBarangBtn = document.getElementById('tambah-barang-btn');
    if (tambahBarangBtn) {
        tambahBarangBtn.addEventListener('click', function() {
            console.log('Tambah barang diklik');
            openTambahBarangModal();
        });
    }
    
    // Tambah barang masuk button
    const tambahMasukBtn = document.getElementById('tambah-masuk-btn');
    if (tambahMasukBtn) {
        tambahMasukBtn.addEventListener('click', function() {
            console.log('Tambah barang masuk diklik');
            openTambahMasukModal();
        });
    }
    
    // Multi barang masuk button
    const multiMasukBtn = document.getElementById('multi-masuk-btn');
    if (multiMasukBtn) {
        multiMasukBtn.addEventListener('click', function() {
            console.log('Multi barang masuk diklik');
            openMultiMasukModal();
        });
    }
    
    // Tambah barang keluar button
    const tambahKeluarBtn = document.getElementById('tambah-keluar-btn');
    if (tambahKeluarBtn) {
        tambahKeluarBtn.addEventListener('click', function() {
            console.log('Tambah barang keluar diklik');
            openTambahKeluarModal();
        });
    }
    
    // Multi barang keluar button
    const multiKeluarBtn = document.getElementById('multi-keluar-btn');
    if (multiKeluarBtn) {
        multiKeluarBtn.addEventListener('click', function() {
            console.log('Multi barang keluar diklik');
            openMultiKeluarModal();
        });
    }
    
    // Tambah kategori button
    const tambahKategoriBtn = document.getElementById('tambah-kategori-btn');
    if (tambahKategoriBtn) {
        tambahKategoriBtn.addEventListener('click', function() {
            console.log('Tambah kategori diklik');
            resetKategoriForm();
        });
    }
    
    // Tambah satuan button
    const tambahSatuanBtn = document.getElementById('tambah-satuan-btn');
    if (tambahSatuanBtn) {
        tambahSatuanBtn.addEventListener('click', function() {
            console.log('Tambah satuan diklik');
            resetSatuanForm();
        });
    }
    
    // Filter laporan button
    const filterLaporanBtn = document.getElementById('filter-laporan-btn');
    if (filterLaporanBtn) {
        filterLaporanBtn.addEventListener('click', function() {
            console.log('Filter laporan diklik');
            loadLaporanData();
        });
    }
    
    // Export laporan button
    const exportLaporanBtn = document.getElementById('export-laporan-btn');
    if (exportLaporanBtn) {
        exportLaporanBtn.addEventListener('click', function() {
            console.log('Export laporan diklik');
            exportLaporanPDF();
        });
    }
    
    // Reset kategori button
    const resetKategoriBtn = document.getElementById('reset-kategori-btn');
    if (resetKategoriBtn) {
        resetKategoriBtn.addEventListener('click', function() {
            console.log('Reset kategori diklik');
            resetKategoriForm();
        });
    }
    
    // Reset satuan button
    const resetSatuanBtn = document.getElementById('reset-satuan-btn');
    if (resetSatuanBtn) {
        resetSatuanBtn.addEventListener('click', function() {
            console.log('Reset satuan diklik');
            resetSatuanForm();
        });
    }
    
    // Search barang
    const searchBarang = document.getElementById('search-barang');
    if (searchBarang) {
        searchBarang.addEventListener('input', function() {
            console.log('Search barang:', this.value);
            filterBarangTable(this.value);
        });
    }
    
    // Filter barang masuk
    const filterTanggalMasuk = document.getElementById('filter-tanggal-masuk');
    if (filterTanggalMasuk) {
        filterTanggalMasuk.addEventListener('change', function() {
            console.log('Filter tanggal masuk:', this.value);
            loadBarangMasukData();
        });
    }
    
    const filterBarangMasuk = document.getElementById('filter-barang-masuk');
    if (filterBarangMasuk) {
        filterBarangMasuk.addEventListener('change', function() {
            console.log('Filter barang masuk:', this.value);
            loadBarangMasukData();
        });
    }
    
    // Filter barang keluar
    const filterTanggalKeluar = document.getElementById('filter-tanggal-keluar');
    if (filterTanggalKeluar) {
        filterTanggalKeluar.addEventListener('change', function() {
            console.log('Filter tanggal keluar:', this.value);
            loadBarangKeluarData();
        });
    }
    
    const filterBarangKeluar = document.getElementById('filter-barang-keluar');
    if (filterBarangKeluar) {
        filterBarangKeluar.addEventListener('change', function() {
            console.log('Filter barang keluar:', this.value);
            loadBarangKeluarData();
        });
    }
    
    // Form submit handlers
    const formTambahBarang = document.getElementById('form-tambah-barang');
    if (formTambahBarang) {
        formTambahBarang.addEventListener('submit', handleTambahBarang);
    }
    
    const formTambahMasuk = document.getElementById('form-tambah-masuk');
    if (formTambahMasuk) {
        formTambahMasuk.addEventListener('submit', handleTambahMasuk);
    }
    
    const formTambahKeluar = document.getElementById('form-tambah-keluar');
    if (formTambahKeluar) {
        formTambahKeluar.addEventListener('submit', handleTambahKeluar);
    }
    
    const kategoriForm = document.getElementById('kategori-form');
    if (kategoriForm) {
        kategoriForm.addEventListener('submit', handleKategoriForm);
    }
    
    const satuanForm = document.getElementById('satuan-form');
    if (satuanForm) {
        satuanForm.addEventListener('submit', handleSatuanForm);
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            console.log('Close modal diklik');
            closeAllModals();
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            console.log('Modal background diklik');
            closeAllModals();
        }
    });
    
    // Barang masuk - hitung total Pcs
    const modalJumlahMasuk = document.getElementById('modal-jumlah-masuk');
    if (modalJumlahMasuk) {
        modalJumlahMasuk.addEventListener('input', function() {
            updateKonversiMasuk();
        });
    }
    
    const modalBarangMasuk = document.getElementById('modal-barang-masuk');
    if (modalBarangMasuk) {
        modalBarangMasuk.addEventListener('change', function() {
            updateKonversiMasuk();
        });
    }
    
    // Barang keluar - update info
    const modalBarangKeluar = document.getElementById('modal-barang-keluar');
    if (modalBarangKeluar) {
        modalBarangKeluar.addEventListener('change', function() {
            updateInfoKeluar();
        });
    }
    
    const modalSatuanKeluar = document.getElementById('modal-satuan-keluar');
    if (modalSatuanKeluar) {
        modalSatuanKeluar.addEventListener('change', function() {
            updateKonversiKeluar();
        });
    }
    
    const modalJumlahKeluar = document.getElementById('modal-jumlah-keluar');
    if (modalJumlahKeluar) {
        modalJumlahKeluar.addEventListener('input', function() {
            updateKonversiKeluar();
        });
    }
    
    // Multi item controls
    const tambahItemMasukBtn = document.getElementById('tambah-item-masuk');
    if (tambahItemMasukBtn) {
        tambahItemMasukBtn.addEventListener('click', function() {
            addMultiMasukItem();
        });
    }
    
    const hitungTotalMasukBtn = document.getElementById('hitung-total-masuk');
    if (hitungTotalMasukBtn) {
        hitungTotalMasukBtn.addEventListener('click', function() {
            calculateTotalMasuk();
        });
    }
    
    const simpanMultiMasukBtn = document.getElementById('simpan-multi-masuk');
    if (simpanMultiMasukBtn) {
        simpanMultiMasukBtn.addEventListener('click', function() {
            handleMultiMasuk();
        });
    }
    
    const tambahItemKeluarBtn = document.getElementById('tambah-item-keluar');
    if (tambahItemKeluarBtn) {
        tambahItemKeluarBtn.addEventListener('click', function() {
            addMultiKeluarItem();
        });
    }
    
    const hitungTotalKeluarBtn = document.getElementById('hitung-total-keluar');
    if (hitungTotalKeluarBtn) {
        hitungTotalKeluarBtn.addEventListener('click', function() {
            calculateTotalKeluar();
        });
    }
    
    const simpanMultiKeluarBtn = document.getElementById('simpan-multi-keluar');
    if (simpanMultiKeluarBtn) {
        simpanMultiKeluarBtn.addEventListener('click', function() {
            handleMultiKeluar();
        });
    }
    
    console.log('Event listeners setup selesai');
}

// Fungsi untuk berpindah tab
function switchTab(tabId) {
    console.log('Switch ke tab:', tabId);
    
    // Update active tab in sidebar
    document.querySelectorAll('.sidebar li').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        }
    });
    
    // Show active tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabId) {
            tab.classList.add('active');
            
            // Load data for the tab
            switch(tabId) {
                case 'dashboard':
                    console.log('Loading dashboard data...');
                    loadDashboardData();
                    break;
                case 'barang':
                    console.log('Loading barang data...');
                    loadBarangData();
                    break;
                case 'barang-masuk':
                    console.log('Loading barang masuk data...');
                    loadBarangMasukData();
                    break;
                case 'barang-keluar':
                    console.log('Loading barang keluar data...');
                    loadBarangKeluarData();
                    break;
                case 'laporan':
                    console.log('Loading laporan data...');
                    loadLaporanData();
                    break;
                case 'kategori':
                    console.log('Loading kategori data...');
                    loadKategoriData();
                    break;
                case 'satuan':
                    console.log('Loading satuan data...');
                    loadSatuanData();
                    break;
            }
        }
    });
}

// Load data dashboard
async function loadDashboardData() {
    console.log('Memuat data dashboard...');
    
    try {
        // Update status loading
        updateStatsLoading();
        
        // Load data barang untuk statistik
        const barang = await window.supabaseFunctions.getBarang();
        const barangMasuk = await window.supabaseFunctions.getBarangMasuk();
        const barangKeluar = await window.supabaseFunctions.getBarangKeluar();
        
        console.log('Data loaded:', {
            barang: barang.length,
            masuk: barangMasuk.length,
            keluar: barangKeluar.length
        });
        
        // Update statistik
        updateDashboardStats(barang, barangMasuk, barangKeluar);
        
        // Load aktivitas terbaru
        loadAktivitasTerbaru();
        
        // Load chart data
        loadChartData(barang);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Gagal memuat data dashboard', 'error');
        
        // Set default values jika error
        resetDashboardStats();
    }
}

// Update stats loading state
function updateStatsLoading() {
    document.getElementById('total-barang').textContent = '...';
    document.getElementById('total-masuk').textContent = '...';
    document.getElementById('total-keluar').textContent = '...';
    document.getElementById('total-rendah').textContent = '...';
}

// Update dashboard statistics
function updateDashboardStats(barang, barangMasuk, barangKeluar) {
    // Total barang
    document.getElementById('total-barang').textContent = barang.length;
    
    // Total barang masuk (dalam Dus)
    const totalMasukDus = barangMasuk.reduce((sum, item) => sum + (parseFloat(item.jumlah_dus) || 0), 0);
    document.getElementById('total-masuk').textContent = totalMasukDus.toFixed(2);
    
    // Total barang keluar (dalam Pcs)
    const totalKeluarPcs = barangKeluar.reduce((sum, item) => sum + (item.total_pcs || 0), 0);
    document.getElementById('total-keluar').textContent = totalKeluarPcs;
    
    // Hitung barang dengan stok rendah (kurang dari minimal stok)
    const stokRendah = barang.filter(item => (item.stok_pcs || 0) <= (item.min_stok_pcs || 0)).length;
    document.getElementById('total-rendah').textContent = stokRendah;
}

// Reset dashboard stats
function resetDashboardStats() {
    document.getElementById('total-barang').textContent = '0';
    document.getElementById('total-masuk').textContent = '0';
    document.getElementById('total-keluar').textContent = '0';
    document.getElementById('total-rendah').textContent = '0';
}

// Load data barang
async function loadBarangData() {
    console.log('Memuat data barang...');
    
    try {
        const barang = await window.supabaseFunctions.getBarang();
        
        console.log('Data barang loaded:', barang.length);
        
        // Render table
        renderBarangTable(barang);
        
    } catch (error) {
        console.error('Error loading barang data:', error);
        showNotification('Gagal memuat data barang', 'error');
        
        const tbody = document.getElementById('barang-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">Error memuat data barang</td></tr>';
        }
    }
}

// Render barang table
function renderBarangTable(barang) {
    const tbody = document.getElementById('barang-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (barang.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Tidak ada data barang</td></tr>';
        return;
    }
    
    barang.forEach(item => {
        const konversi = item.konversi && item.konversi.length > 0 ? item.konversi[0] : null;
        const stokDus = konversi ? (item.stok_pcs || 0) / (konversi.jumlah_per_dus || 24) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.kode_barang || '-'}</td>
            <td>${item.nama_barang || '-'}</td>
            <td>${item.kategori?.nama_kategori || '-'}</td>
            <td class="${(item.stok_pcs || 0) <= (item.min_stok_pcs || 0) ? 'low-stock' : ''}">
                ${item.stok_pcs || 0} Pcs
            </td>
            <td>${stokDus.toFixed(2)} Dus</td>
            <td>${item.min_stok_pcs || 0} Pcs</td>
            <td>${item.lokasi || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" data-id="${item.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" data-id="${item.id}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    addBarangActionListeners();
}

// Add event listeners for barang action buttons
function addBarangActionListeners() {
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            console.log('Edit barang dengan ID:', id);
            editBarang(id);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            console.log('Hapus barang dengan ID:', id);
            deleteBarangConfirmation(id);
        });
    });
}

// Load data barang masuk
async function loadBarangMasukData() {
    console.log('Memuat data barang masuk...');
    
    try {
        const filter = {};
        const tanggalFilter = document.getElementById('filter-tanggal-masuk')?.value;
        const barangFilter = document.getElementById('filter-barang-masuk')?.value;
        
        if (tanggalFilter) filter.tanggal = tanggalFilter;
        if (barangFilter) filter.barang_id = parseInt(barangFilter);
        
        const barangMasuk = await window.supabaseFunctions.getBarangMasuk(filter);
        
        console.log('Data barang masuk loaded:', barangMasuk.length);
        
        // Populate barang filter dropdown
        await populateBarangFilter('filter-barang-masuk');
        
        // Render table
        renderBarangMasukTable(barangMasuk);
        
    } catch (error) {
        console.error('Error loading barang masuk data:', error);
        showNotification('Gagal memuat data barang masuk', 'error');
        
        const tbody = document.getElementById('masuk-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">Error memuat data barang masuk</td></tr>';
        }
    }
}

// Render barang masuk table
function renderBarangMasukTable(barangMasuk) {
    const tbody = document.getElementById('masuk-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (barangMasuk.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Tidak ada data barang masuk</td></tr>';
        return;
    }
    
    barangMasuk.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(item.tanggal)}</td>
            <td>${item.barang?.kode_barang || '-'}</td>
            <td>${item.barang?.nama_barang || '-'}</td>
            <td>${parseFloat(item.jumlah_dus || 0).toFixed(2)}</td>
            <td>${item.total_pcs || 0}</td>
            <td>${item.supplier || '-'}</td>
            <td>${item.keterangan || '-'}</td>
            <td>
                <button class="btn-action btn-delete" data-id="${item.id}" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners for delete buttons
    addBarangMasukDeleteListeners();
}

// Add event listeners for barang masuk delete buttons
function addBarangMasukDeleteListeners() {
    document.querySelectorAll('#masuk-table-body .btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            console.log('Hapus barang masuk dengan ID:', id);
            deleteBarangMasukConfirmation(id);
        });
    });
}

// Load data barang keluar
async function loadBarangKeluarData() {
    console.log('Memuat data barang keluar...');
    
    try {
        const filter = {};
        const tanggalFilter = document.getElementById('filter-tanggal-keluar')?.value;
        const barangFilter = document.getElementById('filter-barang-keluar')?.value;
        
        if (tanggalFilter) filter.tanggal = tanggalFilter;
        if (barangFilter) filter.barang_id = parseInt(barangFilter);
        
        const barangKeluar = await window.supabaseFunctions.getBarangKeluar(filter);
        
        console.log('Data barang keluar loaded:', barangKeluar.length);
        
        // Populate barang filter dropdown
        await populateBarangFilter('filter-barang-keluar');
        
        // Render table
        renderBarangKeluarTable(barangKeluar);
        
    } catch (error) {
        console.error('Error loading barang keluar data:', error);
        showNotification('Gagal memuat data barang keluar', 'error');
        
        const tbody = document.getElementById('keluar-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">Error memuat data barang keluar</td></tr>';
        }
    }
}

// Render barang keluar table
function renderBarangKeluarTable(barangKeluar) {
    const tbody = document.getElementById('keluar-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (barangKeluar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Tidak ada data barang keluar</td></tr>';
        return;
    }
    
    barangKeluar.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(item.tanggal)}</td>
            <td>${item.barang?.kode_barang || '-'}</td>
            <td>${item.barang?.nama_barang || '-'}</td>
            <td>${item.satuan_keluar || '-'}</td>
            <td>${item.jumlah || 0}</td>
            <td>${item.penerima || '-'}</td>
            <td>${item.keterangan || '-'}</td>
            <td>
                <button class="btn-action btn-delete" data-id="${item.id}" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners for delete buttons
    addBarangKeluarDeleteListeners();
}

// Add event listeners for barang keluar delete buttons
function addBarangKeluarDeleteListeners() {
    document.querySelectorAll('#keluar-table-body .btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            console.log('Hapus barang keluar dengan ID:', id);
            deleteBarangKeluarConfirmation(id);
        });
    });
}

// Load data laporan
async function loadLaporanData() {
    console.log('Memuat data laporan...');
    
    try {
        const startDate = document.getElementById('report-start-date')?.value;
        const endDate = document.getElementById('report-end-date')?.value;
        const reportType = document.getElementById('report-type')?.value;
        
        if (!startDate || !endDate) {
            showNotification('Harap pilih periode laporan', 'warning');
            return;
        }
        
        console.log('Filter laporan:', { startDate, endDate, reportType });
        
        const laporan = await window.supabaseFunctions.getLaporan(startDate, endDate, reportType);
        
        console.log('Data laporan loaded:', laporan.length);
        
        // Render table
        renderLaporanTable(laporan, startDate, endDate);
        
    } catch (error) {
        console.error('Error loading laporan data:', error);
        showNotification('Gagal memuat data laporan', 'error');
        
        const tbody = document.getElementById('report-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Error memuat data laporan</td></tr>';
        }
    }
}

// Render laporan table
function renderLaporanTable(laporan, startDate, endDate) {
    const tbody = document.getElementById('report-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (laporan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Tidak ada data laporan untuk periode ini</td></tr>';
        resetLaporanSummary(startDate, endDate);
        return;
    }
    
    // Calculate summary
    let totalMasukDus = 0;
    let totalKeluarPcs = 0;
    
    laporan.forEach(item => {
        const row = document.createElement('tr');
        const badgeClass = item.jenis === 'MASUK' ? 'badge-in' : 'badge-out';
        
        row.innerHTML = `
            <td>${formatDate(item.tanggal)}</td>
            <td><span class="badge ${badgeClass}">${item.jenis}</span></td>
            <td>${item.barang?.kode_barang || '-'}</td>
            <td>${item.barang?.nama_barang || '-'}</td>
            <td>${item.satuan || '-'}</td>
            <td>${item.jenis === 'MASUK' ? parseFloat(item.jumlah || 0).toFixed(2) : item.jumlah || 0}</td>
            <td>${item.keterangan || '-'}</td>
        `;
        tbody.appendChild(row);
        
        // Update totals
        if (item.jenis === 'MASUK') {
            totalMasukDus += parseFloat(item.jumlah) || 0;
        } else if (item.jenis === 'KELUAR') {
            totalKeluarPcs += item.total_pcs || 0;
        }
    });
    
    // Update summary
    updateLaporanSummary(totalMasukDus, totalKeluarPcs, startDate, endDate);
}

// Update laporan summary
function updateLaporanSummary(totalMasukDus, totalKeluarPcs, startDate, endDate) {
    const summaryMasuk = document.getElementById('summary-masuk');
    const summaryKeluar = document.getElementById('summary-keluar');
    const summaryPeriod = document.getElementById('summary-period');
    
    if (summaryMasuk) summaryMasuk.textContent = `${totalMasukDus.toFixed(2)} Dus`;
    if (summaryKeluar) summaryKeluar.textContent = `${totalKeluarPcs} Pcs`;
    if (summaryPeriod) summaryPeriod.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// Reset laporan summary
function resetLaporanSummary(startDate, endDate) {
    const summaryMasuk = document.getElementById('summary-masuk');
    const summaryKeluar = document.getElementById('summary-keluar');
    const summaryPeriod = document.getElementById('summary-period');
    
    if (summaryMasuk) summaryMasuk.textContent = '0 Dus';
    if (summaryKeluar) summaryKeluar.textContent = '0 Pcs';
    if (summaryPeriod) summaryPeriod.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// Load data kategori
async function loadKategoriData() {
    console.log('Memuat data kategori...');
    
    try {
        const kategori = await window.supabaseFunctions.getKategori();
        
        console.log('Data kategori loaded:', kategori.length);
        
        // Render kategori list
        renderKategoriList(kategori);
        
        // Populate kategori dropdowns
        await populateKategoriDropdown('modal-kategori-barang');
        
    } catch (error) {
        console.error('Error loading kategori data:', error);
        showNotification('Gagal memuat data kategori', 'error');
        
        const kategoriList = document.getElementById('kategori-list');
        if (kategoriList) {
            kategoriList.innerHTML = '<li class="loading">Error memuat data kategori</li>';
        }
    }
}

// Render kategori list
function renderKategoriList(kategori) {
    const kategoriList = document.getElementById('kategori-list');
    if (!kategoriList) return;
    
    kategoriList.innerHTML = '';
    
    if (kategori.length === 0) {
        kategoriList.innerHTML = '<li class="loading">Belum ada kategori. Tambahkan kategori baru.</li>';
        return;
    }
    
    kategori.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>
                <strong>${item.nama_kategori || 'Tanpa nama'}</strong>
                ${item.deskripsi ? `<br><small>${item.deskripsi}</small>` : ''}
            </span>
            <div class="kategori-actions">
                <button class="btn-action btn-edit" data-id="${item.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" data-id="${item.id}" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add click event to select kategori for editing
        li.addEventListener('click', function(e) {
            if (!e.target.closest('.btn-action')) {
                console.log('Kategori dipilih untuk edit:', item.id);
                editKategori(item.id);
            }
        });
        
        kategoriList.appendChild(li);
    });
    
    // Add event listeners for action buttons
    addKategoriActionListeners();
}

// Add event listeners for kategori action buttons
function addKategoriActionListeners() {
    document.querySelectorAll('#kategori-list .btn-edit').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            console.log('Edit kategori dengan ID:', id);
            editKategori(id);
        });
    });
    
    document.querySelectorAll('#kategori-list .btn-delete').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            console.log('Hapus kategori dengan ID:', id);
            deleteKategoriConfirmation(id);
        });
    });
}

// Load data satuan
async function loadSatuanData() {
    console.log('Memuat data satuan...');
    
    try {
        const satuan = await window.supabaseFunctions.getSatuanKonversi();
        const barang = await window.supabaseFunctions.getBarang();
        
        console.log('Data satuan loaded:', satuan.length);
        
        // Render satuan table
        renderSatuanTable(satuan);
        
        // Populate barang dropdown
        await populateBarangDropdownSatuan(barang);
        
    } catch (error) {
        console.error('Error loading satuan data:', error);
        showNotification('Gagal memuat data satuan', 'error');
        
        const tbody = document.getElementById('satuan-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" class="loading">Error memuat data satuan</td></tr>';
        }
    }
}

// Render satuan table
function renderSatuanTable(satuan) {
    const tbody = document.getElementById('satuan-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (satuan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">Belum ada konversi satuan. Tambahkan konversi baru.</td></tr>';
        return;
    }
    
    // Group by barang
    const groupedByBarang = {};
    satuan.forEach(item => {
        if (!groupedByBarang[item.barang_id]) {
            groupedByBarang[item.barang_id] = {
                barang: item.barang,
                konversi: []
            };
        }
        groupedByBarang[item.barang_id].konversi.push(item);
    });
    
    // Render grouped data
    Object.values(groupedByBarang).forEach(group => {
        const row = document.createElement('tr');
        const konversiText = group.konversi.map(k => `1 Dus = ${k.jumlah_per_dus} ${k.satuan_unit}`).join('<br>');
        
        row.innerHTML = `
            <td>
                <strong>${group.barang?.nama_barang || 'Barang tidak ditemukan'}</strong><br>
                <small>${group.barang?.kode_barang || 'TANPA KODE'}</small>
            </td>
            <td>${konversiText}</td>
            <td>
                <div class="action-buttons">
                    ${group.konversi.map(k => `
                        <button class="btn-action btn-edit" data-id="${k.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${k.id}" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    `).join('')}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    addSatuanActionListeners();
}

// Add event listeners for satuan action buttons
function addSatuanActionListeners() {
    document.querySelectorAll('#satuan-table-body .btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            console.log('Edit satuan dengan ID:', id);
            editSatuan(id);
        });
    });
    
    document.querySelectorAll('#satuan-table-body .btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            console.log('Hapus satuan dengan ID:', id);
            deleteSatuanConfirmation(id);
        });
    });
}

// Load aktivitas terbaru
async function loadAktivitasTerbaru() {
    console.log('Memuat aktivitas terbaru...');
    
    try {
        // Get recent transactions
        const barangMasuk = await window.supabaseFunctions.getBarangMasuk({});
        const barangKeluar = await window.supabaseFunctions.getBarangKeluar({});
        
        // Combine and sort by date (newest first)
        const aktivitas = [
            ...barangMasuk.map(item => ({ ...item, type: 'in' })),
            ...barangKeluar.map(item => ({ ...item, type: 'out' }))
        ].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 10); // Get top 10
        
        // Render aktivitas
        renderAktivitas(aktivitas);
        
    } catch (error) {
        console.error('Error loading aktivitas:', error);
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            activityList.innerHTML = '<div class="loading">Gagal memuat aktivitas</div>';
        }
    }
}

// Render aktivitas
function renderAktivitas(aktivitas) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    if (aktivitas.length === 0) {
        activityList.innerHTML = '<div class="loading">Belum ada aktivitas</div>';
        return;
    }
    
    aktivitas.forEach(item => {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'activity-item';
        
        const iconClass = item.type === 'in' ? 'activity-in' : 'activity-out';
        const icon = item.type === 'in' ? 'fa-arrow-down' : 'fa-arrow-up';
        const text = item.type === 'in' ? 
            `Barang masuk: ${item.barang?.nama_barang || 'Barang'} (${parseFloat(item.jumlah_dus || 0).toFixed(2)} Dus)` :
            `Barang keluar: ${item.barang?.nama_barang || 'Barang'} (${item.jumlah || 0} ${item.satuan_keluar || 'Unit'})`;
        
        activityDiv.innerHTML = `
            <div class="activity-icon ${iconClass}">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <p><strong>${text}</strong></p>
                <small>${formatDate(item.tanggal)} • ${item.type === 'in' ? (item.supplier || '-') : (item.penerima || '-')}</small>
            </div>
        `;
        
        activityList.appendChild(activityDiv);
    });
}

// Load chart data
function loadChartData(barang) {
    console.log('Memuat chart data...');
    
    try {
        // Prepare data for chart
        const limitedBarang = barang.slice(0, 10); // Limit to 10 items for better visualization
        const labels = limitedBarang.map(item => item.nama_barang || 'Barang');
        const stokData = limitedBarang.map(item => item.stok_pcs || 0);
        const minStokData = limitedBarang.map(item => item.min_stok_pcs || 0);
        
        // Get canvas context
        const chartCanvas = document.getElementById('stokChart');
        if (!chartCanvas) {
            console.warn('Chart canvas tidak ditemukan');
            return;
        }
        
        const ctx = chartCanvas.getContext('2d');
        
        // Destroy existing chart if any
        if (window.stokChartInstance) {
            window.stokChartInstance.destroy();
        }
        
        // Create new chart
        window.stokChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Stok Tersedia (Pcs)',
                        data: stokData,
                        backgroundColor: '#4A6FA5',
                        borderColor: '#3a5a8a',
                        borderWidth: 1
                    },
                    {
                        label: 'Minimal Stok (Pcs)',
                        data: minStokData,
                        backgroundColor: '#FF9800',
                        borderColor: '#e68900',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Jumlah (Pcs)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Nama Barang'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Populate kategori dropdown
async function populateKategoriDropdown(dropdownId) {
    try {
        const kategori = await window.supabaseFunctions.getKategori();
        const dropdown = document.getElementById(dropdownId);
        
        if (!dropdown) return;
        
        // Save current value if editing
        const currentValue = dropdown.value;
        
        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">Pilih Kategori</option>';
        
        // Add kategori options
        kategori.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nama_kategori;
            dropdown.appendChild(option);
        });
        
        // Restore previous value if exists
        if (currentValue) {
            dropdown.value = currentValue;
        }
        
        console.log(`Dropdown ${dropdownId} diisi dengan ${kategori.length} kategori`);
        
    } catch (error) {
        console.error('Error populating kategori dropdown:', error);
    }
}

// Populate barang dropdown
async function populateBarangDropdown(dropdownId, includeEmptyOption = true) {
    try {
        const barang = await window.supabaseFunctions.getBarang();
        const dropdown = document.getElementById(dropdownId);
        
        if (!dropdown) return;
        
        // Clear existing options
        dropdown.innerHTML = '';
        
        // Add empty option if needed
        if (includeEmptyOption) {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Pilih Barang';
            dropdown.appendChild(emptyOption);
        }
        
        // Add barang options
        barang.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.kode_barang || 'TANPA KODE'} - ${item.nama_barang || 'Tanpa nama'}`;
            option.setAttribute('data-stok', item.stok_pcs || 0);
            dropdown.appendChild(option);
        });
        
        console.log(`Dropdown ${dropdownId} diisi dengan ${barang.length} barang`);
        
    } catch (error) {
        console.error('Error populating barang dropdown:', error);
    }
}

// Populate barang dropdown for satuan form
async function populateBarangDropdownSatuan(barang) {
    try {
        const dropdown = document.getElementById('barang-satuan');
        
        if (!dropdown) return;
        
        // Clear existing options
        dropdown.innerHTML = '<option value="">Pilih Barang</option>';
        
        // Add barang options
        barang.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.kode_barang || 'TANPA KODE'} - ${item.nama_barang || 'Tanpa nama'}`;
            dropdown.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating barang dropdown satuan:', error);
    }
}

// Populate barang filter dropdown
async function populateBarangFilter(dropdownId) {
    try {
        const barang = await window.supabaseFunctions.getBarang();
        const dropdown = document.getElementById(dropdownId);
        
        if (!dropdown) return;
        
        // Check if options already exist (except first option)
        if (dropdown.options.length > 1) return;
        
        // Add barang options
        barang.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.kode_barang || 'TANPA KODE'} - ${item.nama_barang || 'Tanpa nama'}`;
            dropdown.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating barang filter dropdown:', error);
    }
}

// Open tambah barang modal
async function openTambahBarangModal() {
    console.log('Membuka modal tambah barang');
    
    try {
        // Populate kategori dropdown
        await populateKategoriDropdown('modal-kategori-barang');
        
        // Reset form
        const form = document.getElementById('form-tambah-barang');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
        
        const stokInput = document.getElementById('modal-stok-pcs');
        const minStokInput = document.getElementById('modal-min-stok');
        const konversiInput = document.getElementById('modal-konversi-default');
        
        if (stokInput) stokInput.value = 0;
        if (minStokInput) minStokInput.value = 24;
        if (konversiInput) konversiInput.value = 24;
        
        // Update modal title and button text
        updateModalTitle('modal-tambah-barang', 'Tambah Barang Baru', 'Simpan Barang');
        
        // Show modal
        showModal('modal-tambah-barang');
        
    } catch (error) {
        console.error('Error opening tambah barang modal:', error);
        showNotification('Gagal membuka form tambah barang', 'error');
    }
}

// Open tambah barang masuk modal
async function openTambahMasukModal() {
    console.log('Membuka modal tambah barang masuk');
    
    try {
        // Populate barang dropdown
        await populateBarangDropdown('modal-barang-masuk');
        
        // Reset form
        const form = document.getElementById('form-tambah-masuk');
        if (form) {
            form.reset();
        }
        
        // Set tanggal hari ini
        const tanggalInput = document.getElementById('modal-tanggal-masuk');
        if (tanggalInput) {
            tanggalInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Reset konversi info
        const konversiInfo = document.getElementById('konversi-info-masuk');
        if (konversiInfo) {
            konversiInfo.style.display = 'none';
        }
        
        // Show modal
        showModal('modal-tambah-masuk');
        
    } catch (error) {
        console.error('Error opening tambah barang masuk modal:', error);
        showNotification('Gagal membuka form tambah barang masuk', 'error');
    }
}

// Open multi barang masuk modal
async function openMultiMasukModal() {
    console.log('Membuka modal multi barang masuk');
    
    try {
        // Reset form
        const tanggalInput = document.getElementById('multi-tanggal-masuk');
        const supplierInput = document.getElementById('multi-supplier-masuk');
        const keteranganInput = document.getElementById('multi-keterangan-masuk');
        
        if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
        if (supplierInput) supplierInput.value = '';
        if (keteranganInput) keteranganInput.value = '';
        
        // Clear table body
        const tableBody = document.getElementById('multi-masuk-body');
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        
        // Reset total
        const totalElement = document.getElementById('total-all-pcs-masuk');
        if (totalElement) {
            totalElement.innerHTML = '<strong>0</strong> Pcs';
        }
        
        // Add first item
        addMultiMasukItem();
        
        // Show modal
        showModal('modal-multi-masuk');
        
    } catch (error) {
        console.error('Error opening multi barang masuk modal:', error);
        showNotification('Gagal membuka form multi barang masuk', 'error');
    }
}

// Open tambah barang keluar modal
async function openTambahKeluarModal() {
    console.log('Membuka modal tambah barang keluar');
    
    try {
        // Populate barang dropdown
        await populateBarangDropdown('modal-barang-keluar');
        
        // Reset form
        const form = document.getElementById('form-tambah-keluar');
        if (form) {
            form.reset();
        }
        
        // Set tanggal hari ini
        const tanggalInput = document.getElementById('modal-tanggal-keluar');
        if (tanggalInput) {
            tanggalInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Reset satuan dropdown
        const satuanInput = document.getElementById('modal-satuan-keluar');
        if (satuanInput) {
            satuanInput.value = '';
        }
        
        // Reset info
        updateInfoKeluar();
        
        // Show modal
        showModal('modal-tambah-keluar');
        
    } catch (error) {
        console.error('Error opening tambah barang keluar modal:', error);
        showNotification('Gagal membuka form tambah barang keluar', 'error');
    }
}

// Open multi barang keluar modal
async function openMultiKeluarModal() {
    console.log('Membuka modal multi barang keluar');
    
    try {
        // Reset form
        const tanggalInput = document.getElementById('multi-tanggal-keluar');
        const penerimaInput = document.getElementById('multi-penerima-keluar');
        const keteranganInput = document.getElementById('multi-keterangan-keluar');
        
        if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
        if (penerimaInput) penerimaInput.value = '';
        if (keteranganInput) keteranganInput.value = '';
        
        // Clear table body
        const tableBody = document.getElementById('multi-keluar-body');
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        
        // Reset total
        const totalElement = document.getElementById('total-all-pcs-keluar');
        if (totalElement) {
            totalElement.innerHTML = '<strong>0</strong> Pcs';
        }
        
        // Add first item
        addMultiKeluarItem();
        
        // Show modal
        showModal('modal-multi-keluar');
        
    } catch (error) {
        console.error('Error opening multi barang keluar modal:', error);
        showNotification('Gagal membuka form multi barang keluar', 'error');
    }
}

// Update konversi untuk barang masuk
async function updateKonversiMasuk() {
    const barangId = document.getElementById('modal-barang-masuk')?.value;
    const jumlahDus = parseFloat(document.getElementById('modal-jumlah-masuk')?.value) || 0;
    
    if (!barangId || jumlahDus <= 0) {
        const konversiInfo = document.getElementById('konversi-info-masuk');
        if (konversiInfo) {
            konversiInfo.style.display = 'none';
        }
        return;
    }
    
    try {
        // Get konversi data
        const konversiData = await window.supabaseFunctions.getKonversiBarang(barangId);
        
        if (konversiData && konversiData.length > 0) {
            const konversi = konversiData[0]; // Ambil konversi pertama
            const totalPcs = jumlahDus * konversi.jumlah_per_dus;
            
            // Update display
            const konversiText = document.getElementById('konversi-text-masuk');
            const totalPcsElement = document.getElementById('total-pcs-masuk');
            const konversiInfo = document.getElementById('konversi-info-masuk');
            
            if (konversiText) konversiText.textContent = `1 Dus = ${konversi.jumlah_per_dus} ${konversi.satuan_unit}`;
            if (totalPcsElement) totalPcsElement.textContent = Math.round(totalPcs);
            if (konversiInfo) konversiInfo.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error updating konversi masuk:', error);
    }
}

// Update info untuk barang keluar
async function updateInfoKeluar() {
    const barangId = document.getElementById('modal-barang-keluar')?.value;
    
    if (!barangId) {
        const stokInfoPcs = document.getElementById('stok-tersedia-pcs');
        const stokInfoDus = document.getElementById('stok-tersedia-dus');
        const konversiInfo = document.getElementById('konversi-info-keluar');
        
        if (stokInfoPcs) stokInfoPcs.textContent = '0';
        if (stokInfoDus) stokInfoDus.textContent = '0';
        if (konversiInfo) konversiInfo.style.display = 'none';
        
        return;
    }
    
    try {
        // Get barang data
        const { data: barang, error } = await supabase
            .from('barang')
            .select('stok_pcs')
            .eq('id', barangId)
            .single();
        
        if (error) throw error;
        
        // Get konversi data
        const konversiData = await window.supabaseFunctions.getKonversiBarang(barangId);
        
        if (konversiData && konversiData.length > 0) {
            const konversi = konversiData[0];
            const stokDus = barang.stok_pcs / konversi.jumlah_per_dus;
            
            // Update display
            const stokInfoPcs = document.getElementById('stok-tersedia-pcs');
            const stokInfoDus = document.getElementById('stok-tersedia-dus');
            const konversiText = document.getElementById('konversi-text-keluar');
            const konversiInfo = document.getElementById('konversi-info-keluar');
            
            if (stokInfoPcs) stokInfoPcs.textContent = barang.stok_pcs;
            if (stokInfoDus) stokInfoDus.textContent = stokDus.toFixed(2);
            if (konversiText) konversiText.textContent = `1 Dus = ${konversi.jumlah_per_dus} ${konversi.satuan_unit}`;
            if (konversiInfo) konversiInfo.style.display = 'block';
            
            // Update satuan options
            updateSatuanKeluarOptions(konversiData);
        }
        
    } catch (error) {
        console.error('Error updating info keluar:', error);
    }
}

// Update satuan options for barang keluar
function updateSatuanKeluarOptions(konversiData) {
    const satuanSelect = document.getElementById('modal-satuan-keluar');
    if (!satuanSelect) return;
    
    // Clear existing options except the first one
    while (satuanSelect.options.length > 1) {
        satuanSelect.remove(1);
    }
    
    // Add options from konversi data
    konversiData.forEach(konversi => {
        const option = document.createElement('option');
        option.value = konversi.satuan_unit;
        option.textContent = konversi.satuan_unit;
        option.setAttribute('data-jumlah-per-dus', konversi.jumlah_per_dus);
        satuanSelect.appendChild(option);
    });
    
    // Select first option if available
    if (satuanSelect.options.length > 1) {
        satuanSelect.value = satuanSelect.options[1].value;
    }
}

// Update konversi untuk barang keluar
function updateKonversiKeluar() {
    const barangId = document.getElementById('modal-barang-keluar')?.value;
    const satuan = document.getElementById('modal-satuan-keluar')?.value;
    const jumlah = parseInt(document.getElementById('modal-jumlah-keluar')?.value) || 0;
    
    if (!barangId || !satuan || jumlah <= 0) {
        const konversiInfo = document.getElementById('konversi-info-keluar');
        if (konversiInfo) {
            konversiInfo.style.display = 'none';
        }
        return;
    }
    
    try {
        // Get selected option data
        const satuanSelect = document.getElementById('modal-satuan-keluar');
        const selectedOption = satuanSelect.options[satuanSelect.selectedIndex];
        const jumlahPerDus = parseFloat(selectedOption.getAttribute('data-jumlah-per-dus')) || 1;
        
        // Calculate total Pcs
        const totalPcs = jumlah * jumlahPerDus;
        
        // Update display
        const totalPcsElement = document.getElementById('total-pcs-keluar');
        const konversiInfo = document.getElementById('konversi-info-keluar');
        
        if (totalPcsElement) totalPcsElement.textContent = Math.round(totalPcs);
        if (konversiInfo) konversiInfo.style.display = 'block';
        
    } catch (error) {
        console.error('Error updating konversi keluar:', error);
    }
}

// Add multi masuk item
async function addMultiMasukItem() {
    const tableBody = document.getElementById('multi-masuk-body');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.className = 'multi-item-row';
    row.innerHTML = `
        <td>
            <select class="multi-barang-masuk" required>
                <option value="">Pilih Barang</option>
            </select>
        </td>
        <td>
            <input type="number" class="multi-jumlah-masuk" min="0.01" step="0.01" required placeholder="Jumlah Dus">
        </td>
        <td class="multi-konversi-masuk">-</td>
        <td class="multi-total-pcs-masuk">0</td>
        <td>
            <input type="text" class="multi-keterangan-item" placeholder="Keterangan item">
        </td>
        <td>
            <button type="button" class="btn-action btn-delete hapus-item" title="Hapus Item">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Populate barang dropdown for this row
    await populateBarangDropdownForRow(row.querySelector('.multi-barang-masuk'));
    
    // Add event listeners for this row
    addMultiMasukRowListeners(row);
}

// Populate barang dropdown for a specific row
async function populateBarangDropdownForRow(dropdown) {
    try {
        const barang = await window.supabaseFunctions.getBarang();
        
        barang.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.kode_barang || 'TANPA KODE'} - ${item.nama_barang || 'Tanpa nama'}`;
            option.setAttribute('data-konversi', JSON.stringify(item.konversi || []));
            dropdown.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating dropdown for row:', error);
    }
}

// Add event listeners for multi masuk row
function addMultiMasukRowListeners(row) {
    const barangSelect = row.querySelector('.multi-barang-masuk');
    const jumlahInput = row.querySelector('.multi-jumlah-masuk');
    const deleteBtn = row.querySelector('.hapus-item');
    
    if (barangSelect) {
        barangSelect.addEventListener('change', function() {
            updateMultiMasukRow(row);
        });
    }
    
    if (jumlahInput) {
        jumlahInput.addEventListener('input', function() {
            updateMultiMasukRow(row);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            row.remove();
            calculateTotalMasuk();
        });
    }
}

// Update multi masuk row
async function updateMultiMasukRow(row) {
    const barangSelect = row.querySelector('.multi-barang-masuk');
    const jumlahInput = row.querySelector('.multi-jumlah-masuk');
    const konversiCell = row.querySelector('.multi-konversi-masuk');
    const totalPcsCell = row.querySelector('.multi-total-pcs-masuk');
    
    const barangId = barangSelect.value;
    const jumlahDus = parseFloat(jumlahInput.value) || 0;
    
    if (!barangId || jumlahDus <= 0) {
        if (konversiCell) konversiCell.textContent = '-';
        if (totalPcsCell) totalPcsCell.textContent = '0';
        return;
    }
    
    try {
        // Get konversi from option attribute
        const selectedOption = barangSelect.options[barangSelect.selectedIndex];
        const konversiData = JSON.parse(selectedOption.getAttribute('data-konversi') || '[]');
        
        if (konversiData && konversiData.length > 0) {
            const konversi = konversiData[0];
            const totalPcs = jumlahDus * konversi.jumlah_per_dus;
            
            if (konversiCell) konversiCell.textContent = `1 Dus = ${konversi.jumlah_per_dus} ${konversi.satuan_unit}`;
            if (totalPcsCell) totalPcsCell.textContent = Math.round(totalPcs);
        }
        
    } catch (error) {
        console.error('Error updating multi masuk row:', error);
    }
}

// Calculate total for multi masuk
function calculateTotalMasuk() {
    const rows = document.querySelectorAll('#multi-masuk-body .multi-item-row');
    let totalPcs = 0;
    
    rows.forEach(row => {
        const totalPcsCell = row.querySelector('.multi-total-pcs-masuk');
        const pcsValue = parseInt(totalPcsCell.textContent) || 0;
        totalPcs += pcsValue;
    });
    
    const totalElement = document.getElementById('total-all-pcs-masuk');
    if (totalElement) {
        totalElement.innerHTML = `<strong>${totalPcs}</strong> Pcs`;
    }
}

// Add multi keluar item
async function addMultiKeluarItem() {
    const tableBody = document.getElementById('multi-keluar-body');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.className = 'multi-item-row';
    row.innerHTML = `
        <td>
            <select class="multi-barang-keluar" required>
                <option value="">Pilih Barang</option>
            </select>
        </td>
        <td>
            <select class="multi-satuan-keluar" required>
                <option value="">Pilih Satuan</option>
            </select>
        </td>
        <td>
            <input type="number" class="multi-jumlah-keluar" min="1" required placeholder="Jumlah">
        </td>
        <td class="multi-konversi-keluar">-</td>
        <td class="multi-total-pcs-keluar">0</td>
        <td class="multi-stok-tersedia">-</td>
        <td>
            <input type="text" class="multi-keterangan-item" placeholder="Keterangan item">
        </td>
        <td>
            <button type="button" class="btn-action btn-delete hapus-item" title="Hapus Item">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // Populate barang dropdown for this row
    await populateBarangDropdownForRow(row.querySelector('.multi-barang-keluar'));
    
    // Add event listeners for this row
    addMultiKeluarRowListeners(row);
}

// Add event listeners for multi keluar row
function addMultiKeluarRowListeners(row) {
    const barangSelect = row.querySelector('.multi-barang-keluar');
    const satuanSelect = row.querySelector('.multi-satuan-keluar');
    const jumlahInput = row.querySelector('.multi-jumlah-keluar');
    const deleteBtn = row.querySelector('.hapus-item');
    
    if (barangSelect) {
        barangSelect.addEventListener('change', function() {
            updateMultiKeluarRow(row);
        });
    }
    
    if (satuanSelect) {
        satuanSelect.addEventListener('change', function() {
            updateMultiKeluarRow(row);
        });
    }
    
    if (jumlahInput) {
        jumlahInput.addEventListener('input', function() {
            updateMultiKeluarRow(row);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            row.remove();
            calculateTotalKeluar();
        });
    }
}

// Update multi keluar row
async function updateMultiKeluarRow(row) {
    const barangSelect = row.querySelector('.multi-barang-keluar');
    const satuanSelect = row.querySelector('.multi-satuan-keluar');
    const jumlahInput = row.querySelector('.multi-jumlah-keluar');
    const konversiCell = row.querySelector('.multi-konversi-keluar');
    const totalPcsCell = row.querySelector('.multi-total-pcs-keluar');
    const stokCell = row.querySelector('.multi-stok-tersedia');
    
    const barangId = barangSelect.value;
    const satuan = satuanSelect.value;
    const jumlah = parseInt(jumlahInput.value) || 0;
    
    if (!barangId) {
        if (konversiCell) konversiCell.textContent = '-';
        if (totalPcsCell) totalPcsCell.textContent = '0';
        if (stokCell) stokCell.textContent = '-';
        
        // Clear satuan options
        satuanSelect.innerHTML = '<option value="">Pilih Satuan</option>';
        return;
    }
    
    try {
        // Get barang data
        const { data: barang, error } = await supabase
            .from('barang')
            .select('stok_pcs')
            .eq('id', barangId)
            .single();
        
        if (error) throw error;
        
        // Get konversi from option attribute
        const selectedOption = barangSelect.options[barangSelect.selectedIndex];
        const konversiData = JSON.parse(selectedOption.getAttribute('data-konversi') || '[]');
        
        if (konversiData && konversiData.length > 0) {
            // Update satuan options
            updateSatuanSelectForRow(satuanSelect, konversiData);
            
            // Find selected konversi
            const selectedKonversi = konversiData.find(k => k.satuan_unit === satuan) || konversiData[0];
            
            if (selectedKonversi) {
                const totalPcs = jumlah * selectedKonversi.jumlah_per_dus;
                
                if (konversiCell) konversiCell.textContent = `1 Dus = ${selectedKonversi.jumlah_per_dus} ${selectedKonversi.satuan_unit}`;
                if (totalPcsCell) totalPcsCell.textContent = Math.round(totalPcs);
                if (stokCell) {
                    const stokDus = barang.stok_pcs / selectedKonversi.jumlah_per_dus;
                    stokCell.textContent = `${barang.stok_pcs} Pcs (${stokDus.toFixed(2)} Dus)`;
                    
                    // Highlight if insufficient stock
                    if (totalPcs > barang.stok_pcs) {
                        stokCell.classList.add('low-stock');
                    } else {
                        stokCell.classList.remove('low-stock');
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error updating multi keluar row:', error);
    }
}

// Update satuan select for a row
function updateSatuanSelectForRow(satuanSelect, konversiData) {
    const currentValue = satuanSelect.value;
    
    // Clear existing options except the first one
    satuanSelect.innerHTML = '<option value="">Pilih Satuan</option>';
    
    // Add options from konversi data
    konversiData.forEach(konversi => {
        const option = document.createElement('option');
        option.value = konversi.satuan_unit;
        option.textContent = konversi.satuan_unit;
        option.setAttribute('data-jumlah-per-dus', konversi.jumlah_per_dus);
        satuanSelect.appendChild(option);
    });
    
    // Restore previous value if exists
    if (currentValue && Array.from(satuanSelect.options).some(opt => opt.value === currentValue)) {
        satuanSelect.value = currentValue;
    } else if (satuanSelect.options.length > 1) {
        satuanSelect.value = satuanSelect.options[1].value;
    }
}

// Calculate total for multi keluar
function calculateTotalKeluar() {
    const rows = document.querySelectorAll('#multi-keluar-body .multi-item-row');
    let totalPcs = 0;
    
    rows.forEach(row => {
        const totalPcsCell = row.querySelector('.multi-total-pcs-keluar');
        const pcsValue = parseInt(totalPcsCell.textContent) || 0;
        totalPcs += pcsValue;
    });
    
    const totalElement = document.getElementById('total-all-pcs-keluar');
    if (totalElement) {
        totalElement.innerHTML = `<strong>${totalPcs}</strong> Pcs`;
    }
}

// Handle tambah barang form submit
async function handleTambahBarang(e) {
    e.preventDefault();
    console.log('Form tambah barang disubmit');
    
    try {
        // Get form data
        const barang = {
            kode_barang: document.getElementById('modal-kode-barang')?.value.trim() || '',
            nama_barang: document.getElementById('modal-nama-barang')?.value.trim() || '',
            kategori_id: parseInt(document.getElementById('modal-kategori-barang')?.value) || null,
            stok_pcs: parseInt(document.getElementById('modal-stok-pcs')?.value) || 0,
            min_stok_pcs: parseInt(document.getElementById('modal-min-stok')?.value) || 24,
            lokasi: document.getElementById('modal-lokasi-barang')?.value.trim() || null,
            deskripsi: document.getElementById('modal-deskripsi-barang')?.value.trim() || null,
            jumlah_per_dus: parseInt(document.getElementById('modal-konversi-default')?.value) || 24,
            satuan_unit: document.getElementById('modal-satuan-default')?.value || 'Pcs'
        };
        
        // Validate
        if (!barang.kode_barang || !barang.nama_barang) {
            showNotification('Kode dan nama barang harus diisi', 'warning');
            return;
        }
        
        if (barang.stok_pcs < 0 || barang.min_stok_pcs < 0) {
            showNotification('Stok tidak boleh negatif', 'warning');
            return;
        }
        
        if (barang.jumlah_per_dus <= 0) {
            showNotification('Jumlah per dus harus lebih dari 0', 'warning');
            return;
        }
        
        const form = e.target;
        const isEditMode = form.dataset.editId;
        
        if (isEditMode) {
            // Update existing barang
            console.log('Updating barang dengan ID:', isEditMode);
            
            // Remove konversi fields from barang object
            const { jumlah_per_dus, satuan_unit, ...barangData } = barang;
            
            const result = await window.supabaseFunctions.updateBarang(isEditMode, barangData);
            
            if (result) {
                showNotification('Barang berhasil diperbarui', 'success');
                closeAllModals();
                loadBarangData();
                loadDashboardData();
            } else {
                showNotification('Gagal memperbarui barang', 'error');
            }
        } else {
            // Add new barang
            console.log('Adding new barang:', barang.kode_barang);
            const result = await window.supabaseFunctions.addBarang(barang);
            
            if (result) {
                showNotification('Barang berhasil ditambahkan', 'success');
                closeAllModals();
                loadBarangData();
                loadDashboardData();
                loadSatuanData();
            } else {
                showNotification('Gagal menambahkan barang', 'error');
            }
        }
        
    } catch (error) {
        console.error('Error saving barang:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menyimpan barang', 'error');
    }
}

// Handle tambah barang masuk form submit
async function handleTambahMasuk(e) {
    e.preventDefault();
    console.log('Form tambah barang masuk disubmit');
    
    try {
        // Get form data
        const barangMasuk = {
            barang_id: parseInt(document.getElementById('modal-barang-masuk')?.value) || 0,
            jumlah_dus: parseFloat(document.getElementById('modal-jumlah-masuk')?.value) || 0,
            tanggal: document.getElementById('modal-tanggal-masuk')?.value || '',
            supplier: document.getElementById('modal-supplier-masuk')?.value.trim() || null,
            keterangan: document.getElementById('modal-keterangan-masuk')?.value.trim() || null
        };
        
        // Validate
        if (!barangMasuk.barang_id || !barangMasuk.tanggal) {
            showNotification('Barang dan tanggal harus diisi', 'warning');
            return;
        }
        
        if (barangMasuk.jumlah_dus <= 0) {
            showNotification('Jumlah harus lebih dari 0', 'warning');
            return;
        }
        
        // Get konversi data
        const konversiData = await window.supabaseFunctions.getKonversiBarang(barangMasuk.barang_id);
        
        if (!konversiData || konversiData.length === 0) {
            showNotification('Konversi satuan untuk barang ini belum ditentukan', 'warning');
            return;
        }
        
        const konversi = konversiData[0]; // Use first conversion
        barangMasuk.total_pcs = Math.round(barangMasuk.jumlah_dus * konversi.jumlah_per_dus);
        
        console.log('Adding barang masuk:', barangMasuk);
        const result = await window.supabaseFunctions.addBarangMasuk(barangMasuk);
        
        if (result) {
            showNotification('Barang masuk berhasil ditambahkan', 'success');
            closeAllModals();
            loadBarangMasukData();
            loadDashboardData();
        } else {
            showNotification('Gagal menambahkan barang masuk', 'error');
        }
        
    } catch (error) {
        console.error('Error adding barang masuk:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menambahkan barang masuk', 'error');
    }
}

// Handle multi barang masuk
async function handleMultiMasuk() {
    console.log('Multi barang masuk disubmit');
    
    try {
        // Get general data
        const tanggal = document.getElementById('multi-tanggal-masuk')?.value;
        const supplier = document.getElementById('multi-supplier-masuk')?.value.trim() || null;
        const keteranganUmum = document.getElementById('multi-keterangan-masuk')?.value.trim() || null;
        
        if (!tanggal) {
            showNotification('Tanggal harus diisi', 'warning');
            return;
        }
        
        // Get all items
        const rows = document.querySelectorAll('#multi-masuk-body .multi-item-row');
        if (rows.length === 0) {
            showNotification('Tidak ada item yang ditambahkan', 'warning');
            return;
        }
        
        const items = [];
        let valid = true;
        
        for (const row of rows) {
            const barangSelect = row.querySelector('.multi-barang-masuk');
            const jumlahInput = row.querySelector('.multi-jumlah-masuk');
            const keteranganInput = row.querySelector('.multi-keterangan-item');
            
            const barangId = parseInt(barangSelect.value);
            const jumlahDus = parseFloat(jumlahInput.value);
            const keterangan = keteranganInput.value.trim() || keteranganUmum;
            
            // Validate
            if (!barangId || !jumlahDus || jumlahDus <= 0) {
                showNotification('Semua item harus memiliki barang dan jumlah yang valid', 'warning');
                valid = false;
                break;
            }
            
            // Get konversi data
            const konversiData = await window.supabaseFunctions.getKonversiBarang(barangId);
            
            if (!konversiData || konversiData.length === 0) {
                showNotification(`Konversi satuan untuk barang ${barangSelect.selectedOptions[0]?.text} belum ditentukan`, 'warning');
                valid = false;
                break;
            }
            
            const konversi = konversiData[0];
            const totalPcs = Math.round(jumlahDus * konversi.jumlah_per_dus);
            
            items.push({
                barang_id: barangId,
                jumlah_dus: jumlahDus,
                total_pcs: totalPcs,
                tanggal: tanggal,
                supplier: supplier,
                keterangan: keterangan
            });
        }
        
        if (!valid) return;
        
        console.log('Adding multiple barang masuk:', items);
        const result = await window.supabaseFunctions.addMultipleBarangMasuk(items, tanggal, supplier, keteranganUmum);
        
        if (result) {
            showNotification(`${items.length} item barang masuk berhasil ditambahkan`, 'success');
            closeAllModals();
            loadBarangMasukData();
            loadDashboardData();
        } else {
            showNotification('Gagal menambahkan barang masuk', 'error');
        }
        
    } catch (error) {
        console.error('Error adding multi barang masuk:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menambahkan barang masuk', 'error');
    }
}

// Handle tambah barang keluar form submit
async function handleTambahKeluar(e) {
    e.preventDefault();
    console.log('Form tambah barang keluar disubmit');
    
    try {
        // Get form data
        const barangKeluar = {
            barang_id: parseInt(document.getElementById('modal-barang-keluar')?.value) || 0,
            satuan_keluar: document.getElementById('modal-satuan-keluar')?.value || '',
            jumlah: parseInt(document.getElementById('modal-jumlah-keluar')?.value) || 0,
            tanggal: document.getElementById('modal-tanggal-keluar')?.value || '',
            penerima: document.getElementById('modal-penerima-keluar')?.value.trim() || null,
            keterangan: document.getElementById('modal-keterangan-keluar')?.value.trim() || null
        };
        
        // Validate
        if (!barangKeluar.barang_id || !barangKeluar.satuan_keluar || !barangKeluar.tanggal) {
            showNotification('Barang, satuan, dan tanggal harus diisi', 'warning');
            return;
        }
        
        if (barangKeluar.jumlah <= 0) {
            showNotification('Jumlah harus lebih dari 0', 'warning');
            return;
        }
        
        // Get konversi data
        const konversiData = await window.supabaseFunctions.getKonversiBarang(barangKeluar.barang_id);
        
        if (!konversiData || konversiData.length === 0) {
            showNotification('Konversi satuan untuk barang ini belum ditentukan', 'warning');
            return;
        }
        
        // Find the correct conversion
        const konversi = konversiData.find(k => k.satuan_unit === barangKeluar.satuan_keluar);
        if (!konversi) {
            showNotification(`Konversi untuk satuan ${barangKeluar.satuan_keluar} tidak ditemukan`, 'warning');
            return;
        }
        
        barangKeluar.total_pcs = Math.round(barangKeluar.jumlah * konversi.jumlah_per_dus);
        
        // Check stock availability
        const { data: barang, error } = await supabase
            .from('barang')
            .select('stok_pcs')
            .eq('id', barangKeluar.barang_id)
            .single();
        
        if (error) throw error;
        
        if (barang.stok_pcs < barangKeluar.total_pcs) {
            showNotification(`Stok tidak mencukupi. Stok tersedia: ${barang.stok_pcs} Pcs`, 'warning');
            return;
        }
        
        console.log('Adding barang keluar:', barangKeluar);
        const result = await window.supabaseFunctions.addBarangKeluar(barangKeluar);
        
        if (result) {
            showNotification('Barang keluar berhasil ditambahkan', 'success');
            closeAllModals();
            loadBarangKeluarData();
            loadDashboardData();
        } else {
            showNotification('Gagal menambahkan barang keluar', 'error');
        }
        
    } catch (error) {
        console.error('Error adding barang keluar:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menambahkan barang keluar', 'error');
    }
}

// Handle multi barang keluar
async function handleMultiKeluar() {
    console.log('Multi barang keluar disubmit');
    
    try {
        // Get general data
        const tanggal = document.getElementById('multi-tanggal-keluar')?.value;
        const penerima = document.getElementById('multi-penerima-keluar')?.value.trim() || null;
        const keteranganUmum = document.getElementById('multi-keterangan-keluar')?.value.trim() || null;
        
        if (!tanggal) {
            showNotification('Tanggal harus diisi', 'warning');
            return;
        }
        
        // Get all items
        const rows = document.querySelectorAll('#multi-keluar-body .multi-item-row');
        if (rows.length === 0) {
            showNotification('Tidak ada item yang ditambahkan', 'warning');
            return;
        }
        
        const items = [];
        let valid = true;
        
        for (const row of rows) {
            const barangSelect = row.querySelector('.multi-barang-keluar');
            const satuanSelect = row.querySelector('.multi-satuan-keluar');
            const jumlahInput = row.querySelector('.multi-jumlah-keluar');
            const keteranganInput = row.querySelector('.multi-keterangan-item');
            
            const barangId = parseInt(barangSelect.value);
            const satuan = satuanSelect.value;
            const jumlah = parseInt(jumlahInput.value);
            const keterangan = keteranganInput.value.trim() || keteranganUmum;
            
            // Validate
            if (!barangId || !satuan || !jumlah || jumlah <= 0) {
                showNotification('Semua item harus memiliki barang, satuan, dan jumlah yang valid', 'warning');
                valid = false;
                break;
            }
            
            // Get konversi data
            const konversiData = await window.supabaseFunctions.getKonversiBarang(barangId);
            
            if (!konversiData || konversiData.length === 0) {
                showNotification(`Konversi satuan untuk barang ${barangSelect.selectedOptions[0]?.text} belum ditentukan`, 'warning');
                valid = false;
                break;
            }
            
            // Find the correct conversion
            const konversi = konversiData.find(k => k.satuan_unit === satuan);
            if (!konversi) {
                showNotification(`Konversi untuk satuan ${satuan} tidak ditemukan`, 'warning');
                valid = false;
                break;
            }
            
            const totalPcs = Math.round(jumlah * konversi.jumlah_per_dus);
            
            // Check stock availability
            const { data: barang, error } = await supabase
                .from('barang')
                .select('stok_pcs')
                .eq('id', barangId)
                .single();
            
            if (error) throw error;
            
            if (barang.stok_pcs < totalPcs) {
                showNotification(`Stok tidak mencukupi untuk barang ${barangSelect.selectedOptions[0]?.text}. Stok tersedia: ${barang.stok_pcs} Pcs`, 'warning');
                valid = false;
                break;
            }
            
            items.push({
                barang_id: barangId,
                satuan_keluar: satuan,
                jumlah: jumlah,
                total_pcs: totalPcs,
                tanggal: tanggal,
                penerima: penerima,
                keterangan: keterangan
            });
        }
        
        if (!valid) return;
        
        console.log('Adding multiple barang keluar:', items);
        const result = await window.supabaseFunctions.addMultipleBarangKeluar(items, tanggal, penerima, keteranganUmum);
        
        if (result) {
            showNotification(`${items.length} item barang keluar berhasil ditambahkan`, 'success');
            closeAllModals();
            loadBarangKeluarData();
            loadDashboardData();
        } else {
            showNotification('Gagal menambahkan barang keluar', 'error');
        }
        
    } catch (error) {
        console.error('Error adding multi barang keluar:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menambahkan barang keluar', 'error');
    }
}

// Handle kategori form submit
async function handleKategoriForm(e) {
    e.preventDefault();
    console.log('Form kategori disubmit');
    
    try {
        // Get form data
        const kategori = {
            nama_kategori: document.getElementById('nama-kategori')?.value.trim() || '',
            deskripsi: document.getElementById('deskripsi-kategori')?.value.trim() || null
        };
        
        const kategoriId = document.getElementById('kategori-id')?.value;
        
        // Validate
        if (!kategori.nama_kategori) {
            showNotification('Nama kategori harus diisi', 'warning');
            return;
        }
        
        let result;
        
        if (kategoriId) {
            // Update existing kategori
            console.log('Updating kategori dengan ID:', kategoriId);
            result = await window.supabaseFunctions.updateKategori(kategoriId, kategori);
            if (result) {
                showNotification('Kategori berhasil diperbarui', 'success');
            } else {
                showNotification('Gagal memperbarui kategori', 'error');
                return;
            }
        } else {
            // Add new kategori
            console.log('Adding new kategori:', kategori.nama_kategori);
            result = await window.supabaseFunctions.addKategori(kategori);
            if (result) {
                showNotification('Kategori berhasil ditambahkan', 'success');
            } else {
                showNotification('Gagal menambahkan kategori', 'error');
                return;
            }
        }
        
        // Reset form and reload data
        resetKategoriForm();
        loadKategoriData();
        loadBarangData(); // Reload barang data to refresh kategori references
        
    } catch (error) {
        console.error('Error saving kategori:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menyimpan kategori', 'error');
    }
}

// Handle satuan form submit
async function handleSatuanForm(e) {
    e.preventDefault();
    console.log('Form satuan disubmit');
    
    try {
        // Get form data
        const satuan = {
            barang_id: parseInt(document.getElementById('barang-satuan')?.value) || 0,
            jumlah_per_dus: parseInt(document.getElementById('jumlah-satuan')?.value) || 24,
            satuan_unit: document.getElementById('satuan-unit')?.value || 'Pcs'
        };
        
        const satuanId = document.getElementById('satuan-id')?.value;
        
        // Validate
        if (!satuan.barang_id || !satuan.satuan_unit || !satuan.jumlah_per_dus) {
            showNotification('Barang, satuan unit, dan jumlah harus diisi', 'warning');
            return;
        }
        
        if (satuan.jumlah_per_dus <= 0) {
            showNotification('Jumlah per dus harus lebih dari 0', 'warning');
            return;
        }
        
        let result;
        
        if (satuanId) {
            // Update existing satuan
            console.log('Updating satuan dengan ID:', satuanId);
            result = await window.supabaseFunctions.updateSatuanKonversi(satuanId, satuan);
            if (result) {
                showNotification('Konversi satuan berhasil diperbarui', 'success');
            } else {
                showNotification('Gagal memperbarui konversi satuan', 'error');
                return;
            }
        } else {
            // Add new satuan
            console.log('Adding new satuan:', satuan);
            result = await window.supabaseFunctions.addSatuanKonversi(satuan);
            if (result) {
                showNotification('Konversi satuan berhasil ditambahkan', 'success');
            } else {
                showNotification('Gagal menambahkan konversi satuan', 'error');
                return;
            }
        }
        
        // Reset form and reload data
        resetSatuanForm();
        loadSatuanData();
        
    } catch (error) {
        console.error('Error saving satuan:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menyimpan konversi satuan', 'error');
    }
}

// Edit barang
async function editBarang(id) {
    try {
        // Get barang data
        const { data: barang, error } = await supabase
            .from('barang')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Populate kategori dropdown
        await populateKategoriDropdown('modal-kategori-barang');
        
        // Fill form with barang data
        document.getElementById('modal-kode-barang').value = barang.kode_barang || '';
        document.getElementById('modal-nama-barang').value = barang.nama_barang || '';
        document.getElementById('modal-kategori-barang').value = barang.kategori_id || '';
        document.getElementById('modal-stok-pcs').value = barang.stok_pcs || 0;
        document.getElementById('modal-min-stok').value = barang.min_stok_pcs || 24;
        document.getElementById('modal-lokasi-barang').value = barang.lokasi || '';
        document.getElementById('modal-deskripsi-barang').value = barang.deskripsi || '';
        
        // Get konversi data
        const konversiData = await window.supabaseFunctions.getKonversiBarang(id);
        if (konversiData && konversiData.length > 0) {
            const konversi = konversiData[0];
            document.getElementById('modal-konversi-default').value = konversi.jumlah_per_dus || 24;
            document.getElementById('modal-satuan-default').value = konversi.satuan_unit || 'Pcs';
        }
        
        // Update form to edit mode
        const form = document.getElementById('form-tambah-barang');
        form.dataset.editId = id;
        
        // Update modal title and button text
        updateModalTitle('modal-tambah-barang', 'Edit Barang', 'Update Barang');
        
        // Show modal
        showModal('modal-tambah-barang');
        
    } catch (error) {
        console.error('Error loading barang for edit:', error);
        showNotification('Gagal memuat data barang untuk diedit', 'error');
    }
}

// Edit kategori
async function editKategori(id) {
    try {
        // Get kategori data
        const { data: kategori, error } = await supabase
            .from('kategori')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Fill form with kategori data
        document.getElementById('kategori-id').value = kategori.id;
        document.getElementById('nama-kategori').value = kategori.nama_kategori || '';
        document.getElementById('deskripsi-kategori').value = kategori.deskripsi || '';
        
        // Scroll to form
        const kategoriForm = document.querySelector('.kategori-form');
        if (kategoriForm) {
            kategoriForm.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        console.error('Error loading kategori for edit:', error);
        showNotification('Gagal memuat data kategori untuk diedit', 'error');
    }
}

// Edit satuan
async function editSatuan(id) {
    try {
        // Get satuan data
        const { data: satuan, error } = await supabase
            .from('satuan_konversi')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Fill form with satuan data
        document.getElementById('satuan-id').value = satuan.id;
        document.getElementById('barang-satuan').value = satuan.barang_id;
        document.getElementById('jumlah-satuan').value = satuan.jumlah_per_dus || 24;
        document.getElementById('satuan-unit').value = satuan.satuan_unit || 'Pcs';
        
        // Scroll to form
        const satuanForm = document.querySelector('.satuan-form');
        if (satuanForm) {
            satuanForm.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        console.error('Error loading satuan for edit:', error);
        showNotification('Gagal memuat data konversi satuan untuk diedit', 'error');
    }
}

// Delete barang confirmation
function deleteBarangConfirmation(id) {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini? Tindakan ini tidak dapat dibatalkan.')) {
        deleteBarang(id);
    }
}

// Delete barang
async function deleteBarang(id) {
    try {
        const success = await window.supabaseFunctions.deleteBarang(id);
        
        if (success) {
            showNotification('Barang berhasil dihapus', 'success');
            loadBarangData();
            loadDashboardData();
            loadSatuanData();
        } else {
            showNotification('Gagal menghapus barang', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting barang:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menghapus barang', 'error');
    }
}

// Delete barang masuk confirmation
function deleteBarangMasukConfirmation(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data barang masuk ini?')) {
        deleteBarangMasuk(id);
    }
}

// Delete barang masuk
async function deleteBarangMasuk(id) {
    try {
        // First get the data to know how much to deduct from stock
        const { data: transaksi, error: getError } = await supabase
            .from('barang_masuk')
            .select('barang_id, total_pcs')
            .eq('id', id)
            .single();
        
        if (getError) throw getError;
        
        // Delete the transaction
        const { error: deleteError } = await supabase
            .from('barang_masuk')
            .delete()
            .eq('id', id);
        
        if (deleteError) throw deleteError;
        
        // Update stock (deduct)
        await window.supabaseFunctions.updateStokBarang(transaksi.barang_id, transaksi.total_pcs, 'out');
        
        showNotification('Data barang masuk berhasil dihapus', 'success');
        loadBarangMasukData();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting barang masuk:', error);
        showNotification(error.message || 'Gagal menghapus data barang masuk', 'error');
    }
}

// Delete barang keluar confirmation
function deleteBarangKeluarConfirmation(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data barang keluar ini?')) {
        deleteBarangKeluar(id);
    }
}

// Delete barang keluar
async function deleteBarangKeluar(id) {
    try {
        // First get the data to know how much to add back to stock
        const { data: transaksi, error: getError } = await supabase
            .from('barang_keluar')
            .select('barang_id, total_pcs')
            .eq('id', id)
            .single();
        
        if (getError) throw getError;
        
        // Delete the transaction
        const { error: deleteError } = await supabase
            .from('barang_keluar')
            .delete()
            .eq('id', id);
        
        if (deleteError) throw deleteError;
        
        // Update stock (add back)
        await window.supabaseFunctions.updateStokBarang(transaksi.barang_id, transaksi.total_pcs, 'in');
        
        showNotification('Data barang keluar berhasil dihapus', 'success');
        loadBarangKeluarData();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting barang keluar:', error);
        showNotification(error.message || 'Gagal menghapus data barang keluar', 'error');
    }
}

// Delete kategori confirmation
function deleteKategoriConfirmation(id) {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
        deleteKategori(id);
    }
}

// Delete kategori
async function deleteKategori(id) {
    try {
        await window.supabaseFunctions.deleteKategori(id);
        
        showNotification('Kategori berhasil dihapus', 'success');
        loadKategoriData();
        
    } catch (error) {
        console.error('Error deleting kategori:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menghapus kategori', 'error');
    }
}

// Delete satuan confirmation
function deleteSatuanConfirmation(id) {
    if (confirm('Apakah Anda yakin ingin menghapus konversi satuan ini?')) {
        deleteSatuan(id);
    }
}

// Delete satuan
async function deleteSatuan(id) {
    try {
        await window.supabaseFunctions.deleteSatuanKonversi(id);
        
        showNotification('Konversi satuan berhasil dihapus', 'success');
        loadSatuanData();
        
    } catch (error) {
        console.error('Error deleting satuan:', error);
        showNotification(error.message || 'Terjadi kesalahan saat menghapus konversi satuan', 'error');
    }
}

// Reset kategori form
function resetKategoriForm() {
    const form = document.getElementById('kategori-form');
    if (form) {
        form.reset();
    }
    
    const kategoriIdInput = document.getElementById('kategori-id');
    if (kategoriIdInput) {
        kategoriIdInput.value = '';
    }
}

// Reset satuan form
function resetSatuanForm() {
    const form = document.getElementById('satuan-form');
    if (form) {
        form.reset();
    }
    
    const satuanIdInput = document.getElementById('satuan-id');
    if (satuanIdInput) {
        satuanIdInput.value = '';
    }
}

// Filter barang table
function filterBarangTable(searchTerm) {
    const rows = document.querySelectorAll('#barang-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Export laporan to PDF
function exportLaporanPDF() {
    console.log('Exporting to PDF...');
    
    // Simple implementation using window.print()
    // For production, consider using a library like jsPDF
    window.print();
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]: ${message}`);
    
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add close button event
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Add CSS for notification if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
            }
            .notification-success { background-color: #4CAF50; }
            .notification-error { background-color: #f44336; }
            .notification-warning { background-color: #FF9800; }
            .notification-info { background-color: #2196F3; }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 15px;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Format date to Indonesian format
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return dateString;
    }
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

// Update modal title
function updateModalTitle(modalId, title, buttonText) {
    const modalTitle = document.querySelector(`#${modalId} .modal-header h3`);
    const submitButton = document.querySelector(`#${modalId} .modal-footer button[type="submit"]`);
    
    if (modalTitle) modalTitle.innerHTML = `<i class="fas ${modalId.includes('barang') ? 'fa-box' : 'fa-edit'}"></i> ${title}`;
    if (submitButton) submitButton.textContent = buttonText;
}

// Close all modals
function closeAllModals() {
    console.log('Menutup semua modal');
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Reset form states
    const barangForm = document.getElementById('form-tambah-barang');
    if (barangForm) {
        delete barangForm.dataset.editId;
    }
    
    updateModalTitle('modal-tambah-barang', 'Tambah Barang Baru', 'Simpan Barang');
}
