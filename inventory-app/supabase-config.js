// Konfigurasi Supabase - GANTI DENGAN URL DAN KEY ANDA
const SUPABASE_URL = 'https://iltqolfmvhzaiuagtoxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdHFvbGZtdmh6YWl1YWd0b3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDE5MjQsImV4cCI6MjA4MDgxNzkyNH0.sGzEQjpKfy7fdw8KBNO7mVzKd2tuxqQaYAdRuTjHVMs';

// Periksa apakah Supabase library sudah dimuat
if (typeof supabase === 'undefined') {
    console.error('Supabase library belum dimuat! Pastikan Anda menyertakan script Supabase di HTML.');
}

// Inisialisasi Supabase client dengan error handling
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client berhasil diinisialisasi');
} catch (error) {
    console.error('Gagal menginisialisasi Supabase client:', error);
    // Buat fallback supabase object untuk mencegah crash
    supabase = {
        from: () => ({ 
            select: () => Promise.reject(new Error('Supabase tidak tersedia')),
            insert: () => Promise.reject(new Error('Supabase tidak tersedia')),
            update: () => Promise.reject(new Error('Supabase tidak tersedia')),
            delete: () => Promise.reject(new Error('Supabase tidak tersedia')),
            eq: () => ({})
        })
    };
}

// Fungsi untuk inisialisasi database
async function initializeDatabase() {
    console.log('Menginisialisasi koneksi database...');
    
    try {
        // Cek apakah supabase tersedia
        if (!supabase || !supabase.from) {
            throw new Error('Supabase client tidak tersedia');
        }
        
        // Cek koneksi dengan query sederhana
        const { data, error } = await supabase
            .from('barang')
            .select('count')
            .limit(1);
        
        if (error) {
            console.warn('Error koneksi database:', error.message);
            
            // Berikan petunjuk berdasarkan error
            if (error.code === '42P01') {
                console.info('Tabel belum dibuat. Silakan jalankan SQL berikut di Supabase SQL Editor:');
                console.info(CREATE_TABLES_SQL);
                return {
                    success: false,
                    message: 'Tabel belum dibuat. Silakan buat tabel terlebih dahulu di Supabase.',
                    error: error
                };
            }
            
            // Error lain
            return {
                success: false,
                message: 'Gagal terhubung ke database',
                error: error
            };
        }
        
        console.log('Database terhubung dengan sukses');
        return {
            success: true,
            message: 'Database terhubung dengan sukses'
        };
        
    } catch (error) {
        console.error('Gagal menginisialisasi database:', error);
        return {
            success: false,
            message: 'Gagal menginisialisasi database: ' + error.message,
            error: error
        };
    }
}

