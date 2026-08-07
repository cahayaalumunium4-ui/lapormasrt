import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';
import type { ActivityLog } from '@/types';
import { Loading } from '@/components/Loading';
import { History, LogIn, LogOut, Plus, Pencil, Trash2, ShieldCheck, Database, KeyRound, Printer } from 'lucide-react';

const actionIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  logout: LogOut,
  create: Plus,
  update: Pencil,
  delete: Trash2,
  verify: ShieldCheck,
  backup: Database,
  restore: Database,
  reset: KeyRound,
  'Cetak PDF': Printer,
};

const actionColor: Record<string, string> = {
  login: '#16a34a',
  logout: '#64748b',
  create: '#1e40af',
  update: '#0891b2',
  delete: '#dc2626',
  verify: '#7c3aed',
};

export function AdminAktivitas() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => {
      setLogs(data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter((l) =>
    !q || l.action.toLowerCase().includes(q.toLowerCase()) || l.admin_email.toLowerCase().includes(q.toLowerCase()) || (l.detail ?? '').toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Riwayat Aktivitas Admin</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Log tindakan admin di sistem</p>
      </div>

      <div className="glass rounded-2xl p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari aksi, email, detail..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? <Loading className="py-16" /> : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <History className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl shadow-soft p-4 sm:p-5">
          <ol className="relative border-l-2 border-slate-200 dark:border-white/10 ml-3 space-y-4">
            {filtered.map((l) => {
              const Icon = actionIcon[l.action] ?? History;
              return (
                <li key={l.id} className="ml-5">
                  <span
                    className="absolute -left-[9px] grid place-items-center h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-900"
                    style={{ backgroundColor: actionColor[l.action] ?? '#64748b' }}
                  />
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">{l.action}</span>
                    <span className="text-xs text-slate-400">{formatDate(l.created_at)}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{l.admin_email}{l.detail ? ` • ${l.detail}` : ''}</div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
