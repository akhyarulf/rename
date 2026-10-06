# Edit Foto — untuk Nyasar Nyaman

Alat internal untuk menyiapkan foto sebelum di-upload ke
[nyasarnyaman.my.id](https://nyasarnyaman.my.id).

Satu layar saja: upload foto, rename, beri deskripsi, potong yang perlu, lalu unduh
semua sekaligus. Tidak ada halaman terpisah untuk crop.

Format nama file:

```
01-lawu-via-cemoro-sewu-panorama-dari-puncak-nyasar-nyaman.jpg
└──┘ └──────────────────────┘ └────────────────────┘ └────────────┘ └──┘
  │      gunung dan jalur          deskripsi foto (opsional)   │   ekstensi asli
nomor (2 digit)                                            penanda blog
```

Format tanpa deskripsi tetap sama seperti sebelumnya:
`01-lawu-via-cemoro-sewu-nyasar-nyaman.jpg`. Deskripsi disisipkan di belakang
nama jalur, sebelum penanda blog, dan boleh dikosongkan per foto. Ada toggle
**Sisipkan deskripsi** untuk mengembalikannya ke format lama.

## Fitur (Rename)

- Tulis slug jalur sekali saja — huruf besar dan spasi otomatis jadi strip.
- Masukkan banyak foto sekaligus lewat drag & drop; pilihan file.
- Atur urutan per foto: tombol naik/turun atau ketik nomor yang diinginkan
  (foto lain otomatis bergeser, tidak ada nomor bentrok).
- **Lightbox**: klik thumbnail untuk melihat foto besar tanpa buka tab baru.
  Navigasi dengan tombol ← →, panah kiri/kanan pada keyboard, atau Esc untuk
  menutup. Nama file dan deskripsinya ikut tampil di modal.
- **Deskripsi per foto dengan input cepat:**
  - ketik sekali lalu **Pakai untuk semua**, atau centang "terapkan otomatis
    ke semua foto" biar ngetik sambil jalan;
  - **Tempel daftar**: satu deskripsi per baris, langsung berurutan ke foto 01, 02, …;
  - **Enter** melompat ke input foto berikutnya;
  - preset siap pakai (panorama gunung, pemandangan luas, sunrise, puncak, kamp, suasana jalur);
  - deskripsi dipangkas maksimum 4 kata supaya nama file tidak kepanjangan;
  - deskripsi juga dipakai sebagai alt text saat menyalin Markdown.
- Nomor dua digit (`01`, `02`, … `10`) supaya urutan tetap rapi saat diurutkan.
- Unduh semuanya dalam satu ZIP, atau satu per satu.
- Salin daftar nama file / kode Markdown untuk tempel ke artikel.
- 100% diproses di browser: foto tidak pernah diunggah ke server.
- Slug, pengaturan, dan deskripsi terakhir disimpan otomatis di browser.

## Fitur (Crop — panel dalam alat yang sama)

- Potong foto langsung di browser dengan rasio **Bebas / 16:9 / 9:16 / 4:3 / 3:4 /
  1:1** plus slider zoom — 16:9 untuk header artikel, 9:16 dan 3:4 untuk foto
  vertikal (story/HP), 1:1 untuk galeri.
- **Pilih ukuran hasil**: `Ikuti crop` (default), 1920 × 1080, 1600 × 900,
  1280 × 720, 1200 × 900, 800 × 600, 1080 × 1080, 1080 × 1440, 1080 × 1920,
  atau 900 × 1200. Rasio hasil selalu mengikuti kotak crop (tidak
  diregangkan), dan ukuran keluarannya ditampilkan langsung di dialog. Fotomu
  tidak diperbesar diam-diam; centang **Perbesar jika perlu** kalau memang mau
  upscaling.
- Orientasi EXIF foto HP dihormati (foto miring tetap lurus setelah crop).
- Hasil crop di-encode ulang sebagai **JPEG kualitas 90** dan otomatis
  berakhiran `.jpg`; foto yang tidak di-crop tetap byte asli.
- Ukuran hasil ikut tampil di daftar foto, misalnya
  `sudah di-crop (JPEG q90, 1280 × 720 px)`.
- Tombol **kembalikan asli** untuk membatalkan crop pada satu foto.
- Nama file mengikuti format yang sama seperti rename, jadi hasil
  crop langsung bisa masuk ke alur upload yang sama.
- Status pilihan rasio, ukuran, zoom, dan toggle perbesar tersimpan per foto
  di browser, jadi kalau halaman di-refresh kotak crop tidak hilang.

## Menjalankan secara lokal

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # hasil statis di dist/
bun run typecheck
```

## Deploy

Push ke `main` memicu `.github/workflows/deploy.yml` (Bun → typecheck → build →
GitHub Pages). Domain tujuan akhir: **https://edit.nyasarnyaman.my.id** (ganti
`public/CNAME` + DNS saat beralih dari rename.nyasarnyaman.my.id).

> Repository ini: Pages harus memakai Source **GitHub Actions**
> (Settings → Pages → Build and deployment → Source). Kalau source-nya masih
> *Deploy from a branch*, build Jekyll akan menimpa hasil di atas dengan berkas
> sumber mentah.
