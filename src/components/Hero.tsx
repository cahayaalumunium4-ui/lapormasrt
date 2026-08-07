import { ArrowRight, FileText, ShieldCheck, Clock, CheckCircle2, Loader2, MapPin, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  onNavigate: (page: string) => void;
}

const sample = [
  { label: 'Menunggu Verifikasi', ticket: 'LPR-2026-001', pct: 33, color: '#ca8a04', bg: '#fef9c3', icon: Clock },
  { label: 'Diproses', ticket: 'LPR-2026-002', pct: 66, color: '#2563eb', bg: '#dbeafe', icon: Loader2 },
  { label: 'Selesai', ticket: 'LPR-2026-003', pct: 100, color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
];

export function Hero({ onNavigate }: Props) {
  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 gradient-green" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl" />
        <div className="absolute top-32 -right-24 h-96 w-96 rounded-full bg-accent-400/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(22,163,74,0.5) 1px, transparent 0)',
            backgroundSize: '34px 34px',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-brand-200 text-xs font-semibold text-brand-700 mb-6 shadow-soft">
            <ShieldCheck className="h-4 w-4" />
            Layanan Resmi Warga
            <span className="inline-flex items-center gap-1 ml-1 text-accent-600">
              <Sparkles className="h-3 w-3" /> Online
            </span>
          </div>
          <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
            <span className="text-gradient">LAPOR MAS RT</span>
          </h1>
          <p className="mt-3 text-lg sm:text-xl font-display font-semibold text-[#1F2937]">
            Sistem Pengaduan, Aspirasi, dan Saran Warga
          </p>
          <p className="mt-4 text-sm sm:text-base text-[#6B7280] leading-relaxed max-w-xl">
            Lapor Mas RT merupakan layanan digital yang memudahkan warga Dusun Gabusan RT 22
            dalam menyampaikan pengaduan, usulan, kritik, maupun aspirasi kepada pengurus RT
            secara cepat, aman, transparan, dan dapat dipantau proses tindak lanjutnya.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-sm text-[#1F2937]">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span className="font-medium">Dusun Gabusan RT 22 — Desa Tanon — Kabupaten Sragen</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('buat')}
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-glow transition-all hover:-translate-y-0.5"
            >
              <FileText className="h-5 w-5" />
              Buat Laporan Sekarang
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onNavigate('alur')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-[#E5E7EB] font-semibold text-[#1F2937] hover:border-brand-300 hover:bg-brand-50 hover:-translate-y-0.5 transition-all shadow-soft"
            >
              Lihat Alur Pengaduan
            </button>
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:120ms]">
          <div className="card p-6 sm:p-7 animate-float">
            <div className="flex items-center gap-3 mb-5">
              <Logo size={40} />
              <div>
                <div className="font-display font-bold text-[#1F2937]">Pengaduan Anda</div>
                <div className="text-xs text-[#6B7280]">Status real-time</div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" /> Live
              </span>
            </div>

            <div className="space-y-3">
              {sample.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.ticket}
                    className="rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] p-4 hover:border-brand-200 transition-colors animate-fade-up"
                    style={{ animationDelay: `${200 + i * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid place-items-center h-9 w-9 rounded-xl"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-sm font-semibold text-[#1F2937]">{s.label}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#6B7280]">{s.ticket}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] font-medium text-[#6B7280]">
                      <span>Progres {s.pct}%</span>
                      <span>{s.pct === 100 ? 'Selesai' : s.pct === 33 ? 'Menunggu' : 'Dalam proses'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigate('cek')}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-sm font-semibold text-brand-700 transition-colors"
            >
              Lacak Pengaduan Lainnya
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
