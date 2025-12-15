// Konfigurasi Supabase - GANTI DENGAN URL DAN KEY ANDA
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs';

// Inisialisasi Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi untuk inisialisasi database
async function initializeDatabase() {
    console.log('Menginisialisasi database...');
    
    try {
        // Cek koneksi dengan mengambil data dari tabel barang
        const { data, error } = await supabase
            .from('barang')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('Error koneksi database:', error);
            
            // Jika tabel belum ada, beri petunjuk
            if (error.code === '42P01') {
                console.log('Tabel belum dibuat. Silakan buat tabel di Supabase.');
                return false;
            }
            throw error;
        }
        
        console.log('Database terhubung dengan sukses');
        return true;
        
    } catch (error) {
        console.error('Gagal menginisialisasi database:', error);
        return false;
    }
}

// SQL untuk membuat tabel (jalankan di SQL Editor Supabase)
const CREATE_TABLES_SQL = `
-- Tabel Kategori
CREATE TABLE IF NOT EXISTS kategori (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Satuan Konversi
CREATE TABLE IF NOT EXISTS satuan_konversi (
    id SERIAL PRIMARY KEY,
    barang_id INTEGER NOT NULL,
    jumlah_per_dus INTEGER NOT NULL DEFAULT 24,
    satuan_unit VARCHAR(20) NOT NULL DEFAULT 'Pcs',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(barang_id, satuan_unit)
);

-- Tabel Barang
CREATE TABLE IF NOT EXISTS barang (
    id SERIAL PRIMARY KEY,
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    nama_barang VARCHAR(200) NOT NULL,
    kategori_id INTEGER REFERENCES kategori(id),
    stok_pcs INTEGER DEFAULT 0,
    min_stok_pcs INTEGER DEFAULT 24,
    lokasi VARCHAR(100),
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Barang Masuk
CREATE TABLE IF NOT EXISTS barang_masuk (
    id SERIAL PRIMARY KEY,
    barang_id INTEGER REFERENCES barang(id) NOT NULL,
    jumlah_dus DECIMAL(10,2) NOT NULL,
    total_pcs INTEGER NOT NULL,
    tanggal DATE NOT NULL,
    supplier VARCHAR(200),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel Barang Keluar
CREATE TABLE IF NOT EXISTS barang_keluar (
    id SERIAL PRIMARY KEY,
    barang_id INTEGER REFERENCES barang(id) NOT NULL,
    satuan_keluar VARCHAR(20) NOT NULL,
    jumlah INTEGER NOT NULL,
    total_pcs INTEGER NOT NULL,
    tanggal DATE NOT NULL,
    penerima VARCHAR(200),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert data kategori contoh
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Makanan', 'Barang makanan dan minuman'),
('Elektronik', 'Barang elektronik dan aksesoris'),
('Peralatan', 'Peralatan kantor dan rumah tangga'),
('Kesehatan', 'Obat-obatan dan alat kesehatan')
ON CONFLICT DO NOTHING;
`;

// Fungsi untuk mendapatkan data barang
async function getBarang() {
    const { data, error } = await supabase
        .from('barang')
        .select(`
            *,
            kategori:kategori_id(nama_kategori),
            konversi:satuan_konversi(jumlah_per_dus, satuan_unit)
        `)
        .order('nama_barang', { ascending: true });
    
    if (error) {
        console.error('Error mengambil data barang:', error);
        throw error;
    }
    
    return data;
}

// Fungsi untuk mendapatkan data kategori
async function getKategori() {
    const { data, error } = await supabase
        .from('kategori')
        .select('*')
        .order('nama_kategori', { ascending: true });
    
    if (error) {
        console.error('Error mengambil data kategori:', error);
        throw error;
    }
    
    return data;
}

// Fungsi untuk mendapatkan data satuan konversi
async function getSatuanKonversi() {
    const { data, error } = await supabase
        .from('satuan_konversi')
        .select(`
            *,
            barang:barang_id(kode_barang, nama_barang)
        `)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error mengambil data satuan konversi:', error);
        throw error;
    }
    
    return data;
}

// Fungsi untuk mendapatkan konversi untuk barang tertentu
async function getKonversiBarang(barangId) {
    const { data, error } = await supabase
        .from('satuan_konversi')
        .select('*')
        .eq('barang_id', barangId);
    
    if (error) {
        console.error('Error mengambil konversi barang:', error);
        throw error;
    }
    
    return data;
}

// Fungsi untuk menambahkan barang baru
async function addBarang(barang) {
    const { data, error } = await supabase
        .from('barang')
        .insert([barang])
        .select();
    
    if (error) {
        console.error('Error menambahkan barang:', error);
        throw error;
    }
    
    // Tambahkan konversi default
    const konversi = {
        barang_id: data[0].id,
        jumlah_per_dus: barang.jumlah_per_dus || 24,
        satuan_unit: barang.satuan_unit || 'Pcs'
    };
    
    await addSatuanKonversi(konversi);
    
    return data[0];
}

