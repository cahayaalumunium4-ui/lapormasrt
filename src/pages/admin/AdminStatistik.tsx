import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Report, Category } from '@/types';
import { STATUS_LABEL } from '@/types';
import { Loading } from '@/components/Loading';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Inbox, TrendingUp, PieChart as PieIcon } from 'lucide-react';

export function AdminStatistik() {
  const [reports, setReports] = useState<Report[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('reports').select('*, category:categories(*)').then(({ data }) => { setReports(data ?? []); setLoading(false); });
    supabase.from('categories').select('*').then(({ data }) => setCats(data ?? []));
  }, []);

  const byCategory = useMemo(() => {
    return cats.map((c) => ({ name: c.name, value: reports.filter((r) => r.category_id === c.id).length, color: c.color }));
  }, [reports, cats]);

  const byPriority = useMemo(() => (['rendah', 'sedang', 'tinggi'] as const).map((p) => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: reports.filter((r) => r.priority === p).length,
  })), [reports]);

  const PIE_COLORS = ['#1e40af', '#16a34a', '#dc2626', '#0891b2', '#ca8a04', '#7c3aed', '#64748b'];

  if (loading) return <Loading full />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Laporan Statistik</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Analisis pengaduan berdasarkan kategori dan prioritas</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass rounded-3xl p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="h-5 w-5 text-brand-600" />
            <h3 className="font-display font-bold text-slate-900 dark:text-white">Pengaduan per Kategori</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {byCategory.map((e, i) => (
                    <Cell key={i} fill={e.color || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <h3 className="font-display font-bold text-slate-900 dark:text-white">Pengaduan per Prioritas</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#1e40af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 shadow-soft">
        <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Inbox className="h-5 w-5 text-brand-600" /> Ringkasan Status
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(['menunggu', 'diproses', 'selesai'] as const).map((s) => {
            const v = reports.filter((r) => r.status === s).length;
            return (
              <div key={s} className="rounded-2xl bg-white/60 dark:bg-white/5 p-5 text-center">
                <div className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">{v}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{STATUS_LABEL[s]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