// SQL untuk membuat tabel (jalankan di SQL Editor Supabase)
const CREATE_TABLES_SQL = `
-- Hapus foreign key constraints terlebih dahulu jika ada
ALTER TABLE IF EXISTS barang_masuk DROP CONSTRAINT IF EXISTS barang_masuk_barang_id_fkey;
ALTER TABLE IF EXISTS barang_keluar DROP CONSTRAINT IF EXISTS barang_keluar_barang_id_fkey;
ALTER TABLE IF EXISTS satuan_konversi DROP CONSTRAINT IF EXISTS satuan_konversi_barang_id_fkey;
ALTER TABLE IF EXISTS barang DROP CONSTRAINT IF EXISTS barang_kategori_id_fkey;

-- Hapus tabel jika sudah ada (hati-hati, ini akan menghapus data!)
DROP TABLE IF EXISTS barang_keluar;
DROP TABLE IF EXISTS barang_masuk;
DROP TABLE IF EXISTS satuan_konversi;
DROP TABLE IF EXISTS barang;
DROP TABLE IF EXISTS kategori;

-- Tabel Kategori
CREATE TABLE kategori (
    id BIGSERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabel Barang
CREATE TABLE barang (
    id BIGSERIAL PRIMARY KEY,
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    nama_barang VARCHAR(200) NOT NULL,
    kategori_id BIGINT REFERENCES kategori(id) ON DELETE SET NULL,
    stok_pcs INTEGER DEFAULT 0,
    min_stok_pcs INTEGER DEFAULT 24,
    lokasi VARCHAR(100),
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabel Satuan Konversi
CREATE TABLE satuan_konversi (
    id BIGSERIAL PRIMARY KEY,
    barang_id BIGINT NOT NULL REFERENCES barang(id) ON DELETE CASCADE,
    jumlah_per_dus INTEGER NOT NULL DEFAULT 24,
    satuan_unit VARCHAR(20) NOT NULL DEFAULT 'Pcs',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(barang_id, satuan_unit)
);

-- Tabel Barang Masuk
CREATE TABLE barang_masuk (
    id BIGSERIAL PRIMARY KEY,
    barang_id BIGINT NOT NULL REFERENCES barang(id) ON DELETE CASCADE,
    jumlah_dus DECIMAL(10,2) NOT NULL,
    total_pcs INTEGER NOT NULL,
    tanggal DATE NOT NULL,
    supplier VARCHAR(200),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabel Barang Keluar
CREATE TABLE barang_keluar (
    id BIGSERIAL PRIMARY KEY,
    barang_id BIGINT NOT NULL REFERENCES barang(id) ON DELETE CASCADE,
    satuan_keluar VARCHAR(20) NOT NULL,
    jumlah INTEGER NOT NULL,
    total_pcs INTEGER NOT NULL,
    tanggal DATE NOT NULL,
    penerima VARCHAR(200),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_barang_kategori ON barang(kategori_id);
CREATE INDEX IF NOT EXISTS idx_barang_masuk_tanggal ON barang_masuk(tanggal);
CREATE INDEX IF NOT EXISTS idx_barang_masuk_barang ON barang_masuk(barang_id);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_tanggal ON barang_keluar(tanggal);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_barang ON barang_keluar(barang_id);
CREATE INDEX IF NOT EXISTS idx_satuan_konversi_barang ON satuan_konversi(barang_id);

-- Insert data kategori contoh
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Makanan', 'Barang makanan dan minuman'),
('Elektronik', 'Barang elektronik dan aksesoris'),
('Peralatan', 'Peralatan kantor dan rumah tangga'),
('Kesehatan', 'Obat-obatan dan alat kesehatan')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) dan buat policies
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE satuan_konversi ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang_keluar ENABLE ROW LEVEL SECURITY;

-- Create policies untuk akses public (ubah sesuai kebutuhan keamanan Anda)
CREATE POLICY "Enable read access for all users" ON kategori FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON kategori FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON barang FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON barang FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON satuan_konversi FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON satuan_konversi FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON barang_masuk FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON barang_masuk FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON barang_keluar FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON barang_keluar FOR ALL USING (true);
`;

// Fungsi helper untuk handle error
function handleSupabaseError(error, operation = 'operasi') {
    console.error(`Error pada ${operation}:`, error);
    
    // Berikan pesan error yang lebih user-friendly
    let userMessage = `Gagal melakukan ${operation}`;
    
    if (error.code === '42P01') {
        userMessage = 'Tabel belum dibuat. Silakan inisialisasi database terlebih dahulu.';
    } else if (error.code === '23503') {
        userMessage = 'Data tidak dapat diproses karena ada relasi yang tidak valid.';
    } else if (error.code === '23505') {
        userMessage = 'Data dengan kode yang sama sudah ada.';
    } else if (error.message && error.message.includes('network')) {
        userMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    }
    
    throw {
        ...error,
        userMessage: userMessage
    };
}

// Fungsi untuk mendapatkan data barang
async function getBarang() {
    try {
        const { data, error } = await supabase
            .from('barang')
            .select(`
                *,
                kategori:kategori_id(nama_kategori),
                konversi:satuan_konversi(jumlah_per_dus, satuan_unit)
            `)
            .order('nama_barang', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'mengambil data barang');
    }
}

// Fungsi untuk mendapatkan data kategori
async function getKategori() {
    try {
        const { data, error } = await supabase
            .from('kategori')
            .select('*')
            .order('nama_kategori', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'mengambil data kategori');
    }
}

