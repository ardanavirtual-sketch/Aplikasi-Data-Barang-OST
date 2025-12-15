// Konfigurasi Supabase
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs';

// Inisialisasi Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi untuk inisialisasi database (buat tabel jika belum ada)
async function initializeDatabase() {
    console.log('Menginisialisasi database...');
    
    // Cek apakah tabel sudah ada
    const { data: tables, error } = await supabase
        .from('barang')
        .select('*')
        .limit(1);
    
    // Jika tabel tidak ada, buat tabel-tabel yang diperlukan
    // Catatan: Di Supabase, tabel dibuat melalui SQL di dashboard
    // Berikut adalah contoh SQL untuk membuat tabel:
    
    /*
    -- Tabel Kategori
    CREATE TABLE kategori (
        id SERIAL PRIMARY KEY,
        nama_kategori VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Tabel Barang
    CREATE TABLE barang (
        id SERIAL PRIMARY KEY,
        kode_barang VARCHAR(50) UNIQUE NOT NULL,
        nama_barang VARCHAR(200) NOT NULL,
        kategori_id INTEGER REFERENCES kategori(id),
        stok INTEGER DEFAULT 0,
        satuan VARCHAR(50) NOT NULL,
        min_stok INTEGER DEFAULT 5,
        lokasi VARCHAR(100),
        deskripsi TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Tabel Barang Masuk
    CREATE TABLE barang_masuk (
        id SERIAL PRIMARY KEY,
        barang_id INTEGER REFERENCES barang(id) NOT NULL,
        jumlah INTEGER NOT NULL,
        tanggal DATE NOT NULL,
        supplier VARCHAR(200),
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Tabel Barang Keluar
    CREATE TABLE barang_keluar (
        id SERIAL PRIMARY KEY,
        barang_id INTEGER REFERENCES barang(id) NOT NULL,
        jumlah INTEGER NOT NULL,
        tanggal DATE NOT NULL,
        penerima VARCHAR(200),
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Insert beberapa data kategori contoh
    INSERT INTO kategori (nama_kategori, deskripsi) VALUES
    ('Elektronik', 'Barang-barang elektronik'),
    ('Perkakas', 'Alat-alat perkakas'),
    ('Bahan Bangunan', 'Material bangunan'),
    ('Kebutuhan Kantor', 'Alat tulis dan perlengkapan kantor');
    */
    
    if (error && error.code === '42P01') {
        console.error('Tabel belum dibuat. Silakan buat tabel terlebih dahulu di dashboard Supabase.');
        alert('Tabel database belum dibuat. Silakan buat tabel terlebih dahulu di dashboard Supabase menggunakan SQL yang disediakan.');
        return false;
    }
    
    console.log('Database sudah diinisialisasi.');
    return true;
}

// Fungsi untuk mendapatkan data barang
async function getBarang() {
    const { data, error } = await supabase
        .from('barang')
        .select(`
            *,
            kategori:nama_kategori
        `)
        .order('nama_barang', { ascending: true });
    
    if (error) {
        console.error('Error mengambil data barang:', error);
        return [];
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
        return [];
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
        return null;
    }
    
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
        return null;
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
        return false;
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
        return null;
    }
    
    // Update stok barang
    await updateStokBarang(barangMasuk.barang_id, barangMasuk.jumlah, 'in');
    
    return data[0];
}

// Fungsi untuk menambahkan barang keluar
async function addBarangKeluar(barangKeluar) {
    const { data, error } = await supabase
        .from('barang_keluar')
        .insert([barangKeluar])
        .select();
    
    if (error) {
        console.error('Error menambahkan barang keluar:', error);
        return null;
    }
    
    // Update stok barang
    await updateStokBarang(barangKeluar.barang_id, barangKeluar.jumlah, 'out');
    
    return data[0];
}

// Fungsi untuk update stok barang
async function updateStokBarang(barangId, jumlah, type) {
    // Dapatkan stok saat ini
    const { data: barang, error: getError } = await supabase
        .from('barang')
        .select('stok')
        .eq('id', barangId)
        .single();
    
    if (getError) {
        console.error('Error mengambil data stok:', getError);
        return false;
    }
    
    // Hitung stok baru
    let stokBaru = barang.stok;
    if (type === 'in') {
        stokBaru += jumlah;
    } else if (type === 'out') {
        stokBaru -= jumlah;
    }
    
    // Update stok
    const { error: updateError } = await supabase
        .from('barang')
        .update({ stok: stokBaru })
        .eq('id', barangId);
    
    if (updateError) {
        console.error('Error mengupdate stok:', updateError);
        return false;
    }
    
    return true;
}

