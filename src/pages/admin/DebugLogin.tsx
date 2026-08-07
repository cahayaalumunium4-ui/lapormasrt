import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { ArrowLeft, CheckCircle2, XCircle, Plug, RefreshCw } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

interface Row {
  label: string;
  value: string;
  ok: boolean;
}

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function decodeJwtRef(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

export function DebugLogin({ onNavigate }: Props) {
  const { session, profile, testConnection } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [testing, setTesting] = useState(false);
  const [connMsg, setConnMsg] = useState('');

  const refFromUrl = SUPA_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null;
  const refFromKey = decodeJwtRef(SUPA_KEY);
  const projectMatch = refFromUrl && refFromKey && refFromUrl === refFromKey;

  const run = async () => {
    const userId = session?.user?.id ?? '-';
    const email = session?.user?.email ?? '-';
    const role = profile?.role ?? '-';
    const sessionActive = !!session;

    const r: Row[] = [
      { label: 'Project URL', value: SUPA_URL || '(kosong)', ok: !!SUPA_URL && SUPA_URL.startsWith('https://') },
      { label: 'Project ID', value: refFromUrl ?? '-', ok: !!refFromUrl },
      { label: 'Status Koneksi', value: projectMatch ? 'Terhubung' : 'Mismatch', ok: !!projectMatch },
      { label: 'Session', value: sessionActive ? 'Aktif' : 'Tidak ada', ok: sessionActive },
      { label: 'User Login', value: email, ok: email !== '-' },
      { label: 'User ID', value: userId, ok: userId !== '-' },
      { label: 'Email', value: email, ok: email !== '-' },
      { label: 'Role', value: role, ok: role !== '-' },
      { label: 'Auth Status', value: sessionActive ? 'Authenticated' : 'Unauthenticated', ok: sessionActive },
      { label: 'Anon Key', value: SUPA_KEY ? `${SUPA_KEY.slice(0, 12)}...` : '(kosong)', ok: !!SUPA_KEY && SUPA_KEY.length > 20 },
      { label: 'Key Project Ref', value: refFromKey ?? '-', ok: !!refFromKey },
    ];
    setRows(r);
  };

  useEffect(() => { run(); }, [session, profile]);

  const fullTest = async () => {
    setTesting(true);
    const r = await testConnection();
    setConnMsg(r.message);
    setTesting(false);
    await run();
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="mx-auto max-w-2xl px-4">
        <button
          onClick={() => onNavigate('admin-login')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-brand-700 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Login
        </button>

        <div className="card p-6 sm:p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <Logo size={44} />
            <div>
              <h1 className="font-display font-extrabold text-xl text-[#1F2937]">Debug Connection</h1>
              <p className="text-sm text-[#6B7280]">Status koneksi & autentikasi Supabase</p>
            </div>
          </div>

          {!projectMatch && refFromUrl && refFromKey && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              Project Supabase yang digunakan aplikasi tidak sama dengan project Authentication.
              URL: <b>{refFromUrl}</b> · Key: <b>{refFromKey}</b>
            </div>
          )}

          <div className="space-y-2.5">
            {rows.map((r) => (
              <div
                key={r.label}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  r.ok ? 'border-brand-200 bg-brand-50/50' : 'border-red-200 bg-red-50/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {r.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1F2937]">{r.label}</div>
                    <div className="text-xs text-[#6B7280] truncate font-mono">{r.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              onClick={fullTest}
              disabled={testing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
            >
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Test Connection
            </button>
            <button
              onClick={run}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#E5E7EB] text-[#1F2937] font-semibold hover:bg-brand-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {connMsg && (
            <div className="mt-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937]">
              {connMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
