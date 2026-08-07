import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MediaKegiatan } from '@/types';
import { MEDIA_CATEGORIES } from '@/types';
import { Loading } from '@/components/Loading';
import { Lightbox } from '@/components/Lightbox';
import { ArrowLeft, Search, Images, Calendar, MapPin, Eye, X, Filter } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

export function GaleriKegiatan({ onNavigate }: Props) {
  const [items, setItems] = useState<MediaKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [fKategori, setFKategori] = useState('all');
  const [fTahun, setFTahun] = useState('all');
  const [fBulan, setFBulan] = useState('all');
  const [detail, setDetail] = useState<MediaKegiatan | null>(null);
  const [lightbox, setLightbox] = useState<{ imgs: string[]; i: number } | null>(null);

  useEffect(() => {
    supabase
      .from('media_kegiatan')
      .select('*')
      .eq('status', 'aktif')
      .order('tanggal', { ascending: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false); });
  }, []);

  const years = useMemo(() => Array.from(new Set(items.map((i) => new Date(i.tanggal).getFullYear()))).sort((a, b) => b - a), [items]);

  const filtered = useMemo(() => items.filter((m) => {
    if (fKategori !== 'all' && m.kategori !== fKategori) return false;
    if (fTahun !== 'all' && new Date(m.tanggal).getFullYear().toString() !== fTahun) return false;
    if (fBulan !== 'all' && (new Date(m.tanggal).getMonth() + 1).toString() !== fBulan) return false;
    if (q) { const s = q.toLowerCase(); return m.judul.toLowerCase().includes(s) || (m.lokasi ?? '').toLowerCase().includes(s); }
    return true;
  }), [items, q, fKategori, fTahun, fBulan]);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4">
        <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 mb-5">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">Galeri Kegiatan</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Dokumentasi seluruh kegiatan RT 22 Dusun Gabusan</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kegiatan..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <select value={fKategori} onChange={(e) => setFKategori(e.target.value)} className={cls}>
            <option value="all">Semua Kategori</option>
            {MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fTahun} onChange={(e) => setFTahun(e.target.value)} className={cls}>
            <option value="all">Semua Tahun</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={fBulan} onChange={(e) => setFBulan(e.target.value)} className={cls}>
            <option value="all">Semua Bulan</option>
            {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => <option key={m} value={(i + 1).toString()}>{m}</option>)}
          </select>
        </div>

        {loading ? <Loading full /> : filtered.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <Images className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Belum ada dokumentasi kegiatan.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((m, i) => (
              <div key={m.id} className="glass rounded-3xl overflow-hidden shadow-soft hover:-translate-y-1 transition-all animate-fade-up cursor-pointer" style={{ animationDelay: `${i * 50}ms` }} onClick={() => setDetail(m)}>
                <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
                  {m.foto[0] ? <img src={m.foto[0]} alt={m.judul} loading="lazy" className="h-full w-full object-cover" /> : <div className="h-full grid place-items-center text-slate-400"><Images className="h-10 w-10" /></div>}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-black/50 backdrop-blur">{m.foto.length} foto</span>
                </div>
                <div className="p-4">
                  <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300">{m.kategori}</span>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">{m.judul}</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(m.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    {m.lokasi && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {m.lokasi}</div>}
                  </div>
                  <button className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold hover:bg-brand-100">
                    <Eye className="h-3.5 w-3.5" /> Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <DetailModal media={detail} onClose={() => setDetail(null)} onLightbox={(i) => setLightbox({ imgs: detail.foto, i })} />
      )}
      {lightbox && <Lightbox images={lightbox.imgs} index={lightbox.i} onClose={() => setLightbox(null)} onIndex={(i) => setLightbox({ ...lightbox, i })} />}
    </div>
  );
}

function DetailModal({ media, onClose, onLightbox }: { media: MediaKegiatan; onClose: () => void; onLightbox: (i: number) => void }) {
  const [active, setActive] = useState(0);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl shadow-soft p-6 sm:p-7 animate-scale-in">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">{media.kategori}</span>
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">{media.judul}</h3>
          </div>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500"><X className="h-5 w-5" /></button>
        </div>
        {media.foto.length > 0 && (
          <div className="mb-4">
            <div className="rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-video">
              <img src={media.foto[active]} alt="" className="h-full w-full object-cover cursor-zoom-in" onClick={() => onLightbox(active)} />
            </div>
            {media.foto.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {media.foto.map((f, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 ${active === i ? 'border-brand-500' : 'border-transparent'}`}>
                    <img src={f} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {media.video && <div className="mb-4"><video src={media.video} controls className="w-full rounded-2xl" /></div>}
        <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
          <Info icon={Calendar} label="Tanggal" value={new Date(media.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
          <Info icon={MapPin} label="Lokasi" value={media.lokasi ?? '-'} />
          <Info icon={Eye} label="Penanggung Jawab" value={media.penanggung_jawab ?? '-'} />
        </div>
        {media.deskripsi && <div className="rounded-2xl bg-white/60 dark:bg-white/5 p-4"><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{media.deskripsi}</p></div>}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/60 dark:bg-white/5 px-3 py-2">
      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</div>
      <div className="font-medium text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}

const cls = 'px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
