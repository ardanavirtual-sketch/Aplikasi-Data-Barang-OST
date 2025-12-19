// Konfigurasi Supabase
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs';

// Inisialisasi Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabel global
let masterBarang = [];
let barangMasuk = [];
let barangKeluar = [];
let stokBarang = [];
let selectedBarangId = null;
let activityChart = null;

// Inisialisasi aplikasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplikasi dimuat...');
    initializeApp();
});

// Fungsi inisialisasi aplikasi
async function initializeApp() {
    console.log('Menginisialisasi aplikasi...');
    
    // Setup event listeners untuk navigasi
    setupNavigationListeners();
    
    // Setup event listeners lainnya
    setupOtherEventListeners();
    
    // Setup data dummy untuk demo
    setupDemoData();
    
    console.log('Aplikasi siap digunakan!');
}

// Setup event listeners untuk navigasi
function setupNavigationListeners() {
    console.log('Setup navigasi...');
    
    // Navigasi - Gunakan event delegation
    document.querySelector('.sidebar').addEventListener('click', function(e) {
        // Cek jika yang diklik adalah nav-link
        if (e.target.classList.contains('nav-link') || e.target.closest('.nav-link')) {
            e.preventDefault();
            const navLink = e.target.classList.contains('nav-link') ? e.target : e.target.closest('.nav-link');
            const target = navLink.getAttribute('data-target');
            
            // Cek jika bukan logout button
            if (navLink.id !== 'logout-btn') {
                console.log('Menu diklik:', target);
                
                // Tampilkan section yang dipilih
                showSection(target);
                
                // Update active state
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(l => l.classList.remove('active'));
                navLink.classList.add('active');
            }
        }
    });
}

// Setup event listeners lainnya
function setupOtherEventListeners() {
    console.log('Setup event listeners lainnya...');
    
    // Form Barang Masuk
    document.getElementById('add-more-masuk').addEventListener('click', function() {
        console.log('Tombol tambah baris barang masuk diklik');
        addItemRow('masuk');
    });
    
    document.getElementById('form-barang-masuk').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form barang masuk disubmit');
        simpanBarangMasuk();
    });
    
    // Form Barang Keluar
    document.getElementById('add-more-keluar').addEventListener('click', function() {
        console.log('Tombol tambah baris barang keluar diklik');
        addItemRow('keluar');
    });
    
    document.getElementById('form-barang-keluar').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form barang keluar disubmit');
        simpanBarangKeluar();
    });
    
    // Form Master Barang
    document.getElementById('form-master-barang').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form master barang disubmit');
        simpanMasterBarang();
    });
    
    document.getElementById('reset-master').addEventListener('click', function() {
        console.log('Tombol reset master diklik');
        resetMasterForm();
    });
    
    // Preview gambar
    document.getElementById('foto-barang').addEventListener('change', function(e) {
        console.log('File gambar dipilih');
        previewImage(e.target);
    });
    
    // Filter stok
    document.getElementById('filter-kategori').addEventListener('change', function() {
        console.log('Filter kategori berubah:', this.value);
        filterStokBarang();
    });
    
    document.getElementById('filter-stok').addEventListener('change', function() {
        console.log('Filter stok berubah:', this.value);
        filterStokBarang();
    });
    
    document.getElementById('refresh-stok').addEventListener('click', function() {
        console.log('Tombol refresh stok diklik');
        updateStokBarangTable();
        filterStokBarang();
        alert('Data stok telah direfresh!');
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Tombol logout diklik');
        if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
            alert('Anda telah keluar dari aplikasi. Terima kasih!');
            // Dalam aplikasi nyata, ini akan redirect ke halaman login
            // window.location.href = 'login.html';
        }
    });
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', function() {
        console.log('Tombol close modal diklik');
        document.getElementById('fotoModal').style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('fotoModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Set tanggal hari ini di form
    setTodayDate();
    
    // Event delegation untuk tombol hapus di item rows
    document.addEventListener('click', function(e) {
        // Tombol hapus baris
        if (e.target.classList.contains('remove-item-btn') || e.target.closest('.remove-item-btn')) {
            const btn = e.target.classList.contains('remove-item-btn') ? e.target : e.target.closest('.remove-item-btn');
            const itemRow = btn.closest('.item-row');
            const container = itemRow.parentElement;
            
            if (container.querySelectorAll('.item-row').length > 1) {
                container.removeChild(itemRow);
                console.log('Baris item dihapus');
            } else {
                alert('Minimal harus ada satu baris item');
            }
        }
        
        // Tombol edit dan hapus di tabel
        if (e.target.classList.contains('action-btn') || e.target.closest('.action-btn')) {
            const actionBtn = e.target.classList.contains('action-btn') ? e.target : e.target.closest('.action-btn');
            const row = actionBtn.closest('tr');
            const id = parseInt(row.querySelector('td:first-child').textContent); // Ambil ID dari kolom pertama
            
            if (actionBtn.classList.contains('edit-btn')) {
                console.log('Tombol edit diklik untuk ID:', id);
                editMasterBarang(id);
            } else if (actionBtn.classList.contains('delete-btn')) {
                console.log('Tombol hapus diklik untuk ID:', id);
                hapusMasterBarang(id);
            }
        }
    });
}

