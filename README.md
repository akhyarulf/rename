# Rename Foto — untuk Nyasar Nyaman

Alat internal untuk me-rename banyak foto sekaligus sebelum di-upload ke
[nyasarnyaman.my.id](https://nyasarnyaman.my.id), dengan pola nama:

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

## Fitur

- Tulis slug jalur sekali saja — huruf besar dan spasi otomatis jadi strip.
- Masukkan banyak foto sekaligus lewat drag & drop; pilihan file.
- Atur urutan per foto: tombol naik/turun atau ketik nomor yang diinginkan
  (foto lain otomatis bergeser, tidak ada nomor bentrok).
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

## Menjalankan secara lokal

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # hasil statis di dist/
bun run typecheck
```

## Deploy

Push ke `main` memicu `.github/workflows/deploy.yml` (Bun → typecheck → build →
GitHub Pages) dan terbit di **https://rename.nyasarnyaman.my.id**.

> Repository ini: Pages harus memakai Source **GitHub Actions**
> (Settings → Pages → Build and deployment → Source). Kalau source-nya masih
> *Deploy from a branch*, build Jekyll akan menimpa hasil di atas dengan berkas
> sumber mentah.
