// Aplikasi Inventori - Main JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Aplikasi Inventori dimuat');
    
    // Inisialisasi
    await initializeApp();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data awal
    loadDashboardData();
});

// Inisialisasi aplikasi
async function initializeApp() {
    // Cek koneksi Supabase
    const isInitialized = await window.supabaseFunctions.initializeDatabase();
    
    if (!isInitialized) {
        console.error('Gagal menginisialisasi database');
        return;
    }
    
    // Set tanggal default untuk form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modal-tanggal-masuk').value = today;
    document.getElementById('modal-tanggal-keluar').value = today;
    
    // Set tanggal untuk filter laporan (bulan ini)
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0];
    document.getElementById('report-start-date').value = firstDay;
    document.getElementById('report-end-date').value = lastDay;
    
    console.log('Aplikasi siap digunakan');
}

// Setup semua event listener
function setupEventListeners() {
    // Navigation tabs
    const navItems = document.querySelectorAll('.sidebar li');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadDashboardData();
        showNotification('Data diperbarui', 'success');
    });
    
    // Tambah barang button
    document.getElementById('tambah-barang-btn').addEventListener('click', function() {
        openTambahBarangModal();
    });
    
    // Tambah barang masuk button
    document.getElementById('tambah-masuk-btn').addEventListener('click', function() {
        openTambahMasukModal();
    });
    
    // Tambah barang keluar button
    document.getElementById('tambah-keluar-btn').addEventListener('click', function() {
        openTambahKeluarModal();
    });
    
    // Tambah kategori button
    document.getElementById('tambah-kategori-btn').addEventListener('click', function() {
        resetKategoriForm();
    });
    
    // Filter laporan button
    document.getElementById('filter-laporan-btn').addEventListener('click', function() {
        loadLaporanData();
    });
    
    // Export laporan button
    document.getElementById('export-laporan-btn').addEventListener('click', function() {
        exportLaporanPDF();
    });
    
    // Reset kategori button
    document.getElementById('reset-kategori-btn').addEventListener('click', function() {
        resetKategoriForm();
    });
    
    // Search barang
    document.getElementById('search-barang').addEventListener('input', function() {
        filterBarangTable(this.value);
    });
    
    // Filter barang masuk
    document.getElementById('filter-tanggal-masuk').addEventListener('change', function() {
        loadBarangMasukData();
    });
    
    document.getElementById('filter-barang-masuk').addEventListener('change', function() {
        loadBarangMasukData();
    });
    
    // Filter barang keluar
    document.getElementById('filter-tanggal-keluar').addEventListener('change', function() {
        loadBarangKeluarData();
    });
    
    document.getElementById('filter-barang-keluar').addEventListener('change', function() {
        loadBarangKeluarData();
    });
    
    // Form submit handlers
    document.getElementById('form-tambah-barang').addEventListener('submit', handleTambahBarang);
    document.getElementById('form-tambah-masuk').addEventListener('submit', handleTambahMasuk);
    document.getElementById('form-tambah-keluar').addEventListener('submit', handleTambahKeluar);
    document.getElementById('kategori-form').addEventListener('submit', handleKategoriForm);
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Barang keluar - update stok info
    document.getElementById('modal-barang-keluar').addEventListener('change', function() {
        updateStokInfoKeluar();
    });
}

// Fungsi untuk berpindah tab
function switchTab(tabId) {
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
                    loadDashboardData();
                    break;
                case 'barang':
                    loadBarangData();
                    break;
                case 'barang-masuk':
                    loadBarangMasukData();
                    break;
                case 'barang-keluar':
                    loadBarangKeluarData();
                    break;
                case 'laporan':
                    loadLaporanData();
                    break;
                case 'kategori':
                    loadKategoriData();
                    break;
            }
        }
    });
}