// Fungsi untuk mendapatkan data barang masuk
async function getBarangMasuk(filter = {}) {
    let query = supabase
        .from('barang_masuk')
        .select(`
            *,
            barang:kode_barang,
            barang:nama_barang
        `)
        .order('tanggal', { ascending: false });
    
    if (filter.tanggal) {
        query = query.eq('tanggal', filter.tanggal);
    }
    
    if (filter.barang_id) {
        query = query.eq('barang_id', filter.barang_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error mengambil data barang masuk:', error);
        return [];
    }
    
    return data;
}

// Fungsi untuk mendapatkan data barang keluar
async function getBarangKeluar(filter = {}) {
    let query = supabase
        .from('barang_keluar')
        .select(`
            *,
            barang:kode_barang,
            barang:nama_barang
        `)
        .order('tanggal', { ascending: false });
    
    if (filter.tanggal) {
        query = query.eq('tanggal', filter.tanggal);
    }
    
    if (filter.barang_id) {
        query = query.eq('barang_id', filter.barang_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error mengambil data barang keluar:', error);
        return [];
    }
    
    return data;
}

// Fungsi untuk mendapatkan laporan
async function getLaporan(startDate, endDate, type) {
    let query;
    
    if (type === 'in' || type === 'all') {
        // Ambil data barang masuk
        const { data: dataMasuk, error: errorMasuk } = await supabase
            .from('barang_masuk')
            .select(`
                *,
                barang:kode_barang,
                barang:nama_barang
            `)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate)
            .order('tanggal', { ascending: false });
        
        if (errorMasuk) {
            console.error('Error mengambil data barang masuk untuk laporan:', errorMasuk);
            return [];
        }
        
        if (type === 'in') {
            return dataMasuk.map(item => ({
                ...item,
                jenis: 'MASUK'
            }));
        }
        
        // Ambil data barang keluar
        const { data: dataKeluar, error: errorKeluar } = await supabase
            .from('barang_keluar')
            .select(`
                *,
                barang:kode_barang,
                barang:nama_barang
            `)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate)
            .order('tanggal', { ascending: false });
        
        if (errorKeluar) {
            console.error('Error mengambil data barang keluar untuk laporan:', errorKeluar);
            return dataMasuk.map(item => ({
                ...item,
                jenis: 'MASUK'
            }));
        }
        
        // Gabungkan data
        const combinedData = [
            ...dataMasuk.map(item => ({
                ...item,
                jenis: 'MASUK'
            })),
            ...dataKeluar.map(item => ({
                ...item,
                jenis: 'KELUAR'
            }))
        ].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        return combinedData;
    } else if (type === 'out') {
        // Ambil data barang keluar saja
        const { data, error } = await supabase
            .from('barang_keluar')
            .select(`
                *,
                barang:kode_barang,
                barang:nama_barang
            `)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate)
            .order('tanggal', { ascending: false });
        
        if (error) {
            console.error('Error mengambil data barang keluar untuk laporan:', error);
            return [];
        }
        
        return data.map(item => ({
            ...item,
            jenis: 'KELUAR'
        }));
    }
    
    return [];
}

// Fungsi untuk menambahkan kategori
async function addKategori(kategori) {
    const { data, error } = await supabase
        .from('kategori')
        .insert([kategori])
        .select();
    
    if (error) {
        console.error('Error menambahkan kategori:', error);
        return null;
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
        return null;
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
        return { success: false, message: 'Gagal mengecek penggunaan kategori' };
    }
    
    if (barang && barang.length > 0) {
        return { success: false, message: 'Kategori tidak dapat dihapus karena masih digunakan oleh barang' };
    }
    
    // Hapus kategori
    const { error } = await supabase
        .from('kategori')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error menghapus kategori:', error);
        return { success: false, message: 'Gagal menghapus kategori' };
    }
    
    return { success: true, message: 'Kategori berhasil dihapus' };
}

// Export fungsi-fungsi
window.supabaseFunctions = {
    initializeDatabase,
    getBarang,
    getKategori,
    addBarang,
    updateBarang,
    deleteBarang,
    addBarangMasuk,
    addBarangKeluar,
    getBarangMasuk,
    getBarangKeluar,
    getLaporan,
    addKategori,
    updateKategori,
    deleteKategori
};
