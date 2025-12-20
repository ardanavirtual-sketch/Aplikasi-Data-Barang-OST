// supabase-config.js
// Konfigurasi dan fungsi untuk koneksi ke Supabase

const SUPABASE_CONFIG = {
    url: 'https://iltqolfmvhzaiuagtoxt.supabase.co', // Ganti dengan URL Supabase Anda
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs' // Ganti dengan API Key Anda
};

// Inisialisasi Supabase Client
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// SQL untuk membuat tabel database
const CREATE_TABLES_SQL = `
-- Drop existing tables (optional - uncomment if needed)
-- DROP TABLE IF EXISTS barang_keluar;
-- DROP TABLE IF EXISTS barang_masuk;
-- DROP TABLE IF EXISTS barang;
-- DROP TABLE IF EXISTS kategori;
-- DROP TABLE IF EXISTS satuan;

-- Create Kategori Table
CREATE TABLE IF NOT EXISTS kategori (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Satuan Table
CREATE TABLE IF NOT EXISTS satuan (
    id SERIAL PRIMARY KEY,
    nama_satuan VARCHAR(50) NOT NULL UNIQUE,
    simbol VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Barang Table
CREATE TABLE IF NOT EXISTS barang (
    id SERIAL PRIMARY KEY,
    kode_barang VARCHAR(50) NOT NULL UNIQUE,
    nama_barang VARCHAR(200) NOT NULL,
    kategori_id INTEGER REFERENCES kategori(id) ON DELETE SET NULL,
    stok_pcs INTEGER DEFAULT 0,
    min_stok_pcs INTEGER DEFAULT 24,
    lokasi VARCHAR(100),
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Barang Masuk Table
CREATE TABLE IF NOT EXISTS barang_masuk (
    id SERIAL PRIMARY KEY,
    barang_id INTEGER NOT NULL REFERENCES barang(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jumlah_dus DECIMAL(10,2) NOT NULL,
    total_pcs INTEGER NOT NULL,
    supplier VARCHAR(200),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Barang Keluar Table
CREATE TABLE IF NOT EXISTS barang_keluar (
    id SERIAL PRIMARY KEY,
    barang_id INTEGER NOT NULL REFERENCES barang(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    satuan_keluar VARCHAR(50) NOT NULL,
    jumlah INTEGER NOT NULL,
    total_pcs INTEGER NOT NULL,
    penerima VARCHAR(200),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert default kategori
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
    ('Elektronik', 'Barang-barang elektronik'),
    ('Alat Tulis', 'Alat tulis kantor'),
    ('Bahan Bangunan', 'Material bangunan'),
    ('Makanan & Minuman', 'Produk makanan dan minuman'),
    ('Peralatan Rumah Tangga', 'Peralatan untuk rumah tangga')
ON CONFLICT (nama_kategori) DO NOTHING;

-- Insert default satuan
INSERT INTO satuan (nama_satuan, simbol) VALUES
    ('Pieces', 'Pcs'),
    ('Dus', 'Dus'),
    ('Pack', 'Pack'),
    ('Box', 'Box'),
    ('Unit', 'Unit'),
    ('Lembar', 'Lbr'),
    ('Roll', 'Roll'),
    ('Set', 'Set'),
    ('Botol', 'Botol'),
    ('Kilogram', 'Kg')
ON CONFLICT (nama_satuan) DO NOTHING;
`;

// Fungsi untuk mengecek koneksi database
async function checkConnection() {
    try {
        console.log('🔄 Checking database connection...');
        
        // Coba ambil data dari tabel kategori (yang seharusnya ada)
        const { data, error } = await supabase
            .from('kategori')
            .select('count')
            .limit(1);
            
        if (error) {
            // Jika tabel belum ada, coba buat tabel
            if (error.code === '42P01') { // Table doesn't exist
                console.log('⚠️ Tables not found, database needs initialization');
                return false;
            }
            console.error('❌ Database connection error:', error);
            return false;
        }
        
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Error checking connection:', error);
        return false;
    }
}

// Fungsi untuk inisialisasi database (membuat tabel)
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        // Jalankan SQL untuk membuat tabel
        const { error } = await supabase.rpc('exec_sql', { sql: CREATE_TABLES_SQL });
        
        if (error) {
            // Jika fungsi RPC belum ada, coba alternatif lain
            console.log('⚠️ RPC not available, trying alternative method...');
            return await initializeDatabaseAlternative();
        }
        
        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        return false;
    }
}

// Alternatif jika RPC tidak tersedia
async function initializeDatabaseAlternative() {
    try {
        // Untuk Supabase, kita tidak bisa langsung execute SQL dari client
        // User perlu menjalankan SQL di SQL Editor
        console.log('ℹ️ Please run the SQL script in Supabase SQL Editor');
        return false;
    } catch (error) {
        console.error('❌ Error in alternative initialization:', error);
        return false;
    }
}

// ========== BARANG FUNCTIONS ==========

// Get all barang dengan join kategori
async function getBarang() {
    try {
        const { data, error } = await supabase
            .from('barang')
            .select(`
                *,
                kategori:kategori_id(*)
            `)
            .order('nama_barang', { ascending: true });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error getting barang:', error);
        throw error;
    }
}

