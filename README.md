# ⚡ MASIV Web — Mobile Asset Surveying, Information and Verification System
### OPTADIS GIS System — PT PLN (Persero)

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20PLN-003B73?style=flat)](LICENSE)

**MASIV Web** adalah sistem informasi geografis (GIS) dan platform manajemen survey aset distribusi tenaga listrik berbasis web untuk **PT PLN (Persero)**. Aplikasi ini dirancang untuk studio perencanaan, verifikasi lapangan oleh supervisor/manager, perbaikan jalur kabel, hingga penerbitan dokumen resmi teknik berstandar PLN.

MASIV Web memiliki paritas fungsional penuh (100% feature parity) dengan aplikasi mobile **MASIV Mobile App**, dilengkapi kenyamanan drafting layar lebar, presisi mouse CAD, dan performa tinggi.

---

## 🌟 Fitur Utama

### 1. 🗺️ Smart GIS Drafting & Manajemen Aset Jaringan
- **Aset Tiang Listrik**:
  - Penomoran otomatis (*Auto-Urut*) dan kode tiang standar PLN (`T.1`, `T.2`, dll).
  - Algoritma **Smart Label Placement**: Penataan label tiang cerdas 8 kuadran bebas tumpang tindih (*anti-collision*), dengan fitur geser label manual.
  - Percabangan Jalur Otomatis (*Branching* Kanan `R` / Kiri `L`) dengan kode bertingkat (contoh: `T1R01`, `T1R02L01`).
  - Geser Posisi Tiang (*Move Tiang*) dengan sinkronisasi otomatis ke seluruh segmen jalur kabel yang terhubung.
- **Aset Gardu Distribusi**:
  - Jenis Portal, Cantol, Beton, dan Kios dengan pencatatan kapasitas kVA, merek trafo, dan perlengkapan proteksi.
- **Jalur Kabel Jaringan Distribusi**:
  - Mendukung konstruksi **SUTM** (20 kV), **SUTR** (220/380 V), **SKTM** (Kabel Tanah TM), dan **SKUTM** (Kabel Udara TM).
  - Fitur **Underbuild SUTR**: Penarikan jaringan SUTR otomatis yang menempel pada jalur tiang SUTM yang telah ada.
  - **Auto-Connect Jalur**: Deteksi kedekatan titik otomatis saat penanaman tiang baru untuk menghubungkan polyline kabel secara instan.
- **Persil & Pelanggan**:
  - Penggambaran bidang tanah (*polygon persil*) pelanggan pasang baru dengan estimasi kebutuhan sambungan tenaga listrik.

### 2. ⚡ Berita Acara (BA) Survey & Tanda Tangan Digital
- Form pengisian Berita Acara survey lapangan lengkap:
  - Data Unit (UID, UP3, ULP), data calon pelanggan, daya, tarif, dan titik koordinat.
  - Tabel rincian material & kebutuhan konstruksi tiang/kabel.
  - **Digital Signature Pad**: Pad tanda tangan digital interaktif langsung pada layar untuk Surveyor, Calon Pelanggan, dan Pejabat/Kepala Desa setempat.
- Ekspor dokumen **Berita Acara (BA) PDF Resmi PLN** siap cetak dan tandatangan elektronik.

