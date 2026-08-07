import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast, alert } from '@/lib/notify';
import { logActivity } from '@/lib/helpers';
import { Spinner } from '@/components/Loading';
import { KeyRound, Lock, Check } from 'lucide-react';

export function AdminResetPassword() {
  const { session } = useAuth();
  const [old, setOld] = useState('');
  const [newP, setNewP] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!old || !newP || !confirm) { toast.error('Semua field wajib diisi'); return; }
    if (newP.length < 6) { toast.error('Password baru minimal 6 karakter'); return; }
    if (newP !== confirm) { toast.error('Konfirmasi password tidak cocok'); return; }

    const ok = await alert.confirm('Ubah password?', 'Anda akan tetap login setelah password diubah.');
    if (!ok) return;

    setLoading(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email ?? '',
      password: old,
    });
    if (verifyError) {
      setLoading(false);
      toast.error('Password lama salah');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newP });
    setLoading(false);
    if (error) { toast.error('Gagal mengubah password', error.message); return; }
    toast.success('Password berhasil diubah');
    setOld(''); setNewP(''); setConfirm('');
    await logActivity(session?.user?.email ?? 'admin', 'reset', 'Reset password admin');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-lg">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Reset Password Admin</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ganti password dengan verifikasi password lama</p>
      </div>

      <form onSubmit={submit} className="glass-strong rounded-3xl shadow-soft p-6 sm:p-7 space-y-4">
        <div className="grid place-items-center h-14 w-14 rounded-2xl bg-brand-700 text-white mx-auto mb-2">
          <KeyRound className="h-7 w-7" />
        </div>

        <Field label="Password Lama" icon={Lock} value={old} onChange={setOld} type="password" />
        <Field label="Password Baru" icon={KeyRound} value={newP} onChange={setNewP} type="password" />
        <Field label="Konfirmasi Password Baru" icon={Check} value={confirm} onChange={setConfirm} type="password" />

        <button
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-semibold disabled:opacity-60"
        >
          {loading ? <Spinner /> : <KeyRound className="h-5 w-5" />}
          {loading ? 'Memproses...' : 'Ubah Password'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, icon: Icon, value, onChange, type }: { label: string; icon: React.ComponentType<{ className?: string }>; value: string; onChange: (v: string) => void; type: string }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
        <Icon className="h-4 w-4 text-brand-600" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