// Setup data demo untuk testing
function setupDemoData() {
    console.log('Setup data demo...');
    
    // Data master barang contoh
    masterBarang = [
        {
            id: 1,
            kode_barang: 'BRG001',
            nama_barang: 'Air Mineral 600ml',
            kategori: 'Minuman',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'Dus',
            konversi_nilai_kecil: 24,
            konversi_satuan_kecil: 'Botol',
            foto_url: '',
            deskripsi: 'Air mineral kemasan botol 600ml'
        },
        {
            id: 2,
            kode_barang: 'BRG002',
            nama_barang: 'Mie Instan',
            kategori: 'Makanan',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'Pack',
            konversi_nilai_kecil: 10,
            konversi_satuan_kecil: 'Bungkus',
            foto_url: '',
            deskripsi: 'Mie instan berbagai rasa'
        },
        {
            id: 3,
            kode_barang: 'BRG003',
            nama_barang: 'Gula Pasir',
            kategori: 'Makanan',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'KG',
            konversi_nilai_kecil: 1000,
            konversi_satuan_kecil: 'Gram',
            foto_url: '',
            deskripsi: 'Gula pasir kemasan 1kg'
        },
        {
            id: 4,
            kode_barang: 'BRG004',
            nama_barang: 'Saus Tomat',
            kategori: 'Makanan',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'Lusin',
            konversi_nilai_kecil: 12,
            konversi_satuan_kecil: 'Botol',
            foto_url: '',
            deskripsi: 'Saus tomat botol'
        }
    ];
    
    // Data barang masuk contoh
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    
    barangMasuk = [
        {
            id: 1,
            tanggal: today,
            barang_id: 1,
            jumlah: 5,
            satuan_besar: 'Dus',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'Dus',
            konversi_nilai_kecil: 24,
            konversi_satuan_kecil: 'Botol',
            jumlah_kecil: 120,
            keterangan: 'Pembelian dari Supplier A',
            master_barang: masterBarang[0]
        },
        {
            id: 2,
            tanggal: today,
            barang_id: 2,
            jumlah: 3,
            satuan_besar: 'Pack',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'Pack',
            konversi_nilai_kecil: 10,
            konversi_satuan_kecil: 'Bungkus',
            jumlah_kecil: 30,
            keterangan: 'Pembelian dari Supplier B',
            master_barang: masterBarang[1]
        },
        {
            id: 3,
            tanggal: yesterdayStr,
            barang_id: 3,
            jumlah: 2,
            satuan_besar: 'KG',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'KG',
            konversi_nilai_kecil: 1000,
            konversi_satuan_kecil: 'Gram',
            jumlah_kecil: 2000,
            keterangan: 'Pembelian dari Supplier C',
            master_barang: masterBarang[2]
        },
        {
            id: 4,
            tanggal: twoDaysAgoStr,
            barang_id: 4,
            jumlah: 1,
            satuan_besar: 'Lusin',
            konversi_nilai_besar: 1,
            konversi_satuan_besar: 'Lusin',
            konversi_nilai_kecil: 12,
            konversi_satuan_kecil: 'Botol',
            jumlah_kecil: 12,
            keterangan: 'Pembelian dari Supplier D',
            master_barang: masterBarang[3]
        }
    ];
    
    // Data barang keluar contoh
    barangKeluar = [
        {
            id: 1,
            tanggal: today,
            barang_id: 1,
            jumlah: 12,
            satuan_kecil: 'Botol',
            keterangan: 'Penjualan ke Toko X',
            master_barang: masterBarang[0]
        },
        {
            id: 2,
            tanggal: yesterdayStr,
            barang_id: 2,
            jumlah: 5,
            satuan_kecil: 'Bungkus',
            keterangan: 'Penjualan ke Toko Y',
            master_barang: masterBarang[1]
        },
        {
            id: 3,
            tanggal: twoDaysAgoStr,
            barang_id: 3,
            jumlah: 500,
            satuan_kecil: 'Gram',
            keterangan: 'Penjualan ke Toko Z',
            master_barang: masterBarang[2]
        }
    ];
    
    // Hitung stok barang
    calculateStokBarang();
    
    // Update UI
    updateMasterBarangTable();
    updateBarangMasukTable();
    updateBarangKeluarTable();
    updateStokBarangTable();
    updateDashboard();
    populateBarangSelects();
    updateKonversiTable();
    setupCharts();
    
    console.log('Data demo siap!');
}

