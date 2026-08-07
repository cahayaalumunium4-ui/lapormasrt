import { useState, useEffect } from 'react';
import { Menu, X, FileText, Home } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  onNavigate: (page: string) => void;
  current: string;
}

const links = [
  { key: 'home', label: 'Beranda' },
  { key: 'alur', label: 'Alur Pengaduan' },
  { key: 'buat', label: 'Buat Pengaduan' },
  { key: 'cek', label: 'Cek Tiket' },
  { key: 'riwayat', label: 'Riwayat Laporan' },
  { key: 'galeri', label: 'Galeri Kegiatan' },
  { key: 'admin-login', label: 'Login Admin' },
];

export function Navbar({ onNavigate, current }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (key: string) => {
    onNavigate(key);
    setOpen(false);
  };

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={`bg-white rounded-[20px] border border-[#E5E7EB] transition-all duration-300 ${
            scrolled ? 'py-2.5 shadow-[0_6px_24px_-8px_rgba(22,163,74,0.14)]' : 'py-3 shadow-[0_2px_12px_-4px_rgba(22,163,74,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between gap-4 px-3 sm:px-4">
            <button onClick={() => go('home')} className="flex items-center gap-3 group">
              <div className="relative">
                <Logo size={40} className="transition-transform group-hover:scale-105" />
                <FileText className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-accent-400 text-brand-900 p-0.5 ring-2 ring-white" />
              </div>
              <div className="text-left leading-tight">
                <div className="font-display font-extrabold tracking-tight text-[#1F2937] text-base sm:text-lg">
                  LAPOR MAS RT
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-brand-700">
                  Dusun Gabusan RT 22
                </div>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {links.map((l) => (
                <button
                  key={l.key}
                  onClick={() => go(l.key)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    current === l.key
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-[#6B7280] hover:text-brand-700 hover:bg-brand-50/60'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => go('buat')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
              >
                <FileText className="h-4 w-4" /> Buat Laporan
              </button>
              <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Menu"
                className="lg:hidden grid place-items-center h-10 w-10 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {open && (
            <div className="lg:hidden mt-2 mx-1 mb-1 p-2 bg-white rounded-xl border border-[#E5E7EB] animate-fade-in">
              {links.map((l) => (
                <button
                  key={l.key}
                  onClick={() => go(l.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    current === l.key
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-[#1F2937] hover:bg-brand-50/60'
                  }`}
                >
                  {l.key === 'home' && <Home className="h-4 w-4" />}
                  {l.key !== 'home' && <FileText className="h-4 w-4" />}
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
