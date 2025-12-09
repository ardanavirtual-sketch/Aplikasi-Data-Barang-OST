// **KONFIGURASI SUPABASE**
// Ganti dengan URL dan Anon Key project Supabase Anda
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs';

// Inisialisasi Klien Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi untuk mengambil data produk dan mengisi tabel serta dropdown
async function loadDataProduk() {
    const tableBody = document.getElementById('produkTableBody');
    const produkDropdown = document.getElementById('produk_id_keluar');
    tableBody.innerHTML = ''; // Kosongkan tampilan tabel
    produkDropdown.innerHTML = ''; // Kosongkan dropdown

    const { data: produk, error } = await supabase
        .from('produk')
        .select('*');

    if (error) {
        console.error('Error memuat data produk:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="color: red;">Gagal memuat data produk. Cek konsol.</td></tr>';
        produkDropdown.innerHTML = '<option value="">Gagal memuat produk</option>';
        return;
    }

    if (produk) {
        // 1. Mengisi Tabel Produk
        produk.forEach(p => {
            const row = tableBody.insertRow();
            // Perhatikan bahwa ID tidak ditampilkan di tabel, tetapi penting untuk dropdown
            row.insertCell().textContent = p.nama_produk || '-';
            row.insertCell().textContent = p.sku || '-';
            row.insertCell().textContent = p.deskripsi || '-';
            row.insertCell().textContent = p.unit_besar || '-';
            row.insertCell().textContent = p.unit_kecil || '-';
            row.insertCell().textContent = p.konversi_kecil || 0;
        });

        // 2. Mengisi Dropdown (Select) Barang Keluar
        produkDropdown.innerHTML = '<option value="" disabled selected>-- Pilih Produk --</option>'; // Default option
        produk.forEach(p => {
            const option = document.createElement('option');
            // Asumsi tabel 'produk' memiliki kolom 'id' sebagai kunci utama
            option.value = p.id; 
            option.textContent = `${p.nama_produk} (SKU: ${p.sku})`;
            produkDropdown.appendChild(option);
        });

        if (produk.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">Tidak ada data produk.</td></tr>';
        }
    }
}

// Fungsi untuk menangani pengiriman data Barang Keluar
async function handleSubmitBarangKeluar(event) {
    event.preventDefault(); // Mencegah form melakukan reload halaman

    const form = document.getElementById('formBarangKeluar');
    const pesanStatus = document.getElementById('pesanStatus');

    const dataBaru = {
        produk_id: form.produk_id_keluar.value,
        jumlah_unit_kecil: parseInt(form.jumlah_unit_kecil.value, 10),
        tanggal_keluar: form.tanggal_keluar.value,
        tujuan: form.tujuan.value,
        catatan: form.catatan_keluar.value,
        // Kolom 'id' akan diisi otomatis oleh Supabase
    };

    pesanStatus.textContent = 'Memproses data...';
    pesanStatus.style.color = 'orange';

    const { data, error } = await supabase
        .from('barang_keluar')
        .insert([dataBaru])
        .select(); // Mengembalikan data yang baru dimasukkan

    if (error) {
        console.error('Error saat mencatat Barang Keluar:', error);
        pesanStatus.textContent = `❌ Gagal mencatat. Error: ${error.message}`;
        pesanStatus.style.color = 'red';
    } else {
        console.log('Barang Keluar berhasil dicatat:', data);
        pesanStatus.textContent = '✅ Barang Keluar berhasil dicatat!';
        pesanStatus.style.color = 'green';
        form.reset(); // Mengosongkan form setelah berhasil

        // Hilangkan pesan status setelah beberapa detik
        setTimeout(() => {
            pesanStatus.textContent = '';
        }, 5000);
    }
}

// **INIALISASI APLIKASI**
document.addEventListener('DOMContentLoaded', () => {
    // 1. Muat data produk saat halaman dimuat
    loadDataProduk();

    // 2. Tambahkan event listener untuk form Barang Keluar
    const formBarangKeluar = document.getElementById('formBarangKeluar');
    formBarangKeluar.addEventListener('submit', handleSubmitBarangKeluar);
});
