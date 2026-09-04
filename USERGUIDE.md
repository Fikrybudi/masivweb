# 📘 Buku Panduan Pengguna (User Guide)
## MASIV Web — Mobile Asset Surveying, Information and Verification System
### Sistem Informasi Geografis Jaringan Distribusi Tenaga Listrik PT PLN (Persero)

---

## DAFTAR ISI
1. [BAB 1: Pengenalan & Akses Aplikasi](#bab-1-pengenalan--akses-aplikasi)
2. [BAB 2: Autentikasi & Sinkronisasi Cloud](#bab-2-autentikasi--sinkronisasi-cloud)
3. [BAB 3: Manajemen Proyek Survey](#bab-3-manajemen-proyek-survey)
4. [BAB 4: Peralatan Gambar Peta & Smart Drafting](#bab-4-peralatan-gambar-peta--smart-drafting)
   - [4.1 Menanam Tiang Baru (Smart Label & Branching)](#41-menanam-tiang-baru-smart-label--branching)
   - [4.2 Menggeser & Mengedit Tiang](#42-menggeser--mengedit-tiang)
   - [4.3 Menanam Gardu Distribusi](#43-menanam-gardu-distribusi)
   - [4.4 Menarik Jalur Kabel Jaringan](#44-menarik-jalur-kabel-jaringan)
   - [4.5 Fitur Underbuild SUTR](#45-fitur-underbuild-sutr)
   - [4.6 Menggambar Persil Pelanggan](#46-menggambar-persil-pelanggan)
5. [BAB 5: Import & Layer Data Eksisting](#bab-5-import--layer-data-eksisting)
6. [BAB 6: Berita Acara (BA) Survey & Tanda Tangan Digital](#bab-6-berita-acara-ba-survey--tanda-tangan-digital)
7. [BAB 7: Rekapitulasi & 5 Format Ekspor Dokumen Resmi](#bab-7-rekapitulasi--5-format-ekspor-dokumen-resmi)
   - [7.1 Export Rekap PDF](#71-export-rekap-pdf)
   - [7.2 Export Peta KML (Google Earth)](#72-export-peta-kml-google-earth)
   - [7.3 Export Berita Acara (BA) PDF](#73-export-berita-acara-ba-pdf)
   - [7.4 Export PDF Gambar (Blangko CAD Standar PLN)](#74-export-pdf-gambar-blangko-cad-standar-pln)
   - [7.5 Export CSV (Excel)](#75-export-csv-excel)
8. [BAB 8: Tips Produktivitas & Solusi Masalah](#bab-8-tips-produktivitas--solusi-masalah)

---

## BAB 1: Pengenalan & Akses Aplikasi

**MASIV Web** adalah sistem web GIS yang digunakan oleh tim survey lapangan, perencanaan (*planning*), dan pimpinan unit (*supervisor/manager*) PT PLN (Persero) untuk memetakan jalur jaringan distribusi tenaga listrik, membuat Berita Acara, serta mencetak gambar teknik resmi.

### Cara Akses:
1. **Komputer / Laptop Kantor**:
   - Buka browser modern (Google Chrome, Microsoft Edge, atau Mozilla Firefox).
   - Akses alamat server: `http://localhost:5173/` atau alamat domain/IP server yang telah ditentukan.
2. **Smartphone / Tablet / iPad**:
   - Pastikan perangkat terhubung pada jaringan WiFi yang sama dengan komputer host.
   - Buka browser HP dan masukkan alamat IP host, misalnya: `http://192.168.1.10:5173/`.
   - Tampilan akan otomatis menyesuaikan diri dengan tata letak mobile (*responsive drawer & bottom navigation*).

---

## BAB 2: Autentikasi & Sinkronisasi Cloud

1. **Masuk ke Akun**:
   - Masukkan Username/Email dan Password petugas PLN pada layar login.
   - Tersedia tombol bantuan langsung untuk menghubungi Superadmin via WhatsApp apabila lupa kata sandi.
2. **Sinkronisasi Cloud (Supabase)**:
   - Tombol **Sync Cloud** (berwarna biru di bagian atas sidebar) digunakan untuk menyelaraskan data survey antara penyimpanan lokal browser dan server cloud Supabase.
   - **Indikator Status Cloud**:
     - ☁️ *Cloud*: Data tersimpan aman di server pusat dan dapat diakses dari perangkat lain.
     - 💾 *Lokal*: Data tersimpan di penyimpanan browser saat ini (dapat diunggah kapan saja dengan menekan Sync).

---

## BAB 3: Manajemen Proyek Survey

### Membuat Survey Baru:
1. Klik tombol **+ Survey Baru** (warna hijau) pada sidebar.
2. Isi formulir pembuatan survey:
   - **Nama Survey**: Judul pekerjaan (contoh: *Pasang Baru - CV Berkah Mandiri*).
   - **Jenis Survey**: Pilih `SUTM` atau `SUTR`.
   - **Lokasi & Alamat**: Detail lokasi desa, kecamatan, atau calon pelanggan.
   - **Data Feeder & Gardu Induk**: Nama penyulang dan GI pemasok.
   - **Nama Surveyor**: Nama tim lapangan yang bertugas.
3. Klik **Simpan & Mulai Survey**. Peta akan otomatis memuat proyek baru.

### Pencarian & Filter Survey:
- **Kotak Pencarian**: Ketik nama survey, lokasi, atau nama pelanggan pada kolom cari di sidebar.
- **Filter Tab**:
  - **Semua**: Menampilkan semua survey.
  - **Cloud**: Hanya menampilkan survey yang sudah tersinkronisasi ke server pusat.
  - **Lokal**: Menampilkan survey yang belum di-sync ke cloud.

### Mengubah Lebar Sidebar:
- Pada mode desktop, geser garis pembatas di sebelah kanan sidebar untuk memperlebar atau mempersempit panel daftar survey sesuai kenyamanan mata Anda.
- Klik ikon panah di pojok kiri atas untuk menyembunyikan (*collapse*) sidebar agar area peta menjadi layar penuh.

---

## BAB 4: Peralatan Gambar Peta & Smart Drafting

Toolbar di bagian bawah layar menyediakan berbagai alat pemetaan cepat:

### 4.1 Menanam Tiang Baru (Smart Label & Branching)
1. Klik tombol **+ Tiang** pada toolbar bawah. Kursor peta akan berubah menjadi pin penargetan tiang presisi.
2. Klik pada titik lokasi tiang di peta.
3. Form input tiang akan muncul:
   - **Nomor Urut**: Terisi otomatis berurutan.
   - **Jenis Tiang**: Beton, Besi/Baja, atau Kayu.
   - **Tinggi Tiang**: 9m, 11m, 12m, atau 14m.
   - **Konstruksi**: Standar konstruksi PLN (TM-1, TM-2, TR-1, dll).
   - **Penguat & Grounding**: Pilihan Stayset (skur), Pondasi, dan pembumian (grounding).
4. **Smart Label Placement**: Posisi teks label tiang akan otomatis dihitung agar tidak menabrak tiang atau jalur kabel lain.
5. **Percabangan Jalur (Branching)**:
   - Jika ingin membuat cabang ke kanan atau ke kiri dari tiang induk, klik tiang induk tersebut pada peta, pilih **Cabang Kanan (R)** atau **Cabang Kiri (L)**.
   - Tiang berikutnya akan otomatis memiliki kode hirarki resmi PLN (misal: `T1R01`).

### 4.2 Menggeser & Mengedit Tiang
- **Menggeser Posisi Tiang**: Klik tiang yang ingin dipindah, pilih **Geser Tiang**, lalu klik posisi baru di peta. Seluruh jalur kabel yang menempel pada tiang tersebut akan ikut bergeser secara otomatis.
- **Menggeser Arah Label**: Klik label tiang untuk memutar posisi kuadran label ke arah yang paling kosong di sekitar tiang.

### 4.3 Menanam Gardu Distribusi
1. Klik tombol **+ Gardu** pada toolbar bawah.
2. Klik titik penempatan gardu di peta.
3. Masukkan nomor gardu, nama gardu, jenis (Portal, Cantol, Beton), kapasitas kVA (misal: 100 kVA, 250 kVA), serta perlengkapan proteksi (FCO, Arrester, dll).

### 4.4 Menarik Jalur Kabel Jaringan
1. Klik tombol **Tarik Jalur**.
2. Klik berurutan pada tiang-tiang atau titik belokan yang dilalui kabel. Jarak antar titik akan dihitung secara live (*real-time measurement*).
3. Setelah mencapai titik akhir, klik dua kali atau tekan tombol konfirmasi untuk membuka dialog jalur.
4. Tentukan jenis jaringan (**SUTM**, **SUTR**, **SKTM**, atau **SKUTM**), jenis penghantar (A3C, AAAC, dll), dan ukuran penampang (70 mm², 150 mm², dll).

### 4.5 Fitur Underbuild SUTR
- Digunakan ketika kabel tegangan rendah (SUTR) dipasang menumpang pada tiang-tiang saluran tegangan menengah (SUTM).
- Klik tombol **Underbuild SUTR**, lalu pilih tiang-tiang SUTM yang ingin dipasangi kabel SUTR. Sistem akan otomatis merekam jalur underbuild tanpa perlu menggambar tiang baru.

### 4.6 Menggambar Persil Pelanggan
- Klik tombol **Persil**, lalu klik sudut-sudut batas tanah/bangunan pelanggan untuk membentuk poligon area.
- Masukkan identitas pelanggan, nomor IDPEL, dan daya yang diminta.

---

## BAB 5: Import & Layer Data Eksisting

1. **Membuka Layer Manager**: Klik ikon **Layer** pada pojok kanan atas peta.
2. **Visibilitas Layer**: Anda dapat menyembunyikan atau menampilkan layer tertentu (SUTM, SUTR, SKTM, SKUTM, Tiang, Gardu) dengan mencentang kotak centang yang tersedia.
3. **Pilihan Jenis Peta (Basemap)**:
   - **OpenStreetMap**: Peta jalan standar yang ringan.
   - **Satelit Esri**: Citra satelit dunia berkualitas tinggi.
   - **Google Satellite**: Citra satelit detail Google Maps.
   - **Google Hybrid**: Citra satelit Google dilengkapi nama jalan dan batas wilayah.
4. **Import Data Eksisting**:
   - Klik tombol **Import Data Eksisting** pada bar judul.
   - Unggah berkas **KML**, **KMZ**, atau **CSV** jaringan PLN eksisting.
   - Jalur penyulang akan ditampilkan dengan warna feeder yang berbeda secara otomatis.

---

## BAB 6: Berita Acara (BA) Survey & Tanda Tangan Digital

Berita Acara (BA) adalah dokumen legalitas survey lapangan yang mengikat antara PLN, calon pelanggan, dan aparat desa.

1. **Membuka Form BA**:
   - Klik tombol **Edit BA** pada bar judul atas.
2. **Pengisian Formulir**:
   - Isi kelengkapan data Calon Pelanggan (Nama, Alamat, No Telepon, Daya, Tarif).
   - Verifikasi kebutuhan material (jumlah tiang, panjang tarikan kabel, kVA gardu).
   - Catatan khusus kondisi lapangan (akses jalan, pohon penghalang, dsb).
3. **Tanda Tangan Digital**:
   - Klik tombol **Tanda Tangan** pada kolom masing-masing:
     1. Petugas Surveyor PLN.
     2. Calon Pelanggan.
     3. Kepala Desa / Aparat Setempat.
   - Sebuah kanvas digital akan terbuka. Tanda tangani langsung menggunakan mouse, stylus pen, atau jari tangan pada layar sentuh.
   - Klik **Simpan Tanda Tangan**.
4. Simpan formulir. Dokumen Berita Acara kini siap diekspor ke PDF resmi.

---

## BAB 7: Rekapitulasi & 5 Format Ekspor Dokumen Resmi

Untuk membuka menu rekapitulasi dan ekspor:
- Klik tombol **Rekap Survey** pada bar judul, atau
- Klik tombol **Rekap** pada salah satu kartu survey di sidebar.

Jendela ringkasan survey akan menampilkan ringkasan aset, total tiang TM/TR, panjang kabel per jenis jaringan, jumlah gardu, dan rincian material. Di bagian bawah jendela terdapat 5 tombol ekspor:

### 7.1 Export Rekap PDF
- Menghasilkan laporan dokumen rekapitulasi formal lengkap dengan tabel inventaris tiang, rincian kabel, daftar gardu, dan tabel rekap material PLN.

### 7.2 Export Peta KML (Google Earth)
- Menghasilkan berkas `.kml` yang siap dibuka di aplikasi Google Earth desktop maupun mobile.
- Warna jalur kabel dan penanda tiang/gardu sudah dikonfigurasi sesuai standar simbol PLN.

### 7.3 Export Berita Acara (BA) PDF
- Menghasilkan dokumen resmi Berita Acara Pengukuran Lapangan dengan format tata letak standar PT PLN (Persero), lengkap dengan tanda tangan digital para pihak yang telah direkam.

### 7.4 Export PDF Gambar (Blangko CAD Standar PLN)
Fitur unggulan untuk menghasilkan gambar teknik peta resmi berskala:
1. Klik tombol **Export PDF Gambar (Blangko)**.
2. Jendela **Form Data Kop Gambar PLN** akan terbuka:
   - Periksa nama **UID**, **UP3**, dan **ULP**.
   - Masukkan nama surveyor, pilih jabatan pemeriksa (**TL HAR**, **TL RENSIS**, **ASMAN KONS**, atau **TL TEKNIK**), dan nama pemeriksa.
   - Masukkan nama **Manager ULP / UP3**.
   - **Tarik Beban Trafo Live**: Aktifkan sakelar ini untuk menyisipkan data pengukuran beban trafo dari database web. Pilih nama gardu yang relevan.
   - **Pekerjaan Uprating**: Aktifkan jika terdapat rencana uprating kapasitas trafo (contoh: 250 kVA).
   - **Mode Segmentasi**:
     - *Fixed Scale (Skala Terkunci)*: Multi-halaman dengan skala konsisten (Rekomendasi).
     - *8 Tiang TM / Halaman*: Membagi halaman per 8 tiang SUTM.
     - *Per 400 Meter / Halaman*: Membagi halaman per 400m panjang rute fisik.
     - *1 Halaman Full*: Menampilkan seluruh jalur dalam satu lembar peta A4 landscape.
3. Klik **🚀 EXPORT PDF RESMI**.
4. Dokumen PDF Gambar Teknik standar CAD PLN akan terunduh secara otomatis.

### 7.5 Export CSV (Excel)
- Menghasilkan berkas spreadsheet tabular `.csv` yang berisi daftar koordinat tiang, atribut konstruksi, panjang jalur kabel, dan gardu untuk keperluan analisis data dan penyusunan RAB.

---

## BAB 8: Tips Produktivitas & Solusi Masalah

| Kendala / Pertanyaan | Solusi Cepat |
|---|---|
| **Peta satelit lambat dimuat** | Ganti jenis peta sementara ke *OpenStreetMap* pada tombol jenis peta di pojok kanan atas. |
| **Ingin drafting lebih leluasa** | Sembunyikan sidebar dengan mengklik tombol panah di samping judul aplikasi MASIV. |
| **Akses dari smartphone di lapangan** | Hubungkan HP ke tethering/WiFi laptop, lalu buka browser HP ke alamat IP laptop port 5173 (`http://192.168.x.x:5173`). |
| **Data survey belum muncul di komputer lain** | Pastikan Anda telah menekan tombol **Sync Cloud** pada survey tersebut agar data terunggah ke database server. |
| **Label tiang saling bertumpuk** | Klik pada tiang yang bersangkutan, lalu ubah posisi label ke kuadran yang masih kosong (Utara, Selatan, Timur, Barat, dll). |

---

*Hak Cipta © 2026 PT PLN (Persero). Dokumen ini diterbitkan sebagai panduan resmi operasional sistem informasi geografis MASIV Web.*