// Fungsi untuk mengupdate barang
async function updateBarang(id, barang) {
    const { data, error } = await supabase
        .from('barang')
        .update(barang)
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Error mengupdate barang:', error);
        throw error;
    }
    
    return data[0];
}

// Fungsi untuk menghapus barang
async function deleteBarang(id) {
    const { error } = await supabase
        .from('barang')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error menghapus barang:', error);
        throw error;
    }
    
    return true;
}

// Fungsi untuk menambahkan satuan konversi
async function addSatuanKonversi(konversi) {
    const { data, error } = await supabase
        .from('satuan_konversi')
        .insert([konversi])
        .select();
    
    if (error) {
        console.error('Error menambahkan satuan konversi:', error);
        throw error;
    }
    
    return data[0];
}

// Fungsi untuk mengupdate satuan konversi
async function updateSatuanKonversi(id, konversi) {
    const { data, error } = await supabase
        .from('satuan_konversi')
        .update(konversi)
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Error mengupdate satuan konversi:', error);
        throw error;
    }
    
    return data[0];
}

// Fungsi untuk menghapus satuan konversi
async function deleteSatuanKonversi(id) {
    const { error } = await supabase
        .from('satuan_konversi')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error menghapus satuan konversi:', error);
        throw error;
    }
    
    return true;
}

// Fungsi untuk menambahkan barang masuk
async function addBarangMasuk(barangMasuk) {
    const { data, error } = await supabase
        .from('barang_masuk')
        .insert([barangMasuk])
        .select();
    
    if (error) {
        console.error('Error menambahkan barang masuk:', error);
        throw error;
    }
    
    // Update stok barang
    await updateStokBarang(barangMasuk.barang_id, barangMasuk.total_pcs, 'in');
    
    return data[0];
}

// Fungsi untuk menambahkan multiple barang masuk
async function addMultipleBarangMasuk(items, tanggal, supplier = null, keterangan = null) {
    const transactions = items.map(item => ({
        ...item,
        tanggal,
        supplier,
        keterangan: item.keterangan || keterangan
    }));
    
    const { data, error } = await supabase
        .from('barang_masuk')
        .insert(transactions)
        .select();
    
    if (error) {
        console.error('Error menambahkan multiple barang masuk:', error);
        throw error;
    }
    
    // Update stok untuk setiap barang
    for (const item of items) {
        await updateStokBarang(item.barang_id, item.total_pcs, 'in');
    }
    
    return data;
}

// Fungsi untuk menambahkan barang keluar
async function addBarangKeluar(barangKeluar) {
    const { data, error } = await supabase
        .from('barang_keluar')
        .insert([barangKeluar])
        .select();
    
    if (error) {
        console.error('Error menambahkan barang keluar:', error);
        throw error;
    }
    
    // Update stok barang
    await updateStokBarang(barangKeluar.barang_id, barangKeluar.total_pcs, 'out');
    
    return data[0];
}

// Fungsi untuk menambahkan multiple barang keluar
async function addMultipleBarangKeluar(items, tanggal, penerima = null, keterangan = null) {
    const transactions = items.map(item => ({
        ...item,
        tanggal,
        penerima,
        keterangan: item.keterangan || keterangan
    }));
    
    const { data, error } = await supabase
        .from('barang_keluar')
        .insert(transactions)
        .select();
    
    if (error) {
        console.error('Error menambahkan multiple barang keluar:', error);
        throw error;
    }
    
    // Update stok untuk setiap barang
    for (const item of items) {
        await updateStokBarang(item.barang_id, item.total_pcs, 'out');
    }
    
    return data;
}

// Fungsi untuk update stok barang
async function updateStokBarang(barangId, jumlahPcs, type) {
    // Dapatkan stok saat ini
    const { data: barang, error: getError } = await supabase
        .from('barang')
        .select('stok_pcs')
        .eq('id', barangId)
        .single();
    
    if (getError) {
        console.error('Error mengambil data stok:', getError);
        throw getError;
    }
    
    // Hitung stok baru
    let stokBaru = barang.stok_pcs;
    if (type === 'in') {
        stokBaru += jumlahPcs;
    } else if (type === 'out') {
        stokBaru -= jumlahPcs;
    }
    
    // Update stok
    const { error: updateError } = await supabase
        .from('barang')
        .update({ 
            stok_pcs: stokBaru,
            updated_at: new Date().toISOString()
        })
        .eq('id', barangId);
    
    if (updateError) {
        console.error('Error mengupdate stok:', updateError);
        throw updateError;
    }
    
    return true;
}

