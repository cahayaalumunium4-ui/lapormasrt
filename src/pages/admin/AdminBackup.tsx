import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast, alert } from '@/lib/notify';
import { logActivity } from '@/lib/helpers';
import { Spinner } from '@/components/Loading';
import { Database, Download, Upload, ShieldAlert } from 'lucide-react';

const TABLES = ['reports', 'report_timeline', 'categories', 'residents', 'rt_rw', 'settings', 'activity_logs'];

export function AdminBackup() {
  const { session } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown[]> | null>(null);

  const backup = async () => {
    setBusy('backup');
    try {
      const dump: Record<string, unknown[]> = {};
      for (const t of TABLES) {
        const { data: rows } = await supabase.from(t).select('*');
        dump[t] = rows ?? [];
      }
      setData(dump);
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), data: dump }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-lapormasrt-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup berhasil diunduh');
      await logActivity(session?.user?.email ?? 'admin', 'backup', 'Download backup database');
    } catch (e) {
      toast.error('Backup gagal', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const restore = async (file: File) => {
    if (!(await alert.confirm('Restore database?', 'Data yang ada akan ditimpa oleh isi file backup. Lanjutkan?'))) return;
    setBusy('restore');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const dump = parsed.data ?? parsed;
      for (const t of TABLES) {
        if (!Array.isArray(dump[t])) continue;
        await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (dump[t].length) {
          const { error } = await supabase.from(t).insert(dump[t]);
          if (error) console.warn(t, error.message);
        }
      }
      toast.success('Restore selesai');
      await logActivity(session?.user?.email ?? 'admin', 'restore', 'Restore database dari file');
    } catch (e) {
      toast.error('Restore gagal', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Backup & Restore Database</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cadangkan dan pulihkan data aplikasi</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="glass rounded-3xl p-6 shadow-soft text-center">
          <div className="grid place-items-center h-14 w-14 mx-auto rounded-2xl bg-brand-700 text-white mb-4">
            <Database className="h-7 w-7" />
          </div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Backup Database</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Unduh seluruh data dalam format JSON.</p>
          <button
            onClick={backup}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold disabled:opacity-60"
          >
            {busy === 'backup' ? <Spinner /> : <Download className="h-4 w-4" />}
            {busy === 'backup' ? 'Memproses...' : 'Backup & Download'}
          </button>
        </div>

        <div className="glass rounded-3xl p-6 shadow-soft text-center">
          <div className="grid place-items-center h-14 w-14 mx-auto rounded-2xl bg-amber-600 text-white mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Restore Database</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Pulihkan data dari file backup JSON.</p>
          <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20 disabled:opacity-60">
            {busy === 'restore' ? <Spinner /> : <Upload className="h-4 w-4" />}
            {busy === 'restore' ? 'Memulihkan...' : 'Pilih File Backup'}
            <input
              type="file"
              accept="application/json"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {data && (
        <div className="glass rounded-3xl p-6 shadow-soft">
          <h3 className="font-display font-bold text-slate-900 dark:text-white mb-3">Ringkasan Backup Terakhir</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TABLES.map((t) => (
              <div key={t} className="rounded-xl bg-white/60 dark:bg-white/5 p-3 text-center">
                <div className="font-display font-bold text-xl text-slate-900 dark:text-white">{data[t]?.length ?? 0}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