// Fungsi untuk mendapatkan data satuan konversi
async function getSatuanKonversi() {
    try {
        const { data, error } = await supabase
            .from('satuan_konversi')
            .select(`
                *,
                barang:barang_id(kode_barang, nama_barang)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'mengambil data satuan konversi');
    }
}

// Fungsi untuk mendapatkan konversi untuk barang tertentu
async function getKonversiBarang(barangId) {
    try {
        const { data, error } = await supabase
            .from('satuan_konversi')
            .select('*')
            .eq('barang_id', barangId);
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'mengambil konversi barang');
    }
}

// Fungsi untuk menambahkan barang baru
async function addBarang(barang) {
    try {
        // Validasi input
        if (!barang.kode_barang || !barang.nama_barang) {
            throw new Error('Kode barang dan nama barang wajib diisi');
        }
        
        const { data, error } = await supabase
            .from('barang')
            .insert([{
                ...barang,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Tambahkan konversi default jika ada
        if (data && data.id) {
            try {
                const konversi = {
                    barang_id: data.id,
                    jumlah_per_dus: barang.jumlah_per_dus || 24,
                    satuan_unit: barang.satuan_unit || 'Pcs'
                };
                
                await addSatuanKonversi(konversi);
            } catch (konversiError) {
                console.warn('Gagal menambahkan konversi default:', konversiError);
                // Lanjutkan meskipun konversi gagal
            }
        }
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'menambahkan barang');
    }
}

// Fungsi untuk mengupdate barang
async function updateBarang(id, barang) {
    try {
        const { data, error } = await supabase
            .from('barang')
            .update({
                ...barang,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'mengupdate barang');
    }
}

// Fungsi untuk menghapus barang
async function deleteBarang(id) {
    try {
        const { error } = await supabase
            .from('barang')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        return true;
        
    } catch (error) {
        return handleSupabaseError(error, 'menghapus barang');
    }
}

// Fungsi untuk menambahkan satuan konversi
async function addSatuanKonversi(konversi) {
    try {
        const { data, error } = await supabase
            .from('satuan_konversi')
            .insert([konversi])
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'menambahkan satuan konversi');
    }
}

// Fungsi untuk mengupdate satuan konversi
async function updateSatuanKonversi(id, konversi) {
    try {
        const { data, error } = await supabase
            .from('satuan_konversi')
            .update(konversi)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'mengupdate satuan konversi');
    }
}

// Fungsi untuk menghapus satuan konversi
async function deleteSatuanKonversi(id) {
    try {
        const { error } = await supabase
            .from('satuan_konversi')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        return true;
        
    } catch (error) {
        return handleSupabaseError(error, 'menghapus satuan konversi');
    }
}

// Fungsi untuk menambahkan barang masuk
async function addBarangMasuk(barangMasuk) {
    try {
        // Validasi
        if (!barangMasuk.barang_id || !barangMasuk.jumlah_dus || !barangMasuk.tanggal) {
            throw new Error('Data barang masuk tidak lengkap');
        }
        
        const { data, error } = await supabase
            .from('barang_masuk')
            .insert([barangMasuk])
            .select()
            .single();
        
        if (error) throw error;
        
        // Update stok barang
        await updateStokBarang(barangMasuk.barang_id, barangMasuk.total_pcs, 'in');
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'menambahkan barang masuk');
    }
}

// Fungsi untuk menambahkan multiple barang masuk
async function addMultipleBarangMasuk(items, tanggal, supplier = null, keterangan = null) {
    try {
        const transactions = items.map(item => ({
            ...item,
            tanggal,
            supplier,
            keterangan: item.keterangan || keterangan,
            created_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('barang_masuk')
            .insert(transactions)
            .select();
        
        if (error) throw error;
        
        // Update stok untuk setiap barang
        const updatePromises = items.map(item => 
            updateStokBarang(item.barang_id, item.total_pcs, 'in')
        );
        
        await Promise.all(updatePromises);
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'menambahkan multiple barang masuk');
    }
}

// Fungsi untuk menambahkan barang keluar
async function addBarangKeluar(barangKeluar) {
    try {
        // Validasi
        if (!barangKeluar.barang_id || !barangKeluar.jumlah || !barangKeluar.tanggal) {
            throw new Error('Data barang keluar tidak lengkap');
        }
        
        // Cek stok cukup
        const { data: barang } = await supabase
            .from('barang')
            .select('stok_pcs')
            .eq('id', barangKeluar.barang_id)
            .single();
        
        if (barang && barang.stok_pcs < barangKeluar.total_pcs) {
            throw new Error('Stok tidak mencukupi');
        }
        
        const { data, error } = await supabase
            .from('barang_keluar')
            .insert([barangKeluar])
            .select()
            .single();
        
        if (error) throw error;
        
        // Update stok barang
        await updateStokBarang(barangKeluar.barang_id, barangKeluar.total_pcs, 'out');
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'menambahkan barang keluar');
    }
}

// Fungsi untuk menambahkan multiple barang keluar
async function addMultipleBarangKeluar(items, tanggal, penerima = null, keterangan = null) {
    try {
        // Cek stok untuk semua item terlebih dahulu
        for (const item of items) {
            const { data: barang } = await supabase
                .from('barang')
                .select('stok_pcs, nama_barang')
                .eq('id', item.barang_id)
                .single();
            
            if (barang && barang.stok_pcs < item.total_pcs) {
                throw new Error(`Stok ${barang.nama_barang} tidak mencukupi`);
            }
        }
        
        const transactions = items.map(item => ({
            ...item,
            tanggal,
            penerima,
            keterangan: item.keterangan || keterangan,
            created_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('barang_keluar')
            .insert(transactions)
            .select();
        
        if (error) throw error;
        
        // Update stok untuk setiap barang
        const updatePromises = items.map(item => 
            updateStokBarang(item.barang_id, item.total_pcs, 'out')
        );
        
        await Promise.all(updatePromises);
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'menambahkan multiple barang keluar');
    }
}

// Fungsi untuk update stok barang
async function updateStokBarang(barangId, jumlahPcs, type) {
    try {
        // Gunakan RPC untuk atomic update
        const { data, error } = await supabase.rpc('update_stok_barang', {
            p_barang_id: barangId,
            p_jumlah: jumlahPcs,
            p_type: type
        });
        
        if (error) {
            // Fallback ke cara manual jika RPC tidak ada
            return await updateStokBarangManual(barangId, jumlahPcs, type);
        }
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'mengupdate stok barang');
    }
}

// Fungsi fallback untuk update stok manual
async function updateStokBarangManual(barangId, jumlahPcs, type) {
    try {
        // Dapatkan stok saat ini
        const { data: barang, error: getError } = await supabase
            .from('barang')
            .select('stok_pcs')
            .eq('id', barangId)
            .single();
        
        if (getError) throw getError;
        
        // Hitung stok baru
        let stokBaru = barang.stok_pcs;
        if (type === 'in') {
            stokBaru += jumlahPcs;
        } else if (type === 'out') {
            stokBaru -= jumlahPcs;
        }
        
        // Pastikan stok tidak negatif
        if (stokBaru < 0) stokBaru = 0;
        
        // Update stok
        const { error: updateError } = await supabase
            .from('barang')
            .update({ 
                stok_pcs: stokBaru,
                updated_at: new Date().toISOString()
            })
            .eq('id', barangId);
        
        if (updateError) throw updateError;
        
        return true;
        
    } catch (error) {
        throw error;
    }
}

// Fungsi untuk mendapatkan data barang masuk
async function getBarangMasuk(filter = {}) {
    try {
        let query = supabase
            .from('barang_masuk')
            .select(`
                *,
                barang:barang_id(kode_barang, nama_barang, kategori:kategori_id(nama_kategori))
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
        
        if (filter.supplier) {
            query = query.ilike('supplier', `%${filter.supplier}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'mengambil data barang masuk');
    }
}

// Fungsi untuk mendapatkan data barang keluar
async function getBarangKeluar(filter = {}) {
    try {
        let query = supabase
            .from('barang_keluar')
            .select(`
                *,
                barang:barang_id(kode_barang, nama_barang, kategori:kategori_id(nama_kategori))
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
        
        if (filter.penerima) {
            query = query.ilike('penerima', `%${filter.penerima}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        return handleSupabaseError(error, 'mengambil data barang keluar');
    }
}

// Fungsi untuk mendapatkan laporan
async function getLaporan(startDate, endDate, type = 'all') {
    try {
        let dataMasuk = [];
        let dataKeluar = [];
        
        if (type === 'in' || type === 'all') {
            const masuk = await getBarangMasuk({
                startDate,
                endDate
            });
            dataMasuk = masuk;
        }
        
        if (type === 'out' || type === 'all') {
            const keluar = await getBarangKeluar({
                startDate,
                endDate
            });
            dataKeluar = keluar;
        }
        
        // Format data untuk laporan
        const laporan = [];
        
        if (type === 'in' || type === 'all') {
            dataMasuk.forEach(item => {
                laporan.push({
                    id: item.id,
                    tanggal: item.tanggal,
                    jenis: 'MASUK',
                    barang_id: item.barang_id,
                    kode_barang: item.barang?.kode_barang,
                    nama_barang: item.barang?.nama_barang,
                    kategori: item.barang?.kategori?.nama_kategori,
                    satuan: 'Dus',
                    jumlah: item.jumlah_dus,
                    total_pcs: item.total_pcs,
                    keterangan: item.keterangan,
                    supplier: item.supplier,
                    created_at: item.created_at
                });
            });
        }
        
        if (type === 'out' || type === 'all') {
            dataKeluar.forEach(item => {
                laporan.push({
                    id: item.id,
                    tanggal: item.tanggal,
                    jenis: 'KELUAR',
                    barang_id: item.barang_id,
                    kode_barang: item.barang?.kode_barang,
                    nama_barang: item.barang?.nama_barang,
                    kategori: item.barang?.kategori?.nama_kategori,
                    satuan: item.satuan_keluar,
                    jumlah: item.jumlah,
                    total_pcs: item.total_pcs,
                    keterangan: item.keterangan,
                    penerima: item.penerima,
                    created_at: item.created_at
                });
            });
        }
        
        // Urutkan berdasarkan tanggal
        laporan.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        return laporan;
        
    } catch (error) {
        return handleSupabaseError(error, 'mengambil laporan');
    }
}

// Fungsi untuk menambahkan kategori
async function addKategori(kategori) {
    try {
        if (!kategori.nama_kategori) {
            throw new Error('Nama kategori wajib diisi');
        }
        
        const { data, error } = await supabase
            .from('kategori')
            .insert([kategori])
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'menambahkan kategori');
    }
}

// Fungsi untuk mengupdate kategori
async function updateKategori(id, kategori) {
    try {
        const { data, error } = await supabase
            .from('kategori')
            .update(kategori)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        return handleSupabaseError(error, 'mengupdate kategori');
    }
}

// Fungsi untuk menghapus kategori
async function deleteKategori(id) {
    try {
        // Cek apakah kategori digunakan oleh barang
        const { data: barang, error: checkError } = await supabase
            .from('barang')
            .select('id, kode_barang, nama_barang')
            .eq('kategori_id', id)
            .limit(5);
        
        if (checkError) throw checkError;
        
        if (barang && barang.length > 0) {
            const barangList = barang.map(b => `${b.kode_barang} - ${b.nama_barang}`).join(', ');
            throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh barang: ${barangList}`);
        }
        
        // Hapus kategori
        const { error } = await supabase
            .from('kategori')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        return true;
        
    } catch (error) {
        return handleSupabaseError(error, 'menghapus kategori');
    }
}

// Fungsi untuk mengecek kesehatan koneksi
async function checkConnection() {
    try {
        const result = await initializeDatabase();
        return result.success;
    } catch (error) {
        return false;
    }
}

// Export fungsi-fungsi dengan error handling
window.supabaseFunctions = {
    // Konfigurasi
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    
    // Fungsi utama
    initializeDatabase,
    checkConnection,
    CREATE_TABLES_SQL,
    
    // Data operations
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
    
    // Transaksi
    addBarangMasuk,
    addMultipleBarangMasuk,
    addBarangKeluar,
    addMultipleBarangKeluar,
    getBarangMasuk,
    getBarangKeluar,
    
    // Laporan
    getLaporan,
    
    // Kategori
    addKategori,
    updateKategori,
    deleteKategori,
    
    // Helper
    updateStokBarang
};

// Cek koneksi otomatis saat load (opsional)
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Memeriksa koneksi database...');
    const connection = await checkConnection();
    
    if (connection) {
        console.log('✅ Aplikasi siap digunakan');
        // Anda bisa tambahkan event atau inisialisasi UI di sini
        if (typeof window.onDatabaseConnected === 'function') {
            window.onDatabaseConnected();
        }
    } else {
        console.warn('⚠️ Koneksi database bermasalah');
        if (typeof window.onDatabaseError === 'function') {
            window.onDatabaseError('Gagal terhubung ke database');
        }
    }
});