// Fungsi untuk mendapatkan data barang masuk
async function getBarangMasuk(filter = {}) {
    let query = supabase
        .from('barang_masuk')
        .select(`
            *,
            barang:barang_id(kode_barang, nama_barang)
        `)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });
    
    if (filter.tanggal) {
        query = query.eq('tanggal', filter.tanggal);
    }
    
    if (filter.barang_id) {
        query = query.eq('barang_id', filter.barang_id);
    }
    
    if (filter.startDate && filter.endDate) {
        query = query.gte('tanggal', filter.startDate).lte('tanggal', filter.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error mengambil data barang masuk:', error);
        throw error;
    }
    
    return data;
}

// Fungsi untuk mendapatkan data barang keluar
async function getBarangKeluar(filter = {}) {
    let query = supabase
        .from('barang_keluar')
        .select(`
            *,
            barang:barang_id(kode_barang, nama_barang)
        `)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });
    
    if (filter.tanggal) {
        query = query.eq('tanggal', filter.tanggal);
    }
    
    if (filter.barang_id) {
        query = query.eq('barang_id', filter.barang_id);
    }
    
    if (filter.startDate && filter.endDate) {
        query = query.gte('tanggal', filter.startDate).lte('tanggal', filter.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error mengambil data barang keluar:', error);
        throw error;
    }
    
    return data;
}

// Fungsi untuk mendapatkan laporan
async function getLaporan(startDate, endDate, type) {
    try {
        let dataMasuk = [];
        let dataKeluar = [];
        
        if (type === 'in' || type === 'all') {
            const { data: masuk, error: errorMasuk } = await supabase
                .from('barang_masuk')
                .select(`
                    *,
                    barang:barang_id(kode_barang, nama_barang)
                `)
                .gte('tanggal', startDate)
                .lte('tanggal', endDate)
                .order('tanggal', { ascending: false });
            
            if (errorMasuk) throw errorMasuk;
            dataMasuk = masuk;
        }
        
        if (type === 'out' || type === 'all') {
            const { data: keluar, error: errorKeluar } = await supabase
                .from('barang_keluar')
                .select(`
                    *,
                    barang:barang_id(kode_barang, nama_barang)
                `)
                .gte('tanggal', startDate)
                .lte('tanggal', endDate)
                .order('tanggal', { ascending: false });
            
            if (errorKeluar) throw errorKeluar;
            dataKeluar = keluar;
        }
        
        // Format data untuk laporan
        const laporan = [];
        
        if (type === 'in' || type === 'all') {
            dataMasuk.forEach(item => {
                laporan.push({
                    ...item,
                    jenis: 'MASUK',
                    satuan: 'Dus',
                    jumlah: item.jumlah_dus,
                    total_pcs: item.total_pcs
                });
            });
        }
        
        if (type === 'out' || type === 'all') {
            dataKeluar.forEach(item => {
                laporan.push({
                    ...item,
                    jenis: 'KELUAR',
                    satuan: item.satuan_keluar,
                    jumlah: item.jumlah,
                    total_pcs: item.total_pcs
                });
            });
        }
        
        // Urutkan berdasarkan tanggal
        laporan.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        return laporan;
        
    } catch (error) {
        console.error('Error mengambil laporan:', error);
        throw error;
    }
}

// Fungsi untuk menambahkan kategori
async function addKategori(kategori) {
    const { data, error } = await supabase
        .from('kategori')
        .insert([kategori])
        .select();
    
    if (error) {
        console.error('Error menambahkan kategori:', error);
        throw error;
    }
    
    return data[0];
}

// Fungsi untuk mengupdate kategori
async function updateKategori(id, kategori) {
    const { data, error } = await supabase
        .from('kategori')
        .update(kategori)
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Error mengupdate kategori:', error);
        throw error;
    }
    
    return data[0];
}

// Fungsi untuk menghapus kategori
async function deleteKategori(id) {
    // Cek apakah kategori digunakan oleh barang
    const { data: barang, error: checkError } = await supabase
        .from('barang')
        .select('id')
        .eq('kategori_id', id)
        .limit(1);
    
    if (checkError) {
        console.error('Error mengecek penggunaan kategori:', checkError);
        throw checkError;
    }
    
    if (barang && barang.length > 0) {
        throw new Error('Kategori tidak dapat dihapus karena masih digunakan oleh barang');
    }
    
    // Hapus kategori
    const { error } = await supabase
        .from('kategori')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error menghapus kategori:', error);
        throw error;
    }
    
    return true;
}

// Export fungsi-fungsi
window.supabaseFunctions = {
    initializeDatabase,
    CREATE_TABLES_SQL,
    getBarang,
    getKategori,
    getSatuanKonversi,
    getKonversiBarang,
    addBarang,
    updateBarang,
    deleteBarang,
    addSatuanKonversi,
    updateSatuanKonversi,
    deleteSatuanKonversi,
    addBarangMasuk,
    addMultipleBarangMasuk,
    addBarangKeluar,
    addMultipleBarangKeluar,
    getBarangMasuk,
    getBarangKeluar,
    getLaporan,
    addKategori,
    updateKategori,
    deleteKategori
};