// Menampilkan section tertentu
function showSection(sectionId) {
    console.log('Menampilkan section:', sectionId);
    
    // Sembunyikan semua section
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Tampilkan section yang dipilih
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load data tambahan jika diperlukan
        if (sectionId === 'dashboard') {
            updateDashboard();
        } else if (sectionId === 'stok') {
            filterStokBarang();
        } else if (sectionId === 'master-barang') {
            // Reset form master barang saat pindah ke halaman ini
            resetMasterForm();
        }
        
        console.log('Section', sectionId, 'ditampilkan');
    } else {
        console.error('Section tidak ditemukan:', sectionId);
    }
}

// Set tanggal hari ini di form
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal-masuk').value = today;
    document.getElementById('tanggal-keluar').value = today;
    console.log('Tanggal diatur ke:', today);
}

// Hitung stok barang
function calculateStokBarang() {
    stokBarang = [];
    
    masterBarang.forEach(barang => {
        // Hitung total barang masuk (dikonversi ke satuan kecil)
        const totalMasuk = barangMasuk
            .filter(m => m.barang_id === barang.id)
            .reduce((total, m) => {
                const jumlahKecil = m.jumlah * m.konversi_nilai_kecil;
                return total + jumlahKecil;
            }, 0);
        
        // Hitung total barang keluar (dalam satuan kecil)
        const totalKeluar = barangKeluar
            .filter(k => k.barang_id === barang.id)
            .reduce((total, k) => total + k.jumlah, 0);
        
        // Hitung stok tersisa
        const stok = totalMasuk - totalKeluar;
        
        stokBarang.push({
            id: barang.id,
            kode_barang: barang.kode_barang,
            nama_barang: barang.nama_barang,
            kategori: barang.kategori,
            foto_url: barang.foto_url,
            konversi_satuan_besar: barang.konversi_satuan_besar,
            konversi_satuan_kecil: barang.konversi_satuan_kecil,
            konversi_nilai_besar: barang.konversi_nilai_besar,
            konversi_nilai_kecil: barang.konversi_nilai_kecil,
            stok_kecil: stok,
            stok_besar: stok / barang.konversi_nilai_kecil
        });
    });
    
    console.log('Stok barang dihitung:', stokBarang.length, 'item');
}

// Tambah baris item di form
function addItemRow(type) {
    const containerId = type === 'masuk' ? 'items-container-masuk' : 'items-container-keluar';
    const container = document.getElementById(containerId);
    
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    
    if (type === 'masuk') {
        itemRow.innerHTML = `
            <div class="form-group">
                <label>Barang</label>
                <select class="barang-select" required>
                    <option value="">Pilih Barang</option>
                </select>
            </div>
            <div class="form-group">
                <label>Jumlah</label>
                <input type="number" class="jumlah" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label>Satuan Besar</label>
                <select class="satuan-besar" required>
                    <option value="Dus">Dus</option>
                    <option value="Lusin">Lusin</option>
                    <option value="Pack">Pack</option>
                    <option value="Bungkus">Bungkus</option>
                    <option value="KG">KG</option>
                </select>
            </div>
            <div class="form-group">
                <button type="button" class="btn-danger remove-item-btn" style="margin-top: 24px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    } else {
        itemRow.innerHTML = `
            <div class="form-group">
                <label>Barang</label>
                <select class="barang-select" required>
                    <option value="">Pilih Barang</option>
                </select>
            </div>
            <div class="form-group">
                <label>Jumlah</label>
                <input type="number" class="jumlah" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label>Satuan Kecil</label>
                <select class="satuan-kecil" required>
                    <option value="Pcs">Pcs</option>
                    <option value="Botol">Botol</option>
                    <option value="Bungkus">Bungkus</option>
                    <option value="KG">KG</option>
                </select>
            </div>
            <div class="form-group">
                <label>Stok Tersedia</label>
                <input type="text" class="stok-tersedia" readonly value="0">
            </div>
            <div class="form-group">
                <button type="button" class="btn-danger remove-item-btn" style="margin-top: 24px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Event listener untuk update stok saat barang dipilih
        const barangSelect = itemRow.querySelector('.barang-select');
        barangSelect.addEventListener('change', function() {
            updateStokTersedia(this);
        });
    }
    
    container.appendChild(itemRow);
    
    // Populate dropdown barang
    populateBarangSelect(itemRow.querySelector('.barang-select'));
    
    console.log('Baris item ditambahkan untuk:', type);
}

// Populate dropdown barang di form
function populateBarangSelects() {
    const selects = document.querySelectorAll('.barang-select');
    selects.forEach(select => {
        populateBarangSelect(select);
    });
}