### 3. 📊 Rekapitulasi Hasil Survey & 5 Opsi Ekspor Lengkap
1. **📄 Export Rekap PDF**: Laporan rekapitulasi lengkap berisi data umum, statistik tiang TM/TR, total panjang kabel per jenis jaringan, daftar gardu, dan rincian kebutuhan material PLN.
2. **🌍 Export KML (Google Earth)**: File KML terstruktur dengan pengelompokan folder, warna polyline sesuai tegangan, dan koordinat waypoint tiang/gardu.
3. **📋 Export BA Survey PDF**: Berita Acara resmi format standar PLN lengkap dengan tanda tangan digital tersemat.
4. **📐 Export PDF Gambar (Blangko Standar CAD PLN)**:
   - **Double CAD Border**: Garis bingkai ganda CAD standar gambar teknik PLN (margin 12pt & 15pt).
   - **Kop Box Resmi PT PLN (Persero)**: Banner biru tua PLN, logo resmi PLN PNG, hierarki unit (UID/UP3/ULP), judul pekerjaan auto-scaling font, data teknis peta (skala 1:2.500), serta 3 kolom pengesahan (*Disurvey Oleh*, *Diperiksa [TL HAR/Rensis/Kons]*, *Disetujui [Manager ULP]*).
   - **Tabel Rincian Pekerjaan**: Box semi-transparan di pojok kiri bawah peta berisi breakdown material.
   - **Legenda Peta Vektor**: Simbol vektor presisi di pojok kanan bawah peta (SUTM, SKTM, SKUTM, SUTR, JTM Eksisting pelangi, Tiang Existing/Baru, Stayset ⅄, Pondasi, Grounding ⏚, Gardu Baru/Eksisting).
   - **Integrasi Database Beban Trafo Web**: Penarikan data pengukuran live dari web database (`fikrybudi.github.io/dashboard-beban-trafo/`).
   - **Mode Segmentasi Jalur**: Multi-page terkunci (*Fixed Scale*), potong per 8 tiang TM, potong per 400m, atau 1 lembar peta full.
5. **📊 Export CSV (Excel)**: Ekspor tabular lengkap seluruh aset survey untuk pengolahan spreadsheet dan laporan anggaran (RAB).

### 4. 🗂️ Data Eksisting / Overlay Manager
- Import dan visualisasi data jaringan eksisting dalam format **KML, KMZ, dan CSV**.
- Pewarnaan otomatis jalur penyulang/feeder dengan palet warna khusus.
- Pengaturan visibilitas layer (SUTM, SUTR, SKTM, SKUTM, Tiang, Gardu) secara independen.

### 5. ☁️ Sinkronisasi Cloud & Arsitektur Offline-First
- Terintegrasi dengan **Supabase Database & Authentication**.
- **Offline-First**: Penyimpanan lokal otomatis via browser `localStorage` dan IndexedDB. Survey dapat dibuat dan diedit tanpa koneksi internet, lalu di-sync ke cloud ketika online.

### 6. 📱 Antarmuka Responsif & Multi-Perangkat
- **Desktop & Laptop**: Sidebar dengan *resizable drag handle* (lebar sidebar dapat diatur bebas) dan tombol *collapse/expand*.
- **Smartphone & Tablet**: Drawer navigasi adaptif dan toolbar bawah ramah sentuhan.
- **Dukungan Akses Jaringan Lokal**: Server dev dikonfigurasi `host: 0.0.0.0` sehingga dapat diakses oleh perangkat lain dalam satu jaringan WiFi/LAN.

---

## 🛠️ Teknologi & Dependensi

| Kategori | Teknologi | Deskripsi |
|---|---|---|
| **Core Framework** | React 18 + TypeScript | UI berbasis komponen tipe-aman |
| **Build Tool** | Vite 6 | Development server instan & bundle builder cepat |
| **GIS & Pemetaan** | Leaflet + React-Leaflet | Visualisasi peta, polylines, markers, dan layer tiles |
| **Dokumen PDF** | `pdf-lib` | Pembuatan dokumen CAD landscape A4 dan kop vektor PLN |
| **Tangkapan Peta** | `html2canvas` | Render canvas peta resolusi tinggi (skala 2x) |
| **Backend & Cloud** | Supabase JS Client | Database PostgreSQL, autentikasi, dan sinkronisasi cloud |
| **Ikonografi** | Lucide React | Ikon UI modern, ringan, dan konsisten |

---

## 🚀 Memulai (Quick Start)

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18.x atau lebih baru.
- Manajer paket `npm`, `yarn`, atau `pnpm`.

