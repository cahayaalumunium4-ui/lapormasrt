import { useEffect, useState } from 'react';
import { useForm } from './useForm';
import { supabase } from '@/lib/supabase';
import { generateTicketNumber, formatPhone } from '@/lib/helpers';
import { toast, alert } from '@/lib/notify';
import type { Category, ReportPriority } from '@/types';
import { Loading, Spinner } from '@/components/Loading';
import { QrCode } from '@/components/QrCode';
import { ArrowLeft, Upload, Send, Ticket, CheckCircle2, MapPin, Phone, User, AlertTriangle, Tag, FileText } from 'lucide-react';

interface Props {
  onNavigate: (page: string) => void;
}

export function BuatPengaduan({ onNavigate }: Props) {
  const { values, setField, errors, validate } = useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoName, setPhotoName] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ ticket: string } | null>(null);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setCategories(data ?? []);
        setLoading(false);
      });
  }, []);

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 5MB');
        return;
      }
      setPhotoFile(f);
      setPhotoName(f.name);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const ticket = await generateTicketNumber();
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `${ticket}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('reports')
          .upload(path, photoFile, { cacheControl: '3600', upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('reports').getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }

      const { error } = await supabase.from('reports').insert({
        ticket_number: ticket,
        reporter_name: values.nama,
        reporter_phone: formatPhone(values.hp),
        reporter_address: values.alamat,
        rt_rw: values.rtRw,
        category_id: values.kategori,
        title: values.judul,
        description: values.deskripsi,
        photo_url: photoUrl,
        location: values.lokasi,
        priority: values.prioritas,
        status: 'menunggu',
      });
      if (error) throw error;

      await supabase.from('report_timeline').insert({
        report_id: (await supabase.from('reports').select('id').eq('ticket_number', ticket).maybeSingle()).data?.id,
        status: 'menunggu',
        note: 'Laporan diterima dan menunggu verifikasi pengurus RT.',
        officer: 'Sistem',
      });

      setResult({ ticket });
      toast.success('Pengaduan berhasil dikirim!');
    } catch (err) {
      alert.error('Gagal mengirim', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading full label="Menyiapkan form..." />;

  if (result) {
    return (
      <div className="pt-32 pb-20">
        <div className="mx-auto max-w-lg px-4">
          <div className="glass-strong rounded-3xl shadow-soft p-8 text-center animate-scale-in">
            <div className="grid place-items-center h-16 w-16 mx-auto rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              Pengaduan Berhasil Dikirim
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Simpan nomor tiket berikut untuk melacak status pengaduan Anda.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800">
              <Ticket className="h-5 w-5 text-brand-700 dark:text-brand-300" />
              <span className="font-mono font-bold text-lg text-brand-800 dark:text-brand-200">
                {result.ticket}
              </span>
            </div>

            <div className="mt-5 inline-block">
              <QrCode value={result.ticket} size={160} />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Scan QR untuk cek status</p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate('cek')}
                className="flex-1 px-4 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold transition-colors"
              >
                Cek Tiket Sekarang
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  onNavigate('buat');
                }}
                className="flex-1 px-4 py-3 rounded-xl glass font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                Buat Laporan Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </button>

        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Buat Pengaduan
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Lengkapi data berikut. Nomor tiket akan dibuat otomatis setelah pengiriman.
          </p>
        </div>

        <form onSubmit={submit} className="glass-strong rounded-3xl shadow-soft p-6 sm:p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nama Pelapor" icon={User} error={errors.nama}>
              <input
                value={values.nama}
                onChange={(e) => setField('nama', e.target.value)}
                placeholder="Nama lengkap"
                className={inputCls}
              />
            </Field>
            <Field label="Nomor HP" icon={Phone} error={errors.hp}>
              <input
                value={values.hp}
                onChange={(e) => setField('hp', e.target.value)}
                placeholder="08xxxxxxxxxx"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Alamat" icon={MapPin} error={errors.alamat}>
              <input
                value={values.alamat}
                onChange={(e) => setField('alamat', e.target.value)}
                placeholder="Alamat tempat tinggal"
                className={inputCls}
              />
            </Field>
            <Field label="RT / RW" icon={MapPin} error={errors.rtRw}>
              <input
                value={values.rtRw}
                onChange={(e) => setField('rtRw', e.target.value)}
                placeholder="Contoh: 01/05"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Kategori Pengaduan" icon={Tag} error={errors.kategori}>
              <select value={values.kategori} onChange={(e) => setField('kategori', e.target.value)} className={inputCls}>
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Prioritas" icon={AlertTriangle} error={errors.prioritas}>
              <select
                value={values.prioritas}
                onChange={(e) => setField('prioritas', e.target.value as ReportPriority)}
                className={inputCls}
              >
                <option value="rendah">Rendah</option>
                <option value="sedang">Sedang</option>
                <option value="tinggi">Tinggi</option>
              </select>
            </Field>
          </div>

          <Field label="Judul" icon={FileText} error={errors.judul}>
            <input
              value={values.judul}
              onChange={(e) => setField('judul', e.target.value)}
              placeholder="Ringkasan pengaduan"
              className={inputCls}
            />
          </Field>

          <Field label="Deskripsi" error={errors.deskripsi}>
            <textarea
              value={values.deskripsi}
              onChange={(e) => setField('deskripsi', e.target.value)}
              placeholder="Jelaskan pengaduan secara detail"
              rows={4}
              className={inputCls}
            />
          </Field>

          <Field label="Lokasi Kejadian">
            <input
              value={values.lokasi}
              onChange={(e) => setField('lokasi', e.target.value)}
              placeholder="Alamat/lokasi kejadian"
              className={inputCls}
            />
          </Field>

          <Field label="Upload Foto (maks 5MB, opsional)">
            <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 cursor-pointer hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-900/10 transition-colors">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {photoName || 'Klik untuk pilih foto'}
              </span>
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold shadow-glow transition-all"
          >
            {submitting ? <Spinner /> : <Send className="h-5 w-5" />}
            {submitting ? 'Mengirim...' : 'Kirim Pengaduan'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
        {Icon && <Icon className="h-4 w-4 text-brand-600" />}
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
