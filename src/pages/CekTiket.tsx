import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPhone, formatDate } from '@/lib/helpers';
import { toast } from '@/lib/notify';
import type { Report, ReportTimeline } from '@/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/types';
import { Loading } from '@/components/Loading';
import { Search, Ticket, Phone, Clock, MapPin, Image as ImageIcon, StickyNote, ArrowLeft, FileText, Lock } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

export function CekTiket({ onNavigate }: Props) {
  const [ticket, setTicket] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<ReportTimeline[]>([]);
  const [searched, setSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.trim() || !phone.trim()) {
      toast.error('Lengkapi nomor tiket dan nomor HP');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, category:categories(*)')
        .eq('ticket_number', ticket.trim().toUpperCase())
        .eq('reporter_phone', formatPhone(phone))
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setReport(null);
        setTimeline([]);
        toast.warning('Tiket tidak ditemukan. Periksa kembali nomor tiket & HP Anda.');
        return;
      }
      setReport(data);
      const { data: tl } = await supabase
        .from('report_timeline')
        .select('*')
        .eq('report_id', data.id)
        .order('created_at', { ascending: true });
      setTimeline(tl ?? []);
    } catch (err) {
      toast.error('Terjadi kesalahan', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Cek Tiket Pengaduan
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Masukkan nomor tiket dan nomor HP Anda untuk melihat status pengaduan.
          </p>
        </div>

        <form onSubmit={search} className="glass-strong rounded-3xl shadow-soft p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <Ticket className="h-4 w-4 text-brand-600" /> Nomor Tiket
              </label>
              <input
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="LPR-2026-0001"
                className={inputCls}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <Phone className="h-4 w-4 text-brand-600" /> Nomor HP
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className={inputCls}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold transition-all"
          >
            <Search className="h-5 w-5" />
            {loading ? 'Mencari...' : 'Cek Status'}
          </button>
        </form>

        {loading && <div className="mt-8"><Loading label="Mencari tiket..." /></div>}

        {!loading && searched && !report && (
          <div className="mt-8 glass rounded-3xl p-10 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Tiket tidak ditemukan. Pastikan nomor tiket dan nomor HP sesuai dengan saat membuat pengaduan.
            </p>
          </div>
        )}

        {!loading && report && (
          <div className="mt-8 space-y-6 animate-fade-up">
            {/* Header */}
            <div className="glass-strong rounded-3xl shadow-soft p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Nomor Tiket</div>
                  <div className="font-mono font-bold text-xl text-brand-800 dark:text-brand-200">
                    {report.ticket_number}
                  </div>
                </div>
                <span
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: (STATUS_COLOR as Record<string, string>)[report.status] }}
                >
                  {STATUS_LABEL[report.status]}
                </span>
              </div>

              <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
                <Info icon={FileText} label="Judul" value={report.title} />
                <Info icon={MapPin} label="Lokasi" value={report.location || '-'} />
                <Info icon={Clock} label="Tanggal" value={formatDate(report.created_at)} />
                {report.assigned_officer && (
                  <Info icon={StickyNote} label="Petugas" value={report.assigned_officer} />
                )}
                {report.category && (
                  <Info icon={StickyNote} label="Kategori" value={report.category.name} />
                )}
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Deskripsi</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {report.description}
                </p>
              </div>

              {report.photo_url && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Foto
                  </div>
                  <img src={report.photo_url} alt="Foto pengaduan" className="rounded-2xl max-h-64 object-cover" />
                </div>
              )}

              {report.admin_note && (
                <div className="mt-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 p-4 border border-brand-100 dark:border-brand-800/40">
                  <div className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1 flex items-center gap-1">
                    <StickyNote className="h-3.5 w-3.5" /> Catatan Admin
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{report.admin_note}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="glass-strong rounded-3xl shadow-soft p-6 sm:p-7">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-5">
                Timeline Proses
              </h3>
              <ol className="relative border-l-2 border-slate-200 dark:border-white/10 ml-3 space-y-6">
                {(timeline.length ? timeline : [
                  { id: '0', status: report.status, note: report.admin_note, officer: report.assigned_officer, created_at: report.created_at },
                ]).map((t, i) => (
                  <li key={t.id} className="ml-5">
                    <span
                      className="absolute -left-[9px] grid place-items-center h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-900"
                      style={{ backgroundColor: (STATUS_COLOR as Record<string, string>)[t.status] ?? '#64748b' }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {STATUS_LABEL[t.status as keyof typeof STATUS_LABEL] ?? t.status}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(t.created_at)}</span>
                    </div>
                    {t.officer && <div className="text-xs text-slate-500 dark:text-slate-400">Petugas: {t.officer}</div>}
                    {t.note && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.note}</p>}
                    {i === 0 && <span className="text-[10px] text-slate-400">Mulai proses</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 text-brand-600 shrink-0" />
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="font-medium text-slate-800 dark:text-slate-100">{value}</div>
      </div>
    </div>
  );
}
