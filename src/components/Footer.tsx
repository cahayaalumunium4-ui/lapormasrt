import { Mail, MessageCircle, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppSettings } from '@/types';
import { Logo } from './Logo';

interface Props {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: Props) {
  const [s, setS] = useState<AppSettings | null>(null);

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => setS(data));
  }, []);

  return (
    <footer className="relative mt-12 bg-brand-900 text-white overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-8">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Logo size={44} />
              <div>
                <div className="font-display font-extrabold text-white">LAPOR MAS RT</div>
                <div className="text-xs text-brand-200">{s?.rt_name ?? 'Dusun Gabusan RT 22'}</div>
              </div>
            </div>
            <p className="text-sm text-brand-100/80 leading-relaxed">
              Sistem pengaduan digital warga Dusun Gabusan RT 22, Desa Tanon, Kabupaten Sragen.
              Transparan, cepat, dan dapat dipantau proses tindak lanjutnya oleh seluruh warga.
            </p>
            <div className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-accent-400">
              <ShieldCheck className="h-4 w-4" /> Pelayanan Transparan & Akuntabel
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-white mb-4">Menu Cepat</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { k: 'home', l: 'Beranda' },
                { k: 'alur', l: 'Alur Pengaduan' },
                { k: 'buat', l: 'Buat Pengaduan' },
                { k: 'cek', l: 'Cek Tiket' },
                { k: 'riwayat', l: 'Riwayat Laporan' },
                { k: 'galeri', l: 'Galeri Kegiatan' },
                { k: 'admin-login', l: 'Login Admin' },
              ].map((i) => (
                <li key={i.k}>
                  <button
                    onClick={() => onNavigate(i.k)}
                    className="inline-flex items-center gap-1 text-brand-100/80 hover:text-accent-400 transition-colors"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {i.l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-white mb-4">Kontak Pengurus</h4>
            <ul className="space-y-3 text-sm text-brand-100/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-accent-400" />
                <span>{s?.address ?? 'Dusun Gabusan RT 22, Desa Tanon, Kabupaten Sragen'}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle className="h-4 w-4 mt-0.5 text-accent-400" />
                <a
                  href="https://wa.me/6281366916828"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent-400"
                >
                  081366916828
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 text-accent-400" />
                <span>lapormasrtgabusan@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-100/70">
          <p>Copyright © 2026 Lapor Mas RT — Dusun Gabusan RT 22, Desa Tanon, Kabupaten Sragen.</p>
          <p>Dibuat untuk pelayanan warga yang lebih baik.</p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center text-center">
          <p className="text-[11px] text-brand-100/60 mb-2">Dikembangkan oleh</p>
          <div className="font-display font-bold text-white tracking-wide text-sm">GIGA INNOVATION</div>
          <p className="text-[11px] text-brand-100/60 italic mt-0.5">"Inovasi Untuk Solusi Terbaik"</p>
         <a
  href="https://wa.me/6281329200985"
  target="_blank"
  rel="noreferrer"
  className="mt-1.5 text-[11px] text-accent-400 hover:text-accent-500 font-medium inline-flex items-center gap-1"
>
  <MessageCircle className="h-3 w-3" /> 081329200985
</a>
        </div>
      </div>
    </footer>
  );
}
