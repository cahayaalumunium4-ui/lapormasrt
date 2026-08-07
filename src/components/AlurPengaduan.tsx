import { ClipboardList, ShieldCheck, Cog, CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  {
    n: 1,
    title: 'Isi Form Pengaduan',
    desc: 'Warga mengisi form pengaduan secara online dengan data lengkap dan foto bukti.',
    icon: ClipboardList,
    color: '#16a34a',
  },
  {
    n: 2,
    title: 'Laporan Diverifikasi',
    desc: 'Pengurus RT memverifikasi keabsahan laporan yang masuk sebelum ditindaklanjuti.',
    icon: ShieldCheck,
    color: '#22c55e',
  },
  {
    n: 3,
    title: 'Diproses Pengurus RT',
    desc: 'Laporan diteruskan ke petugas terkait untuk ditindaklanjuti sesuai kategori.',
    icon: Cog,
    color: '#84cc16',
  },
  {
    n: 4,
    title: 'Pengaduan Selesai',
    desc: 'Tindak lanjut selesai dan warga menerima notifikasi beserta catatan penyelesaian.',
    icon: CheckCircle2,
    color: '#15803d',
  },
];

export function AlurPengaduan() {
  return (
    <section id="alur" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 mb-4">
            Proses Jelas & Transparan
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1F2937]">
            Alur Pengaduan
          </h2>
          <p className="mt-3 text-[#6B7280]">
            Empat langkah sederhana dari laporan terkirim hingga selesai ditindaklanjuti.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="relative group card card-hover p-6 animate-fade-up"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div
                  className="absolute top-5 right-5 font-display font-extrabold text-5xl opacity-10"
                  style={{ color: s.color }}
                >
                  {s.n}
                </div>
                <div
                  className="grid place-items-center h-14 w-14 rounded-2xl text-white shadow-lg mb-5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: s.color }}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#1F2937] mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {s.desc}
                </p>

                {i < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
