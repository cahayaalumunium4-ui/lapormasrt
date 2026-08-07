import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast, alert } from '@/lib/notify';
import { logActivity } from '@/lib/helpers';
import { compressImage } from '@/lib/image';
import type { MediaKegiatan, MediaStatus } from '@/types';
import { MEDIA_CATEGORIES } from '@/types';
import { Loading, Spinner } from '@/components/Loading';
import { Lightbox } from '@/components/Lightbox';
import { exportMediaPdf } from '@/lib/mediaPdf';
import { downloadPhotosZip } from '@/lib/zip';
import {
  Plus, Pencil, Trash2, X, Save, Upload, Images, Search, Eye, FileDown,
  Archive, Download, Video, MapPin, Calendar, User as UserIcon, Filter,
} from 'lucide-react';

export function AdminMedia() {
  const { session } = useAuth();
  const [items, setItems] = useState<MediaKegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MediaKegiatan | null>(null);
  const [detail, setDetail] = useState<MediaKegiatan | null>(null);
  const [lightbox, setLightbox] = useState<{ imgs: string[]; i: number } | null>(null);

  // Filters
  const [q, setQ] = useState('');
  const [fKategori, setFKategori] = useState('all');
  const [fTahun, setFTahun] = useState('all');
  const [fBulan, setFBulan] = useState('all');
  const [fStatus, setFStatus] = useState<'all' | MediaStatus>('all');

  const load = () => {
    setLoading(true);
    supabase
      .from('media_kegiatan')
      .select('*')
      .order('tanggal', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Gagal memuat', error.message);
        setItems(data ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const years = useMemo(() => {
    const set = new Set(items.map((i) => new Date(i.tanggal).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (fKategori !== 'all' && m.kategori !== fKategori) return false;
      if (fStatus !== 'all' && m.status !== fStatus) return false;
      if (fTahun !== 'all' && new Date(m.tanggal).getFullYear().toString() !== fTahun) return false;
      if (fBulan !== 'all' && (new Date(m.tanggal).getMonth() + 1).toString() !== fBulan) return false;
      if (q) {
        const s = q.toLowerCase();
        return m.judul.toLowerCase().includes(s) || (m.lokasi ?? '').toLowerCase().includes(s) || (m.penanggung_jawab ?? '').toLowerCase().includes(s);
      }
      return true;
    });
  }, [items, q, fKategori, fTahun, fBulan, fStatus]);

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (m: MediaKegiatan) => { setEditing(m); setShowForm(true); };

  const remove = async (m: MediaKegiatan) => {
    if (!(await alert.confirm('Hapus dokumentasi?', m.judul))) return;
    const { error } = await supabase.from('media_kegiatan').delete().eq('id', m.id);
    if (error) toast.error('Gagal', error.message);
    else {
      toast.success('Dihapus');
      await logActivity(session?.user?.email ?? 'admin', 'delete', `Media: ${m.judul}`);
      load();
    }
  };

  const toggleStatus = async (m: MediaKegiatan) => {
    const ns: MediaStatus = m.status === 'aktif' ? 'arsip' : 'aktif';
    const { error } = await supabase.from('media_kegiatan').update({ status: ns }).eq('id', m.id);
    if (error) toast.error('Gagal', error.message);
    else { toast.success(ns === 'aktif' ? 'Diaktifkan' : 'Diarsipkan'); load(); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Media Kegiatan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Dokumentasi seluruh kegiatan RT</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportMediaPdf(filtered)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50">
            <FileDown className="h-4 w-4" /> Export PDF
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
            <Plus className="h-4 w-4" /> Tambah Dokumentasi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul, lokasi, penanggung jawab..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <Select value={fKategori} onChange={setFKategori} options={[['all', 'Semua Kategori'], ...MEDIA_CATEGORIES.map((c) => [c, c] as [string, string])]} />
        <Select value={fTahun} onChange={setFTahun} options={[['all', 'Semua Tahun'], ...years.map((y) => [y.toString(), y.toString()] as [string, string])]} />
        <Select value={fBulan} onChange={setFBulan} options={[['all', 'Semua Bulan'], ...Array.from({ length: 12 }, (_, i) => [(i + 1).toString(), monthName(i)] as [string, string])]} />
        <Select value={fStatus} onChange={(v) => setFStatus(v as 'all' | MediaStatus)} options={[['all', 'Semua Status'], ['aktif', 'Aktif'], ['arsip', 'Arsip']]} />
      </div>

      {loading ? <Loading className="py-16" /> : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <Images className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Belum ada dokumentasi kegiatan.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((m, i) => (
            <div key={m.id} className="glass rounded-3xl overflow-hidden shadow-soft hover:-translate-y-1 transition-all animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="relative h-44 overflow-hidden bg-slate-200 dark:bg-slate-800">
                {m.foto[0] ? (
                  <img src={m.foto[0]} alt={m.judul} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full grid place-items-center text-slate-400"><Images className="h-10 w-10" /></div>
                )}
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white ${m.status === 'aktif' ? 'bg-brand-600' : 'bg-slate-500'}`}>
                  {m.status === 'aktif' ? 'Aktif' : 'Arsip'}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-black/50 backdrop-blur">
                  {m.foto.length} foto
                </span>
              </div>
              <div className="p-4">
                <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300">{m.kategori}</span>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">{m.judul}</h3>
                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDateShort(m.tanggal)}</div>
                  {m.lokasi && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {m.lokasi}</div>}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <button onClick={() => setDetail(m)} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold hover:bg-brand-100">
                    <Eye className="h-3.5 w-3.5" /> Lihat
                  </button>
                  <IconBtn onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></IconBtn>
                  <IconBtn onClick={() => toggleStatus(m)}><Archive className="h-4 w-4" /></IconBtn>
                  <IconBtn onClick={() => remove(m)} danger><Trash2 className="h-4 w-4" /></IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <MediaForm editing={editing} onClose={() => setShowForm(false)} onSaved={load} />}
      {detail && (
        <DetailModal
          media={detail}
          onClose={() => setDetail(null)}
          onLightbox={(i) => setLightbox({ imgs: detail.foto, i })}
          onEdit={() => { setDetail(null); openEdit(detail); }}
        />
      )}
      {lightbox && <Lightbox images={lightbox.imgs} index={lightbox.i} onClose={() => setLightbox(null)} onIndex={(i) => setLightbox({ ...lightbox, i })} />}
    </div>
  );
}

function MediaForm({ editing, onClose, onSaved }: { editing: MediaKegiatan | null; onClose: () => void; onSaved: () => void }) {
  const { session } = useAuth();
  const [form, setForm] = useState({
    judul: editing?.judul ?? '',
    kategori: editing?.kategori ?? MEDIA_CATEGORIES[0],
    tanggal: editing?.tanggal ?? new Date().toISOString().slice(0, 10),
    lokasi: editing?.lokasi ?? '',
    deskripsi: editing?.deskripsi ?? '',
    penanggung_jawab: editing?.penanggung_jawab ?? '',
    status: editing?.status ?? 'aktif',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(editing?.foto ?? []);
  const [existingFoto, setExistingFoto] = useState<string[]>(editing?.foto ?? []);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(editing?.video ?? null);
  const [saving, setSaving] = useState(false);

  const onPhotos = async (files: FileList) => {
    const compressed: File[] = [];
    for (const f of Array.from(files)) {
      compressed.push(await compressImage(f));
    }
    setPhotos((p) => [...p, ...compressed]);
    setPhotoPreviews((p) => [...p, ...compressed.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx: number) => {
    setPhotoPreviews((p) => p.filter((_, i) => i !== idx));
    if (idx < existingFoto.length) {
      setExistingFoto((e) => e.filter((_, i) => i !== idx));
    } else {
      const localIdx = idx - existingFoto.length;
      setPhotos((p) => p.filter((_, i) => i !== localIdx));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul || !form.kategori || !form.tanggal) { toast.error('Lengkapi judul, kategori, dan tanggal'); return; }
    setSaving(true);
    try {
      const id = editing?.id ?? crypto.randomUUID();
      const folder = id;
      const uploadedFoto: string[] = [...existingFoto];

      for (let i = 0; i < photos.length; i++) {
        const f = photos[i];
        const path = `${folder}/${Date.now()}-${i}.jpg`;
        const { error } = await supabase.storage.from('media-kegiatan').upload(path, f, { cacheControl: '3600', upsert: true });
        if (error) throw error;
        uploadedFoto.push(supabase.storage.from('media-kegiatan').getPublicUrl(path).data.publicUrl);
      }

      let finalVideo = videoUrl;
      if (videoFile) {
        const vpath = `${folder}/video-${Date.now()}.${videoFile.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('media-kegiatan').upload(vpath, videoFile, { cacheControl: '3600', upsert: true });
        if (error) throw error;
        finalVideo = supabase.storage.from('media-kegiatan').getPublicUrl(vpath).data.publicUrl;
      }

      const payload = {
        judul: form.judul,
        kategori: form.kategori,
        tanggal: form.tanggal,
        lokasi: form.lokasi || null,
        deskripsi: form.deskripsi || null,
        foto: uploadedFoto,
        video: finalVideo,
        penanggung_jawab: form.penanggung_jawab || null,
        status: form.status as MediaStatus,
        created_by: session?.user?.id ?? null,
      };

      if (editing) {
        const { error } = await supabase.from('media_kegiatan').update(payload).eq('id', editing.id);
        if (error) throw error;
        await logActivity(session?.user?.email ?? 'admin', 'update', `Media: ${form.judul}`);
        toast.success('Diperbarui');
      } else {
        const { error } = await supabase.from('media_kegiatan').insert({ id, ...payload });
        if (error) throw error;
        await logActivity(session?.user?.email ?? 'admin', 'create', `Media: ${form.judul}`);
        toast.success('Ditambahkan');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Gagal menyimpan', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl shadow-soft p-6 sm:p-7 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{editing ? 'Edit Dokumentasi' : 'Tambah Dokumentasi'}</h3>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Judul Kegiatan" value={form.judul} onChange={(v) => setForm({ ...form, judul: v })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Kategori</label>
              <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className={cls}>
                {MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Tanggal" type="date" value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} />
          </div>
          <Input label="Lokasi" value={form.lokasi} onChange={(v) => setForm({ ...form, lokasi: v })} />
          <Input label="Penanggung Jawab" value={form.penanggung_jawab} onChange={(v) => setForm({ ...form, penanggung_jawab: v })} />
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Deskripsi</label>
            <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} className={cls} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Upload Banyak Foto</label>
            <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 cursor-pointer hover:border-brand-500 transition-colors">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Klik untuk pilih beberapa foto (auto-compress)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && onPhotos(e.target.files)} />
            </label>
            {photoPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="h-16 w-full object-cover rounded-lg" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 grid place-items-center h-5 w-5 rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Upload Video (opsional)</label>
            <label className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 cursor-pointer hover:border-brand-500 transition-colors">
              <Video className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{videoFile ? videoFile.name : videoUrl ? 'Video tersimpan (klik untuk ganti)' : 'Pilih video'}</span>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MediaStatus })} className={cls}>
              <option value="aktif">Aktif</option>
              <option value="arsip">Arsip</option>
            </select>
          </div>
          <button disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60">
            {saving ? <Spinner /> : <Save className="h-4 w-4" />} Simpan
          </button>
        </form>
      </div>
    </div>
  );
}

function DetailModal({ media, onClose, onLightbox, onEdit }: { media: MediaKegiatan; onClose: () => void; onLightbox: (i: number) => void; onEdit: () => void }) {
  const [active, setActive] = useState(0);
  const [zipping, setZipping] = useState(false);

  const downloadZip = async () => {
    setZipping(true);
    try {
      await downloadPhotosZip(media.judul, media.foto);
      toast.success('ZIP berhasil diunduh');
    } catch (e) {
      toast.error('Gagal membuat ZIP', (e as Error).message);
    } finally {
      setZipping(false);
    }
  };

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

        {/* Slider */}
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

        {media.video && (
          <div className="mb-4">
            <video src={media.video} controls className="w-full rounded-2xl" />
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
          <Info icon={Calendar} label="Tanggal" value={formatDateShort(media.tanggal)} />
          <Info icon={MapPin} label="Lokasi" value={media.lokasi ?? '-'} />
          <Info icon={UserIcon} label="Penanggung Jawab" value={media.penanggung_jawab ?? '-'} />
        </div>

        {media.deskripsi && (
          <div className="rounded-2xl bg-white/60 dark:bg-white/5 p-4 mb-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{media.deskripsi}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button onClick={downloadZip} disabled={zipping} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60">
            {zipping ? <Spinner /> : <Download className="h-4 w-4" />} {zipping ? 'Memproses...' : 'Download Semua Foto (ZIP)'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== helpers =====
const cls = 'w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function IconBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`grid place-items-center h-9 w-9 rounded-lg ${danger ? 'text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100' : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200'}`}>
      {children}
    </button>
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

function formatDateShort(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function monthName(i: number): string {
  return ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][i];
}
