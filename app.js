// Pastikan Anda memuat library Supabase di index.html sebelum file ini.
// Contoh: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// Jika Anda tidak menggunakan modul, 'createClient' harus tersedia secara global.

// **KONFIGURASI SUPABASE**
// Ganti dengan URL dan Anon Key project Supabase Anda.
// Dapatkan di: Project Settings > API
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs';

// Cek apakah 'createClient' tersedia (asumsi library dimuat)
if (typeof createClient === 'undefined') {
    console.error("Kesalahan Fatal: Library Supabase tidak dimuat. Pastikan Anda menambahkan script tag Supabase di index.html.");
    // Logika UI akan ditampilkan di DOMContentLoaded jika Supabase credentials belum diganti
}

// Inisialisasi Klien Supabase
const supabase = (typeof createClient !== 'undefined') 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null; // Null jika library tidak dimuat

// --- FUNGSI UTILITY & NAVIGASI ---

/**
 * Fungsi utilitas untuk menampilkan pesan error di area konten.
 * @param {string} message - Pesan error yang akan ditampilkan.
 * @param {string} tableBodyId - ID tbody yang gagal dimuat.
 */
function displayFetchError(message, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500 font-bold">
            🚨 Gagal memuat data dari database. Cek koneksi atau RLS Supabase Anda. <br> Pesan: ${message}
        </td></tr>`;
    }
}

/**
 * Mengubah tampilan konten berdasarkan menu sidebar yang diklik.
 * @param {string} targetView - ID dari elemen view yang akan ditampilkan (misalnya 'stok', 'produk', 'keluar').
 * @param {string} title - Judul halaman baru.
 */
function switchView(targetView, title) {
    // Sembunyikan semua views
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.add('hidden');
    });

    // Tampilkan view yang ditargetkan
    const activeView = document.getElementById(`view-${targetView}`);
    if (activeView) {
        activeView.classList.remove('hidden');
    }

    // Perbarui judul halaman
    document.getElementById('page-title').textContent = title;

    // Perbarui status aktif di sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'bg-indigo-50', 'text-gray-700');
        item.classList.add('text-gray-500');
        
        // Tambahkan kembali kelas aktif pada item yang sesuai
        if (item.dataset.target === targetView) {
            item.classList.add('active', 'bg-indigo-50', 'text-gray-700');
            item.classList.remove('text-gray-500');
            // Ubah warna ikon menjadi indigo-500
            const icon = item.querySelector('svg');
            if(icon) {
                icon.classList.add('text-indigo-500');
            }
        } else {
            const icon = item.querySelector('svg');
            if(icon) {
                icon.classList.remove('text-indigo-500');
            }
        }
    });
    
    // Panggil fungsi pemuatan data jika halaman yang relevan dibuka
    if (!supabase) return; // Jangan coba load jika supabase client null

    if (targetView === 'produk') {
        loadDataProduk();
    } else if (targetView === 'stok') {
        loadDataStok();
    } else if (targetView === 'masuk') {
        loadProdukToDropdowns(); // Untuk form
        loadDataMasuk(); // Untuk riwayat
    } else if (targetView === 'keluar') {
        loadProdukToDropdowns(); // Untuk form
        loadDataKeluar(); // Untuk riwayat
    }
}


// --- FUNGSI INTERAKSI SUPABASE (READ) ---

/**
 * Mengambil data Stok Saat Ini (View `stok_saat_ini_pcs`).
 */
async function loadDataStok() {
    if (!supabase) return;
    const tableBody = document.getElementById('stokTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data Stok...</td></tr>';

    try {
        // Kolom di View: nama_produk, sku, deskripsi, unit_besar, unit_kecil, stok_unit_kecil
        const { data: stok, error } = await supabase
            .from('stok_saat_ini_pcs')
            .select('nama_produk, sku, deskripsi, unit_besar, unit_kecil, stok_unit_kecil');

        if (error) throw error;

        if (stok && stok.length > 0) {
            tableBody.innerHTML = '';
            stok.forEach(p => {
                const row = tableBody.insertRow();
                row.className = 'hover:bg-gray-50 transition-colors duration-100';
                row.insertCell().textContent = p.nama_produk || '-';
                row.insertCell().textContent = p.sku || '-';
                row.insertCell().textContent = p.deskripsi ? p.deskripsi.substring(0, 50) + '...' : '-';
                row.insertCell().textContent = p.unit_besar || '-';
                row.insertCell().textContent = p.unit_kecil || '-';
                
                // Kolom Stok
                const stockCell = row.insertCell();
                stockCell.className = 'font-semibold text-right';
                // Gunakan toLocaleString untuk format angka Indonesia
                stockCell.textContent = p.stok_unit_kecil ? p.stok_unit_kecil.toLocaleString('id-ID') : '0';
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada data stok saat ini.</td></tr>';
        }
    } catch (error) {
        console.error('Error memuat data stok:', error);
        displayFetchError(error.message || 'Koneksi database gagal.', 'stokTableBody');
    }
}


/**
 * Mengambil data Produk (Tabel `produk`).
 */
async function loadDataProduk() {
    if (!supabase) return;
    const tableBody = document.getElementById('produkTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data Produk...</td></tr>';

    try {
        const { data: produk, error } = await supabase
            .from('produk')
            .select('*');

        if (error) throw error;

        if (produk && produk.length > 0) {
            tableBody.innerHTML = '';
            produk.forEach(p => {
                const row = tableBody.insertRow();
                row.className = 'hover:bg-gray-50 transition-colors duration-100';
                row.insertCell().textContent = p.nama_produk || '-';
                row.insertCell().textContent = p.sku || '-';
                row.insertCell().textContent = p.deskripsi ? p.deskripsi.substring(0, 50) + '...' : '-';
                row.insertCell().textContent = p.unit_besar || '-';
                row.insertCell().textContent = p.unit_kecil || '-';
                row.insertCell().textContent = p.konversi_kecil || 0;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada data produk.</td></tr>';
        }
    } catch (error) {
        console.error('Error memuat data produk:', error);
        displayFetchError(error.message || 'Koneksi database gagal.', 'produkTableBody');
    }
}

/**
 * Mengambil data riwayat Barang Masuk (Tabel `barang_masuk`) dengan join ke `produk`.
 */
async function loadDataMasuk() {
    if (!supabase) return;
    const tableBody = document.getElementById('masukTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Memuat data Barang Masuk...</td></tr>';

    try {
        // Fetch data barang masuk dan join dengan nama/sku produk
        const { data: masuk, error } = await supabase
            .from('barang_masuk')
            .select(`
                *,
                produk (nama_produk, sku)
            `)
            .order('tanggal_masuk', { ascending: false });

        if (error) throw error;

        if (masuk && masuk.length > 0) {
            tableBody.innerHTML = '';
            masuk.forEach(t => {
                const row = tableBody.insertRow();
                row.className = 'hover:bg-gray-50 transition-colors duration-100';
                row.insertCell().textContent = new Date(t.tanggal_masuk).toLocaleDateString('id-ID');
                row.insertCell().textContent = t.produk ? `${t.produk.nama_produk} (${t.produk.sku})` : 'Produk tidak dikenal';
                row.insertCell().textContent = t.jumlah_unit_besar.toLocaleString('id-ID');
                row.insertCell().textContent = t.sumber || '-';
                row.insertCell().textContent = t.catatan ? t.catatan.substring(0, 50) + '...' : '-';
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Tidak ada riwayat barang masuk.</td></tr>';
        }
        
        // Setelah memuat riwayat, pastikan form Masuk terlihat (opsional, tapi bagus)
        switchView('masuk', 'Catat Barang Masuk');

    } catch (error) {
        console.error('Error memuat data barang masuk:', error);
        displayFetchError(error.message || 'Koneksi database gagal.', 'masukTableBody');
    }
}

/**
 * Mengambil data riwayat Barang Keluar (Tabel `barang_keluar`) dengan join ke `produk`.
 */
async function loadDataKeluar() {
    if (!supabase) return;
    const tableBody = document.getElementById('keluarTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Memuat data Barang Keluar...</td></tr>';

    try {
        // Fetch data barang keluar dan join dengan nama/sku produk
        const { data: keluar, error } = await supabase
            .from('barang_keluar')
            .select(`
                *,
                produk (nama_produk, sku)
            `)
            .order('tanggal_keluar', { ascending: false });

        if (error) throw error;

        if (keluar && keluar.length > 0) {
            tableBody.innerHTML = '';
            keluar.forEach(t => {
                const row = tableBody.insertRow();
                row.className = 'hover:bg-gray-50 transition-colors duration-100';
                row.insertCell().textContent = new Date(t.tanggal_keluar).toLocaleDateString('id-ID');
                row.insertCell().textContent = t.produk ? `${t.produk.nama_produk} (${t.produk.sku})` : 'Produk tidak dikenal';
                row.insertCell().textContent = t.jumlah_unit_kecil.toLocaleString('id-ID');
                row.insertCell().textContent = t.tujuan || '-';
                row.insertCell().textContent = t.catatan ? t.catatan.substring(0, 50) + '...' : '-';
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Tidak ada riwayat barang keluar.</td></tr>';
        }

        // Setelah memuat riwayat, pastikan form Keluar terlihat (opsional, tapi bagus)
        switchView('keluar', 'Catat Barang Keluar');

    } catch (error) {
        console.error('Error memuat data barang keluar:', error);
        displayFetchError(error.message || 'Koneksi database gagal.', 'keluarTableBody');
    }
}


/**
 * Mengambil data produk dan mengisi dropdown (select) di form Masuk dan Keluar.
 */
async function loadProdukToDropdowns() {
    if (!supabase) return;
    const dropdownKeluar = document.getElementById('produk_id_keluar');
    const dropdownMasuk = document.getElementById('produk_id_masuk');
    
    // Reset dropdown
    dropdownKeluar.innerHTML = '<option value="" disabled selected>-- Memuat produk... --</option>';
    dropdownMasuk.innerHTML = '<option value="" disabled selected>-- Memuat produk... --</option>';

    try {
        const { data: produk, error } = await supabase
            .from('produk')
            .select('id, nama_produk, sku'); // Hanya ambil data yang diperlukan

        if (error) throw error;

        if (produk) {
            dropdownKeluar.innerHTML = '<option value="" disabled selected>-- Pilih Produk --</option>';
            dropdownMasuk.innerHTML = '<option value="" disabled selected>-- Pilih Produk --</option>';

            produk.forEach(p => {
                const optionText = `${p.nama_produk} (SKU: ${p.sku})`;
                
                // Untuk Barang Keluar
                const optionKeluar = document.createElement('option');
                optionKeluar.value = p.id; 
                optionKeluar.textContent = optionText;
                dropdownKeluar.appendChild(optionKeluar);

                // Untuk Barang Masuk
                const optionMasuk = document.createElement('option');
                optionMasuk.value = p.id; 
                optionMasuk.textContent = optionText;
                dropdownMasuk.appendChild(optionMasuk);
            });
        }
    } catch (error) {
        console.error('Error memuat produk untuk dropdown:', error);
        dropdownKeluar.innerHTML = '<option value="" disabled selected>Gagal memuat produk</option>';
        dropdownMasuk.innerHTML = '<option value="" disabled selected>Gagal memuat produk</option>';
    }
}


// --- FUNGSI INTERAKSI SUPABASE (CREATE/SUBMIT) ---

/**
 * Menangani pengiriman data Barang Keluar (Tabel `barang_keluar`).
 */
async function handleSubmitBarangKeluar(event) {
    event.preventDefault(); 
    if (!supabase) return;

    const form = document.getElementById('formBarangKeluar');
    const pesanStatus = document.getElementById('pesanStatusKeluar');

    // Validasi dasar
    if (!form.produk_id_keluar.value || !form.jumlah_unit_kecil.value || !form.tanggal_keluar.value) {
        pesanStatus.textContent = '❌ Harap lengkapi semua bidang wajib (Produk, Jumlah, Tanggal).';
        pesanStatus.className = 'mt-2 text-sm font-medium text-red-600';
        setTimeout(() => { pesanStatus.textContent = ''; }, 5000);
        return;
    }

    const dataBaru = {
        produk_id: form.produk_id_keluar.value,
        jumlah_unit_kecil: parseInt(form.jumlah_unit_kecil.value, 10),
        tanggal_keluar: form.tanggal_keluar.value,
        tujuan: form.tujuan.value,
        catatan: form.catatan_keluar.value,
    };

    pesanStatus.textContent = 'Memproses data...';
    pesanStatus.className = 'mt-2 text-sm font-medium text-indigo-600';

    try {
        const { error } = await supabase
            .from('barang_keluar')
            .insert([dataBaru]);

        if (error) throw error;
        
        console.log('Barang Keluar berhasil dicatat.');
        pesanStatus.textContent = '✅ Barang Keluar berhasil dicatat!';
        pesanStatus.className = 'mt-2 text-sm font-medium text-green-600';
        form.reset(); 
        loadDataKeluar(); // Refresh riwayat setelah submit
        loadDataStok(); // Refresh stok setelah submit
    } catch (error) {
        console.error('Error saat mencatat Barang Keluar:', error);
        pesanStatus.textContent = `❌ Gagal mencatat. Error: ${error.message}`;
        pesanStatus.className = 'mt-2 text-sm font-medium text-red-600';
    } finally {
        setTimeout(() => {
            pesanStatus.textContent = '';
        }, 5000);
    }
}

/**
 * Menangani pengiriman data Barang Masuk (Tabel `barang_masuk`).
 */
async function handleSubmitBarangMasuk(event) {
    event.preventDefault(); 
    if (!supabase) return;

    const form = document.getElementById('formBarangMasuk');
    const pesanStatus = document.getElementById('pesanStatusMasuk');

    // Validasi dasar
    if (!form.produk_id_masuk.value || !form.jumlah_unit_besar.value || !form.tanggal_masuk.value) {
        pesanStatus.textContent = '❌ Harap lengkapi semua bidang wajib (Produk, Jumlah, Tanggal).';
        pesanStatus.className = 'mt-2 text-sm font-medium text-red-600';
        setTimeout(() => { pesanStatus.textContent = ''; }, 5000);
        return;
    }

    const dataBaru = {
        produk_id: form.produk_id_masuk.value,
        jumlah_unit_besar: parseInt(form.jumlah_unit_besar.value, 10),
        tanggal_masuk: form.tanggal_masuk.value,
        sumber: form.sumber.value,
        catatan: form.catatan_masuk.value,
    };

    pesanStatus.textContent = 'Memproses data...';
    pesanStatus.className = 'mt-2 text-sm font-medium text-indigo-600';

    try {
        const { error } = await supabase
            .from('barang_masuk')
            .insert([dataBaru]);
        
        if (error) throw error;

        console.log('Barang Masuk berhasil dicatat.');
        pesanStatus.textContent = '✅ Barang Masuk berhasil dicatat!';
        pesanStatus.className = 'mt-2 text-sm font-medium text-green-600';
        form.reset(); 
        loadDataMasuk(); // Refresh riwayat setelah submit
        loadDataStok(); // Refresh stok setelah submit
    } catch (error) {
        console.error('Error saat mencatat Barang Masuk:', error);
        pesanStatus.textContent = `❌ Gagal mencatat. Error: ${error.message}`;
        pesanStatus.className = 'mt-2 text-sm font-medium text-red-600';
    } finally {
        setTimeout(() => {
            pesanStatus.textContent = '';
        }, 5000);
    }
}


// **INIALISASI APLIKASI**
document.addEventListener('DOMContentLoaded', () => {
    
    // PERIKSA KRITIKAL: Cek apakah kredensial Supabase sudah diganti
    const isConfigMissing = SUPABASE_URL.includes('[GANTI_DENGAN_URL_ANDA]') || SUPABASE_ANON_KEY.includes('[GANTI_DENGAN_ANON_KEY_ANDA]');

    if (isConfigMissing) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 p-6 rounded-xl shadow-lg mx-auto max-w-2xl mt-10" role="alert">
                <strong class="font-bold text-lg block mb-2">🚨 Kesalahan Konfigurasi Fatal!</strong>
                <span class="block text-sm">Harap ganti placeholder <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code> di **file app.js**.</span>
                <span class="block text-sm mt-1">Navigasi UI diaktifkan, tetapi data tidak akan dimuat.</span>
            </div>
        `;
        console.error("FATAL ERROR: Kredensial Supabase belum diatur. Harap ganti placeholder di app.js.");
        // Lanjutkan untuk memastikan navigasi menu tetap berfungsi
    }

    // 1. Tambahkan event listener untuk navigasi sidebar (PRIORITAS TINGGI)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget.dataset.target;
            const titleMap = {
                'stok': 'Stok Saat Ini',
                'produk': 'Data Master Produk',
                'masuk': 'Catat Barang Masuk',
                'keluar': 'Catat Barang Keluar'
            };
            switchView(target, titleMap[target]);
        });
    });

    // 2. Tambahkan event listener untuk form
    const formBarangKeluar = document.getElementById('formBarangKeluar');
    const formBarangMasuk = document.getElementById('formBarangMasuk');

    if (formBarangKeluar) {
        formBarangKeluar.addEventListener('submit', handleSubmitBarangKeluar);
    }
    
    if (formBarangMasuk) {
        formBarangMasuk.addEventListener('submit', handleSubmitBarangMasuk);
    }
    
    // 3. Muat tampilan dan data awal (Hanya jika konfigurasi tidak hilang)
    switchView('stok', 'Stok Saat Ini');
    
    if (!isConfigMissing && supabase) {
        // Jika konfigurasi OK, coba muat data awal
        loadProdukToDropdowns(); 
    }
});