// Load data dashboard
async function loadDashboardData() {
    try {
        // Load data barang untuk statistik
        const barang = await window.supabaseFunctions.getBarang();
        const barangMasuk = await window.supabaseFunctions.getBarangMasuk();
        const barangKeluar = await window.supabaseFunctions.getBarangKeluar();
        
        // Update statistik
        document.getElementById('total-barang').textContent = barang.length;
        
        const totalMasuk = barangMasuk.reduce((sum, item) => sum + item.jumlah, 0);
        const totalKeluar = barangKeluar.reduce((sum, item) => sum + item.jumlah, 0);
        
        document.getElementById('total-masuk').textContent = totalMasuk;
        document.getElementById('total-keluar').textContent = totalKeluar;
        
        // Hitung barang dengan stok rendah
        const stokRendah = barang.filter(item => item.stok <= item.min_stok).length;
        document.getElementById('total-rendah').textContent = stokRendah;
        
        // Load aktivitas terbaru
        loadAktivitasTerbaru();
        
        // Load chart data
        loadChartData(barang);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Gagal memuat data dashboard', 'error');
    }
}

// Load data barang
async function loadBarangData() {
    try {
        const barang = await window.supabaseFunctions.getBarang();
        const kategori = await window.supabaseFunctions.getKategori();
        
        // Create kategori map for lookup
        const kategoriMap = {};
        kategori.forEach(k => {
            kategoriMap[k.id] = k.nama_kategori;
        });
        
        // Render table
        const tbody = document.getElementById('barang-table-body');
        tbody.innerHTML = '';
        
        if (barang.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">Tidak ada data barang</td></tr>';
            return;
        }
        
        barang.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.kode_barang}</td>
                <td>${item.nama_barang}</td>
                <td>${kategoriMap[item.kategori_id] || '-'}</td>
                <td><span class="${item.stok <= item.min_stok ? 'low-stock' : ''}">${item.stok}</span></td>
                <td>${item.satuan}</td>
                <td>${item.min_stok}</td>
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
            
            // Add low stock class if needed
            if (item.stok <= item.min_stok) {
                row.querySelector('td:nth-child(4)').classList.add('low-stock');
            }
            
            tbody.appendChild(row);
        });
        
        // Add event listeners for action buttons
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editBarang(id);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteBarangConfirmation(id);
            });
        });
        
    } catch (error) {
        console.error('Error loading barang data:', error);
        showNotification('Gagal memuat data barang', 'error');
    }
}

// Load data barang masuk
async function loadBarangMasukData() {
    try {
        const filter = {};
        const tanggalFilter = document.getElementById('filter-tanggal-masuk').value;
        const barangFilter = document.getElementById('filter-barang-masuk').value;
        
        if (tanggalFilter) filter.tanggal = tanggalFilter;
        if (barangFilter) filter.barang_id = parseInt(barangFilter);
        
        const barangMasuk = await window.supabaseFunctions.getBarangMasuk(filter);
        
        // Populate barang filter dropdown
        await populateBarangFilter('filter-barang-masuk');
        
        // Render table
        const tbody = document.getElementById('masuk-table-body');
        tbody.innerHTML = '';
        
        if (barangMasuk.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Tidak ada data barang masuk</td></tr>';
            return;
        }
        
        barangMasuk.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(item.tanggal)}</td>
                <td>${item.barang?.kode_barang || '-'}</td>
                <td>${item.barang?.nama_barang || '-'}</td>
                <td>${item.jumlah}</td>
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
        document.querySelectorAll('#masuk-table-body .btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteBarangMasukConfirmation(id);
            });
        });
        
    } catch (error) {
        console.error('Error loading barang masuk data:', error);
        showNotification('Gagal memuat data barang masuk', 'error');
    }
}

// Load data barang keluar
async function loadBarangKeluarData() {
    try {
        const filter = {};
        const tanggalFilter = document.getElementById('filter-tanggal-keluar').value;
        const barangFilter = document.getElementById('filter-barang-keluar').value;
        
        if (tanggalFilter) filter.tanggal = tanggalFilter;
        if (barangFilter) filter.barang_id = parseInt(barangFilter);
        
        const barangKeluar = await window.supabaseFunctions.getBarangKeluar(filter);
        
        // Populate barang filter dropdown
        await populateBarangFilter('filter-barang-keluar');
        
        // Render table
        const tbody = document.getElementById('keluar-table-body');
        tbody.innerHTML = '';
        
        if (barangKeluar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Tidak ada data barang keluar</td></tr>';
            return;
        }
        
        barangKeluar.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(item.tanggal)}</td>
                <td>${item.barang?.kode_barang || '-'}</td>
                <td>${item.barang?.nama_barang || '-'}</td>
                <td>${item.jumlah}</td>
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
        document.querySelectorAll('#keluar-table-body .btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteBarangKeluarConfirmation(id);
            });
        });
        
    } catch (error) {
        console.error('Error loading barang keluar data:', error);
        showNotification('Gagal memuat data barang keluar', 'error');
    }
}

