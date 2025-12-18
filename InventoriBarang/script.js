// Konfigurasi Supabase
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs'; // Ganti dengan kunci anon Supabase Anda

// Inisialisasi Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabel global
let masterBarang = [];
let barangMasuk = [];
let barangKeluar = [];
let stokBarang = [];
let selectedBarangId = null;

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Fungsi inisialisasi aplikasi
async function initializeApp() {
    // Setup event listeners
    setupEventListeners();
    
    // Load data dari Supabase
    await loadAllData();
    
    // Setup form dengan tanggal hari ini
    setTodayDate();
    
    // Setup chart
    setupCharts();
}

// Setup event listeners
function setupEventListeners() {
    // Navigasi
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            showSection(target);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Form Barang Masuk
    document.getElementById('add-more-masuk').addEventListener('click', function() {
        addItemRow('masuk');
    });
    
    document.getElementById('form-barang-masuk').addEventListener('submit', async function(e) {
        e.preventDefault();
        await simpanBarangMasuk();
    });
    
    // Form Barang Keluar
    document.getElementById('add-more-keluar').addEventListener('click', function() {
        addItemRow('keluar');
    });
    
    document.getElementById('form-barang-keluar').addEventListener('submit', async function(e) {
        e.preventDefault();
        await simpanBarangKeluar();
    });
    
    // Form Master Barang
    document.getElementById('form-master-barang').addEventListener('submit', async function(e) {
        e.preventDefault();
        await simpanMasterBarang();
    });
    
    document.getElementById('reset-master').addEventListener('click', function() {
        resetMasterForm();
    });
    
    // Preview gambar
    document.getElementById('foto-barang').addEventListener('change', function(e) {
        previewImage(e.target);
    });
    
    // Filter stok
    document.getElementById('filter-kategori').addEventListener('change', function() {
        filterStokBarang();
    });
    
    document.getElementById('filter-stok').addEventListener('change', function() {
        filterStokBarang();
    });
    
    document.getElementById('refresh-stok').addEventListener('click', async function() {
        await loadStokBarang();
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            alert('Anda telah keluar dari aplikasi');
            // Di aplikasi sebenarnya, ini akan mengarahkan ke halaman login
        }
    });
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('fotoModal').style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('fotoModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Menampilkan section tertentu
function showSection(sectionId) {
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
        }
    }
}

// Set tanggal hari ini di form
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal-masuk').value = today;
    document.getElementById('tanggal-keluar').value = today;
}