### 1. Kloning Repositori
```bash
git clone https://github.com/username/pln-survey-web.git
cd pln-survey-web
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi Supabase Anda pada file `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173/`.  
Untuk mengakses dari HP atau perangkat lain dalam satu jaringan WiFi, buka alamat `http://<IP-KOMPUTER-ANDA>:5173/`.

### 5. Build untuk Produksi
```bash
npm run build
```
Hasil kompilasi siap deploy akan berada di folder `dist/`. Anda dapat menguji hasil build secara lokal dengan:
```bash
npm run preview
```

---

## 📁 Struktur Direktori

```text
pln-survey-web/
├── public/                     # Favicon, ikon MASIV, dan aset statis
├── src/
│   ├── components/
│   │   ├── Auth/              # Form login & autentikasi Supabase
│   │   ├── Common/            # Splash screen, loading indicators, dll
│   │   ├── Forms/             # Form input (Tiang, Gardu, Jalur, Persil, BA Survey, Signature Pad)
│   │   ├── Modals/            # Modal aksi (Kop Gambar PLN, Rekap Summary, Action Tiang/Jalur, Layer, About)
│   │   ├── Toolbar/           # Toolbar bawah penanaman aset & drafting peta
│   │   ├── Sidebar.tsx        # Panel daftar survey, pencarian, filter cloud, dan resizable sidebar
│   │   └── SurveyMap.tsx      # Komponen peta Leaflet dengan multi-tile basemap
│   ├── services/
│   │   ├── localDb.ts         # Penyimpanan lokal survey (offline-first)
│   │   ├── overlayParser.ts   # Parser berkas KML, KMZ, dan CSV
│   │   ├── overlayStorage.ts  # Penyimpanan layer data eksisting
│   │   ├── supabaseClient.ts  # Inisialisasi Supabase client
│   │   ├── supabaseService.ts # Layanan sinkronisasi cloud CRUD
│   │   └── trafoLoadService.ts# Service penarik data CSV live beban trafo web
│   ├── types/                 # Definisi TypeScript (Tiang, Gardu, Jalur, Survey, Overlay)
│   ├── utils/
│   │   ├── baSurveyPdf.ts     # Generator Berita Acara PDF resmi PLN
│   │   ├── branchUtils.ts     # Logika percabangan tiang R/L otomatis
│   │   ├── exportUtils.ts     # Utilitas ekspor Rekap PDF, KML Google Earth, dan CSV
│   │   ├── geoUtils.ts        # Kalkulasi Haversine, segmentasi jalur, dan bounding box
│   │   ├── pdfGambarExport.ts # Generator PDF Gambar Teknik CAD & Kop Resmi PT PLN (Persero)
│   │   ├── plnLogoBase64.ts   # Aset logo resmi PLN dalam format Base64 offline
│   │   └── rincianPekerjaan.ts# Builder tabel ringkasan material & rincian pekerjaan
│   ├── App.tsx                # Komponen utama & orkestrasi alur aplikasi
│   ├── index.css              # Styling global, glassmorphism, dan utility CSS
│   └── main.tsx               # Titik masuk utama aplikasi
├── .env.example               # Template environment variables
├── .gitignore                 # Daftar berkas yang diabaikan git
├── package.json               # Dependensi & skrip NPM
├── tsconfig.json              # Konfigurasi TypeScript
├── USERGUIDE.md               # Panduan lengkap penggunaan aplikasi untuk surveyor & admin
└── vite.config.ts             # Konfigurasi server Vite
```

---

## 📖 Panduan Pengguna (User Guide)

Panduan operasional lengkap step-by-step mulai dari login, pembuatan survey, drafting jaringan, pengisian Berita Acara, hingga ekspor dokumen resmi tersedia pada berkas [USERGUIDE.md](USERGUIDE.md).

---

## 🏢 Kepemilikan & Hak Cipta

Aplikasi ini dikembangkan untuk kebutuhan operasional ketenagalistrikan **PT PLN (Persero)** pada sistem distribusi jaringan tenaga listrik. Seluruh standar teknis gambar mengacu pada regulasi gambar teknik ketenagalistrikan PT PLN (Persero).