// Get single barang by ID
async function getBarangById(id) {
    try {
        const { data, error } = await supabase
            .from('barang')
            .select(`
                *,
                kategori:kategori_id(*)
            `)
            .eq('id', id)
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error getting barang by id:', error);
        throw error;
    }
}

// Add new barang
async function addBarang(barangData) {
    try {
        const { data, error } = await supabase
            .from('barang')
            .insert([{
                kode_barang: barangData.kode_barang,
                nama_barang: barangData.nama_barang,
                kategori_id: barangData.kategori_id || null,
                stok_pcs: barangData.stok_pcs || 0,
                min_stok_pcs: barangData.min_stok_pcs || 24,
                lokasi: barangData.lokasi || null,
                deskripsi: barangData.deskripsi || null,
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error adding barang:', error);
        throw error;
    }
}

// Update barang
async function updateBarang(id, barangData) {
    try {
        const { data, error } = await supabase
            .from('barang')
            .update({
                kode_barang: barangData.kode_barang,
                nama_barang: barangData.nama_barang,
                kategori_id: barangData.kategori_id || null,
                stok_pcs: barangData.stok_pcs,
                min_stok_pcs: barangData.min_stok_pcs || 24,
                lokasi: barangData.lokasi || null,
                deskripsi: barangData.deskripsi || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error updating barang:', error);
        throw error;
    }
}

// Delete barang
async function deleteBarang(id) {
    try {
        const { error } = await supabase
            .from('barang')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting barang:', error);
        throw error;
    }
}

// ========== KATEGORI FUNCTIONS ==========

// Get all kategori
async function getKategori() {
    try {
        const { data, error } = await supabase
            .from('kategori')
            .select('*')
            .order('nama_kategori', { ascending: true });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error getting kategori:', error);
        throw error;
    }
}

// Add new kategori
async function addKategori(kategoriData) {
    try {
        const { data, error } = await supabase
            .from('kategori')
            .insert([{
                nama_kategori: kategoriData.nama_kategori,
                deskripsi: kategoriData.deskripsi || null
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error adding kategori:', error);
        throw error;
    }
}

// ========== SATUAN FUNCTIONS ==========

// Get all satuan
async function getSatuan() {
    try {
        const { data, error } = await supabase
            .from('satuan')
            .select('*')
            .order('nama_satuan', { ascending: true });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error getting satuan:', error);
        throw error;
    }
}

// ========== BARANG MASUK FUNCTIONS ==========

// Get all barang masuk dengan join barang
async function getBarangMasuk() {
    try {
        const { data, error } = await supabase
            .from('barang_masuk')
            .select(`
                *,
                barang:barang_id(*)
            `)
            .order('tanggal', { ascending: false });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error getting barang masuk:', error);
        throw error;
    }
}

// Add barang masuk
async function addBarangMasuk(barangMasukData) {
    try {
        const { data, error } = await supabase
            .from('barang_masuk')
            .insert([{
                barang_id: barangMasukData.barang_id,
                tanggal: barangMasukData.tanggal,
                jumlah_dus: barangMasukData.jumlah_dus,
                total_pcs: barangMasukData.total_pcs,
                supplier: barangMasukData.supplier || null,
                keterangan: barangMasukData.keterangan || null
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error adding barang masuk:', error);
        throw error;
    }
}

// Update barang masuk
async function updateBarangMasuk(id, barangMasukData) {
    try {
        const { data, error } = await supabase
            .from('barang_masuk')
            .update({
                tanggal: barangMasukData.tanggal,
                jumlah_dus: barangMasukData.jumlah_dus,
                total_pcs: barangMasukData.total_pcs,
                supplier: barangMasukData.supplier || null,
                keterangan: barangMasukData.keterangan || null
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error updating barang masuk:', error);
        throw error;
    }
}

// Delete barang masuk
async function deleteBarangMasuk(id) {
    try {
        const { error } = await supabase
            .from('barang_masuk')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting barang masuk:', error);
        throw error;
    }
}

// ========== BARANG KELUAR FUNCTIONS ==========

// Get all barang keluar dengan join barang
async function getBarangKeluar() {
    try {
        const { data, error } = await supabase
            .from('barang_keluar')
            .select(`
                *,
                barang:barang_id(*)
            `)
            .order('tanggal', { ascending: false });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error getting barang keluar:', error);
        throw error;
    }
}

// Add barang keluar
async function addBarangKeluar(barangKeluarData) {
    try {
        const { data, error } = await supabase
            .from('barang_keluar')
            .insert([{
                barang_id: barangKeluarData.barang_id,
                tanggal: barangKeluarData.tanggal,
                satuan_keluar: barangKeluarData.satuan_keluar,
                jumlah: barangKeluarData.jumlah,
                total_pcs: barangKeluarData.total_pcs,
                penerima: barangKeluarData.penerima || null,
                keterangan: barangKeluarData.keterangan || null
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error adding barang keluar:', error);
        throw error;
    }
}

// Update barang keluar
async function updateBarangKeluar(id, barangKeluarData) {
    try {
        const { data, error } = await supabase
            .from('barang_keluar')
            .update({
                tanggal: barangKeluarData.tanggal,
                satuan_keluar: barangKeluarData.satuan_keluar,
                jumlah: barangKeluarData.jumlah,
                total_pcs: barangKeluarData.total_pcs,
                penerima: barangKeluarData.penerima || null,
                keterangan: barangKeluarData.keterangan || null
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error updating barang keluar:', error);
        throw error;
    }
}

// Delete barang keluar
async function deleteBarangKeluar(id) {
    try {
        const { error } = await supabase
            .from('barang_keluar')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting barang keluar:', error);
        throw error;
    }
}

// ========== LAPORAN FUNCTIONS ==========

// Get laporan berdasarkan periode
async function getLaporan(startDate = null, endDate = null, jenis = 'all') {
    try {
        let query = supabase
            .from('barang_masuk')
            .select(`
                *,
                barang:barang_id(*)
            `)
            .eq('jenis', 'MASUK');
            
        if (startDate) {
            query = query.gte('tanggal', startDate);
        }
        if (endDate) {
            query = query.lte('tanggal', endDate);
        }
        
        const { data: masukData, error: masukError } = await query;
        if (masukError) throw masukError;
        
        let keluarQuery = supabase
            .from('barang_keluar')
            .select(`
                *,
                barang:barang_id(*)
            `)
            .eq('jenis', 'KELUAR');
            
        if (startDate) {
            keluarQuery = keluarQuery.gte('tanggal', startDate);
        }
        if (endDate) {
            keluarQuery = keluarQuery.lte('tanggal', endDate);
        }
        
        const { data: keluarData, error: keluarError } = await keluarQuery;
        if (keluarError) throw keluarError;
        
        // Gabungkan data
        const laporan = [
            ...(masukData || []).map(item => ({ ...item, jenis: 'MASUK' })),
            ...(keluarData || []).map(item => ({ ...item, jenis: 'KELUAR' }))
        ].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        return laporan;
    } catch (error) {
        console.error('❌ Error getting laporan:', error);
        throw error;
    }
}

// Get stok rendah
async function getStokRendah() {
    try {
        const { data, error } = await supabase
            .from('barang')
            .select(`
                *,
                kategori:kategori_id(*)
            `)
            .lte('stok_pcs', supabase.raw('min_stok_pcs'))
            .order('stok_pcs', { ascending: true });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error getting stok rendah:', error);
        throw error;
    }
}

// ========== UTILITY FUNCTIONS ==========

// Search barang
async function searchBarang(keyword) {
    try {
        const { data, error } = await supabase
            .from('barang')
            .select(`
                *,
                kategori:kategori_id(*)
            `)
            .or(`kode_barang.ilike.%${keyword}%,nama_barang.ilike.%${keyword}%,deskripsi.ilike.%${keyword}%`)
            .order('nama_barang', { ascending: true });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error searching barang:', error);
        throw error;
    }
}

// Get dashboard statistics
async function getDashboardStats() {
    try {
        const [
            { data: barang, error: barangError },
            { data: masuk, error: masukError },
            { data: keluar, error: keluarError },
            { data: stokRendah, error: stokRendahError }
        ] = await Promise.all([
            supabase.from('barang').select('id'),
            supabase.from('barang_masuk').select('id'),
            supabase.from('barang_keluar').select('id'),
            supabase.from('barang').select('id').lte('stok_pcs', supabase.raw('min_stok_pcs'))
        ]);
        
        if (barangError || masukError || keluarError || stokRendahError) {
            throw new Error('Error fetching dashboard stats');
        }
        
        return {
            totalBarang: barang?.length || 0,
            totalMasuk: masuk?.length || 0,
            totalKeluar: keluar?.length || 0,
            totalStokRendah: stokRendah?.length || 0
        };
    } catch (error) {
        console.error('❌ Error getting dashboard stats:', error);
        throw error;
    }
}

// ========== EXPORT FUNCTIONS ==========

// Expose functions to global scope
window.supabaseFunctions = {
    // Config
    SUPABASE_CONFIG,
    CREATE_TABLES_SQL,
    
    // Connection
    checkConnection,
    initializeDatabase,
    
    // Barang
    getBarang,
    getBarangById,
    addBarang,
    updateBarang,
    deleteBarang,
    
    // Kategori
    getKategori,
    addKategori,
    
    // Satuan
    getSatuan,
    
    // Barang Masuk
    getBarangMasuk,
    addBarangMasuk,
    updateBarangMasuk,
    deleteBarangMasuk,
    
    // Barang Keluar
    getBarangKeluar,
    addBarangKeluar,
    updateBarangKeluar,
    deleteBarangKeluar,
    
    // Laporan
    getLaporan,
    getStokRendah,
    
    // Utility
    searchBarang,
    getDashboardStats
};

console.log('✅ Supabase functions loaded successfully');

// Auto-check connection on load
document.addEventListener('DOMContentLoaded', async () => {
    const isConnected = await checkConnection();
    if (!isConnected) {
        console.log('⚠️ Database not initialized. Please run the SQL script in Supabase SQL Editor');
    }
});
