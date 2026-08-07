import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';
import type { Report } from '@/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/types';
import { Loading } from '@/components/Loading';
import { QrCode } from '@/components/QrCode';
import { ScanLine, Search } from 'lucide-react';

export function AdminScan() {
  const [ticket, setTicket] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [all, setAll] = useState<Report[]>([]);

  useEffect(() => {
    supabase.from('reports').select('*, category:categories(*)').order('created_at', { ascending: false }).limit(20).then(({ data }) => setAll(data ?? []));
  }, []);

  const search = async (t: string) => {
    const tk = t.trim().toUpperCase();
    if (!tk) return;
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*, category:categories(*)')
      .eq('ticket_number', tk)
      .maybeSingle();
    setReport(data);
    setLoading(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Scan QR Tiket</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cari pengaduan berdasarkan nomor tiket / QR</p>
      </div>

      <div className="glass rounded-3xl p-6 shadow-soft">
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">Masukkan / Scan Nomor Tiket</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-600" />
                <input
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && search(ticket)}
                  placeholder="LPR-2026-0001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button onClick={() => search(ticket)} className="px-5 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold inline-flex items-center gap-2">
                <Search className="h-4 w-4" /> Cari
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Tip: gunakan kamera HP atau scanner QR untuk mengisi otomatis.</p>

            {loading && <div className="mt-4"><Loading label="Mencari..." /></div>}

            {!loading && ticket && !report && (
              <div className="mt-4 glass rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400">
                Tiket tidak ditemukan.
              </div>
            )}

            {report && (
              <div className="mt-4 glass-strong rounded-2xl p-5 animate-scale-in">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-brand-800 dark:text-brand-200">{report.ticket_number}</span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLOR[report.status] }}>
                    {STATUS_LABEL[report.status]}
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">{report.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{report.reporter_name} • {formatDate(report.created_at)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{report.description}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">QR Tiket Terbaru</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {all.slice(0, 6).map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setTicket(r.ticket_number); setReport(r); }}
                  className="glass rounded-2xl p-3 text-center hover:-translate-y-0.5 transition-all"
                >
                  <QrCode value={r.ticket_number} size={110} className="mx-auto" />
                  <div className="mt-2 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 truncate">
                    {r.ticket_number}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{r.reporter_name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