// Load semua data dari Supabase
async function loadAllData() {
    showLoading(true);
    
    try {
        // Load master barang
        const { data: barangData, error: barangError } = await supabase
            .from('master_barang')
            .select('*')
            .order('nama_barang');
            
        if (barangError) throw barangError;
        
        masterBarang = barangData || [];
        
        // Load barang masuk
        const { data: masukData, error: masukError } = await supabase
            .from('barang_masuk')
            .select(`
                *,
                master_barang(kode_barang, nama_barang, konversi_satuan_besar, konversi_satuan_kecil, konversi_nilai_besar, konversi_nilai_kecil)
            `)
            .order('tanggal', { ascending: false });
            
        if (masukError) throw masukError;
        
        barangMasuk = masukData || [];
        
        // Load barang keluar
        const { data: keluarData, error: keluarError } = await supabase
            .from('barang_keluar')
            .select(`
                *,
                master_barang(kode_barang, nama_barang)
            `)
            .order('tanggal', { ascending: false });
            
        if (keluarError) throw keluarError;
        
        barangKeluar = keluarData || [];
        
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
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Gagal memuat data: ' + error.message);
    } finally {
        showLoading(false);
    }
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
                <input type="number" class="jumlah" min="1" required>
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
                <input type="number" class="jumlah" min="1" required>
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
                <input type="text" class="stok-tersedia" readonly>
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
    
    // Event listener untuk tombol hapus
    const removeBtn = itemRow.querySelector('.remove-item-btn');
    removeBtn.addEventListener('click', function() {
        if (container.querySelectorAll('.item-row').length > 1) {
            container.removeChild(itemRow);
        } else {
            alert('Minimal harus ada satu baris item');
        }
    });
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

// Simpan barang masuk
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
    for (const row of itemRows) {
        const barangId = row.querySelector('.barang-select').value;
        const jumlah = parseInt(row.querySelector('.jumlah').value);
        const satuanBesar = row.querySelector('.satuan-besar').value;
        
        if (!barangId || !jumlah || !satuanBesar) {
            alert('Semua field item harus diisi');
            return;
        }
        
        // Cari barang di master
        const barang = masterBarang.find(b => b.id.toString() === barangId);
        if (!barang) {
            alert('Barang tidak ditemukan');
            return;
        }
        
        // Validasi satuan besar sesuai dengan konversi barang
        if (barang.konversi_satuan_besar !== satuanBesar) {
            alert(`Satuan besar untuk ${barang.nama_barang} harus ${barang.konversi_satuan_besar}`);
            return;
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
    
    showLoading(true);
    
    try {
        // Simpan ke Supabase
        for (const item of items) {
            const { error } = await supabase
                .from('barang_masuk')
                .insert({
                    tanggal,
                    barang_id: item.barang_id,
                    jumlah: item.jumlah,
                    satuan_besar: item.satuan_besar,
                    konversi_nilai_besar: item.konversi_nilai_besar,
                    konversi_nilai_kecil: item.konversi_nilai_kecil,
                    konversi_satuan_besar: item.konversi_satuan_besar,
                    konversi_satuan_kecil: item.konversi_satuan_kecil,
                    jumlah_kecil: item.jumlah_kecil,
                    keterangan
                });
                
            if (error) throw error;
        }
        
        // Refresh data
        await loadAllData();
        
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
        
        alert('Barang masuk berhasil disimpan!');
        
    } catch (error) {
        console.error('Error saving barang masuk:', error);
        alert('Gagal menyimpan barang masuk: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Simpan barang keluar
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
    for (const row of itemRows) {
        const barangId = row.querySelector('.barang-select').value;
        const jumlah = parseInt(row.querySelector('.jumlah').value);
        const satuanKecil = row.querySelector('.satuan-kecil').value;
        
        if (!barangId || !jumlah || !satuanKecil) {
            alert('Semua field item harus diisi');
            return;
        }
        
        // Cari barang di master
        const barang = masterBarang.find(b => b.id.toString() === barangId);
        if (!barang) {
            alert('Barang tidak ditemukan');
            return;
        }
        
        // Validasi satuan kecil sesuai dengan konversi barang
        if (barang.konversi_satuan_kecil !== satuanKecil) {
            alert(`Satuan kecil untuk ${barang.nama_barang} harus ${barang.konversi_satuan_kecil}`);
            return;
        }
        
        // Cek stok tersedia
        const stokBarangItem = stokBarang.find(s => s.id.toString() === barangId);
        if (!stokBarangItem || stokBarangItem.stok_kecil < jumlah) {
            alert(`Stok ${barang.nama_barang} tidak mencukupi. Stok tersedia: ${stokBarangItem ? stokBarangItem.stok_kecil : 0}`);
            return;
        }
        
        items.push({
            barang_id: parseInt(barangId),
            jumlah,
            satuan_kecil: satuanKecil
        });
    }
    
    showLoading(true);
    
    try {
        // Simpan ke Supabase
        for (const item of items) {
            const { error } = await supabase
                .from('barang_keluar')
                .insert({
                    tanggal,
                    barang_id: item.barang_id,
                    jumlah: item.jumlah,
                    satuan_kecil: item.satuan_kecil,
                    keterangan
                });
                
            if (error) throw error;
        }
        
        // Refresh data
        await loadAllData();
        
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
        
        alert('Barang keluar berhasil disimpan!');
        
    } catch (error) {
        console.error('Error saving barang keluar:', error);
        alert('Gagal menyimpan barang keluar: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Simpan master barang
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
        let fotoUrl = null;
        
        // Upload foto jika ada
        if (fotoFile) {
            const fileExt = fotoFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `barang-foto/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('barang-foto')
                .upload(filePath, fotoFile);
                
            if (uploadError) throw uploadError;
            
            // Dapatkan URL publik
            const { data: urlData } = supabase.storage
                .from('barang-foto')
                .getPublicUrl(filePath);
                
            fotoUrl = urlData.publicUrl;
        }
        
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
        
        let error;
        
        if (selectedBarangId) {
            // Update barang yang ada
            const { error: updateError } = await supabase
                .from('master_barang')
                .update(barangData)
                .eq('id', selectedBarangId);
                
            error = updateError;
        } else {
            // Tambah barang baru
            const { error: insertError } = await supabase
                .from('master_barang')
                .insert(barangData);
                
            error = insertError;
        }
        
        if (error) throw error;
        
        // Refresh data
        await loadAllData();
        
        // Reset form
        resetMasterForm();
        
        alert(`Master barang berhasil ${selectedBarangId ? 'diperbarui' : 'disimpan'}!`);
        
    } catch (error) {
        console.error('Error saving master barang:', error);
        alert('Gagal menyimpan master barang: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Reset form master barang
function resetMasterForm() {
    document.getElementById('form-master-barang').reset();
    document.getElementById('image-preview').innerHTML = '<i class="fas fa-image"></i><span>Pratinjau gambar akan muncul di sini</span>';
    selectedBarangId = null;
    document.querySelector('#form-master-barang button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Simpan Barang';
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
    document.querySelector('#form-master-barang button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Update Barang';
    
    // Scroll ke form
    showSection('master-barang');
    document.getElementById('form-master-barang').scrollIntoView({ behavior: 'smooth' });
}

// Hapus master barang
async function hapusMasterBarang(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini? Penghapusan akan mempengaruhi data stok, masuk, dan keluar.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const { error } = await supabase
            .from('master_barang')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        // Refresh data
        await loadAllData();
        
        alert('Barang berhasil dihapus!');
        
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
                <td colspan="7" class="text-center">Tidak ada data master barang</td>
            </tr>
        `;
        return;
    }
    
    masterBarang.forEach(barang => {
        const stokItem = stokBarang.find(s => s.id === barang.id);
        const stokKecil = stokItem ? stokItem.stok_kecil : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${barang.kode_barang}</td>
            <td>
                ${barang.foto_url ? 
                    `<img src="${barang.foto_url}" class="table-foto" alt="Foto" onclick="showFotoModal('${barang.foto_url}', '${barang.nama_barang}')">` : 
                    `<div class="table-foto" style="display: flex; align-items: center; justify-content: center; background-color: #f0f0f0;">
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
                    <div class="action-btn edit-btn" onclick="editMasterBarang(${barang.id})">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div class="action-btn delete-btn" onclick="hapusMasterBarang(${barang.id})">
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
                <td colspan="6" class="text-center">Tidak ada data barang masuk</td>
            </tr>
        `;
        return;
    }
    
    barangMasuk.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
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
                <td colspan="5" class="text-center">Tidak ada data barang keluar</td>
            </tr>
        `;
        return;
    }
    
    barangKeluar.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
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
                <td colspan="7" class="text-center">Tidak ada data stok barang</td>
            </tr>
        `;
        return;
    }
    
    stokBarang.forEach(item => {
        const status = getStatusStok(item.stok_kecil);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.kode_barang}</td>
            <td>
                ${item.foto_url ? 
                    `<img src="${item.foto_url}" class="table-foto" alt="Foto" onclick="showFotoModal('${item.foto_url}', '${item.nama_barang}')">` : 
                    `<div class="table-foto" style="display: flex; align-items: center; justify-content: center; background-color: #f0f0f0;">
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
    
    rows.forEach(row => {
        const kategori = row.cells[3].textContent;
        const stokText = row.cells[4].textContent;
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
    });
}

// Update tabel konversi
function updateKonversiTable() {
    const tbody = document.querySelector('#table-konversi tbody');
    tbody.innerHTML = '';
    
    if (masterBarang.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">Tidak ada data konversi</td>
            </tr>
        `;
        return;
    }
    
    masterBarang.forEach(barang => {
        const row = document.createElement('tr');
        row.innerHTML = `
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
}

// Update top stok items di dashboard
function updateTopStokItems() {
    const container = document.getElementById('top-stock-items');
    
    // Sort by stock (descending)
    const sortedStok = [...stokBarang].sort((a, b) => b.stok_kecil - a.stok_kecil).slice(0, 5);
    
    if (sortedStok.length === 0) {
        container.innerHTML = '<p>Tidak ada data stok</p>';
        return;
    }
    
    let html = '<ul style="list-style: none; padding: 0;">';
    
    sortedStok.forEach(item => {
        const status = getStatusStok(item.stok_kecil);
        html += `
            <li style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold;">${item.nama_barang}</span>
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
    const ctx = document.getElementById('activityChart').getContext('2d');
    
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
    
    new Chart(ctx, {
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
