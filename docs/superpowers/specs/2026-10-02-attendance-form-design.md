# Form Konfirmasi Kehadiran — Design Specification

## Tujuan
Membuat form React untuk menerima nama, nomor WhatsApp, dan status kehadiran. Setelah berhasil dikirim, pengguna melihat halaman QR unik yang menampilkan nama dan nomor WhatsApp.

## Arsitektur
- **Frontend:** React + Vite. Mengirim JSON ke API PHP dan menampilkan hasil QR.
- **Backend:** PHP native endpoint `api/submit.php`. Memvalidasi input, membuat UUID unik, menyimpan data ke file Excel `.xlsx`, lalu mengembalikan data QR.
- **Penyimpanan:** `data/registrations.xlsx` di server. Direktori data tidak boleh diakses langsung dari web.
- **QR:** QR berisi UUID registrasi, bukan data pribadi. UUID dibuat server menggunakan `random_bytes` dan dicek agar unik.

## Alur
1. User mengisi `Nama`, `No Whatsapp`, dan memilih `Hadir` atau `Tidak hadir`.
2. React memvalidasi field required dan format nomor `081...` atau `62...`.
3. React POST JSON ke `api/submit.php`.
4. PHP memvalidasi ulang input pada trust boundary.
5. PHP membuat/memperbarui workbook Excel, menambahkan baris data.
6. PHP mengembalikan `id`, `nama`, `whatsapp`, `kehadiran`.
7. React menampilkan QR unik berbasis `id`, nama, dan nomor WhatsApp.

## Format Nomor WhatsApp
Menerima angka tanpa spasi/tanda baca dengan pola `08` diikuti 8–13 digit atau `62` diikuti 9–14 digit. Nomor disimpan sebagai teks agar awalan `0` tetap ada.

## Format Excel
Kolom: `ID`, `Nama`, `No Whatsapp`, `Kehadiran`, `Dibuat Pada`. Header dibuat otomatis jika file belum ada. Penulisan file memakai lock untuk mengurangi risiko benturan request.

## Error Handling
- Input invalid: HTTP 422 dengan JSON error.
- Method selain POST: HTTP 405.
- CORS dibatasi ke origin frontend melalui konfigurasi sederhana.
- Kegagalan penyimpanan: HTTP 500 tanpa membocorkan path internal.
- PHP membutuhkan ekstensi `ZipArchive` dan `mbstring` bila digunakan oleh writer minimal.

## UI dan Aksesibilitas
- Label terhubung ke input.
- `required`, `type="tel"`, radio status kehadiran.
- Pesan error terlihat dan tidak hanya mengandalkan warna.
- Tombol dinonaktifkan saat submit.
- Halaman hasil menyediakan tombol cetak dan kembali ke form.

## Batasan YAGNI
- Tidak ada login, dashboard admin, edit data, atau endpoint validasi QR.
- Tidak ada dependency backend Excel besar; writer XLSX minimal dibuat memakai ZIP/XML bawaan PHP.
- QR frontend memakai library QR kecil yang sudah dipasang di frontend; jika instalasi dependency tidak diinginkan, QR dapat diganti generator berbasis CDN.

## Verifikasi
- Test PHP CLI untuk validasi nomor dan keunikan ID.
- Build React.
- Uji manual POST valid/invalid dan pembukaan hasil QR.
