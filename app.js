// **KONFIGURASI SUPABASE**
// Ganti dengan URL dan Anon Key project Supabase Anda
// Dapatkan di: Project Settings > API
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs

// Inisialisasi Klien Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- FUNGSI UTILITY & NAVIGASI ---

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
            item.querySelector('svg').classList.add('text-indigo-500');
        } else {
            item.querySelector('svg').classList.remove('text-indigo-500');
        }
    });
    
    // Panggil fungsi pemuatan data jika halaman yang relevan dibuka
    if (targetView === 'produk') {
        loadDataProduk();
    } else if (targetView === 'stok') {
        loadDataStok();
    } else if (targetView === 'keluar' || targetView === 'masuk') {
        loadProdukToDropdowns();
    }
}


// --- FUNGSI INTERAKSI SUPABASE ---

/**
 * Mengambil data Stok Saat Ini (Tabel `stok_saat_ini_pcs`).
 */
async function loadDataStok() {
    const tableBody = document.getElementById('stokTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data Stok...</td></tr>';

    // Asumsi tabel stok_saat_ini_pcs memiliki kolom 'stok_unit_kecil'
    const { data: stok, error } = await supabase
        .from('stok_saat_ini_pcs')
        .select('*');

    if (error) {
        console.error('Error memuat data stok:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Gagal memuat data stok. Pesan: ${error.message}</td></tr>`;
        return;
    }

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
            stockCell.className = 'font-semibold';
            stockCell.textContent = p.stok_unit_kecil ? p.stok_unit_kecil.toLocaleString('id-ID') : '0';
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada data stok saat ini.</td></tr>';
    }
}


/**
 * Mengambil data Produk (Tabel `produk`).
 */
async function loadDataProduk() {
    const tableBody = document.getElementById('produkTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data Produk...</td></tr>';

    const { data: produk, error } = await supabase
        .from('produk')
        .select('*');

    if (error) {
        console.error('Error memuat data produk:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Gagal memuat data produk. Pesan: ${error.message}</td></tr>`;
        return;
    }

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
}

/**
 * Mengambil data produk dan mengisi dropdown (select) di form Masuk dan Keluar.
 */
async function loadProdukToDropdowns() {
    const dropdownKeluar = document.getElementById('produk_id_keluar');
    const dropdownMasuk = document.getElementById('produk_id_masuk');
    
    // Reset dropdown
    dropdownKeluar.innerHTML = '<option value="" disabled selected>-- Memuat produk... --</option>';
    dropdownMasuk.innerHTML = '<option value="" disabled selected>-- Memuat produk... --</option>';

    const { data: produk, error } = await supabase
        .from('produk')
        .select('id, nama_produk, sku'); // Hanya ambil data yang diperlukan

    if (error) {
        console.error('Error memuat produk untuk dropdown:', error);
        dropdownKeluar.innerHTML = '<option value="" disabled selected>Gagal memuat produk</option>';
        dropdownMasuk.innerHTML = '<option value="" disabled selected>Gagal memuat produk</option>';
        return;
    }

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
}


/**
 * Menangani pengiriman data Barang Keluar (Tabel `barang_keluar`).
 */
async function handleSubmitBarangKeluar(event) {
    event.preventDefault(); 
    const form = document.getElementById('formBarangKeluar');
    const pesanStatus = document.getElementById('pesanStatusKeluar');

    const dataBaru = {
        produk_id: form.produk_id_keluar.value,
        jumlah_unit_kecil: parseInt(form.jumlah_unit_kecil.value, 10),
        tanggal_keluar: form.tanggal_keluar.value,
        tujuan: form.tujuan.value,
        catatan: form.catatan_keluar.value,
    };

    pesanStatus.textContent = 'Memproses data...';
    pesanStatus.className = 'mt-2 text-sm font-medium text-indigo-600';

    const { error } = await supabase
        .from('barang_keluar')
        .insert([dataBaru]);

    if (error) {
        console.error('Error saat mencatat Barang Keluar:', error);
        pesanStatus.textContent = `❌ Gagal mencatat. Error: ${error.message}`;
        pesanStatus.className = 'mt-2 text-sm font-medium text-red-600';
    } else {
        console.log('Barang Keluar berhasil dicatat.');
        pesanStatus.textContent = '✅ Barang Keluar berhasil dicatat!';
        pesanStatus.className = 'mt-2 text-sm font-medium text-green-600';
        form.reset(); 

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
    const form = document.getElementById('formBarangMasuk');
    const pesanStatus = document.getElementById('pesanStatusMasuk');

    const dataBaru = {
        produk_id: form.produk_id_masuk.value,
        jumlah_unit_besar: parseInt(form.jumlah_unit_besar.value, 10),
        tanggal_masuk: form.tanggal_masuk.value,
        sumber: form.sumber.value,
        catatan: form.catatan_masuk.value,
    };

    pesanStatus.textContent = 'Memproses data...';
    pesanStatus.className = 'mt-2 text-sm font-medium text-indigo-600';

    const { error } = await supabase
        .from('barang_masuk')
        .insert([dataBaru]);

    if (error) {
        console.error('Error saat mencatat Barang Masuk:', error);
        pesanStatus.textContent = `❌ Gagal mencatat. Error: ${error.message}`;
        pesanStatus.className = 'mt-2 text-sm font-medium text-red-600';
    } else {
        console.log('Barang Masuk berhasil dicatat.');
        pesanStatus.textContent = '✅ Barang Masuk berhasil dicatat!';
        pesanStatus.className = 'mt-2 text-sm font-medium text-green-600';
        form.reset(); 

        setTimeout(() => {
            pesanStatus.textContent = '';
        }, 5000);
    }
}


// **INIALISASI APLIKASI**
document.addEventListener('DOMContentLoaded', () => {
    
    // PERIKSA: Cek apakah kredensial Supabase sudah diganti (Penyebab umum menu tidak dapat di-klik)
    if (SUPABASE_URL.includes('[GANTI_DENGAN_URL_ANDA]') || SUPABASE_ANON_KEY.includes('[GANTI_DENGAN_ANON_KEY_ANDA]')) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 p-6 rounded-xl shadow-lg mx-auto max-w-2xl mt-10" role="alert">
                <strong class="font-bold text-lg block mb-2">🚨 Kesalahan Konfigurasi Fatal!</strong>
                <span class="block text-sm">Harap ganti placeholder <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code> di **file app.js**.</span>
                <span class="block text-sm mt-1">Aplikasi tidak dapat menginisialisasi fungsi dan event listener tanpa konfigurasi Supabase yang valid.</span>
            </div>
        `;
        console.error("FATAL ERROR: Kredensial Supabase belum diatur. Harap ganti placeholder di app.js.");
        return; // Hentikan eksekusi inisialisasi fungsional
    }

    // 1. Inisialisasi tampilan awal
    switchView('stok', 'Stok Saat Ini');

    // 2. Tambahkan event listener untuk navigasi sidebar
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

    // 3. Tambahkan event listener untuk form Barang Keluar
    const formBarangKeluar = document.getElementById('formBarangKeluar');
    formBarangKeluar.addEventListener('submit', handleSubmitBarangKeluar);
    
    // 4. Tambahkan event listener untuk form Barang Masuk
    const formBarangMasuk = document.getElementById('formBarangMasuk');
    formBarangMasuk.addEventListener('submit', handleSubmitBarangMasuk);
    
    // 5. Muat data produk ke dropdown saat startup
    loadProdukToDropdowns();
});