function populateBarangSelect(selectElement) {
    // Simpan nilai yang dipilih sebelumnya
    const currentValue = selectElement.value;
    
    // Clear options kecuali yang pertama
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    // Tambahkan options dari masterBarang
    masterBarang.forEach(barang => {
        const option = document.createElement('option');
        option.value = barang.id;
        option.textContent = `${barang.kode_barang} - ${barang.nama_barang}`;
        selectElement.appendChild(option);
    });
    
    // Kembalikan nilai yang dipilih sebelumnya jika masih ada
    if (currentValue && masterBarang.some(b => b.id.toString() === currentValue)) {
        selectElement.value = currentValue;
        
        // Update stok tersedia jika di form barang keluar
        if (selectElement.closest('#items-container-keluar')) {
            updateStokTersedia(selectElement);
        }
    }
}

// Update stok tersedia di form barang keluar
function updateStokTersedia(selectElement) {
    const barangId = selectElement.value;
    const itemRow = selectElement.closest('.item-row');
    const stokTersediaInput = itemRow.querySelector('.stok-tersedia');
    
    if (barangId) {
        const stokBarangItem = stokBarang.find(s => s.id.toString() === barangId);
        if (stokBarangItem) {
            stokTersediaInput.value = `${stokBarangItem.stok_kecil} ${stokBarangItem.konversi_satuan_kecil}`;
        } else {
            stokTersediaInput.value = '0';
        }
    } else {
        stokTersediaInput.value = '';
    }
}