// Load data laporan
async function loadLaporanData() {
    try {
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        const reportType = document.getElementById('report-type').value;
        
        if (!startDate || !endDate) {
            showNotification('Harap pilih periode laporan', 'warning');
            return;
        }
        
        const laporan = await window.supabaseFunctions.getLaporan(startDate, endDate, reportType);
        
        // Render table
        const tbody = document.getElementById('report-table-body');
        tbody.innerHTML = '';
        
        if (laporan.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Tidak ada data laporan untuk periode ini</td></tr>';
            
            // Reset summary
            document.getElementById('summary-masuk').textContent = '0';
            document.getElementById('summary-keluar').textContent = '0';
            document.getElementById('summary-period').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
            return;
        }
        
        // Calculate summary
        let totalMasuk = 0;
        let totalKeluar = 0;
        
        laporan.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(item.tanggal)}</td>
                <td><span class="badge ${item.jenis === 'MASUK' ? 'badge-in' : 'badge-out'}">${item.jenis}</span></td>
                <td>${item.barang?.kode_barang || '-'}</td>
                <td>${item.barang?.nama_barang || '-'}</td>
                <td>${item.jumlah}</td>
                <td>${item.keterangan || '-'}</td>
            `;
            tbody.appendChild(row);
            
            // Update totals
            if (item.jenis === 'MASUK') {
                totalMasuk += item.jumlah;
            } else if (item.jenis === 'KELUAR') {
                totalKeluar += item.jumlah;
            }
        });
        
        // Update summary
        document.getElementById('summary-masuk').textContent = totalMasuk;
        document.getElementById('summary-keluar').textContent = totalKeluar;
        document.getElementById('summary-period').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        
    } catch (error) {
        console.error('Error loading laporan data:', error);
        showNotification('Gagal memuat data laporan', 'error');
    }
}

// Load data kategori
async function loadKategoriData() {
    try {
        const kategori = await window.supabaseFunctions.getKategori();
        
        // Render kategori list
        const kategoriList = document.getElementById('kategori-list');
        kategoriList.innerHTML = '';
        
        if (kategori.length === 0) {
            kategoriList.innerHTML = '<li class="loading">Belum ada kategori. Tambahkan kategori baru.</li>';
            return;
        }
        
        kategori.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <strong>${item.nama_kategori}</strong>
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
                    editKategori(item.id);
                }
            });
            
            kategoriList.appendChild(li);
        });
        
        // Add event listeners for action buttons
        document.querySelectorAll('#kategori-list .btn-edit').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                editKategori(id);
            });
        });
        
        document.querySelectorAll('#kategori-list .btn-delete').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                deleteKategoriConfirmation(id);
            });
        });
        
        // Populate kategori dropdowns
        await populateKategoriDropdown('modal-kategori-barang');
        
    } catch (error) {
        console.error('Error loading kategori data:', error);
        showNotification('Gagal memuat data kategori', 'error');
    }
}

// Load aktivitas terbaru
async function loadAktivitasTerbaru() {
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
        const activityList = document.getElementById('activity-list');
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
                `Barang masuk: ${item.barang?.nama_barang || 'Barang'} (${item.jumlah})` :
                `Barang keluar: ${item.barang?.nama_barang || 'Barang'} (${item.jumlah})`;
            
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
        
    } catch (error) {
        console.error('Error loading aktivitas:', error);
        document.getElementById('activity-list').innerHTML = '<div class="loading">Gagal memuat aktivitas</div>';
    }
}

// Load chart data
function loadChartData(barang) {
    // Prepare data for chart
    const labels = barang.slice(0, 10).map(item => item.nama_barang);
    const stokData = barang.slice(0, 10).map(item => item.stok);
    const minStokData = barang.slice(0, 10).map(item => item.min_stok);
    
    // Get canvas context
    const ctx = document.getElementById('stokChart').getContext('2d');
    
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
                    label: 'Stok Tersedia',
                    data: stokData,
                    backgroundColor: '#4A6FA5',
                    borderColor: '#3a5a8a',
                    borderWidth: 1
                },
                {
                    label: 'Minimal Stok',
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
                        text: 'Jumlah'
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
}

// Populate kategori dropdown
async function populateKategoriDropdown(dropdownId) {
    try {
        const kategori = await window.supabaseFunctions.getKategori();
        const dropdown = document.getElementById(dropdownId);
        
        // Clear existing options except the first one
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }
        
        // Add kategori options
        kategori.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nama_kategori;
            dropdown.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating kategori dropdown:', error);
    }
}

// Populate barang dropdown
async function populateBarangDropdown(dropdownId, includeEmptyOption = true) {
    try {
        const barang = await window.supabaseFunctions.getBarang();
        const dropdown = document.getElementById(dropdownId);
        
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
            option.textContent = `${item.kode_barang} - ${item.nama_barang} (Stok: ${item.stok})`;
            dropdown.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating barang dropdown:', error);
    }
}

// Populate barang filter dropdown
async function populateBarangFilter(dropdownId) {
    try {
        const barang = await window.supabaseFunctions.getBarang();
        const dropdown = document.getElementById(dropdownId);
        
        // Check if options already exist
        if (dropdown.options.length > 1) return;
        
        // Add barang options
        barang.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.kode_barang} - ${item.nama_barang}`;
            dropdown.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating barang filter dropdown:', error);
    }
}

