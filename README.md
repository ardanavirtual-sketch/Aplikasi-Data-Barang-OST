# Aplikasi Inventori dengan Supabase

Aplikasi inventori untuk mengelola data barang masuk dan keluar dengan menggunakan Supabase sebagai database.

## Fitur

1. **Dashboard** - Menampilkan statistik dan grafik stok barang
2. **Data Barang** - CRUD untuk data barang
3. **Barang Masuk** - Pencatatan barang masuk ke inventori
4. **Barang Keluar** - Pencatatan barang keluar dari inventori
5. **Laporan** - Laporan transaksi dengan filter tanggal
6. **Kategori** - Manajemen kategori barang

## Setup

### 1. Buat Project di Supabase

1. Kunjungi [supabase.com](https://supabase.com) dan buat akun
2. Buat project baru
3. Dapatkan URL dan Anon Key dari Settings > API

### 2. Setup Database

1. Buka SQL Editor di dashboard Supabase
2. Jalankan query SQL berikut untuk membuat tabel:

```sql
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
('Kebutuhan Kantor', 'Alat tulis dan perlengkapan kantor');# Aplikasi-Data-Barang-OST
