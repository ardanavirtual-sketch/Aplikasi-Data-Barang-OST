// ============================================
// SUPABASE CONFIGURATION
// ============================================

// Supabase Credentials
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs';

// Global Supabase Client
let supabase;

// Initialize Supabase
function initializeSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library tidak ditemukan!');
            return false;
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client berhasil diinisialisasi');
        return true;
        
    } catch (error) {
        console.error('❌ Gagal menginisialisasi Supabase:', error);
        return false;
    }
}

// Initialize on load
initializeSupabase();

// SQL untuk membuat tabel
const CREATE_TABLES_SQL = `-- Tabel Kategori
CREATE TABLE IF NOT EXISTS kategori (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT NOW()
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

-- Tabel Satuan Konversi
CREATE TABLE IF NOT EXISTS satuan_konversi (
    id SERIAL PRIMARY KEY,
    barang_id INTEGER NOT NULL REFERENCES barang(id),
    jumlah_per_dus INTEGER NOT NULL DEFAULT 24,
    satuan_unit VARCHAR(20) NOT NULL DEFAULT 'Pcs',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(barang_id, satuan_unit)
);

-- Tabel Barang Masuk
CREATE TABLE IF NOT EXISTS barang_masuk (
    id SERIAL PRIMARY KEY,
    barang_id INTEGER NOT NULL REFERENCES barang(id),
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
    barang_id INTEGER NOT NULL REFERENCES barang(id),
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
ON CONFLICT DO NOTHING;`;

// ============================================
// DATABASE FUNCTIONS
// ============================================

// Inisialisasi Database
async function initializeDatabase() {
    console.log('🔧 Menginisialisasi database...');
    
    try {
        if (!supabase) {
            throw new Error('Supabase client belum diinisialisasi');
        }
        
        // Cek koneksi
        const { data, error } = await supabase
            .from('barang')
            .select('id')
            .limit(1);
        
        if (error) {
            if (error.code === '42P01') {
                return {
                    success: false,
                    message: 'Tabel belum dibuat. Silakan jalankan SQL berikut di Supabase SQL Editor.',
                    error: error
                };
            }
            throw error;
        }
        
        return {
            success: true,
            message: '✅ Database terhubung dengan sukses'
        };
        
    } catch (error) {
        console.error('❌ Gagal menginisialisasi database:', error);
        return {
            success: false,
            message: `❌ Gagal menginisialisasi database: ${error.message}`,
            error: error
        };
    }
}

// Cek Koneksi
async function checkConnection() {
    try {
        const result = await initializeDatabase();
        return result.success;
    } catch (error) {
        console.error('❌ Error checking connection:', error);
        return false;
    }
}

// ============================================
// DATA FUNCTIONS
// ============================================

// Get All Barang
async function getBarang() {
    try {
        if (!supabase) {
            console.error('Supabase client tidak tersedia');
            return [];
        }
        
        const { data, error } = await supabase
            .from('barang')
            .select(`
                *,
                kategori:kategori_id(id, nama_kategori, deskripsi)
            `)
            .order('nama_barang', { ascending: true });
        
        if (error) {
            console.error('❌ Error mengambil data barang:', error);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getBarang:', error);
        return [];
    }
}

// Get Kategori
async function getKategori() {
    try {
        const { data, error } = await supabase
            .from('kategori')
            .select('*')
            .order('nama_kategori', { ascending: true });
        
        if (error) {
            console.error('❌ Error mengambil kategori:', error);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getKategori:', error);
        return [];
    }
}

// Get Barang Masuk
async function getBarangMasuk(filter = {}) {
    try {
        let query = supabase
            .from('barang_masuk')
            .select(`
                *,
                barang:barang_id(kode_barang, nama_barang)
            `)
            .order('tanggal', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Error mengambil barang masuk:', error);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getBarangMasuk:', error);
        return [];
    }
}

// Get Barang Keluar
async function getBarangKeluar(filter = {}) {
    try {
        let query = supabase
            .from('barang_keluar')
            .select(`
                *,
                barang:barang_id(kode_barang, nama_barang)
            `)
            .order('tanggal', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Error mengambil barang keluar:', error);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getBarangKeluar:', error);
        return [];
    }
}

// Add Barang
async function addBarang(barang) {
    try {
        // Add timestamps
        const barangWithTimestamps = {
            ...barang,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('barang')
            .insert([barangWithTimestamps])
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        console.error('❌ Error menambahkan barang:', error);
        throw error;
    }
}

// Update Barang
async function updateBarang(id, barang) {
    try {
        const barangWithTimestamp = {
            ...barang,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('barang')
            .update(barangWithTimestamp)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        console.error('❌ Error mengupdate barang:', error);
        throw error;
    }
}

// Delete Barang
async function deleteBarang(id) {
    try {
        const { error } = await supabase
            .from('barang')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        return true;
        
    } catch (error) {
        console.error('❌ Error menghapus barang:', error);
        throw error;
    }
}

// Get Laporan
async function getLaporan(startDate, endDate, type = 'all') {
    try {
        const [masuk, keluar] = await Promise.all([
            type === 'all' || type === 'in' ? getBarangMasuk() : Promise.resolve([]),
            type === 'all' || type === 'out' ? getBarangKeluar() : Promise.resolve([])
        ]);
        
        // Filter by date
        const filteredMasuk = masuk.filter(item => {
            const itemDate = new Date(item.tanggal);
            return (!startDate || itemDate >= new Date(startDate)) && 
                   (!endDate || itemDate <= new Date(endDate));
        });
        
        const filteredKeluar = keluar.filter(item => {
            const itemDate = new Date(item.tanggal);
            return (!startDate || itemDate >= new Date(startDate)) && 
                   (!endDate || itemDate <= new Date(endDate));
        });
        
        const laporan = [
            ...filteredMasuk.map(item => ({ ...item, jenis: 'MASUK' })),
            ...filteredKeluar.map(item => ({ ...item, jenis: 'KELUAR' }))
        ];
        
        laporan.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        return laporan;
        
    } catch (error) {
        console.error('❌ Error mengambil laporan:', error);
        return [];
    }
}

// Get Satuan Konversi
async function getSatuanKonversi() {
    try {
        const { data, error } = await supabase
            .from('satuan_konversi')
            .select(`
                *,
                barang:barang_id(kode_barang, nama_barang)
            `)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error mengambil satuan konversi:', error);
            return [];
        }
        
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getSatuanKonversi:', error);
        return [];
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

// Export all functions to global scope
window.supabaseFunctions = {
    // Config
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    CREATE_TABLES_SQL,
    
    // Connection
    initializeDatabase,
    checkConnection,
    
    // Data Retrieval
    getBarang,
    getKategori,
    getBarangMasuk,
    getBarangKeluar,
    getSatuanKonversi,
    getLaporan,
    
    // CRUD Operations
    addBarang,
    updateBarang,
    deleteBarang
};

console.log('✅ Supabase Functions berhasil dimuat');

// Auto-check connection when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Memeriksa koneksi Supabase...');
});
