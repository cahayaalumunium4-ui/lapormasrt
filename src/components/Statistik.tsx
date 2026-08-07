import { useEffect, useState } from 'react';
import { Inbox, Loader2, CheckCircle2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from './Loading';

export function Statistik() {
  const [stats, setStats] = useState({ total: 0, diproses: 0, selesai: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ count: total }, { count: diproses }, { count: selesai }, { count: users }] =
          await Promise.all([
            supabase.from('reports').select('*', { count: 'exact', head: true }),
            supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'diproses'),
            supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'selesai'),
            supabase.from('residents').select('*', { count: 'exact', head: true }),
          ]);
        setStats({
          total: total ?? 0,
          diproses: diproses ?? 0,
          selesai: selesai ?? 0,
          users: users ?? 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: 'Total Pengaduan', value: stats.total, icon: Inbox, color: '#16a34a', bg: 'from-brand-500 to-brand-700' },
    { label: 'Sedang Diproses', value: stats.diproses, icon: Loader2, color: '#0891b2', bg: 'from-cyan-500 to-brand-600' },
    { label: 'Selesai', value: stats.selesai, icon: CheckCircle2, color: '#16a34a', bg: 'from-emerald-500 to-green-600' },
    { label: 'Pengguna Terdaftar', value: stats.users, icon: Users, color: '#84cc16', bg: 'from-lime-500 to-brand-600' },
  ];

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 mb-4">
            Data Terkini
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1F2937]">
            Statistik Pengaduan
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="card card-hover p-5 sm:p-6 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br ${c.bg} text-white shadow-lg mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#1F2937]">
                    {c.value.toLocaleString('id-ID')}
                  </div>
                )}
                <p className="mt-1 text-sm font-medium text-[#6B7280]">{c.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
