import RenameTool from "./components/RenameTool";
import { Button } from "./components/ui";

const BLOG_URL = "https://nyasarnyaman.my.id";

const steps = [
  {
    title: "Tulis slug jalur",
    body: "Ketik nama gunung dan jalurnya, misalnya lawu-via-cemoro-sewu. Spasi dan huruf besar otomatis dirapikan.",
  },
  {
    title: "Masukkan foto",
    body: "Tarik puluhan foto sekaligus dari galeri atau folder. Semuanya tetap di perangkatmu, tidak ada yang diunggah ke server.",
  },
  {
    title: "Atur nomor & unduh",
    body: "Naikkan, turunkan, atau ketik nomor yang kamu mau. Hasilnya langsung diunduh sebagai satu ZIP.",
  },
];

const anatomy = [
  { part: "01", label: "Nomor urut", hint: "Dua digit: 01, 02, 03" },
  { part: "lawu-via-cemoro-sewu", label: "Gunung & jalur", hint: "Slug yang kamu ketik sendiri" },
  { part: "nyasar-nyaman", label: "Penanda blog", hint: "Biar rapi saat upload ke blog" },
];

const perks = [
  {
    title: "100% di perangkat",
    body: "Foto tidak pernah meninggalkan browser. Aman untuk foto rute yang masih private di galeri kamu.",
  },
  {
    title: "Tanpa akun, tanpa batas",
    body: "Buka halaman ini, langsung pakai. Tidak ada login, tidak ada kuota file.",
  },
  {
    title: "Rapih sesuai format blog",
    body: "Satu pola nama untuk semua artikel, jadi featured image dan media library blog rapi.",
  },
];

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-moss-200/60 bg-sand-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss-700 text-sand-50">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
                <path d="M3 19l6-9 4 5.5L15.5 12 21 19z" strokeLinejoin="round" />
                <circle cx="17.5" cy="6.5" r="2" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold leading-tight">
              Rename Foto
              <span className="block font-sans text-[11px] font-medium tracking-wide text-ink-500">
                untuk nyasarnyaman.my.id
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-700 md:flex">
            <a className="transition hover:text-moss-700" href="#alat">
              Alat
            </a>
            <a className="transition hover:text-moss-700" href="#cara-kerja">
              Cara kerja
            </a>
            <a className="transition hover:text-moss-700" href="#format">
              Format nama
            </a>
            <a className="transition hover:text-moss-700" href={BLOG_URL} target="_blank" rel="noreferrer">
              Blog ↗
            </a>
          </nav>

          <Button size="sm" onClick={() => document.getElementById("alat")?.scrollIntoView()}>
            Mulai rename
          </Button>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="ridge relative overflow-hidden border-b border-moss-200/60">
          <div className="grain pointer-events-none absolute inset-0 opacity-[0.05]" />
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pb-20 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-moss-300 bg-white/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-moss-700 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />
                  Tool blogger
                </span>

                <h1 className="mt-5 font-display text-4xl leading-[1.08] font-semibold text-ink-900 sm:text-5xl md:text-6xl">
                  Rename foto blog
                  <span className="block text-moss-700">sekaligus banyak.</span>
                </h1>

                <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700">
                  Niatnya buat upload ke{" "}
                  <a
                    href={BLOG_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-moss-700 underline decoration-ember-400 underline-offset-4 hover:decoration-ember-500"
                  >
                    Nyasar Nyaman
                  </a>{" "}
                  jadi gampang. Ketik nama jalurnya, atur urutan fotonya, lalu unduh semuanya
                  sekaligus dalam format{" "}
                  <span className="font-mono text-[0.95em] text-moss-700">
                    angka-namagunungdanjalur-nyasarnyaman
                  </span>
                  .
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => document.getElementById("alat")?.scrollIntoView()}
                  >
                    Upload foto sekarang
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => document.getElementById("format")?.scrollIntoView()}
                  >
                    Lihat format nama
                  </Button>
                </div>

                <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-moss-200 pt-6">
                  {[
                    ["Format", "01-lawu-via-cemoro-sewu-nyasarnyaman.jpg"],
                    ["Privasi", "100% lokal"],
                    ["Akun", "Tidak perlu"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
                        {label}
                      </dt>
                      <dd className="mt-1 break-words font-mono text-xs text-moss-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <HeroPreview />
            </div>
          </div>
        </section>

        {/* Tool */}
        <section id="alat" className="scroll-mt-24 bg-sand-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-ember-600 uppercase">
                Alat rename
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                Tiga langkah, beres.
              </h2>
              <p className="mt-3 text-ink-700">
                Tak perlu install apa pun. Foto diproses langsung di browser dan bisa langsung kamu
                tarik ke media library WordPress.
              </p>
            </div>

            <RenameTool />
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="scroll-mt-24 border-y border-moss-200/60 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-ember-600 uppercase">
                Cara kerja
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                Dari galeri ke artikel dalam sekali duduk.
              </h2>
            </div>

            <ol className="grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="group rounded-3xl border border-moss-200/70 bg-sand-50 p-6 transition hover:-translate-y-1 hover:border-moss-400 hover:shadow-lg hover:shadow-moss-900/5"
                >
                  <span className="font-display text-sm font-semibold text-ember-600">
                    Langkah {index + 1}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{step.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {perks.map((perk) => (
                <div key={perk.title} className="rounded-2xl bg-moss-50 p-5">
                  <h3 className="font-semibold text-moss-800">{perk.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{perk.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Format nama */}
        <section id="format" className="scroll-mt-24 bg-sand-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-ember-600 uppercase">
                  Format nama file
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                  angka-namagunungdanjalur-nyasarnyaman
                </h2>
                <p className="mt-4 leading-relaxed text-ink-700">
                  Pola ini dipakai konsisten di semua artikel. Kalau nama fotonya sudah rapi, jauh
                  lebih gampang dicari lewat pencarian media WordPress, dan featured image selalu
                  kelihatan benar.
                </p>

                <ul className="mt-6 space-y-3">
                  {anatomy.map((item) => (
                    <li
                      key={item.part}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-moss-200/70 bg-white px-4 py-3"
                    >
                      <code className="rounded-lg bg-moss-800 px-2.5 py-1 font-mono text-xs text-sand-100">
                        {item.part}
                      </code>
                      <span className="font-semibold text-moss-800">{item.label}</span>
                      <span className="text-sm text-ink-500">{item.hint}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-moss-200/70 bg-white p-6 shadow-sm">
                <h3 className="font-display text-xl font-semibold">Contoh nama file</h3>
                <ul className="mt-4 space-y-2 font-mono text-sm">
                  {[
                    "01-lawu-via-cemoro-sewu-nyasarnyaman.jpg",
                    "02-lawu-via-cemoro-sewu-nyasarnyaman.jpg",
                    "03-lawu-via-cemoro-sewu-nyasarnyaman.jpg",
                    "10-lawu-via-cemoro-sewu-nyasarnyaman.jpg",
                  ].map((name) => (
                    <li
                      key={name}
                      className="truncate rounded-xl bg-sand-100 px-3 py-2 text-moss-800"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-ink-500">
                  Nomor selalu dua digit supaya urutan 1–9 dan 10–99 tetap berurutan rapi saat diurutkan
                  di explorer atau media library.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-moss-800 py-16 text-sand-100">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold">Siap upload artikel berikutnya?</h2>
              <p className="mt-2 max-w-xl text-sand-200/85">
                Buka alatnya, lempar foto rute kamu, selesai.                Gratis untuk dipakai sendiri atau tim kecil yang mengelola blog.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-sand-100 text-moss-900 hover:bg-white"
              onClick={() => document.getElementById("alat")?.scrollIntoView()}
            >
              Buka alat rename
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-moss-200/60 bg-sand-50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 text-sm text-ink-500 sm:flex-row sm:items-center">
          <p>Alat internal untuk blogger Nyasar Nyaman.</p>
          <a
            href={BLOG_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-moss-700 underline-offset-4 hover:underline"
          >
            nyasarnyaman.my.id ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  const rows = [
    { from: "IMG_4821.JPG", to: "01-lawu-via-cemoro-sewu-nyasarnyaman.jpg" },
    { from: "IMG_4822.JPG", to: "02-lawu-via-cemoro-sewu-nyasarnyaman.jpg" },
    { from: "IMG_4830.JPG", to: "03-lawu-via-cemoro-sewu-nyasarnyaman.jpg" },
    { from: "IMG_4833.JPG", to: "04-lawu-via-cemoro-sewu-nyasarnyaman.jpg" },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-moss-200/50 to-ember-300/30 blur-2xl" />
      <div className="relative rounded-3xl border border-moss-200 bg-white p-5 shadow-xl shadow-moss-900/10">
        <div className="flex items-center gap-2 border-b border-moss-100 pb-3">
          <span className="h-3 w-3 rounded-full bg-ember-400" />
          <span className="h-3 w-3 rounded-full bg-moss-300" />
          <span className="h-3 w-3 rounded-full bg-moss-200" />
          <span className="ml-2 text-xs font-medium text-ink-500">lawu-via-cemoro-sewu.zip</span>
        </div>

        <ul className="mt-4 space-y-2.5">
          {rows.map((row, index) => (
            <li
              key={row.from}
              className="rounded-xl border border-moss-100 bg-sand-50 px-3 py-2.5 transition hover:border-moss-300"
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <p className="font-mono text-xs text-ink-500 line-through">{row.from}</p>
              <p className="mt-0.5 break-all font-mono text-[13px] font-semibold text-moss-800">
                {row.to}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-moss-800 px-3 py-2.5 text-sand-100">
          <span className="text-xs font-semibold">4 foto siap</span>
          <span className="rounded-lg bg-moss-600 px-3 py-1 text-xs font-semibold">Unduh ZIP</span>
        </div>
      </div>
    </div>
  );
}
