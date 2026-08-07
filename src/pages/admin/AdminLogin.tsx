import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast, alert } from '@/lib/notify';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/Loading';
import { ArrowLeft, Mail, Lock, ShieldCheck, KeyRound, Plug, Bug } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function AdminLogin({ onNavigate }: Props) {
  const { signIn, resetPassword, testConnection } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const envWarn = !SUPA_URL || !SUPA_KEY;
  const refFromUrl = SUPA_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null;
  const refFromKey = (() => {
    try {
      const payload = JSON.parse(atob(SUPA_KEY.split('.')[1] ?? ''));
      return payload.ref ?? null;
    } catch { return null; }
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }
    setLoading(true);
    const projectId = refFromUrl ?? '(unknown)';
    console.log('%c[Login] === LOGIN ATTEMPT ===', 'color:#16a34a;font-weight:bold');
    console.table({
      URL: SUPA_URL,
      'Project ID': projectId,
      Email: email.trim(),
    });
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      console.error('%c[Login] FAILED', 'color:#dc2626;font-weight:bold');
      console.table({
        URL: SUPA_URL,
        'Project ID': projectId,
        Email: email.trim(),
        Error: error,
        Session: 'none',
        User: 'none',
      });
      toast.error('Login gagal', error);
    } else {
      const { data: sData } = await supabase.auth.getSession();
      console.log('%c[Login] SUCCESS', 'color:#16a34a;font-weight:bold');
      console.table({
        URL: SUPA_URL,
        'Project ID': projectId,
        Email: email.trim(),
        Error: 'none',
        Session: sData.session ? 'active' : 'none',
        User: sData.session?.user?.id ?? 'none',
      });
      toast.success('Selamat datang, Admin!');
      onNavigate('admin');
    }
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) { toast.error('Masukkan email Anda'); return; }
    setLoading(true);
    const { error } = await resetPassword(resetEmail.trim());
    setLoading(false);
    if (error) {
      toast.error('Gagal mengirim email reset', error);
    } else {
      await alert.success('Email reset terkirim', 'Silakan cek email Anda untuk reset password.');
      setShowReset(false);
      setResetEmail('');
    }
  };

  const runTest = async () => {
    setTesting(true);
    const r = await testConnection();
    setTesting(false);
    if (r.ok) {
      await alert.success('Test Koneksi Berhasil', r.message);
    } else {
      await alert.error('Test Koneksi Gagal', r.message);
    }
  };

  return (
    <div className="pt-28 pb-20 min-h-screen grid place-items-center">
      <div className="mx-auto max-w-md w-full px-4">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-brand-700 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </button>

        {envWarn && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Konfigurasi Supabase belum lengkap. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.
          </div>
        )}
        {refFromUrl && refFromKey && refFromUrl !== refFromKey && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            Project Supabase tidak sesuai. URL merujuk ke project <b>{refFromUrl}</b> sedangkan API key untuk project <b>{refFromKey}</b>.
          </div>
        )}

        <div className="card p-7 sm:p-8 animate-scale-in">
          {!showReset ? (
            <>
              <div className="text-center mb-6">
                <div className="grid place-items-center h-16 w-16 mx-auto rounded-2xl bg-brand-600 text-white shadow-glow mb-3">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h1 className="font-display font-extrabold text-2xl text-[#1F2937]">Login Admin</h1>
                <p className="mt-1 text-sm text-[#6B7280]">Masuk untuk mengelola pengaduan warga</p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[#1F2937] mb-1.5">
                    <Mail className="h-4 w-4 text-brand-600" /> Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@lapormasrt.id"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[#1F2937] mb-1.5">
                    <Lock className="h-4 w-4 text-brand-600" /> Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold transition-all"
                >
                  {loading && <Spinner />}
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={runTest}
                  disabled={testing}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm font-semibold text-[#1F2937] hover:bg-brand-50 disabled:opacity-60"
                >
                  {testing ? <Spinner /> : <Plug className="h-4 w-4" />} Test Connection
                </button>
                <button
                  onClick={() => onNavigate('debug')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm font-semibold text-[#1F2937] hover:bg-brand-50"
                >
                  <Bug className="h-4 w-4" /> Debug Login
                </button>
              </div>

              <button
                onClick={() => { setShowReset(true); setResetEmail(email); }}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                <KeyRound className="h-4 w-4" /> Lupa Password?
              </button>

              <div className="mt-6 flex items-center gap-2 justify-center text-xs text-[#6B7280]">
                <Logo size={20} /> Lapor Mas RT — Dusun Gabusan RT 22
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="grid place-items-center h-16 w-16 mx-auto rounded-2xl bg-brand-600 text-white shadow-glow mb-3">
                  <KeyRound className="h-8 w-8" />
                </div>
                <h1 className="font-display font-extrabold text-2xl text-[#1F2937]">Lupa Password</h1>
                <p className="mt-1 text-sm text-[#6B7280]">Kami akan mengirim link reset ke email Anda</p>
              </div>

              <form onSubmit={sendReset} className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[#1F2937] mb-1.5">
                    <Mail className="h-4 w-4 text-brand-600" /> Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@lapormasrt.id"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold transition-all"
                >
                  {loading && <Spinner />}
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="w-full text-sm font-semibold text-[#6B7280] hover:text-brand-700"
                >
                  Kembali ke Login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';
