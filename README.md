# Edit Foto — untuk Nyasar Nyaman

Alat internal untuk menyiapkan foto sebelum di-upload ke
[nyasarnyaman.my.id](https://nyasarnyaman.my.id), dua halaman:

- **Rename** (`#/`) — rename banyak foto sekaligus dengan pola nama:

```
01-lawu-via-cemoro-sewu-panorama-dari-puncak-nyasarnyaman.jpg
└──┘ └──────────────────────┘ └────────────────────┘ └────────────┘ └──┘
 │      gunung dan jalur          deskripsi foto (opsional)   │   ekstensi asli
nomor (2 digit)                                            penanda blog
```

Format tanpa deskripsi tetap sama seperti sebelumnya:
`01-lawu-via-cemoro-sewu-nyasarnyaman.jpg`. Deskripsi disisipkan di belakang
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

## Fitur (Crop, halaman `#/crop`)

- Potong foto langsung di browser dengan rasio **Bebas / 16:9 / 4:3 / 1:1**
  plus slider zoom — cocok untuk header artikel 16:9.
- Orientasi EXIF foto HP dihormati (foto miring tetap lurus setelah crop).
- Hasil crop di-encode ulang sebagai **JPEG kualitas 90** dan otomatis
  berakhiran `.jpg`; foto yang tidak di-crop tetap byte asli.
- Tombol **kembalikan asli** untuk membatalkan crop pada satu foto.
- Nama file mengikuti format yang sama seperti halaman Rename, jadi hasil
  crop langsung bisa masuk ke alur upload yang sama.

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