// Open tambah barang modal
async function openTambahBarangModal() {
    // Populate kategori dropdown
    await populateKategoriDropdown('modal-kategori-barang');
    
    // Reset form
    document.getElementById('form-tambah-barang').reset();
    document.getElementById('modal-stok-barang').value = 0;
    document.getElementById('modal-min-stok').value = 5;
    
    // Show modal
    document.getElementById('modal-tambah-barang').classList.add('active');
}

// Open tambah barang masuk modal
async function openTambahMasukModal() {
    // Populate barang dropdown
    await populateBarangDropdown('modal-barang-masuk');
    
    // Reset form
    document.getElementById('form-tambah-masuk').reset();
    document.getElementById('modal-tanggal-masuk').value = new Date().toISOString().split('T')[0];
    
    // Show modal
    document.getElementById('modal-tambah-masuk').classList.add('active');
}

// Open tambah barang keluar modal
async function openTambahKeluarModal() {
    // Populate barang dropdown
    await populateBarangDropdown('modal-barang-keluar');
    
    // Reset form
    document.getElementById('form-tambah-keluar').reset();
    document.getElementById('modal-tanggal-keluar').value = new Date().toISOString().split('T')[0];
    
    // Show modal
    document.getElementById('modal-tambah-keluar').classList.add('active');
}

// Update stok info for barang keluar
async function updateStokInfoKeluar() {
    const barangId = document.getElementById('modal-barang-keluar').value;
    
    if (!barangId) {
        document.getElementById('stok-info-keluar').innerHTML = 'Stok tersedia: <span>0</span>';
        return;
    }
    
    try {
        // Get barang data
        const { data: barang, error } = await supabase
            .from('barang')
            .select('stok, nama_barang')
            .eq('id', barangId)
            .single();
        
        if (error) {
            console.error('Error getting barang stok:', error);
            return;
        }
        
        document.getElementById('stok-info-keluar').innerHTML = `Stok tersedia: <span>${barang.stok}</span>`;
        
        // Set max value for jumlah input
        document.getElementById('modal-jumlah-keluar').max = barang.stok;
        
    } catch (error) {
        console.error('Error updating stok info:', error);
    }
}

