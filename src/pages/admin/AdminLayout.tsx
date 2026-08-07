import { useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import {
  LayoutDashboard, Inbox, QrCode, Users, MapPin, Tags, BarChart3,
  Database, History, Settings, KeyRound, LogOut, Menu, X, Images,
} from 'lucide-react';

export type AdminPage =
  | 'dashboard' | 'pengaduan' | 'scan' | 'warga' | 'rtrw' | 'kategori'
  | 'media' | 'statistik' | 'backup' | 'aktivitas' | 'pengaturan' | 'reset';

interface Props {
  page: AdminPage;
  setPage: (p: AdminPage) => void;
  children: ReactNode;
}

const menu: { key: AdminPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'pengaduan', label: 'Pengaduan', icon: Inbox },
  { key: 'scan', label: 'Scan QR Tiket', icon: QrCode },
  { key: 'warga', label: 'Data Warga', icon: Users },
  { key: 'rtrw', label: 'Data RT/RW', icon: MapPin },
  { key: 'kategori', label: 'Kategori', icon: Tags },
  { key: 'media', label: 'Media Kegiatan', icon: Images },
  { key: 'statistik', label: 'Laporan Statistik', icon: BarChart3 },
  { key: 'backup', label: 'Backup & Restore', icon: Database },
  { key: 'aktivitas', label: 'Riwayat Aktivitas', icon: History },
  { key: 'pengaturan', label: 'Pengaturan', icon: Settings },
  { key: 'reset', label: 'Reset Password', icon: KeyRound },
];

export function AdminLayout({ page, setPage, children }: Props) {
  const { signOut, session, profile } = useAuth();
  const [open, setOpen] = useState(false);

  const go = (p: AdminPage) => {
    setPage(p);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-[#E5E7EB] z-40">
        <SidebarContent page={page} go={go} email={session?.user?.email} nama={profile?.nama} onSignOut={signOut} />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white border-r border-[#E5E7EB] animate-fade-in">
            <SidebarContent page={page} go={go} email={session?.user?.email} nama={profile?.nama} onSignOut={signOut} />
          </aside>
        </div>
      )}

      <header className="lg:pl-64 sticky top-0 z-30">
        <div className="bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden grid place-items-center h-10 w-10 rounded-xl bg-brand-50 text-brand-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <h2 className="font-display font-bold text-[#1F2937] capitalize">
              {menu.find((m) => m.key === page)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 text-sm">
              <div className="grid place-items-center h-7 w-7 rounded-lg bg-brand-600 text-white font-bold text-xs">
                {(session?.user?.email ?? 'A').slice(0, 1).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="font-medium text-[#1F2937] max-w-[140px] truncate">{profile?.nama ?? 'Admin'}</div>
                <div className="text-[10px] text-[#6B7280] max-w-[140px] truncate">{session?.user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="lg:pl-64 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

function SidebarContent({
  page, go, email, nama, onSignOut,
}: {
  page: AdminPage;
  go: (p: AdminPage) => void;
  email?: string;
  nama?: string;
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div className="leading-tight">
            <div className="font-display font-extrabold text-sm text-[#1F2937]">LAPOR MAS RT</div>
            <div className="text-[10px] text-[#6B7280]">Admin Panel</div>
          </div>
        </div>
        <button className="lg:hidden text-[#6B7280]" onClick={() => {}}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menu.map((m) => {
          const Icon = m.icon;
          const active = page === m.key;
          return (
            <button
              key={m.key}
              onClick={() => go(m.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-brand-600 text-white shadow-[0_6px_20px_-6px_rgba(22,163,74,0.5)]'
                  : 'text-[#6B7280] hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {m.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#E5E7EB]">
        <div className="mb-3 px-3">
          <div className="text-xs font-semibold text-[#1F2937] truncate">{nama ?? 'Admin'}</div>
          <div className="text-[10px] text-[#6B7280] truncate">{email}</div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </div>
    </>
  );
}