// Simpan barang masuk (demo mode)
async function simpanBarangMasuk() {
    const tanggal = document.getElementById('tanggal-masuk').value;
    const keterangan = document.getElementById('keterangan-masuk').value;
    
    // Validasi
    if (!tanggal) {
        alert('Tanggal harus diisi');
        return;
    }
    
    const itemRows = document.querySelectorAll('#items-container-masuk .item-row');
    if (itemRows.length === 0) {
        alert('Minimal harus ada satu item');
        return;
    }
    
    // Kumpulkan data items
    const items = [];
    let isValid = true;
    
    for (const row of itemRows) {
        const barangId = row.querySelector('.barang-select').value;
        const jumlah = parseInt(row.querySelector('.jumlah').value);
        const satuanBesar = row.querySelector('.satuan-besar').value;
        
        if (!barangId || !jumlah || !satuanBesar) {
            alert('Semua field item harus diisi');
            isValid = false;
            break;
        }
        
        // Cari barang di master
        const barang = masterBarang.find(b => b.id.toString() === barangId);
        if (!barang) {
            alert('Barang tidak ditemukan');
            isValid = false;
            break;
        }
        
        // Validasi satuan besar sesuai dengan konversi barang
        if (barang.konversi_satuan_besar !== satuanBesar) {
            alert(`Satuan besar untuk ${barang.nama_barang} harus ${barang.konversi_satuan_besar}`);
            isValid = false;
            break;
        }
        
        items.push({
            barang_id: parseInt(barangId),
            jumlah,
            satuan_besar: satuanBesar,
            konversi_nilai_besar: barang.konversi_nilai_besar,
            konversi_nilai_kecil: barang.konversi_nilai_kecil,
            konversi_satuan_besar: barang.konversi_satuan_besar,
            konversi_satuan_kecil: barang.konversi_satuan_kecil,
            jumlah_kecil: jumlah * barang.konversi_nilai_kecil
        });
    }
    
    if (!isValid) return;
    
    showLoading(true);
    
    try {
        // Simpan ke data demo
        for (const item of items) {
            const barang = masterBarang.find(b => b.id === item.barang_id);
            const newId = barangMasuk.length > 0 ? Math.max(...barangMasuk.map(b => b.id)) + 1 : 1;
            
            barangMasuk.push({
                id: newId,
                tanggal,
                barang_id: item.barang_id,
                jumlah: item.jumlah,
                satuan_besar: item.satuan_besar,
                konversi_nilai_besar: item.konversi_nilai_besar,
                konversi_nilai_kecil: item.konversi_nilai_kecil,
                konversi_satuan_besar: item.konversi_satuan_besar,
                konversi_satuan_kecil: item.konversi_satuan_kecil,
                jumlah_kecil: item.jumlah_kecil,
                keterangan,
                master_barang: barang
            });
        }
        
        // Refresh data
        calculateStokBarang();
        updateBarangMasukTable();
        updateStokBarangTable();
        updateDashboard();
        updateCharts();
        
        // Reset form
        document.getElementById('form-barang-masuk').reset();
        setTodayDate();
        
        // Hapus item rows tambahan, sisakan satu
        const container = document.getElementById('items-container-masuk');
        while (container.children.length > 1) {
            container.removeChild(container.lastChild);
        }
        
        // Reset dropdown barang di row yang tersisa
        const firstSelect = container.querySelector('.barang-select');
        firstSelect.value = '';
        
        // Update dropdown di form lain
        populateBarangSelects();
        
        alert('Barang masuk berhasil disimpan! (Mode Demo)');
        
    } catch (error) {
        console.error('Error saving barang masuk:', error);
        alert('Gagal menyimpan barang masuk: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Simpan barang keluar (demo mode)
async function simpanBarangKeluar() {
    const tanggal = document.getElementById('tanggal-keluar').value;
    const keterangan = document.getElementById('keterangan-keluar').value;
    
    // Validasi
    if (!tanggal) {
        alert('Tanggal harus diisi');
        return;
    }
    
    const itemRows = document.querySelectorAll('#items-container-keluar .item-row');
    if (itemRows.length === 0) {
        alert('Minimal harus ada satu item');
        return;
    }
    
    // Kumpulkan data items
    const items = [];
    let isValid = true;
    
    for (const row of itemRows) {
        const barangId = row.querySelector('.barang-select').value;
        const jumlah = parseInt(row.querySelector('.jumlah').value);
        const satuanKecil = row.querySelector('.satuan-kecil').value;
        
        if (!barangId || !jumlah || !satuanKecil) {
            alert('Semua field item harus diisi');
            isValid = false;
            break;
        }
        
        // Cari barang di master
        const barang = masterBarang.find(b => b.id.toString() === barangId);
        if (!barang) {
            alert('Barang tidak ditemukan');
            isValid = false;
            break;
        }
        
        // Validasi satuan kecil sesuai dengan konversi barang
        if (barang.konversi_satuan_kecil !== satuanKecil) {
            alert(`Satuan kecil untuk ${barang.nama_barang} harus ${barang.konversi_satuan_kecil}`);
            isValid = false;
            break;
        }
        
        // Cek stok tersedia
        const stokBarangItem = stokBarang.find(s => s.id.toString() === barangId);
        if (!stokBarangItem || stokBarangItem.stok_kecil < jumlah) {
            alert(`Stok ${barang.nama_barang} tidak mencukupi. Stok tersedia: ${stokBarangItem ? stokBarangItem.stok_kecil : 0}`);
            isValid = false;
            break;
        }
        
        items.push({
            barang_id: parseInt(barangId),
            jumlah,
            satuan_kecil: satuanKecil
        });
    }
    
    if (!isValid) return;
    
    showLoading(true);
    
    try {
        // Simpan ke data demo
        for (const item of items) {
            const barang = masterBarang.find(b => b.id === item.barang_id);
            const newId = barangKeluar.length > 0 ? Math.max(...barangKeluar.map(b => b.id)) + 1 : 1;
            
            barangKeluar.push({
                id: newId,
                tanggal,
                barang_id: item.barang_id,
                jumlah: item.jumlah,
                satuan_kecil: item.satuan_kecil,
                keterangan,
                master_barang: barang
            });
        }
        
        // Refresh data
        calculateStokBarang();
        updateBarangKeluarTable();
        updateStokBarangTable();
        updateDashboard();
        updateCharts();
        
        // Reset form
        document.getElementById('form-barang-keluar').reset();
        setTodayDate();
        
        // Hapus item rows tambahan, sisakan satu
        const container = document.getElementById('items-container-keluar');
        while (container.children.length > 1) {
            container.removeChild(container.lastChild);
        }
        
        // Reset dropdown barang di row yang tersisa
        const firstSelect = container.querySelector('.barang-select');
        firstSelect.value = '';
        
        alert('Barang keluar berhasil disimpan! (Mode Demo)');
        
    } catch (error) {
        console.error('Error saving barang keluar:', error);
        alert('Gagal menyimpan barang keluar: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Simpan master barang (demo mode)
async function simpanMasterBarang() {
    const kodeBarang = document.getElementById('kode-barang').value.trim();
    const namaBarang = document.getElementById('nama-barang').value.trim();
    const kategori = document.getElementById('kategori').value;
    const konversiNilaiBesar = parseInt(document.getElementById('konversi-nilai').value);
    const konversiSatuanBesar = document.getElementById('konversi-satuan-besar').value;
    const konversiNilaiKecil = parseInt(document.getElementById('konversi-nilai-kecil').value);
    const konversiSatuanKecil = document.getElementById('konversi-satuan-kecil').value;
    const deskripsi = document.getElementById('deskripsi').value.trim();
    const fotoFile = document.getElementById('foto-barang').files[0];
    
    // Validasi
    if (!kodeBarang || !namaBarang || !kategori || !konversiNilaiBesar || !konversiNilaiKecil) {
        alert('Semua field wajib diisi kecuali foto dan deskripsi');
        return;
    }
    
    if (konversiNilaiBesar <= 0 || konversiNilaiKecil <= 0) {
        alert('Nilai konversi harus lebih besar dari 0');
        return;
    }
    
    // Cek kode barang unik (kecuali sedang edit)
    const isDuplicate = masterBarang.some(b => 
        b.kode_barang === kodeBarang && 
        (selectedBarangId === null || b.id !== selectedBarangId)
    );
    
    if (isDuplicate) {
        alert('Kode barang sudah digunakan');
        return;
    }
    
    showLoading(true);
    
    try {
        let fotoUrl = '';
        
        // Generate foto URL dari file (untuk demo, simpan sebagai data URL)
        if (fotoFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                fotoUrl = e.target.result;
                finishSaveMasterBarang();
            };
            reader.readAsDataURL(fotoFile);
        } else {
            finishSaveMasterBarang();
        }
        
        function finishSaveMasterBarang() {
            // Data untuk disimpan
            const barangData = {
                kode_barang: kodeBarang,
                nama_barang: namaBarang,
                kategori,
                konversi_nilai_besar: konversiNilaiBesar,
                konversi_satuan_besar: konversiSatuanBesar,
                konversi_nilai_kecil: konversiNilaiKecil,
                konversi_satuan_kecil: konversiSatuanKecil,
                deskripsi,
                foto_url: fotoUrl
            };
            
            if (selectedBarangId) {
                // Update barang yang ada
                const index = masterBarang.findIndex(b => b.id === selectedBarangId);
                if (index !== -1) {
                    masterBarang[index] = { id: selectedBarangId, ...barangData };
                    // Update teks tombol submit
                    document.querySelector('#submit-master').innerHTML = '<i class="fas fa-save"></i> Update Barang';
                }
            } else {
                // Tambah barang baru
                const newId = masterBarang.length > 0 ? Math.max(...masterBarang.map(b => b.id)) + 1 : 1;
                masterBarang.push({ id: newId, ...barangData });
            }
            
            // Refresh data
            calculateStokBarang();
            updateMasterBarangTable();
            updateStokBarangTable();
            updateDashboard();
            populateBarangSelects();
            updateKonversiTable();
            
            // Reset form
            resetMasterForm();
            
            alert(`Master barang berhasil ${selectedBarangId ? 'diperbarui' : 'disimpan'}! (Mode Demo)`);
            showLoading(false);
        }
        
    } catch (error) {
        console.error('Error saving master barang:', error);
        alert('Gagal menyimpan master barang: ' + error.message);
        showLoading(false);
    }
}

// Reset form master barang
function resetMasterForm() {
    document.getElementById('form-master-barang').reset();
    document.getElementById('image-preview').innerHTML = '<i class="fas fa-image"></i><span>Pratinjau gambar akan muncul di sini</span>';
    selectedBarangId = null;
    document.querySelector('#submit-master').innerHTML = '<i class="fas fa-save"></i> Simpan Barang';
    console.log('Form master barang direset');
}

// Preview gambar sebelum upload
function previewImage(input) {
    const preview = document.getElementById('image-preview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '<i class="fas fa-image"></i><span>Pratinjau gambar akan muncul di sini</span>';
    }
}

// Edit master barang
function editMasterBarang(id) {
    const barang = masterBarang.find(b => b.id === id);
    if (!barang) return;
    
    selectedBarangId = id;
    
    // Isi form dengan data barang
    document.getElementById('kode-barang').value = barang.kode_barang;
    document.getElementById('nama-barang').value = barang.nama_barang;
    document.getElementById('kategori').value = barang.kategori;
    document.getElementById('konversi-nilai').value = barang.konversi_nilai_besar;
    document.getElementById('konversi-satuan-besar').value = barang.konversi_satuan_besar;
    document.getElementById('konversi-nilai-kecil').value = barang.konversi_nilai_kecil;
    document.getElementById('konversi-satuan-kecil').value = barang.konversi_satuan_kecil;
    document.getElementById('deskripsi').value = barang.deskripsi || '';
    
    // Tampilkan foto jika ada
    const preview = document.getElementById('image-preview');
    if (barang.foto_url) {
        preview.innerHTML = `<img src="${barang.foto_url}" alt="Preview">`;
    }
    
    // Update teks tombol submit
    document.querySelector('#submit-master').innerHTML = '<i class="fas fa-save"></i> Update Barang';
    
    // Scroll ke form
    showSection('master-barang');
    document.getElementById('form-master-barang').scrollIntoView({ behavior: 'smooth' });
    
    console.log('Edit master barang:', barang.nama_barang);
}

// Hapus master barang
async function hapusMasterBarang(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini? Penghapusan akan mempengaruhi data stok, masuk, dan keluar.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        // Hapus dari data demo
        masterBarang = masterBarang.filter(b => b.id !== id);
        barangMasuk = barangMasuk.filter(m => m.barang_id !== id);
        barangKeluar = barangKeluar.filter(k => k.barang_id !== id);
        
        // Refresh data
        calculateStokBarang();
        updateMasterBarangTable();
        updateBarangMasukTable();
        updateBarangKeluarTable();
        updateStokBarangTable();
        updateDashboard();
        populateBarangSelects();
        updateKonversiTable();
        updateCharts();
        
        alert('Barang berhasil dihapus! (Mode Demo)');
        
    } catch (error) {
        console.error('Error deleting master barang:', error);
        alert('Gagal menghapus barang: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Tampilkan foto di modal
function showFotoModal(fotoUrl, namaBarang) {
    const modal = document.getElementById('fotoModal');
    const modalFoto = document.getElementById('modalFoto');
    const modalNamaBarang = document.getElementById('modalNamaBarang');
    
    modalFoto.src = fotoUrl || '';
    modalNamaBarang.textContent = namaBarang || 'Tanpa Nama';
    
    modal.style.display = 'flex';
}

// Update tabel master barang
function updateMasterBarangTable() {
    const tbody = document.querySelector('#table-master-barang tbody');
    tbody.innerHTML = '';
    
    if (masterBarang.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Tidak ada data master barang</td>
            </tr>
        `;
        return;
    }
    
    masterBarang.forEach((barang, index) => {
        const stokItem = stokBarang.find(s => s.id === barang.id);
        const stokKecil = stokItem ? stokItem.stok_kecil : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${barang.kode_barang}</td>
            <td>
                ${barang.foto_url ? 
                    `<img src="${barang.foto_url}" class="table-foto" alt="Foto" onclick="showFotoModal('${barang.foto_url}', '${barang.nama_barang}')">` : 
                    `<div class="table-foto" style="display: flex; align-items: center; justify-content: center; background-color: #f0f0f0; cursor: pointer;" onclick="showFotoModal('', '${barang.nama_barang}')">
                        <i class="fas fa-box" style="font-size: 1.2rem; color: #999;"></i>
                    </div>`
                }
            </td>
            <td>${barang.nama_barang}</td>
            <td>${barang.kategori}</td>
            <td>${barang.konversi_nilai_besar} ${barang.konversi_satuan_besar} = ${barang.konversi_nilai_kecil} ${barang.konversi_satuan_kecil}</td>
            <td>${stokKecil} ${barang.konversi_satuan_kecil}</td>
            <td>
                <div class="actions">
                    <div class="action-btn edit-btn">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div class="action-btn delete-btn">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update tabel barang masuk
function updateBarangMasukTable() {
    const tbody = document.querySelector('#table-barang-masuk tbody');
    tbody.innerHTML = '';
    
    if (barangMasuk.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Tidak ada data barang masuk</td>
            </tr>
        `;
        return;
    }
    
    barangMasuk.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(item.tanggal)}</td>
            <td>${item.master_barang ? item.master_barang.nama_barang : 'Barang dihapus'}</td>
            <td>${item.jumlah}</td>
            <td>${item.satuan_besar}</td>
            <td>${item.jumlah_kecil} ${item.konversi_satuan_kecil}</td>
            <td>${item.keterangan || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update tabel barang keluar
function updateBarangKeluarTable() {
    const tbody = document.querySelector('#table-barang-keluar tbody');
    tbody.innerHTML = '';
    
    if (barangKeluar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Tidak ada data barang keluar</td>
            </tr>
        `;
        return;
    }
    
    barangKeluar.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(item.tanggal)}</td>
            <td>${item.master_barang ? item.master_barang.nama_barang : 'Barang dihapus'}</td>
            <td>${item.jumlah}</td>
            <td>${item.satuan_kecil}</td>
            <td>${item.keterangan || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update tabel stok barang
function updateStokBarangTable() {
    const tbody = document.querySelector('#table-stok tbody');
    tbody.innerHTML = '';
    
    if (stokBarang.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Tidak ada data stok barang</td>
            </tr>
        `;
        return;
    }
    
    stokBarang.forEach((item, index) => {
        const status = getStatusStok(item.stok_kecil);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.kode_barang}</td>
            <td>
                ${item.foto_url ? 
                    `<img src="${item.foto_url}" class="table-foto" alt="Foto" onclick="showFotoModal('${item.foto_url}', '${item.nama_barang}')">` : 
                    `<div class="table-foto" style="display: flex; align-items: center; justify-content: center; background-color: #f0f0f0; cursor: pointer;" onclick="showFotoModal('', '${item.nama_barang}')">
                        <i class="fas fa-box" style="font-size: 1.2rem; color: #999;"></i>
                    </div>`
                }
            </td>
            <td>${item.nama_barang}</td>
            <td>${item.kategori}</td>
            <td>${item.stok_kecil} ${item.konversi_satuan_kecil}</td>
            <td>${item.stok_besar.toFixed(2)} ${item.konversi_satuan_besar}</td>
            <td><span class="status-stok ${status.class}">${status.text}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Filter stok barang
function filterStokBarang() {
    const filterKategori = document.getElementById('filter-kategori').value;
    const filterStok = document.getElementById('filter-stok').value;
    
    const rows = document.querySelectorAll('#table-stok tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const kategori = row.cells[4].textContent; // Kolom ke-5 (0-based index)
        const stokText = row.cells[5].textContent; // Kolom ke-6 (stok kecil)
        const stokMatch = stokText.match(/\d+/);
        const stok = stokMatch ? parseInt(stokMatch[0]) : 0;
        
        let showRow = true;
        
        // Filter kategori
        if (filterKategori && kategori !== filterKategori) {
            showRow = false;
        }
        
        // Filter stok
        if (filterStok === 'menipis' && stok >= 10) {
            showRow = false;
        } else if (filterStok === 'cukup' && (stok < 10 || stok > 50)) {
            showRow = false;
        } else if (filterStok === 'banyak' && stok <= 50) {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    console.log('Filter diterapkan:', filterKategori, filterStok, 'Tampil:', visibleCount, 'dari', rows.length);
}

// Update tabel konversi
function updateKonversiTable() {
    const tbody = document.querySelector('#table-konversi tbody');
    tbody.innerHTML = '';
    
    if (masterBarang.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Tidak ada data konversi</td>
            </tr>
        `;
        return;
    }
    
    masterBarang.forEach((barang, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${barang.nama_barang}</td>
            <td>${barang.konversi_nilai_besar} ${barang.konversi_satuan_besar} = ${barang.konversi_nilai_kecil} ${barang.konversi_satuan_kecil}</td>
            <td>Contoh: Barang masuk ${barang.konversi_nilai_besar} ${barang.konversi_satuan_besar}, stok bertambah ${barang.konversi_nilai_kecil} ${barang.konversi_satuan_kecil}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update dashboard
function updateDashboard() {
    // Total jenis barang
    document.getElementById('total-jenis-barang').textContent = masterBarang.length;
    
    // Barang masuk hari ini
    const today = new Date().toISOString().split('T')[0];
    const masukHariIni = barangMasuk.filter(m => m.tanggal === today).length;
    document.getElementById('barang-masuk-hari-ini').textContent = masukHariIni;
    
    // Barang keluar hari ini
    const keluarHariIni = barangKeluar.filter(k => k.tanggal === today).length;
    document.getElementById('barang-keluar-hari-ini').textContent = keluarHariIni;
    
    // Stok menipis
    const stokMenipis = stokBarang.filter(s => s.stok_kecil < 10).length;
    document.getElementById('stok-menipis').textContent = stokMenipis;
    
    // Update top stok items
    updateTopStokItems();
    
    console.log('Dashboard diperbarui');
}

// Update top stok items di dashboard
function updateTopStokItems() {
    const container = document.getElementById('top-stock-items');
    
    // Sort by stock (descending)
    const sortedStok = [...stokBarang].sort((a, b) => b.stok_kecil - a.stok_kecil).slice(0, 5);
    
    if (sortedStok.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Tidak ada data stok</p>';
        return;
    }
    
    let html = '<ul style="list-style: none; padding: 0;">';
    
    sortedStok.forEach(item => {
        const status = getStatusStok(item.stok_kecil);
        html += `
            <li style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; font-size: 0.9rem;">${item.nama_barang}</span>
                    <span style="font-size: 0.9rem; color: #666;">${item.stok_kecil} ${item.konversi_satuan_kecil}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                    <span style="font-size: 0.85rem; color: #888;">${item.kategori}</span>
                    <span class="status-stok ${status.class}" style="font-size: 0.75rem;">${status.text}</span>
                </div>
            </li>
        `;
    });
    
    html += '</ul>';
    container.innerHTML = html;
}

// Setup charts
function setupCharts() {
    // Setup activity chart (7 hari terakhir)
    const ctx = document.getElementById('activityChart');
    
    if (!ctx) {
        console.error('Canvas element tidak ditemukan!');
        return;
    }
    
    const ctx2d = ctx.getContext('2d');
    
    // Generate data untuk 7 hari terakhir
    const labels = [];
    const masukData = [];
    const keluarData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        labels.push(formatDate(dateStr));
        
        // Hitung barang masuk hari ini
        const masukCount = barangMasuk.filter(m => m.tanggal === dateStr).length;
        masukData.push(masukCount);
        
        // Hitung barang keluar hari ini
        const keluarCount = barangKeluar.filter(k => k.tanggal === dateStr).length;
        keluarData.push(keluarCount);
    }
    
    // Hancurkan chart lama jika ada
    if (activityChart) {
        activityChart.destroy();
    }
    
    activityChart = new Chart(ctx2d, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Barang Masuk',
                    data: masukData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Barang Keluar',
                    data: keluarData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    console.log('Chart berhasil dibuat!');
}

// Update charts setelah data berubah
function updateCharts() {
    setupCharts();
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function getStatusStok(stok) {
    if (stok < 10) {
        return { class: 'status-menipis', text: 'Menipis' };
    } else if (stok <= 50) {
        return { class: 'status-cukup', text: 'Cukup' };
    } else {
        return { class: 'status-banyak', text: 'Banyak' };
    }
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

// Ekspos fungsi ke global scope untuk digunakan di inline event handlers
window.editMasterBarang = editMasterBarang;
window.hapusMasterBarang = hapusMasterBarang;
window.showFotoModal = showFotoModal;
window.showSection = showSection;
