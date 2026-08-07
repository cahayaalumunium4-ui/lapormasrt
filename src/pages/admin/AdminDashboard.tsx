import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast, alert } from '@/lib/notify';
import { logActivity, formatDateShort } from '@/lib/helpers';
import type { Report, ReportStatus } from '@/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/types';
import { Loading, Skeleton } from '@/components/Loading';
import { Inbox, Loader2, CheckCircle2, Clock, TrendingUp, Search, Eye, X } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from 'recharts';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function AdminDashboard() {
  const { session } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [selected, setSelected] = useState<Report | null>(null);

  useEffect(() => {
    supabase
      .from('reports')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel('dashboard-reports')
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

  const stats = useMemo(() => {
    const total = reports.length;
    const diproses = reports.filter((r) => r.status === 'diproses').length;
    const selesai = reports.filter((r) => r.status === 'selesai').length;
    const belum = reports.filter((r) => r.status === 'menunggu').length;
    return { total, diproses, selesai, belum };
  }, [reports]);

  const monthly = useMemo(() => {
    const year = new Date().getFullYear();
    const arr = monthNames.map((m) => ({ name: m, Menunggu: 0, Diproses: 0, Selesai: 0 }));
    reports.forEach((r) => {
      const d = new Date(r.created_at);
      if (d.getFullYear() === year) {
        const idx = d.getMonth();
        const key = r.status === 'menunggu' ? 'Menunggu' : r.status === 'diproses' ? 'Diproses' : 'Selesai';
        arr[idx][key]++;
      }
    });
    return arr;
  }, [reports]);

  const filteredRecent = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        return r.ticket_number.toLowerCase().includes(s) || r.title.toLowerCase().includes(s) || r.reporter_name.toLowerCase().includes(s);
      }
      return true;
    });
  }, [reports, q, statusFilter]);

  const cards = [
    { label: 'Total Laporan', value: stats.total, icon: Inbox, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Menunggu', value: stats.belum, icon: Clock, color: '#ca8a04', bg: '#fef9c3' },
    { label: 'Diproses', value: stats.diproses, icon: Loader2, color: '#2563eb', bg: '#dbeafe' },
    { label: 'Selesai', value: stats.selesai, icon: CheckCircle2, color: '#15803d', bg: '#d1fae5' },
  ];

  const changeStatus = async (status: ReportStatus) => {
    if (!selected) return;
    if (!(await alert.confirm('Ubah status?', `Status akan diubah menjadi "${STATUS_LABEL[status]}".`))) return;
    const { error } = await supabase.from('reports').update({ status, updated_at: new Date().toISOString() }).eq('id', selected.id);
    if (error) { toast.error('Gagal', error.message); return; }
    await supabase.from('report_timeline').insert({ report_id: selected.id, status, note: null, officer: session?.user?.email ?? 'Admin' });
    await logActivity(session?.user?.email ?? 'admin', `Ubah status ke ${STATUS_LABEL[status]}`, selected.ticket_number);
    toast.success('Status diperbarui');
    setSelected({ ...selected, status });
  };

  if (loading) return <Loading full />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-[#1F2937]">Dashboard</h1>
        <p className="text-sm text-[#6B7280]">Ringkasan pengaduan warga RT — realtime</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card card-hover p-5 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="grid place-items-center h-12 w-12 rounded-xl" style={{ backgroundColor: c.bg, color: c.color }}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-xs font-semibold text-[#9CA3AF]">{new Date().getFullYear()}</span>
              </div>
              <div className="font-display font-extrabold text-3xl text-[#1F2937]">{c.value}</div>
              <p className="text-sm text-[#6B7280] mt-0.5">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-[#1F2937]">Grafik Laporan Bulanan</h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              <TrendingUp className="h-4 w-4" /> {new Date().getFullYear()}
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', background: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="Menunggu" stroke="#ca8a04" fill="url(#gM)" strokeWidth={2} />
                <Area type="monotone" dataKey="Diproses" stroke="#2563eb" fill="url(#gP)" strokeWidth={2} />
                <Area type="monotone" dataKey="Selesai" stroke="#16a34a" fill="url(#gS)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h3 className="font-display font-bold text-[#1F2937] mb-4">Distribusi Status</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: STATUS_LABEL.menunggu, value: stats.belum, color: STATUS_COLOR.menunggu },
                { name: STATUS_LABEL.diproses, value: stats.diproses, color: STATUS_COLOR.diproses },
                { name: STATUS_LABEL.selesai, value: stats.selesai, color: STATUS_COLOR.selesai },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', background: '#fff' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {[
                    { name: STATUS_LABEL.menunggu, value: stats.belum, color: STATUS_COLOR.menunggu },
                    { name: STATUS_LABEL.diproses, value: stats.diproses, color: STATUS_COLOR.diproses },
                    { name: STATUS_LABEL.selesai, value: stats.selesai, color: STATUS_COLOR.selesai },
                  ].map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {(['menunggu', 'diproses', 'selesai'] as const).map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#1F2937]">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
                  {STATUS_LABEL[s]}
                </span>
                <span className="font-bold text-[#1F2937]">
                  {s === 'menunggu' ? stats.belum : s === 'diproses' ? stats.diproses : stats.selesai}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-bold text-[#1F2937]">Laporan Terbaru</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari..."
                className="pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'menunggu', 'diproses', 'selesai'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-brand-50'
                  }`}
                >
                  {s === 'all' ? 'Semua' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
        {reports.length === 0 ? (
          <Skeleton className="h-24 w-full" />
        ) : filteredRecent.length === 0 ? (
          <div className="py-8 text-center text-[#6B7280] text-sm">Tidak ada laporan cocok.</div>
        ) : (
          <div className="space-y-2">
            {filteredRecent.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-3 hover:border-brand-200 transition-colors">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-brand-700">{r.ticket_number}</div>
                  <div className="font-semibold text-[#1F2937] truncate">{r.title}</div>
                  <div className="text-xs text-[#6B7280]">{r.reporter_name} • {formatDateShort(r.created_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLOR[r.status] }}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  <button onClick={() => setSelected(r)} className="grid place-items-center h-8 w-8 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md card p-6 animate-scale-in">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="font-mono font-bold text-brand-700 text-sm">{selected.ticket_number}</div>
                <h3 className="font-display font-bold text-lg text-[#1F2937]">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="grid place-items-center h-9 w-9 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-[#6B7280]">Pelapor</span><span className="font-medium text-[#1F2937]">{selected.reporter_name}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Tanggal</span><span className="font-medium text-[#1F2937]">{formatDateShort(selected.created_at)}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#6B7280]">Status</span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLOR[selected.status] }}>{STATUS_LABEL[selected.status]}</span>
              </div>
            </div>
            <p className="text-sm text-[#1F2937] bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3 mb-4 line-clamp-3">{selected.description}</p>
            <div className="flex gap-2">
              {(['menunggu', 'diproses', 'selesai'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={selected.status === s}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${selected.status === s ? 'bg-brand-600 text-white' : 'bg-white border border-[#E5E7EB] text-[#1F2937] hover:bg-brand-50'} disabled:opacity-70`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