// Handle tambah barang form submit
async function handleTambahBarang(e) {
    e.preventDefault();
    
    // Get form data
    const barang = {
        kode_barang: document.getElementById('modal-kode-barang').value.trim(),
        nama_barang: document.getElementById('modal-nama-barang').value.trim(),
        kategori_id: parseInt(document.getElementById('modal-kategori-barang').value),
        stok: parseInt(document.getElementById('modal-stok-barang').value),
        satuan: document.getElementById('modal-satuan-barang').value.trim(),
        min_stok: parseInt(document.getElementById('modal-min-stok').value),
        lokasi: document.getElementById('modal-lokasi-barang').value.trim() || null,
        deskripsi: document.getElementById('modal-deskripsi-barang').value.trim() || null
    };
    
    // Validate
    if (!barang.kode_barang || !barang.nama_barang || !barang.kategori_id || !barang.satuan) {
        showNotification('Harap isi semua field yang wajib diisi', 'warning');
        return;
    }
    
    if (barang.stok < 0 || barang.min_stok < 0) {
        showNotification('Stok tidak boleh negatif', 'warning');
        return;
    }
    
    try {
        // Check if kode barang already exists
        const { data: existing, error: checkError } = await supabase
            .from('barang')
            .select('id')
            .eq('kode_barang', barang.kode_barang)
            .limit(1);
        
        if (checkError) throw checkError;
        
        if (existing && existing.length > 0) {
            showNotification('Kode barang sudah digunakan', 'warning');
            return;
        }
        
        // Add barang
        const result = await window.supabaseFunctions.addBarang(barang);
        
        if (result) {
            showNotification('Barang berhasil ditambahkan', 'success');
            closeAllModals();
            loadBarangData();
            loadDashboardData();
        } else {
            showNotification('Gagal menambahkan barang', 'error');
        }
        
    } catch (error) {
        console.error('Error adding barang:', error);
        showNotification('Terjadi kesalahan saat menambahkan barang', 'error');
    }
}

// Handle tambah barang masuk form submit
async function handleTambahMasuk(e) {
    e.preventDefault();
    
    // Get form data
    const barangMasuk = {
        barang_id: parseInt(document.getElementById('modal-barang-masuk').value),
        jumlah: parseInt(document.getElementById('modal-jumlah-masuk').value),
        tanggal: document.getElementById('modal-tanggal-masuk').value,
        supplier: document.getElementById('modal-supplier-masuk').value.trim() || null,
        keterangan: document.getElementById('modal-keterangan-masuk').value.trim() || null
    };
    
    // Validate
    if (!barangMasuk.barang_id || !barangMasuk.jumlah || !barangMasuk.tanggal) {
        showNotification('Harap isi semua field yang wajib diisi', 'warning');
        return;
    }
    
    if (barangMasuk.jumlah <= 0) {
        showNotification('Jumlah harus lebih dari 0', 'warning');
        return;
    }
    
    try {
        // Add barang masuk
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
        showNotification('Terjadi kesalahan saat menambahkan barang masuk', 'error');
    }
}

// Handle tambah barang keluar form submit
async function handleTambahKeluar(e) {
    e.preventDefault();
    
    // Get form data
    const barangKeluar = {
        barang_id: parseInt(document.getElementById('modal-barang-keluar').value),
        jumlah: parseInt(document.getElementById('modal-jumlah-keluar').value),
        tanggal: document.getElementById('modal-tanggal-keluar').value,
        penerima: document.getElementById('modal-penerima-keluar').value.trim() || null,
        keterangan: document.getElementById('modal-keterangan-keluar').value.trim() || null
    };
    
    // Validate
    if (!barangKeluar.barang_id || !barangKeluar.jumlah || !barangKeluar.tanggal) {
        showNotification('Harap isi semua field yang wajib diisi', 'warning');
        return;
    }
    
    if (barangKeluar.jumlah <= 0) {
        showNotification('Jumlah harus lebih dari 0', 'warning');
        return;
    }
    
    try {
        // Check stok availability
        const { data: barang, error: checkError } = await supabase
            .from('barang')
            .select('stok, nama_barang')
            .eq('id', barangKeluar.barang_id)
            .single();
        
        if (checkError) throw checkError;
        
        if (barang.stok < barangKeluar.jumlah) {
            showNotification(`Stok tidak mencukupi. Stok tersedia: ${barang.stok}`, 'warning');
            return;
        }
        
        // Add barang keluar
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
        showNotification('Terjadi kesalahan saat menambahkan barang keluar', 'error');
    }
}

