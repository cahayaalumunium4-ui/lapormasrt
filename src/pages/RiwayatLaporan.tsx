import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDateShort } from '@/lib/helpers';
import type { Report, ReportStatus } from '@/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/types';
import { Loading } from '@/components/Loading';
import { ArrowLeft, Ticket, Inbox, Filter, Eye, X, MapPin, User, Calendar } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

const filters: { key: 'all' | ReportStatus; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'selesai', label: 'Selesai' },
];

export function RiwayatLaporan({ onNavigate }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');
  const [detail, setDetail] = useState<Report | null>(null);

  useEffect(() => {
    supabase
      .from('reports')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setReports(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel('riwayat-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' },
        () => {
          supabase
            .from('reports')
            .select('*, category:categories(*)')
            .order('created_at', { ascending: false })
            .then(({ data }) => setReports(data ?? []));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? reports : reports.filter((r) => r.status === filter)),
    [reports, filter],
  );

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-brand-700 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1F2937]">
            Riwayat Laporan
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Daftar seluruh pengaduan warga yang telah masuk ke sistem.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] mr-1">
            <Filter className="h-4 w-4" /> Filter:
          </span>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f.key
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'bg-white border border-[#E5E7EB] text-[#1F2937] hover:bg-brand-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading full />
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="grid place-items-center h-16 w-16 mx-auto rounded-2xl bg-brand-50 text-brand-600 mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <p className="text-[#1F2937] font-semibold">Belum ada laporan.</p>
            <p className="text-[#6B7280] text-sm mt-1">Silakan buat pengaduan terlebih dahulu.</p>
            <button
              onClick={() => onNavigate('buat')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
            >
              Buat Pengaduan
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((r, i) => (
              <div
                key={r.id}
                className="card card-hover p-5 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-brand-700">
                    <Ticket className="h-3.5 w-3.5" /> {r.ticket_number}
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
                    style={{ backgroundColor: STATUS_COLOR[r.status] }}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <h3 className="font-display font-bold text-[#1F2937]">{r.title}</h3>
                <p className="mt-1 text-sm text-[#6B7280] line-clamp-2">{r.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
                  <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {r.reporter_name}</span>
                  <span>•</span>
                  <span>{r.category?.name ?? 'Tanpa kategori'}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateShort(r.created_at)}</span>
                </div>
                <button
                  onClick={() => setDetail(r)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors"
                >
                  <Eye className="h-4 w-4" /> Lihat Detail
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-lg card p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="font-mono font-bold text-brand-700 text-sm">{detail.ticket_number}</div>
                <h3 className="font-display font-bold text-xl text-[#1F2937]">{detail.title}</h3>
              </div>
              <button onClick={() => setDetail(null)} className="grid place-items-center h-9 w-9 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLOR[detail.status] }}>
              {STATUS_LABEL[detail.status]}
            </span>
            <div className="grid sm:grid-cols-2 gap-3 text-sm mt-4">
              <Info icon={User} label="Pelapor" value={detail.reporter_name} />
              <Info icon={Calendar} label="Tanggal" value={formatDateShort(detail.created_at)} />
              <Info icon={MapPin} label="Lokasi" value={detail.location ?? detail.reporter_address} />
              <Info icon={Inbox} label="Kategori" value={detail.category?.name ?? '-'} />
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold text-[#6B7280] mb-1">Deskripsi</div>
              <p className="text-sm text-[#1F2937] leading-relaxed bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3">{detail.description}</p>
            </div>
            {detail.photo_url && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-[#6B7280] mb-1">Foto</div>
                <img src={detail.photo_url} alt="bukti" className="rounded-xl max-h-56 object-cover w-full" />
              </div>
            )}
            {detail.admin_note && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-[#6B7280] mb-1">Catatan Admin</div>
                <p className="text-sm text-[#1F2937] bg-brand-50 border border-brand-100 rounded-xl p-3">{detail.admin_note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] px-3 py-2">
      <div className="text-xs text-[#6B7280] flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</div>
      <div className="font-medium text-[#1F2937]">{value}</div>
    </div>
  );
}