// Handle kategori form submit
async function handleKategoriForm(e) {
    e.preventDefault();
    
    // Get form data
    const kategori = {
        nama_kategori: document.getElementById('nama-kategori').value.trim(),
        deskripsi: document.getElementById('deskripsi-kategori').value.trim() || null
    };
    
    const kategoriId = document.getElementById('kategori-id').value;
    
    // Validate
    if (!kategori.nama_kategori) {
        showNotification('Nama kategori harus diisi', 'warning');
        return;
    }
    
    try {
        let result;
        
        if (kategoriId) {
            // Update existing kategori
            result = await window.supabaseFunctions.updateKategori(kategoriId, kategori);
            if (result) {
                showNotification('Kategori berhasil diperbarui', 'success');
            } else {
                showNotification('Gagal memperbarui kategori', 'error');
                return;
            }
        } else {
            // Add new kategori
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
        showNotification('Terjadi kesalahan saat menyimpan kategori', 'error');
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
        document.getElementById('modal-kode-barang').value = barang.kode_barang;
        document.getElementById('modal-nama-barang').value = barang.nama_barang;
        document.getElementById('modal-kategori-barang').value = barang.kategori_id;
        document.getElementById('modal-stok-barang').value = barang.stok;
        document.getElementById('modal-satuan-barang').value = barang.satuan;
        document.getElementById('modal-min-stok').value = barang.min_stok;
        document.getElementById('modal-lokasi-barang').value = barang.lokasi || '';
        document.getElementById('modal-deskripsi-barang').value = barang.deskripsi || '';
        
        // Update form to edit mode
        const form = document.getElementById('form-tambah-barang');
        form.dataset.editId = id;
        
        // Update modal title and button text
        document.querySelector('#modal-tambah-barang .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Edit Barang';
        document.querySelector('#modal-tambah-barang .modal-footer button[type="submit"]').textContent = 'Update Barang';
        
        // Show modal
        document.getElementById('modal-tambah-barang').classList.add('active');
        
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
        document.getElementById('nama-kategori').value = kategori.nama_kategori;
        document.getElementById('deskripsi-kategori').value = kategori.deskripsi || '';
        
        // Scroll to form
        document.querySelector('.kategori-form').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading kategori for edit:', error);
        showNotification('Gagal memuat data kategori untuk diedit', 'error');
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
        } else {
            showNotification('Gagal menghapus barang', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting barang:', error);
        showNotification('Terjadi kesalahan saat menghapus barang', 'error');
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
            .select('barang_id, jumlah')
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
        await window.supabaseFunctions.updateStokBarang(transaksi.barang_id, transaksi.jumlah, 'out');
        
        showNotification('Data barang masuk berhasil dihapus', 'success');
        loadBarangMasukData();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting barang masuk:', error);
        showNotification('Gagal menghapus data barang masuk', 'error');
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
            .select('barang_id, jumlah')
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
        await window.supabaseFunctions.updateStokBarang(transaksi.barang_id, transaksi.jumlah, 'in');
        
        showNotification('Data barang keluar berhasil dihapus', 'success');
        loadBarangKeluarData();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting barang keluar:', error);
        showNotification('Gagal menghapus data barang keluar', 'error');
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
        const result = await window.supabaseFunctions.deleteKategori(id);
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadKategoriData();
        } else {
            showNotification(result.message, 'warning');
        }
        
    } catch (error) {
        console.error('Error deleting kategori:', error);
        showNotification('Terjadi kesalahan saat menghapus kategori', 'error');
    }
}

// Reset kategori form
function resetKategoriForm() {
    document.getElementById('kategori-form').reset();
    document.getElementById('kategori-id').value = '';
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
    // Simple PDF export using window.print()
    // For a more robust solution, consider using a library like jsPDF
    window.print();
}

// Show notification
function showNotification(message, type = 'info') {
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
    
    // Add CSS for notification
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
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Reset form states
    const barangForm = document.getElementById('form-tambah-barang');
    delete barangForm.dataset.editId;
    document.querySelector('#modal-tambah-barang .modal-header h3').innerHTML = '<i class="fas fa-box"></i> Tambah Barang Baru';
    document.querySelector('#modal-tambah-barang .modal-footer button[type="submit"]').textContent = 'Simpan Barang';
}
